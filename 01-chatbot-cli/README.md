# 01-chatbot-cli

一个支持三层抽象架构的命令行聊天机器人，可在同一项目中学习和对比不同层次的实现方式。

## 🎯 三层抽象架构

```
┌─────────────────────────────────────────────────────┐
│                   抽象层次金字塔                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│         🔺 L3: AI 应用框架层                        │
│        ┌─────────────────────┐                     │
│        │    LangChain        │  ← 最高抽象         │
│        │  - Agents           │    复杂 AI 应用     │
│        │  - Tools            │    工作流编排       │
│        │  - Chains           │    代码量: 5 行     │
│        └─────────────────────┘                     │
│               ▲                                     │
│               │ 依赖                                │
│               │                                     │
│         🔺 L2: SDK 客户端层                         │
│        ┌─────────────────────┐                     │
│        │   OpenAI SDK        │  ← 中层封装         │
│        │  - 自动重试         │    生产级特性       │
│        │  - 错误处理         │    类型安全         │
│        │  - 流式处理         │    代码量: 10 行    │
│        └─────────────────────┘                     │
│               ▲                                     │
│               │ 封装                                │
│               │                                     │
│         🔺 L1: HTTP 原语层                          │
│        ┌─────────────────────┐                     │
│        │  fetch / axios      │  ← 最底层           │
│        │  - HTTP Headers     │    理解原理         │
│        │  - Request Body     │    完全可控         │
│        │  - SSE 解析         │    代码量: 135 行   │
│        └─────────────────────┘                     │
│               ▲                                     │
│               │                                     │
│         TCP/HTTP 协议                               │
│               ▼                                     │
│        Kimi API Server                              │
└─────────────────────────────────────────────────────┘
```

## 📦 配置说明

在项目目录下创建 `.env` 文件：

```bash
# API 密钥（必填）
API_KEY=sk-your-api-key

# API 基础 URL（可选，默认：https://api.moonshot.cn/v1）
BASE_URL=https://api.moonshot.cn/v1

# 模型名称（可选，默认：kimi-k2-turbo-preview）
MODEL=kimi-k2-turbo-preview

# 返回模式（可选，默认：normal）
# stream = 流式返回（打字机效果）
# normal = 一次性返回
RETURN_MODE=stream

# SDK 选择（可选，默认：native）
# native    = L1 原生 fetch 实现
# openai    = L2 OpenAI SDK
# langchain = L3 LangChain 框架
USE_SDK=native
```

## 🚀 运行项目

```bash
# 1. 安装依赖
npm install

# 2. 运行（使用 .env 配置）
npm start

# 3. 或者临时指定配置运行
USE_SDK=openai RETURN_MODE=stream npm start
```

## 🎓 六种模式组合

| USE_SDK | RETURN_MODE | 说明 | 适用场景 |
|:---:|:---:|:---|:---|
| `native` | `normal` | L1 + 一次性返回 | 学习 HTTP 请求基础 |
| `native` | `stream` | L1 + 流式返回 | 学习 SSE/Stream 原理 |
| `openai` | `normal` | L2 + 一次性返回 | 快速原型开发 |
| `openai` | `stream` | L2 + 流式返回 | 生产环境推荐 ⭐ |
| `langchain` | `normal` | L3 + 一次性返回 | 复杂 AI 应用基础 |
| `langchain` | `stream` | L3 + 流式返回 | 复杂 AI 应用优化 |

## 📊 代码量对比（相同功能）

| 层次 | 代码行数 | 复杂度 | 学习价值 | 生产推荐 |
|:---|:---:|:---:|:---:|:---:|
| L1 native | 135 行 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| L2 openai | 10 行 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| L3 langchain | 5 行 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔬 学习路径建议

### 第 1 周：L1 原生实现
```bash
USE_SDK=native RETURN_MODE=normal npm start   # 理解 HTTP 请求
USE_SDK=native RETURN_MODE=stream npm start   # 理解 SSE/Stream
```

**学习要点**：
- HTTP POST 请求构建
- Authorization Header 认证
- SSE (Server-Sent Events) 格式解析
- ReadableStream 处理
- TextDecoder 多字节字符处理
- AsyncGenerator 异步迭代器

### 第 2 周：L2 OpenAI SDK
```bash
USE_SDK=openai RETURN_MODE=normal npm start   # 对比代码量差异
USE_SDK=openai RETURN_MODE=stream npm start   # 生产级流式
```

**学习要点**：
- SDK 封装思想
- 类型安全 (TypeScript)
- 自动重试机制
- 错误处理最佳实践
- 生产环境配置

### 第 3 周：L3 LangChain
```bash
USE_SDK=langchain RETURN_MODE=normal npm start
USE_SDK=langchain RETURN_MODE=stream npm start
```

**学习要点**：
- 框架抽象设计
- 统一接口 (BaseMessage)
- 模型切换能力
- 为后续 Agents/Tools 打基础

## 💡 核心代码对比

### L1: 原生 fetch (135 行)
```typescript
async function* streamInvoke(messages: Message[]) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  });

  const decoder = new TextDecoder();
  for await (const value of res.body) {
    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (line === 'data: [DONE]') break;
      if (!line.startsWith('data: ')) continue;

      const json = JSON.parse(line.slice('data: '.length));
      const chunk = json.choices?.[0]?.delta?.content || '';
      if (chunk) yield chunk;
    }
  }
}
```

### L2: OpenAI SDK (10 行)
```typescript
const openai = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

const stream = await openai.chat.completions.create({
  model: MODEL,
  messages,
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### L3: LangChain (5 行)
```typescript
const model = new ChatOpenAI({
  model: MODEL,
  configuration: { baseURL: BASE_URL, apiKey: API_KEY },
  streaming: true,
});

const chunks = await model.stream(messages);
for await (const chunk of chunks) {
  process.stdout.write(chunk.content.toString());
}
```

## 🔄 切换不同服务商

### Moonshot (Kimi)
```bash
BASE_URL=https://api.moonshot.cn/v1
MODEL=kimi-k2-turbo-preview
```

### 通义千问
```bash
BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL=qwen-turbo
```

### OpenAI
```bash
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4
```

## 📝 系统提示词

系统提示词存储在 `system-prompt.md` 文件中，可以自定义 AI 角色和行为规则。

## 🎯 项目特色

1. **三层抽象同时支持** - 一个项目学习三种实现方式
2. **详细注释** - 每个关键点都有清晰的注释说明
3. **灵活配置** - 通过环境变量快速切换模式
4. **对比学习** - 直观理解不同抽象层次的差异
5. **生产级代码** - 包含完整的错误处理和类型定义

## 📚 参考资料

- [Moonshot AI (Kimi) 官方文档](https://platform.moonshot.cn/docs)
- [OpenAI SDK 文档](https://github.com/openai/openai-node)
- [LangChain.js 文档](https://js.langchain.com/)
- [Server-Sent Events (SSE) 规范](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 视频教程

配合 Bilibili UP 主「捣鼓键盘的小麦」的视频教程学习效果更佳。

---

**项目亮点**：从 HTTP 底层到 AI 框架的完整学习路径，适合从初学者到高级开发者的各个阶段。
