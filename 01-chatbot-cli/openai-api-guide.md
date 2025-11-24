# OpenAI API 完整指南

## 📚 目录
1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [Chat Completions API](#chat-completions-api)
4. [流式返回](#流式返回)
5. [高级参数](#高级参数)
6. [最佳实践](#最佳实践)
7. [错误处理](#错误处理)
8. [计费与限流](#计费与限流)

---

## 快速开始

### 认证方式

```bash
# HTTP 请求头
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### 基础请求示例

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "你是一个有帮助的助手"},
      {"role": "user", "content": "你好！"}
    ]
  }'
```

---

## 核心概念

### 1. 端点（Endpoints）

```
主要端点：
├─ /v1/chat/completions          # 对话生成（主要使用）
├─ /v1/completions               # 文本补全（旧版）
├─ /v1/embeddings                # 文本向量化
├─ /v1/images/generations        # 图像生成
└─ /v1/audio/transcriptions      # 语音转文字
```

### 2. 消息角色（Roles）

```typescript
messages: [
  {
    role: "system",     // 系统：定义 AI 行为和角色
    content: "你是专业的编程助手"
  },
  {
    role: "user",       // 用户：用户的输入
    content: "如何学习 TypeScript？"
  },
  {
    role: "assistant",  // 助手：AI 的回复（历史记录）
    content: "TypeScript 是 JavaScript 的超集..."
  }
]
```

**角色说明**：
- `system`: 设定 AI 角色、行为规则、输出格式（只在开头设置一次）
- `user`: 用户的实际输入
- `assistant`: AI 的历史回复（用于多轮对话上下文）

### 3. 对话历史管理

```typescript
// ❌ 错误：每次只发最新消息
messages: [
  { role: "user", content: "最新问题" }  // 丢失上下文！
]

// ✅ 正确：发送完整历史
messages: [
  { role: "system", content: "你是助手" },
  { role: "user", content: "第一个问题" },
  { role: "assistant", content: "第一个回答" },
  { role: "user", content: "第二个问题" },
  { role: "assistant", content: "第二个回答" },
  { role: "user", content: "最新问题" }  // 有完整上下文
]
```

---

## Chat Completions API

### 完整请求参数

```typescript
{
  // ===== 必填参数 =====
  "model": "gpt-4",                    // 模型名称
  "messages": [...],                   // 消息数组

  // ===== 常用可选参数 =====
  "temperature": 0.7,                  // 随机性 (0-2, 默认 1)
  "max_tokens": 1000,                  // 最大输出 token 数
  "stream": false,                     // 是否流式返回

  // ===== 高级参数 =====
  "top_p": 1,                          // 核采样 (0-1, 默认 1)
  "n": 1,                              // 生成几个回复 (默认 1)
  "stop": ["\n\n", "END"],             // 停止词列表
  "presence_penalty": 0,               // 话题新鲜度 (-2 到 2)
  "frequency_penalty": 0,              // 重复惩罚 (-2 到 2)
  "logit_bias": {},                    // token 概率偏移
  "user": "user-123",                  // 用户标识（可选）

  // ===== 函数调用（工具）=====
  "tools": [...],                      // 工具定义（Agent 模式）
  "tool_choice": "auto"                // 工具选择策略
}
```

### 完整响应格式

#### 普通响应（stream: false）
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4",
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 7,
    "total_tokens": 20
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "你好！有什么可以帮你的？"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

#### 流式响应（stream: true）
```
# SSE 格式（Server-Sent Events）
data: {"id":"chatcmpl-abc123","choices":[{"delta":{"role":"assistant"}}]}

data: {"id":"chatcmpl-abc123","choices":[{"delta":{"content":"你"}}]}

data: {"id":"chatcmpl-abc123","choices":[{"delta":{"content":"好"}}]}

data: {"id":"chatcmpl-abc123","choices":[{"delta":{"content":"！"}}]}

data: [DONE]
```

---

## 流式返回

### 流式 vs 普通对比

```
普通模式（stream: false）:
User: 你好
[等待 3 秒...]
Assistant: 你好！有什么可以帮你的？我是一个...

流式模式（stream: true）:
User: 你好
Assistant: 你好！有什么可|以帮你的？我是一个...
           ↑ 逐字显示（打字机效果）
```

### 流式返回实现要点

```typescript
// 1. 设置 stream: true
const response = await fetch(url, {
  body: JSON.stringify({
    model: "gpt-4",
    messages,
    stream: true  // ← 关键
  })
});

// 2. 遍历响应流
for await (const chunk of response.body) {
  // 3. 解码二进制数据
  const text = decoder.decode(chunk, { stream: true });

  // 4. 解析 SSE 格式
  const lines = text.split('\n').filter(line => line.startsWith('data: '));

  for (const line of lines) {
    if (line === 'data: [DONE]') break;

    const json = JSON.parse(line.slice(6));  // 去除 'data: ' 前缀
    const content = json.choices[0]?.delta?.content || '';

    // 5. 逐块输出
    process.stdout.write(content);
  }
}
```

---

## 高级参数

### 1. Temperature（温度）

```
控制输出的随机性和创造性

0.0  ───────────────────────> 2.0
确定性                        随机性
专业/事实                     创意/变化

推荐值：
├─ 0.0-0.3:  代码生成、翻译、摘要（需要精确）
├─ 0.5-0.7:  问答、对话（平衡）
├─ 0.8-1.0:  创意写作、头脑风暴（需要多样性）
└─ 1.0+:     实验性创作（很随机）
```

**示例**：
```typescript
// 代码生成（需要确定性）
{ temperature: 0.2, messages: [{ role: "user", content: "写一个快速排序" }] }

// 创意写作（需要多样性）
{ temperature: 0.9, messages: [{ role: "user", content: "写一首关于春天的诗" }] }
```

### 2. Max Tokens（最大 Token 数）

```
限制模型输出的最大长度

计算公式：
输入 tokens + 输出 tokens <= 模型上下文窗口

GPT-4:     8K / 32K / 128K 上下文
GPT-3.5:   4K / 16K 上下文
```

**注意事项**：
- 1 token ≈ 0.75 英文单词
- 1 token ≈ 0.5 中文字符
- 设置过小会导致输出截断
- 不设置则使用默认值（通常到模型上限）

### 3. Top P（核采样）

```
与 temperature 类似，控制输出多样性

工作原理：
只考虑累计概率达到 p 的 token

top_p = 0.1  → 只考虑概率最高的 10% token（保守）
top_p = 0.9  → 考虑概率前 90% token（平衡）
top_p = 1.0  → 考虑所有 token（最随机）

建议：temperature 和 top_p 通常只调一个
```

### 4. Presence Penalty（存在惩罚）

```
鼓励模型谈论新话题

范围：-2.0 到 2.0

 0.0   → 无影响
 0.5   → 轻微鼓励新话题
 1.0   → 明显鼓励新话题
 2.0   → 强烈鼓励新话题（可能过度发散）
-1.0   → 鼓励重复话题

适用场景：
✅ 头脑风暴、创意生成
✅ 避免循环重复
❌ 专注单一主题时不要用
```

### 5. Frequency Penalty（频率惩罚）

```
减少字词重复

范围：-2.0 到 2.0

 0.0   → 无影响
 0.5   → 轻微减少重复
 1.0   → 明显减少重复
 2.0   → 强烈避免重复（可能语句不自然）

适用场景：
✅ 避免啰嗦、重复表达
✅ 生成多样化文本
❌ 需要重复某些术语时不要用
```

### 6. Stop（停止词）

```typescript
// 遇到指定词立即停止生成
{
  "messages": [...],
  "stop": ["\n\n", "END", "---"]
}

// 用途：
// 1. 控制输出格式
// 2. 分段生成
// 3. 避免超长输出
```

---

## 最佳实践

### 1. System Prompt 设计

```typescript
// ❌ 不好：模糊、无约束
{ role: "system", content: "你是一个助手" }

// ✅ 好：具体、有约束、有格式
{
  role: "system",
  content: `你是专业的 Python 编程导师。

职责：
- 解答 Python 编程问题
- 提供可运行的代码示例
- 指出常见错误和最佳实践

约束：
- 回答简洁，不超过 200 字
- 代码必须加注释
- 不讨论 Python 以外的话题

输出格式：
1. 简短说明（1-2 句话）
2. 代码示例（带注释）
3. 关键要点（3 条以内）`
}
```

### 2. 控制输出格式

```typescript
// 方法 1：在 system 中定义格式
{
  role: "system",
  content: `你必须以 JSON 格式返回，格式如下：
{
  "summary": "摘要",
  "keywords": ["关键词1", "关键词2"],
  "sentiment": "positive/negative/neutral"
}`
}

// 方法 2：使用 response_format（仅 GPT-4 Turbo+）
{
  "model": "gpt-4-turbo",
  "messages": [...],
  "response_format": { "type": "json_object" }
}
```

### 3. 多轮对话管理

```typescript
// 策略 1：完整历史（适合短对话）
const messages = [
  { role: "system", content: systemPrompt },
  ...allHistory  // 包含所有历史
];

// 策略 2：滑动窗口（适合长对话）
const messages = [
  { role: "system", content: systemPrompt },
  ...recentHistory.slice(-10)  // 只保留最近 10 条
];

// 策略 3：摘要压缩（适合超长对话）
const messages = [
  { role: "system", content: systemPrompt },
  { role: "system", content: `之前对话摘要：${summary}` },
  ...recentHistory.slice(-5)
];
```

### 4. Token 管理

```typescript
// 粗略估算 token 数
function estimateTokens(text: string): number {
  // 英文：4 字符 ≈ 1 token
  // 中文：1.5 字符 ≈ 1 token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

// 精确计算：使用 tiktoken 库
import { encoding_for_model } from 'tiktoken';
const encoder = encoding_for_model('gpt-4');
const tokens = encoder.encode(text);
console.log('Token count:', tokens.length);
```

---

## 错误处理

### 常见错误代码

```typescript
// 401 Unauthorized
// 原因：API Key 无效或未提供
if (response.status === 401) {
  console.error('API Key 无效，请检查配置');
}

// 429 Rate Limit Exceeded
// 原因：超过请求频率限制
if (response.status === 429) {
  console.error('请求过于频繁，请稍后重试');
  // 建议：指数退避重试
}

// 500 Internal Server Error
// 原因：服务器内部错误
if (response.status === 500) {
  console.error('服务器错误，请稍后重试');
}

// 503 Service Unavailable
// 原因：服务暂时不可用（过载）
if (response.status === 503) {
  console.error('服务暂时不可用');
}
```

### 重试策略

```typescript
async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      // 429/500/503 可重试
      if ([429, 500, 503].includes(response.status)) {
        const delay = Math.pow(2, i) * 1000;  // 指数退避：1s, 2s, 4s
        console.log(`重试 ${i + 1}/${maxRetries}，等待 ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // 其他错误直接抛出
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
    }
  }
}
```

---

## 计费与限流

### 计费规则

```
计费单位：Token
价格（2024 年参考）：
├─ GPT-4 Turbo:  $10 / 1M input tokens, $30 / 1M output tokens
├─ GPT-4:        $30 / 1M input tokens, $60 / 1M output tokens
└─ GPT-3.5:      $0.5 / 1M input tokens, $1.5 / 1M output tokens

计费对象：
├─ 输入 tokens:  messages 中所有内容（包括历史）
└─ 输出 tokens:  模型生成的内容

优化建议：
✅ 精简 system prompt
✅ 使用滑动窗口管理历史
✅ 选择合适的模型（GPT-3.5 vs GPT-4）
✅ 设置合理的 max_tokens
```

### 限流规则

```
限流维度：
├─ RPM (Requests Per Minute):  每分钟请求数
├─ TPM (Tokens Per Minute):    每分钟 token 数
└─ RPD (Requests Per Day):     每日请求数

不同账户等级限流不同：
├─ 免费层:   3 RPM, 40K TPM
├─ 付费层:   60 RPM, 250K TPM
└─ 企业层:   可定制

应对策略：
✅ 实现请求队列
✅ 指数退避重试
✅ 监控使用量
✅ 升级账户等级
```

---

## 附录：模型对比

| 模型 | 上下文窗口 | 特点 | 适用场景 |
|:---|:---:|:---|:---|
| **gpt-4-turbo** | 128K | 最新、最强、最快 | 复杂推理、长文本 |
| **gpt-4** | 8K | 强大、稳定 | 复杂任务、高质量输出 |
| **gpt-3.5-turbo** | 16K | 快速、便宜 | 简单对话、大量请求 |
| **gpt-3.5-turbo-16k** | 16K | 长上下文版 | 长文本处理 |

---

## 学习资源

- **官方文档**: https://platform.openai.com/docs
- **API 参考**: https://platform.openai.com/docs/api-reference
- **Cookbook**: https://github.com/openai/openai-cookbook
- **社区论坛**: https://community.openai.com

---

**提示**：本文档基于 OpenAI API 标准格式，同样适用于兼容 OpenAI API 的服务商（Kimi、通义千问、DeepSeek 等）。
