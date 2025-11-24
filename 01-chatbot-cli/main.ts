import readline from 'readline';
import fs from 'fs';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// API 配置（从环境变量读取密钥）
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.moonshot.cn/v1';
const MODEL = 'kimi-k2-turbo-preview';

// 从文件读取系统提示词
const systemPrompt = fs.readFileSync('system-prompt.md', 'utf-8');

// 对话历史：初始化时只包含 system 消息（设定 AI 角色）
const messages: Message[] = [
  {
    role: 'system',
    content: systemPrompt,
  },
];

// 主函数：包装 top-level await 避免警告
async function main() {
  // 主循环：不断读取用户输入 → 调用 API → 显示回复
  while (true) {
    const input = await readInput();
    if (!input.trim()) {
      continue; // 直接输入回车的话，直接跳过
    }

    // 将用户输入添加到对话历史
    messages.push({ role: 'user', content: input });

    // 调用 API 获取模型回复（传入完整对话历史）
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
 * 调用 LLM API 获取回复（异步）
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