# 三种 API 调用方式对比

## 方式 1：Kimi 官方推荐（openai SDK）

```javascript
const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: "sk-xxx",
    baseURL: "https://api.moonshot.cn/v1",
});

const completion = await client.chat.completions.create({
    model: "kimi-k2-turbo-preview",
    messages: history,
    stream: false  // 或 true
});
```

**优点**：
- ✅ 官方 SDK，功能完整
- ✅ 错误处理完善
- ✅ 自动重试、超时控制
- ✅ 类型提示完整（TypeScript）
- ✅ 生产环境推荐

**缺点**：
- ❌ 黑盒封装，看不到底层实现
- ❌ 学习价值低，不理解原理

---

## 方式 2：01 项目原生实现（fetch）

```typescript
const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
    }),
});

// 手动解析 SSE 格式
const decoder = new TextDecoder();
for await (const value of res.body) {
    const text = decoder.decode(value, { stream: true });
    // 手动拆分、解析 JSON...
}
```

**优点**：
- ✅ 理解底层原理（HTTP、SSE、Stream）
- ✅ 学习价值高
- ✅ 无依赖，代码可控
- ✅ 教学目的最佳

**缺点**：
- ❌ 代码量大（135 行）
- ❌ 错误处理需要自己写
- ❌ 维护成本高

---

## 方式 3：LangChain 框架

```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
    model: MODEL,
    configuration: {
        baseURL: BASE_URL,
        apiKey: API_KEY,
    },
    streaming: true,
});

const chunks = await model.stream(messages);
```

**优点**：
- ✅ 高层抽象，易于扩展
- ✅ 统一接口（可切换不同模型）
- ✅ 内置工具链（Agents、Tools）
- ✅ 适合复杂 AI 应用

**缺点**：
- ❌ 学习曲线陡峭
- ❌ 依赖较重
- ❌ 底层细节被隐藏

---

## 依赖关系

```
┌────────────────────────────────────────┐
│          LangChain                     │
│  (@langchain/openai)                   │
│            ↓                           │
│       OpenAI SDK                       │
│       (openai npm)                     │
│            ↓                           │
│      fetch / axios                     │
│            ↓                           │
│      HTTP Request                      │
│            ↓                           │
│   Kimi API Server                      │
└────────────────────────────────────────┘

原生实现直接跳过中间层，直接 fetch
```

---

## 使用场景建议

| 场景 | 推荐方案 |
|:---|:---|
| **学习底层原理** | 原生 fetch 实现 ⭐⭐⭐⭐⭐ |
| **快速开发原型** | openai SDK ⭐⭐⭐⭐⭐ |
| **生产环境** | openai SDK ⭐⭐⭐⭐⭐ |
| **复杂 AI 应用** | LangChain ⭐⭐⭐⭐⭐ |
| **教学演示** | 原生 fetch ⭐⭐⭐⭐⭐ |

---

## API 格式完全相同

无论用哪种方式，最终发送的 HTTP 请求格式都是一样的：

```http
POST https://api.moonshot.cn/v1/chat/completions
Content-Type: application/json
Authorization: Bearer sk-xxx

{
  "model": "kimi-k2-turbo-preview",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "stream": true
}
```

响应格式（SSE）：
```
data: {"choices":[{"delta":{"content":"你"}}]}
data: {"choices":[{"delta":{"content":"好"}}]}
data: [DONE]
```

---

## 总结

- **Kimi 官方用 openai SDK**：因为 API 完全兼容，开发者体验好
- **01 项目用原生 fetch**：教学目的，让学习者理解底层原理
- **本质相同**：都是发送相同格式的 HTTP 请求

建议：
1. **学习阶段**：用原生实现理解原理
2. **实际开发**：用 openai SDK 或 LangChain
3. **本项目价值**：同时支持三种方式，可对比学习
