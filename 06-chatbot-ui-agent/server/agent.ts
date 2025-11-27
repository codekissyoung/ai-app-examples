import { HumanMessage } from '@langchain/core/messages';

import { context } from './context.ts';
import { llm } from './llm.ts';
import { tools } from './tools.ts';
import { isToolCall, executeToolCalls } from './utils.ts';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

/**
 * 流式响应选项
 */
export type StreamOptions = {
  signal: AbortSignal; // 用于取消请求的信号
  query: string;       // 用户查询内容
};

/**
 * 智能体流式响应生成器
 * 实现完整的 Agent 循环：模型推理 → 工具调用 → 结果处理 → 最终回复
 *
 * @param options 流式响应选项
 * @returns 异步生成器，逐步产出 ChatMessage
 */
export async function* stream(
  options: StreamOptions,
): AsyncGenerator<ChatMessage> {
  const { signal, query } = options;

  // 🔧 给模型绑定可用工具，让 AI 知道可以调用哪些工具
  const llmWithTools = llm.bindTools(tools);

  // 📝 添加用户消息到对话上下文，保持对话连续性
  context.push(new HumanMessage(query));

  // 🔄 Agent 循环开始 - 这是智能体的核心逻辑
  while (true) {
    // 🤖 调用模型进行推理，让 AI 决定是直接回复还是使用工具
    // TODO: 简单起见这里用的是同步调用（invoke），应该改造为流式调用（stream）以获得更好的用户体验
    const response = await llmWithTools.invoke(context, {
      signal,        // 传递取消信号，支持用户中断
      tool_choice: 'auto', // 让模型自主决定是否使用工具
    });

    // 🔍 判断模型是否决定调用工具（而不是直接回复用户）
    if (isToolCall(response)) {
      // 📢 通知前端：模型正在调用工具，展示工具调用信息
      for (const item of response.tool_calls) {
        yield {
          type: 'tool_call',
          payload: {
            id: item.id!,        // 工具调用的唯一标识
            name: item.name,     // 工具名称（如 'websearch'）
            args: item.args,     // 工具参数（如搜索关键词）
          },
        };
      }

      // 💾 将工具调用请求添加到上下文中，保持对话完整性
      context.push(response);

      // ⚡ 执行实际的工具调用（如网络搜索）
      const toolMessages = await executeToolCalls(tools, response.tool_calls);

      // 💾 将工具执行结果添加到上下文，让模型能看到结果
      context.push(...toolMessages);

      // 📢 通知前端：工具调用完成，展示执行结果
      for (const item of toolMessages) {
        yield {
          type: 'tool_result',
          payload: {
            tool_call_id: item.tool_call_id!, // 关联到之前的工具调用
            name: item.name!,                 // 工具名称
            content: item.content.toString(), // 工具执行结果
          },
        };
      }

      // 🔄 继续循环，让模型基于工具结果继续推理或给出最终回复
      continue;
    }

    // 💬 模型决定直接回复用户（不使用工具）
    yield {
      type: 'assistant',
      partial: false,
      payload: {
        content: response.content.toString(), // 模型的最终回复内容
      },
    };

    // 💾 将模型的最终回复添加到上下文，保持对话历史
    context.push(response);

    // ✅ 任务完成，退出 Agent 循环
    break;
  }
}
