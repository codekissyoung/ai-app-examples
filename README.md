# AI Application Examples

🤖 人工智能应用开发实战教程 - 从基础到企业级架构

> 循序渐进的 AI 应用开发案例库，涵盖命令行工具到企业级智能体系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue)](https://www.typescriptlang.org/)

---

## 🎯 项目特色

- **🏗️ 架构演进**: 从简单 CLI 到企业级 LangGraph 状态图
- **📚 代码注解**: 详细的中文注释，学习友好
- **🔧 实战导向**: 每个项目都是完整可运行的应用
- **🌐 国内适配**: 支持国内大模型 API，降低学习门槛

---

## 📖 学习路径

### 基础阶段 (CLI 应用)
```
01-chatbot-cli          →  基础对话机器人
02-chatbot-cli-stream   →  流式输出改进
03-chatbot-cli-langchain →  LangChain 框架集成
```

### 进阶阶段 (Web 应用)
```
04-chatbot-ui           →  React + Express Web 界面
05-chatbot-ui-websearch →  网络搜索功能 (Workflow)
```

### 高级阶段 (智能体架构)
```
06-chatbot-ui-agent     →  智能体模式 (Agent)
07-chatbot-ui-langgraph →  企业级状态图 (LangGraph)
```

---

## 🏛️ 架构模式对比

| 项目 | 模式 | 决策者 | 流程控制 | 复杂度 | 适用场景 |
|------|------|--------|----------|---------|----------|
| **05** | Workflow | 👤 用户预设 | 固定线性 | ⭐⭐ | 简单任务 |
| **06** | Agent | 🤖 AI 自主 | 智能循环 | ⭐⭐⭐ | 工具调用 |
| **07** | LangGraph | 🤖 AI + 状态图 | 节点路由 | ⭐⭐⭐⭐⭐ | 复杂系统 |

---

## 🚀 快速开始

### 环境要求
- **Node.js** >= v22.x
- **系统**: Linux/macOS (推荐) / Windows
- **API Key**: 国产大模型服务账号

### 安装依赖
```bash
# 克隆仓库
git clone https://github.com/micooz/ai-app-examples.git
cd ai-app-examples

# 安装公共依赖
npm install
```

### 配置 API Key
每个项目需要配置 `.env` 文件:

```bash
# 示例配置 (05/06/07 项目)
API_KEY=your_api_key_here
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat
```

### 运行项目
```bash
# 进入任意项目目录
cd 06-chatbot-ui-agent

# 安装项目依赖
npm install

# 启动开发服务器 (前后端同时启动)
npm run dev

# 或分别启动
npm run dev:ui    # 前端服务
npm run dev:server # 后端服务
```

---

## 📚 项目详解

### 01-chatbot-cli 📟
**最简聊天机器人**
- 原生 fetch API 实现
- 支持多模型配置
- 基础错误处理

### 02-chatbot-cli-stream 🌊
**流式输出版本**
- Server-Sent Events (SSE)
- 打字机效果
- 实时交互体验

### 03-chatbot-cli-langchain 🦜⛓️
**LangChain 框架集成**
- LangChain 消息管理
- 标准化接口设计
- 框架级抽象

### 04-chatbot-ui 🌐
**Web UI 界面**
- React + TypeScript 前端
- Express 后端 API
- SSE 双向通信

### 05-chatbot-ui-websearch 🔍
**网络搜索功能 (Workflow)**
- Bing 搜索集成
- 固定工作流模式
- 智能关键词生成

### 06-chatbot-ui-agent 🤖
**智能体模式 (Agent)**
- AI 自主决策
- 工具调用系统
- 动态推理循环

### 07-chatbot-ui-langgraph 🗺️
**企业级状态图 (LangGraph)**
- 状态图架构
- 可视化流程
- 生产级特性

---

## 🛠️ 技术栈

### 前端技术
- **框架**: React 19 + TypeScript 5.8
- **构建**: Vite 7.x
- **UI**: Tailwind CSS + Radix UI
- **状态**: ahooks hooks

### 后端技术
- **运行时**: Node.js 22+
- **框架**: Express 5.x
- **AI 框架**: LangChain + LangGraph
- **工具**: LangChain Tools

### 开发工具
- **包管理**: npm
- **代码规范**: ESLint + TypeScript
- **环境管理**: dotenv

---

## 📖 API Key 获取

### 推荐模型服务商

| 服务商 | 免费额度 | 获取链接 |
|--------|----------|----------|
| **DeepSeek** | 充值送额度 | [deepseek.com](https://platform.deepseek.com/) |
| **通义千问** | 新用户免费 | [阿里云百炼](https://bailian.console.aliyun.com/) |
| **Kimi** | 新用户免费 | [moonshot.ai](https://platform.moonshot.cn/) |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范
- 代码需添加详细中文注释
- 遵循 ESLint 规范
- 确保项目可独立运行

---

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源

---

## 🙏 致谢

- [LangChain](https://github.com/langchain-ai/langchain) - 强大的 AI 应用开发框架
- [LangGraph](https://github.com/langchain-ai/langgraph) - 状态图构建工具
- [Vite](https://vitejs.dev/) - 快速的前端构建工具
- 所有贡献者和学习者的支持！

---

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/micooz/ai-app-examples/issues)
- **视频教程**: [Bilibili - 捣鼓键盘的小麦](https://space.bilibili.com/3349949/lists/6061232)

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
