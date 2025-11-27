import { AIMessageChunk, HumanMessage } from '@langchain/core/messages';

import { context } from './context.ts';
import { llm } from './llm.ts';
import * as tools from './tools.ts';

// 和前端共享的类型
import type { ChatMessage } from '../src/types/index.ts';

/**
 * 📋 流式响应选项
 */
export type StreamOptions = {
  signal: AbortSignal; // 用于取消请求的信号
  query: string;       // 用户查询内容
  websearch: boolean;  // 是否启用网络搜索
};

/**
 * 🔄 Workflow 流式响应生成器
 *
 * 架构模式：固定工作流（Workflow Pattern）
 * 特点：用户决策，流程固定，步骤明确
 *
 * 工作流程：
 * 1. 用户输入 → 2. [可选] 网络搜索 → 3. AI 回复
 *
 * @param options 流式响应选项
 * @returns 异步生成器，逐步产出 ChatMessage
 */
export async function* stream(
  options: StreamOptions,
): AsyncGenerator<ChatMessage> {
  const { signal, query, websearch = false } = options;

  // 📝 添加用户消息到对话上下文，保持对话连续性
  context.push(new HumanMessage(query));

  // 🔍 条件执行：如果用户启用网络搜索，执行搜索工作流
  if (websearch) {
    /**
     * 🎯 第一步：生成搜索关键词
     *
     * 为什么需要生成关键词？
     * - 用户原始问题可能不够精确
     * - 搜索引擎需要简洁、精准的关键词
     * - 基于历史上下文生成更相关的搜索词
     */
    const keywords = await llm
      .invoke(
        [
          ...context,                    // 📚 历史对话上下文
          new HumanMessage(query),       // 👤 用户原始问题
          new HumanMessage(              // 🎯 关键词生成提示
            '根据当前问题和历史消息，设计一组简洁、精准的搜索关键词，用空格分隔。',
          ),
        ],
        { signal }, // 🛑 传递取消信号
      )
      .then((res) => res.content.toString());

    // 📢 构造搜索关键词消息，通知前端显示
    const keywordsMessage: ChatMessage = {
      type: 'websearch-keywords',
      payload: { keywords },
    };

    // 💾 将 AI 生成的搜索关键词添加到上下文
    // 这样 AI 知道自己搜索了什么，保持对话连贯性
    context.push(new AIMessageChunk(`正在搜索：${keywords}`));

    // 📤 通知前端：展示搜索关键词
    yield keywordsMessage;

    /**
     * 🌐 第二步：执行网络搜索
     *
     * 调用 Bing 搜索 API，获取实时信息
     */
    const searchResults = await tools.websearch(keywords);

    // 📢 构造搜索结果消息，通知前端显示
    const searchResultsMessage: ChatMessage = {
      type: 'websearch-results',
      payload: { searchResults },
    };

    // 💾 将搜索结果添加到上下文
    // AI 会基于这些搜索结果生成最终回复
    context.push(
      new AIMessageChunk(`搜索结果：${JSON.stringify(searchResults)}`),
    );

    // 📤 通知前端：展示搜索结果
    yield searchResultsMessage;
  }

  /**
   * 🤖 第三步：调用模型生成最终回复
   *
   * 此时上下文包含：
   * - 历史对话
   * - 用户当前问题
   * - [可选] 搜索关键词
   * - [可选] 搜索结果
   */
  const stream = await llm.stream(context, { signal });

  let reply = ''; // 💬 累积完整回复内容

  // 🌊 接收模型的流式响应，实时转发给前端
  for await (const chunk of stream) {
    const content = chunk.content.toString();

    // 📤 将流式内容发送给前端，实现打字机效果
    yield {
      type: 'assistant',
      partial: true, // 🔄 标记为部分响应
      payload: { content },
    };

    // 🔤 累积完整的回复内容
    reply += content;
  }

  // 💾 保存完整的模型回复到上下文
  // 即便中途断开，也能保存部分回复，避免丢失
  context.push(new AIMessageChunk(reply));
}
