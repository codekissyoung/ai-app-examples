import {
  BaseMessage,
  ToolMessage,
  type AIMessageChunk,
} from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';
import { type DynamicStructuredTool } from '@langchain/core/tools';

/**
 * 🔍 工具调用判断函数
 *
 * 功能：检查 AI 模型的返回消息是否包含工具调用请求
 *
 * 判断条件：
 * 1. 消息存在
 * 2. 消息包含 tool_calls 属性
 * 3. tool_calls 是非空数组
 *
 * 使用 TypeScript 的类型谓词（Type Predicate），
 * 如果返回 true，TypeScript 会将 message 类型缩窄为包含 tool_calls 的具体类型
 *
 * @param message AI 模型返回的消息（可选）
 * @returns 如果是工具调用则返回 true，否则返回 false
 */
export function isToolCall(
  message?: BaseMessage,
): message is AIMessageChunk & { tool_calls: ToolCall[] } {
  return Boolean(
    message &&                              // 📌 消息存在
      'tool_calls' in message &&           // 🔧 包含 tool_calls 属性
      Array.isArray(message.tool_calls) && // 📋 tool_calls 是数组
      message.tool_calls.length,           // 🔢 数组非空
  );
}

/**
 * ⚡ 工具调用执行器
 *
 * 功能：根据 AI 模型的工具调用请求，执行对应的工具函数
 *
 * 执行流程：
 * 1. 遍历每个工具调用请求
 * 2. 在可用工具列表中查找匹配的工具
 * 3. 执行工具函数并获取结果
 * 4. 将结果包装为 ToolMessage 格式返回
 *
 * 并发处理：支持同时执行多个工具调用（提高效率）
 * 错误处理：如果找不到对应工具，返回错误信息
 *
 * @param tools 可用工具列表（在 tools.ts 中定义）
 * @param toolCalls AI 模型生成的工具调用请求列表
 * @returns 执行结果列表，每个结果都是 ToolMessage 格式
 */
export async function executeToolCalls(
  tools: DynamicStructuredTool[],
  toolCalls: ToolCall[],
) {
  /**
   * 🎯 单个工具调用执行器
   *
   * @param toolCall 单个工具调用请求
   * @returns ToolMessage 格式的执行结果
   */
  const execute = async (toolCall: ToolCall) => {
    const { id, name, args } = toolCall;

    // 🔍 在工具列表中查找匹配的工具
    for (const tool of tools) {
      if (tool.name === name) {
        // ✅ 找到匹配工具，执行工具函数
        const result = await tool.invoke(args);

        // 📦 将执行结果包装为 ToolMessage 格式
        // ToolMessage 是 LangChain 的标准消息格式，用于表示工具执行结果
        return new ToolMessage({
          name: name!,                    // 🏷️ 工具名称
          tool_call_id: id!,             // 🆔 关联到原始工具调用请求
          content: JSON.stringify(result), // 📄 序列化执行结果
        });
      }
    }

    // ❌ 没找到对应工具，返回错误信息
    // 这种情况通常发生在工具名称拼写错误或工具未正确注册
    return new ToolMessage({
      name: name!,
      tool_call_id: id!,
      content: `unknown tool call: ${name}`, // 🚨 错误提示
    });
  };

  // 🚀 并发执行所有工具调用
  // Promise.all 会同时启动所有工具调用，提高执行效率
  // 注意：虽然这里支持多个工具调用，但本项目中通常只有一个 websearch 工具
  return Promise.all(toolCalls.map(execute));
}
