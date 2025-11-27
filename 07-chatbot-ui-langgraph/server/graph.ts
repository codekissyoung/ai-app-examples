import { BaseMessage } from '@langchain/core/messages';
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

import { llm } from './llm.ts';
import { tools } from './tools.ts';
import { isToolCall, last } from './utils.ts';

/**
 * 🗺️ LangGraph 状态定义
 *
 * 这是整个状态图的核心数据结构，管理所有节点间的状态传递
 */
const GraphState = Annotation.Root({
  // 💬 消息列表：存储所有对话消息和工具调用结果
  messages: Annotation<BaseMessage[]>({
    // 🔄 状态合并策略：新消息追加到现有消息列表
    reducer: (x, y) => x.concat(y),
  }),
});

// 📋 状态类型定义，用于 TypeScript 类型检查
type State = typeof GraphState.State;

/**
 * 🏗️ 创建 LangGraph 状态图
 *
 * 功能：定义智能体的工作流程和节点间连接关系
 *
 * 状态图结构：
 * ```
 * START → start → beforeToolCall → [工具调用?] → YES → tools → afterToolCall → start
 *                                  ↓
 *                                 NO → END
 * ```
 *
 * @returns 编译后的状态图实例
 */
export function createGraph() {
  // 🗺️ 创建基于状态的图结构
  const graph = new StateGraph(GraphState);

  graph
    // 🎯 节点定义：图中的处理单元
    .addNode('start', start)                    // 🤖 AI 推理节点
    // 🔧 LangGraph 内置工具节点：自动处理工具调用和结果
    // 💡 知识点：ToolNode 会自动从 messages 中提取工具调用请求，执行后追加结果
    .addNode('tools', new ToolNode(tools))

    // 🔗 边定义：节点间的连接关系
    .addEdge(START, 'start')                    // 🚀 入口：开始节点
    .addConditionalEdges('start', beforeToolCall)  // 🎯 条件边：工具调用前决策
    .addConditionalEdges('tools', afterToolCall);  // 🔄 条件边：工具调用后处理

  // ✅ 编译状态图，生成可执行实例
  return graph.compile();
}

/**
 * 🤖 AI 推理节点
 *
 * 功能：
 * 1. 接收当前状态（消息历史）
 * 2. 调用 AI 模型进行推理
 * 3. 让 AI 自主决定是否使用工具
 * 4. 返回 AI 的响应消息
 *
 * @param state 当前状态，包含消息历史
 * @returns 更新后的状态，包含 AI 响应消息
 */
async function start(state: State) {
  const { messages } = state;

  // 🔧 给模型绑定可用工具，让 AI 知道可以调用哪些工具
  const llmWithTools = llm.bindTools(tools);

  // 🤖 调用模型进行推理
  // TODO: 简单起见这里用的是同步调用（invoke），应该改造为流式调用（stream）以获得更好用户体验
  const response = await llmWithTools.invoke(messages, {
    tool_choice: 'auto',  // 🔑 关键：让模型自主决定是否使用工具
  });

  // 📤 返回更新后的状态：将 AI 响应添加到消息列表
  return {
    messages: [response],
  };
}

/**
 * 🎯 工具调用前决策节点（条件边函数）
 *
 * 功能：判断 AI 是否决定使用工具，决定下一步执行路径
 *
 * 决策逻辑：
 * - 如果最后一条消息是工具调用 → 路由到 tools 节点
 * - 如果最后一条消息是普通回复 → 结束流程
 *
 * @param state 当前状态
 * @returns 下一个节点名称或 END
 */
function beforeToolCall(state: State) {
  // 📋 获取最后一条消息，判断 AI 的决策
  const lastMessage = last(state.messages);

  // 🔍 检查是否为工具调用请求
  if (isToolCall(lastMessage)) {
    // 🔧 AI 决定使用工具，路由到工具执行节点
    return 'tools';
  }

  // ✅ AI 决定直接回复用户，结束工作流
  return END;
}

/**
 * 🔄 工具调用后处理节点（条件边函数）
 *
 * 功能：工具执行完成后的下一步决策
 *
 * 设计思路：
 * - 工具执行完成后，通常需要继续推理
 * - 让 AI 基于工具结果决定下一步行动
 * - 可能需要多次工具调用才能完成任务
 *
 * 💡 知识点：这个节点不是必须的，可以在这里按需处理工具调用结果
 * 例如：结果验证、错误处理、结果格式化等
 *
 * @param state 当前状态（包含工具执行结果）
 * @returns 下一个节点名称
 */
function afterToolCall(state: State) {
  // 🔄 回到 start 节点，让 AI 基于工具结果继续推理
  // 这样形成了一个完整的推理循环：
  // AI 推理 → 工具调用 → 结果处理 → 再次推理
  return 'start';
}
