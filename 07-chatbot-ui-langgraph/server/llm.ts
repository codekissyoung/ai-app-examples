import { ChatOpenAI } from '@langchain/openai';

// 取得调用模型 API 的必要参数（与 04 项目保持一致的默认值）
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = process.env.MODEL || 'deepseek-chat';

if (!API_KEY || !BASE_URL || !MODEL) {
  console.error('缺少必要的环境变量配置：');
  if (!API_KEY) console.error('  - API_KEY');
  if (!BASE_URL) console.error('  - BASE_URL');
  if (!MODEL) console.error('  - MODEL');
  process.exit(1);
}

// 创建 LangChain 模型实例
export const llm = new ChatOpenAI({
  model: MODEL,
  configuration: {
    baseURL: BASE_URL,
    apiKey: API_KEY,
  },
  streaming: true,
});
