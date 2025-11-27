import readline from 'readline';
import fs from 'fs';
import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

const API_KEY = process.env.API_KEY || "not set";
const BASE_URL = process.env.BASE_URL || "not set";
const MODEL = process.env.MODEL || "not set";
if (!API_KEY || !BASE_URL || !MODEL) {
  console.error('缺少必要的环境变量配置：');
  if (!API_KEY) console.error('  - API_KEY: API 密钥');
  if (!BASE_URL) console.error('  - BASE_URL: API 基础 URL');
  if (!MODEL) console.error('  - MODEL: 模型名称');
  console.error('\n请在 .env 文件中配置以上参数');
  process.exit(1);
}

// 返回模式控制 'stream' = 流式返回（打字机效果），其他值 = 一次性返回
const RETURN_MODE = process.env.RETURN_MODE || 'normal';

// SDK 选择：从环境变量读取，默认为原生实现
// 'native'    = 原生 fetch 实现（L1: 最底层，理解 HTTP/SSE 原理）
// 'openai'    = OpenAI SDK（L2: 中间层，生产级封装）
// 'langchain' = LangChain 框架（L3: 最高层，AI 应用框架）
const USE_SDK = process.env.USE_SDK || 'native';

// 从文件读取系统提示词
const systemPrompt = fs.readFileSync('system-prompt.md', 'utf-8');

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// ========== 原生实现 (native) 消息历史 ==========
const messages: Message[] = [
  {
    role: 'system',
    content: systemPrompt,
  },
];

// ========== OpenAI SDK (openai) 实例和消息历史 ==========
let openaiClient: OpenAI | null = null;
const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  { role: 'system', content: systemPrompt },
];
if (USE_SDK === 'openai') {
  openaiClient = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
  });
}

// ========== LangChain (langchain) 实例和消息历史 ==========
let langchainModel: ChatOpenAI | null = null;
const langchainMessages: BaseMessage[] = [new SystemMessage(systemPrompt)];

if (USE_SDK === 'langchain') {
  langchainModel = new ChatOpenAI({
    model: MODEL,
    configuration: {
      baseURL: BASE_URL,
      apiKey: API_KEY,
    },
    streaming: RETURN_MODE === 'stream', // 根据 RETURN_MODE 动态设置
  });
}

// 主函数：包装 top-level await 避免警告
async function main() {
  // 主循环：不断读取用户输入 → 调用 API → 显示回复
  while (true) {
    const input = await readInput();
    if (!input.trim()) {
      continue; // 直接输入回车的话，直接跳过
    }
    switch (USE_SDK) {
      case 'native':
        await handleNativeMode(input);
        break;
      case 'openai':
        await handleOpenAIMode(input);
        break;
      case 'langchain':
        await handleLangChainMode(input);
        break;
      default:
        console.error(`未知的 SDK 类型: ${USE_SDK}，请使用 native/openai/langchain`);
        process.exit(1);
    }
  }
}

/**
 * OpenAI SDK 模式处理函数（L2 层）
 * 使用 OpenAI SDK 封装的 API 调用
 *
 * 特点：
 * - 生产级封装：自动重试、错误处理、超时控制
 * - 类型安全：完整的 TypeScript 类型定义
 * - 简洁易用：比原生实现减少 90% 代码量
 * - 官方推荐：Kimi、通义千问等都推荐使用
 */
async function handleOpenAIMode(input: string) {
  if (!openaiClient) {
    throw new Error('OpenAI SDK 未初始化');
  }
  // 将用户输入添加到消息历史
  openaiMessages.push({ role: 'user', content: input });
  let reply = '';
  if (RETURN_MODE === 'stream') {
    // ===== OpenAI SDK 流式返回 =====
    // 调用 SDK 的 stream 方法，返回异步迭代器
    const stream = await openaiClient.chat.completions.create({
      model: MODEL,
      messages: openaiMessages,
      stream: true, // 开启流式返回
    });

    process.stdout.write('Assistant: ');

    // for await...of 遍历流式响应
    for await (const chunk of stream) {
      // SDK 自动解析 SSE 格式，直接取 content
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
      reply += content;
    }

    process.stdout.write('\n\n');
  } else {
    // ===== OpenAI SDK 普通返回 =====
    // 一次性获取完整响应
    const response = await openaiClient.chat.completions.create({
      model: MODEL,
      messages: openaiMessages,
      stream: false, // 关闭流式返回
    });

    reply = response.choices[0]?.message?.content || '';
    console.log('Assistant:', reply + '\n');
  }

  // 保存 AI 回复到历史
  openaiMessages.push({ role: 'assistant', content: reply });
}

/**
 * LangChain 模式处理函数（L3 层）
 * 使用 LangChain 框架封装的 API 调用
 *
 * 特点：
 * - 最高层抽象：统一接口支持多种模型
 * - 工具生态：内置 Agents、Tools、Chains
 * - 复杂应用：适合构建 RAG、Agent 等复杂 AI 应用
 */
async function handleLangChainMode(input: string) {
  if (!langchainModel) {
    throw new Error('LangChain 模型未初始化');
  }

  // 将用户输入添加到 LangChain 消息历史
  langchainMessages.push(new HumanMessage(input));

  let reply = '';

  if (RETURN_MODE === 'stream') {
    // LangChain 流式返回
    const chunks = await langchainModel.stream(langchainMessages);
    process.stdout.write('Assistant: ');

    for await (const chunk of chunks) {
      const content = chunk.content.toString();
      process.stdout.write(content);
      reply += content;
    }

    process.stdout.write('\n\n');
  } else {
    // LangChain 普通返回
    const response = await langchainModel.invoke(langchainMessages);
    reply = response.content.toString();
    console.log('Assistant:', reply + '\n');
  }

  // 保存 AI 回复到历史
  langchainMessages.push(new AIMessage(reply));
}

/**
 * 原生实现模式处理函数（L1 层）
 * 使用手动实现的 fetch + SSE 解析
 *
 * 特点：
 * - 最底层实现：直接操作 HTTP、SSE、ReadableStream
 * - 完全可控：每一行代码都清晰可见
 * - 学习价值高：理解 API 调用的完整流程
 * - 教学目的：适合学习底层原理
 */
async function handleNativeMode(input: string) {
  // 将用户输入添加到对话历史
  messages.push({ role: 'user', content: input });

  if (RETURN_MODE === 'stream') {
    // ===== 流式返回模式 =====
    // 逐字打印，类似打字机效果，用户体验更好
    const chunks = streamInvoke(messages);
    let reply = '';
    process.stdout.write('Assistant: '); // 不换行打印前缀

    // for await...of 遍历异步迭代器，每次获取一个 chunk
    for await (const chunk of chunks) {
      process.stdout.write(chunk); // 实时打印每个文本片段
      reply += chunk; // 累积完整回复
    }

    process.stdout.write('\n\n'); // 打印完成后换行
    messages.push({ role: 'assistant', content: reply });
  } else {
    // ===== 普通返回模式 =====
    // 等待完整响应后一次性打印
    const reply = await invoke(messages);
    console.log('Assistant:', reply + '\n');
    messages.push({ role: 'assistant', content: reply });
  }
}

// 启动主函数
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * 读取用户输入（异步）
 * 执行流程：
 * 1. 创建 readline 接口，连接标准输入/输出
 * 2. 调用 rl.question() 注册回调（老式 API）
 * 3. 立即返回 Promise<string>（pending 状态）
 * 4. 用户按回车 → readline 触发回调
 * 5. 回调内调用 resolve(message) → Promise fulfilled
 * 6. await 恢复执行，得到 message 值
 * @returns Promise<string> - 用户输入的字符串
 */
async function readInput() {
  // 创建 readline 接口：从键盘读取，向终端输出
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // 返回 Promise，将回调风格的 API 转换成 Promise 风格
  return new Promise<string>((resolve) => {
    // rl.question() 是回调风格：当用户输入时调用回调函数
    rl.question('User: ', (message) => {
      resolve(message);  // 将 message "放入" Promise（fulfilled 状态）
      rl.close();        // 关闭 readline 接口，释放资源
    });
  });
}

/**
 * 调用 LLM API 获取回复 - 普通模式（异步）
 *
 * 执行流程：
 * 1. 发起 HTTP POST 请求（返回 Promise<Response>）
 * 2. await 等待网络响应（HTTP headers 到达）→ res
 * 3. 调用 res.json() 解析响应体（返回 Promise<any>）
 * 4. await 等待 JSON 解析完成 → data
 * 5. 提取并返回模型回复内容
 *
 * @param messages - 对话历史（包含 system、user、assistant 消息）
 * @returns Promise<string> - 模型生成的回复内容
 */
async function invoke(messages: Message[]) {
  // 第一个 await：等待 HTTP 响应（headers）
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',      // 告诉服务器：请求体是 JSON
      Authorization: `Bearer ${API_KEY}`,      // 认证：Bearer Token
    },
    body: JSON.stringify({
      model: MODEL,     // 模型名称
      messages,         // 对象简写：等价于 messages: messages
      stream: false,    // 明确指定非流式返回
    }),
  });

  // 第二个 await：等待 JSON 解析（body）
  // res.json() 异步解析响应体，返回 Promise<any>
  const data = await res.json();

  // 错误处理：检查 API 是否返回了错误
  if (!data.choices) {
    console.error('API Error:', JSON.stringify(data, null, 2));
    throw new Error(`API 请求失败: ${data.error?.message || '未知错误'}`);
  }

  // 类型断言：告诉 TS 这是 string（data 类型是 any）
  // 返回模型生成的文本内容
  return data.choices[0].message.content as string;
}

/**
 * 调用 LLM API 获取回复 - 流式模式（异步生成器）
 *
 * AsyncGenerator 工作原理：
 * 1. async function* 声明异步生成器函数
 * 2. yield 关键字逐个产出值（类似 return，但不终止函数）
 * 3. for await...of 消费生成器，每次循环获取一个 yield 的值
 * 4. 函数执行到 yield 会暂停，等待外部消费后继续执行
 *
 * 流式返回流程：
 * 1. 发起 HTTP 请求，设置 stream: true
 * 2. 获取响应的 body（ReadableStream 类型）
 * 3. for await...of 遍历 body，逐块接收数据
 * 4. TextDecoder 解码二进制数据为文本（处理 UTF-8 多字节字符）
 * 5. 解析 SSE 格式（Server-Sent Events）：
 *    - 每行格式: data: {"choices":[{"delta":{"content":"文本"}}]}
 *    - 结束标记: data: [DONE]
 * 6. 提取文本内容，通过 yield 逐个返回
 *
 * @param messages - 对话历史
 * @returns AsyncGenerator<string> - 异步迭代器，逐块返回文本
 */
async function* streamInvoke(messages: Message[]) {
  // 发起 HTTP 请求，开启流式返回
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true, // 关键：开启流式返回
    }),
  });

  // 检查响应体是否存在
  if (!res.body) {
    throw new Error('响应体为空，无法获取流式数据');
  }

  // 创建文本解码器，用于将二进制数据转换为 UTF-8 文本
  // stream: true 确保多字节字符（如中文）不会在 chunk 边界被截断
  const decoder = new TextDecoder();

  // for await...of 遍历 ReadableStream，逐块接收数据
  // res.body 是 ReadableStream<Uint8Array> 类型
  for await (const value of res.body) {
    // 解码二进制数据为文本
    // value 是 Uint8Array（字节数组）
    const text = decoder.decode(value, { stream: true });

    // SSE 格式处理：
    // 原始数据格式示例：
    // data: {"choices":[{"delta":{"content":"你"}}]}
    // data: {"choices":[{"delta":{"content":"好"}}]}
    //
    // data: [DONE]
    //
    // 处理步骤：按行拆分 → 去除空白 → 过滤空行
    const lines = text
      .split('\n')           // 按换行符拆分
      .map((line) => line.trim()) // 去除每行首尾空白
      .filter(Boolean);          // 过滤空字符串

    // 遍历每一行数据
    for (const line of lines) {
      // 检查结束标记
      if (line === 'data: [DONE]') {
        break; // 流式传输结束
      }

      // 跳过非 data: 开头的行（可能是注释或其他 SSE 字段）
      if (!line.startsWith('data: ')) {
        continue;
      }

      // 提取 JSON 数据：去除 "data: " 前缀
      const jsonStr = line.slice('data: '.length);

      try {
        // 解析 JSON
        const json = JSON.parse(jsonStr);

        // 提取文本内容：json.choices[0].delta.content
        // delta.content 可能为 undefined（如第一个 chunk 只包含 role）
        const chunk = json.choices?.[0]?.delta?.content || '';

        // 如果有内容，通过 yield 返回给调用方
        if (chunk) {
          yield chunk; // 暂停函数，将 chunk 传递给 for await...of
        }
      } catch (err) {
        // JSON 解析失败时跳过该行（可能是不完整的数据）
        console.warn('JSON 解析失败:', jsonStr);
      }
    }
  }
}