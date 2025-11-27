import { HumanMessage, ToolMessage } from '@langchain/core/messages';

import { context } from './context.ts';
import { isToolCall } from './utils.ts';
import { createGraph } from './graph.ts';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

/**
 * 📋 LangGraph 流式响应选项
 */
export type StreamOptions = {
  signal: AbortSignal; // 用于取消请求的信号
  query: string;       // 用户查询内容
};

/**
 * 🗺️ LangGraph 流式响应生成器
 *
 * 架构模式：状态图驱动（LangGraph Pattern）
 * 特点：状态管理，节点路由，可视化流程
 *
 * 工作流程：
 * 1. 创建状态图实例
 * 2. 启动图执行流
 * 3. 监听各节点输出
 * 4. 实时推送给前端
 *
 * @param options 流式响应选项
 * @returns 异步生成器，逐步产出 ChatMessage
 */
export async function* stream(
  options: StreamOptions,
): AsyncGenerator<ChatMessage> {
  const { signal, query } = options;

  // 📝 添加用户消息到对话上下文，保持对话连续性
  context.push(new HumanMessage(query));

  // 🗺️ 创建新的状态图实例
  // 每次请求创建新实例，避免状态污染
  const graph = createGraph();

  /**
   * 🚀 启动状态图执行流
   *
   * 传入参数：
   * - { messages: context }: 初始状态，包含历史对话
   * - { signal }: 取消信号，支持用户中断
   *
   * 返回：异步生成器，逐步输出各节点的执行结果
   */
  const stream = await graph.stream({ messages: context }, { signal });

  /**
   * 📡 监听状态图的执行输出
   *
   * 输出格式解析：
   * output = {
   *   '<node_name>': <node_return_value>,
   *   '<node_name>': <node_return_value>,
   *   ...
   * }
   *
   * 例如：
   * {
   *   'start': { messages: [AIMessage] },
   *   'tools': { messages: [ToolMessage] }
   * }
   */
  for await (const output of stream) {
    // 🎯 遍历每个执行节点的输出
    for (const [node, value] of Object.entries(output)) {
      // 📋 遍历节点返回的消息列表
      for (const message of value.messages || []) {

        /**
         * 🤖 处理 start 节点输出
         *
         * start 节点可能产生两种输出：
         * 1. 工具调用请求（AI 决定使用工具）
         * 2. 普通文本回复（AI 直接回答用户）
         */
        if (node === 'start') {
          // 💾 将 AI 响应添加到全局上下文，保持对话历史
          context.push(message);

          if (isToolCall(message)) {
            // 🔧 AI 决定使用工具，通知前端展示工具调用信息
            for (const item of message.tool_calls) {
              yield {
                type: 'tool_call',
                payload: {
                  id: item.id!,        // 工具调用唯一标识
                  name: item.name,     // 工具名称（如 'websearch'）
                  args: item.args,     // 工具参数（如搜索关键词）
                },
              };
            }
          } else {
            // 💬 AI 直接回复用户，通知前端展示回复内容
            yield {
              type: 'assistant',
              partial: false,         // 完整回复（非流式）
              payload: {
                content: message.content.toString(),
              },
            };
          }
        }

        /**
         * 🔨 处理 tools 节点输出
         *
         * tools 节点专门处理工具调用结果：
         * - 接收工具调用请求
         * - 执行对应工具函数
         * - 返回执行结果
         */
        if (node === 'tools' && message instanceof ToolMessage) {
          // 💾 将工具执行结果添加到全局上下文
          // AI 基于这些结果继续后续推理
          context.push(message);

          // 📤 通知前端：展示工具调用结果
          yield {
            type: 'tool_result',
            payload: {
              tool_call_id: message.tool_call_id!, // 关联到工具调用请求
              content: message.content.toString(), // 执行结果
              name: message.name!,                 // 工具名称
            },
          };
        }
      }
    }
  }
}
