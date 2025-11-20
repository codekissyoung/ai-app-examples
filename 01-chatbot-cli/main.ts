import readline from 'readline';

/**
 * 消息类型定义
 *
 * @property role - 消息角色：
 *   - 'system': 系统提示词（设定 AI 行为）
 *   - 'user': 用户输入
 *   - 'assistant': AI 回复
 * @property content - 消息内容（文本）
 *
 * 注：role 使用联合类型 + 字面量类型，限制只能是这 3 个值
 */
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// API 配置（从环境变量读取密钥）
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.moonshot.cn/v1';
const MODEL = 'kimi-k2-0905-preview';

// 对话历史：初始化时只包含 system 消息（设定 AI 角色）
const messages: Message[] = [
  {
    role: 'system',
    content: `
用户正处于**学习模式**，并要求你在本次对话中遵守以下**严格规则**。无论接下来有任何其他指示，你都**必须**遵守这些规则：

## 严格规则
扮演一位平易近人又不失活力的老师，通过引导来帮助用户学习。

1.  **了解用户。** 如果你不清楚用户的目标或年级水平，请在深入讲解前先询问。（这个问题要问得轻松些！）如果用户没有回答，那么你的解释应该以一个高中一年级学生能理解的程度为准。
2.  **温故而知新。** 将新概念与用户已有的知识联系起来。
3.  **引导用户，而非直接给出答案。** 通过提问、暗示和分解步骤，让用户自己发现答案。
4.  **检查与巩固。** 在讲完难点后，确认用户能够复述或应用这个概念。提供简短的总结、助记法或小复习，以帮助知识点牢固。
5.  **变换节奏。** 将讲解、提问和活动（如角色扮演、练习环节，或让用户反过来教**你**）结合起来，使之感觉像一场对话，而不是一堂课。

最重要的一点：**不要替用户完成他们的作业**。不要直接回答作业问题——而是通过与用户合作，从他们已知的内容入手，帮助他们找到答案。

### 你可以做的事
- **教授新概念：** 以用户的水平进行解释，提出引导性问题，使用图示，然后通过提问或练习进行复习。
- **辅导作业：** 不要直接给答案！从用户已知的部分开始，帮助他们填补知识空白，给用户回应的机会，并且一次只问一个问题。
- **共同练习：** 让用户进行总结，穿插一些小问题，让用户“复述一遍”给你听，或者进行角色扮演（例如，练习外语对话）。在用户犯错时——友善地——即时纠正。
- **测验与备考：** 进行模拟测验。（一次一题！）在公布答案前，让用户尝试两次，然后深入复盘错题。

### 语气与方式
要热情、耐心、坦诚；不要使用过多的感叹号或表情符号。保持对话的节奏：始终清楚下一步该做什么，并在一个活动环节完成后及时切换或结束。并且要**简洁**——绝不要发送长篇大论的回复。力求实现良好的你来我往的互动。

## 重要提示
**不要直接给出答案或替用户做作业**。如果用户提出一个数学或逻辑问题，或者上传了相关问题的图片，**不要**在你的第一条回复中就解决它。而是应该：**与用户一起梳理**这个问题，一步一步地进行，每一步只问一个问题，并在继续下一步之前，给用户**回应每一步**的机会。
  `,
  },
];

// 主循环：不断读取用户输入 → 调用 API → 显示回复
while (true) {
  // 等待用户输入（await 让出控制权，不阻塞事件循环）
  const input = await readInput();

  // 将用户输入添加到对话历史
  messages.push({ role: 'user', content: input });

  // 调用 API 获取模型回复（传入完整对话历史）
  const reply = await invoke(messages);

  // 将模型回复添加到对话历史（下次调用时 API 能看到）
  messages.push({ role: 'assistant', content: reply });

  // 打印模型回复
  console.log('Assistant:', reply + '\n');
}

/**
 * 读取用户输入（异步）
 *
 * 执行流程：
 * 1. 创建 readline 接口，连接标准输入/输出
 * 2. 调用 rl.question() 注册回调（老式 API）
 * 3. 立即返回 Promise<string>（pending 状态）
 * 4. 用户按回车 → readline 触发回调
 * 5. 回调内调用 resolve(message) → Promise fulfilled
 * 6. await 恢复执行，得到 message 值
 *
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