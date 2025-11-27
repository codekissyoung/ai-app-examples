# 05-chatbot-ui-websearch

带联网搜索功能的 Web UI 聊天机器人（Workflow）

# 功能特性

- 使用免费 Bing 搜索接口
- 基础的 Workflow 范式实现
- 基础的上下文管理
- 前端 Markdown 渲染、自定义消息渲染

# 配置 API Key

默认情况下本项目与 04-chatbot-ui 保持一致，使用 DeepSeek 的 OpenAI 兼容接口。你也可以通过环境变量切换成任何兼容的模型服务商（如通义千问、Kimi、Claude 等），推荐先阅读 [仓库根目录 README](../README.md#模型服务和-api-key-说明) 了解如何申请 API Key。

在本目录下创建 `.env` 文件，配置如下内容（BASE_URL、MODEL 可按需覆盖）：

```bash
# 必填
API_KEY=sk-your-api-key

# 可选，默认为 DeepSeek
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat
```

# 运行项目

在此目录下，执行以下命令：

```bash
npm install

# 同时启动前后端
npm run dev

# 或是分别启动前后端
npm run dev:ui
npm run dev:server
```

# 调试说明

访问下面的接口查看当前服务端存储的全量消息：

http://localhost:5173/api/messages

# 视频讲解

https://www.bilibili.com/video/BV18G2TBHENq/
