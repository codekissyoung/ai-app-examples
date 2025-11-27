import express, { type Request, type Response } from 'express';
import {
  AIMessageChunk,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

import { context } from './context.ts';
import * as agent from './agent.ts';
import { isToolCall } from './utils.ts';

// 🚀 创建 Express 应用实例
const app = express();

// 🔧 添加中间件：解析 JSON 请求体，支持 POST 请求中的数据
app.use(express.json());

/**
 * 📚 历史消息查询接口
 *
 * 路径：GET /history
 * 功能：返回对话历史，供前端展示聊天记录
 *
 * 消息类型转换：
 * LangChain 消息 → 前端 ChatMessage 格式
 */
app.get('/history', (req, res) => {
  const messages: ChatMessage[] = [];

  // 🔄 遍历对话上下文，将 LangChain 消息转换为前端格式
  for (const message of context) {
    // 👤 用户消息处理
    if (message instanceof HumanMessage) {
      messages.push({
        type: 'user',
        payload: { content: message.content.toString() },
      });
    }

    // 🤖 AI 消息处理（包含工具调用和普通回复）
    if (message instanceof AIMessageChunk) {
      // 🔧 如果是工具调用
      if (isToolCall(message)) {
        // 📋 一个消息可能包含多个工具调用
        for (const item of message.tool_calls) {
          messages.push({
            type: 'tool_call',
            payload: {
              id: item.id!,        // 工具调用唯一标识
              name: item.name,     // 工具名称
              args: item.args,     // 工具参数
            },
          });
        }
      } else {
        // 💬 普通文本回复
        messages.push({
          type: 'assistant',
          payload: { content: message.content.toString() },
        });
      }
    }

    // 🔨 工具执行结果处理
    if (message instanceof ToolMessage) {
      messages.push({
        type: 'tool_result',
        payload: {
          tool_call_id: message.tool_call_id!, // 关联到工具调用请求
          name: message.name!,                 // 工具名称
          content: message.content.toString(), // 执行结果
        },
      });
    }
  }

  // 📤 返回格式化的历史消息
  res.json(messages);
});

/**
 * 🐛 调试接口：查看原始上下文
 *
 * 路径：GET /context
 * 功能：返回 LangChain 原始消息格式，方便开发调试
 *
 * 用途：查看完整的对话上下文结构，包含所有内部消息格式
 */
app.get('/context', (req, res) => {
  res.json(context);
});

/**
 * 📡 SSE 流式通信接口
 *
 * 支持 GET 和 POST 两种方式：
 * - GET：兼容 EventSource API（简化前端实现）
 * - POST：支持更复杂的请求体和参数传递
 *
 * 实时流式传输：使用 Server-Sent Events 技术
 * 优点：实时性高、连接持久、浏览器原生支持
 */
app.get('/sse', sseHandler);
app.post('/sse', sseHandler);

/**
 * 🌊 SSE 处理核心函数
 *
 * 功能：处理流式聊天请求，实现实时双向通信
 *
 * 流程：
 * 1. 解析用户查询（GET 从 query 参数，POST 从 request body）
 * 2. 启动 Agent 流式处理
 * 3. 通过 SSE 实时推送消息给前端
 * 4. 处理连接中断和异常
 *
 * @param req Express 请求对象
 * @param res Express 响应对象
 */
async function sseHandler(req: Request, res: Response) {
  let query = '';

  // 📥 提取用户查询内容（支持 GET 和 POST 两种方式）
  if (req.method === 'GET') {
    query = req.query.query as unknown as string; // URL 参数
  }
  if (req.method === 'POST') {
    query = req.body.query; // 请求体参数
  }

  // 🛑 创建请求取消控制器，支持用户主动中断
  const abortController = new AbortController();

  // 🚀 启动 Agent 流式处理
  // Agent 会自动决定是否使用工具，以及如何回复用户
  const stream = agent.stream({
    signal: abortController.signal, // 传递取消信号
    query,                          // 用户查询
  });

  // 📡 设置 SSE 响应头，告诉浏览器这是流式响应
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');          // 禁止缓存
  res.setHeader('Connection', 'keep-alive');           // 保持连接

  // ⚡ 立即发送响应头，建立 SSE 连接
  res.flushHeaders();

  // 🔌 监听客户端断开事件，及时释放资源
  req.on('end', () => {
    // 🛑 取消正在进行的模型请求，避免资源浪费
    // 这会让 for await 循环抛出 Error: Aborted 异常
    abortController.abort();
  });

  // 🌊 接收并转发 Agent 的流式响应
  try {
    for await (const message of stream) {
      // 📤 将消息通过 SSE 发送给前端
      // 格式：data: {JSON消息}\n\n（SSE 标准格式）
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  } catch (err: any) {
    // 🚨 处理异常（通常是用户主动中断或网络错误）
    console.error('SSE Stream Error:', err);
  }

  // 🏁 发送连接关闭信号
  // 触发前端的自定义 close 事件，通知连接已结束
  // 注意：必须带 data: 字段，否则前端自定义事件不会触发
  // 原因：前端的 addEventListener('close') 会在 message 事件后触发
  res.end('event: close\ndata:\n\n');
}

/**
 * 🎬 启动服务器
 *
 * 监听端口 3000，启动聊天机器人后端服务
 */
app.listen(3000, () => {
  console.log('🚀 Chatbot Agent Server is running on port 3000');
  console.log('📡 SSE Endpoint: http://localhost:3000/sse');
  console.log('📚 History API: http://localhost:3000/history');
  console.log('🐛 Debug API:   http://localhost:3000/context');
});
