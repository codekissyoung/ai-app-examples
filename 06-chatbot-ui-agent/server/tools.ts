import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 🌐 联网搜索函数
 *
 * 实现原理：
 * 1. 使用 Bing 搜索的 RSS 接口（免费，无需 API Key）
 * 2. 解析 RSS 格式的搜索结果
 * 3. 用正则表达式提取标题、链接、描述等信息
 *
 * @param args 搜索参数
 * @param args.keywords 搜索关键词（支持多个词，用空格分隔）
 * @returns 搜索结果数组，包含标题、链接、描述
 */
async function websearch(args: { keywords: string }) {
  const { keywords } = args;

  // 🔍 发起 Bing 搜索请求，使用 RSS 格式输出
  // RSS 格式比 HTML 更容易解析，结构化程度更高
  const res = await fetch(
    `https://www.bing.com/search?format=rss&q=${encodeURIComponent(keywords)}`,
  );

  // 📄 获取 RSS 文本内容
  const rss = await res.text();

  // 🎯 用正则表达式提取所有的 <item> 标签（每个 item 代表一个搜索结果）
  const matches = rss.match(/<item>(.*?)<\/item>/g);

  // ❌ 如果没有找到任何搜索结果，返回空数组
  if (!matches) {
    return [];
  }

  // 🔧 解析每个搜索结果项，提取结构化信息
  const results = matches.map((match) => {
    // 📖 提取标题
    const title = match.match(/<title>(.*?)<\/title>/)?.[1];
    // 🔗 提取链接
    const link = match.match(/<link>(.*?)<\/link>/)?.[1];
    // 📝 提取描述（可选）
    const description = match.match(/<description>(.*?)<\/description>/)?.[1];

    // ❌ 过滤掉无效结果（标题和链接是必需的）
    if (!title || !link) {
      return null;
    }

    // ✅ 返回结构化的搜索结果
    return { title, link, description };
  });

  // 🧹 清理结果：移除无效项，只返回有效结果
  return results.filter((result) => result !== null);
}

/**
 * 🔧 LangChain 工具封装器
 *
 * 为什么要封装？
 * LangChain 需要特定的工具格式才能与 AI 模型配合使用。
 * tool() 函数将我们的普通函数转换为 LangChain 兼容的工具。
 *
 * 封装内容：
 * - description: AI 模型通过这个描述了解工具的功能
 * - name: 工具的唯一标识符，模型调用时使用
 * - schema: 定义输入参数的结构和验证规则
 */
const websearchTool = tool(websearch, {
  description: '搜索互联网，获取实时信息', // 📖 AI 模型看到的工具描述
  name: 'websearch',                        // 🏷️ 工具名称，模型调用时使用
  schema: z.object({
    keywords: z.string().describe('搜索关键词，多个关键词用空格分隔'),
  }),
});

// 📦 导出所有可用工具，供 agent 使用
export const tools = [websearchTool];
