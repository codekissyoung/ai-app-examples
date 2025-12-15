# CLAUDE.md - AI Application Examples

This file provides guidance for Claude Code when working with the AI Application Examples repository.

## 🎯 Project Overview

**Repository**: AI Application Examples - 从基础到企业级的人工智能应用开发实战教程

**Environment**: Mac Mini (link-workmini.local) - 公司开发环境

**Learning Focus**: AI 应用架构演进，从 CLI 工具到企业级智能体系统

## 🏗️ Architecture Evolution

### 项目演进路径
```
01-chatbot-cli          →  基础对话机器人 (原生 fetch)
02-chatbot-cli-stream   →  流式输出改进 (SSE)
03-chatbot-cli-langchain →  LangChain 框架集成
04-chatbot-ui           →  React + Express Web 界面
05-chatbot-ui-websearch →  网络搜索功能 (Workflow 范式)
06-chatbot-ui-agent     →  智能体模式 (Agentic 范式)
07-chatbot-ui-langgraph →  企业级状态图 (LangGraph 范式)
```

### 三代架构模式对比

| 项目 | 模式 | 决策者 | 流程控制 | 复杂度 | 适用场景 |
|------|------|--------|----------|---------|----------|
| **05** | Workflow | 👤 用户预设 | 固定线性 | ⭐⭐ | 简单任务 |
| **06** | Agent | 🤖 AI 自主 | 智能循环 | ⭐⭐⭐ | 工具调用 |
| **07** | LangGraph | 🤖 AI + 状态图 | 节点路由 | ⭐⭐⭐⭐⭐ | 复杂系统 |

## 🛠️ Technology Stack

### Frontend Technologies
- **Framework**: React 19 + TypeScript 5.8
- **Build Tool**: Vite 7.x
- **UI Libraries**: Tailwind CSS + Radix UI
- **State Management**: ahooks hooks
- **Markdown**: react-markdown + remark-gfm

### Backend Technologies
- **Runtime**: Node.js 22+
- **Framework**: Express 5.x
- **AI Frameworks**: LangChain + LangGraph
- **Communication**: Server-Sent Events (SSE)
- **Environment**: dotenv configuration

### AI Model Integration
- **Primary**: DeepSeek (api.deepseek.com)
- **Alternatives**: 通义千问, Kimi (国内适配)
- **Tools**: Bing Search RSS API (免费接口)

## 📁 Project Structure

```
ai-app-examples/
├── 01-chatbot-cli/          # 基础 CLI 聊天机器人
├── 02-chatbot-cli-stream/   # 流式输出 CLI 版本
├── 03-chatbot-cli-langchain/ # LangChain CLI 版本
├── 04-chatbot-ui/           # React + Express Web 版本
├── 05-chatbot-ui-websearch/ # Workflow 搜索版本
├── 06-chatbot-ui-agent/     # Agent 智能体版本
├── 07-chatbot-ui-langgraph/ # LangGraph 状态图版本
└── README.md               # 项目总览文档
```

### 每个项目的标准结构
```
project-name/
├── server/                 # 后端代码
│   ├── main.ts            # Express 服务器入口
│   ├── llm.ts             # AI 模型配置
│   ├── *.ts               # 核心业务逻辑
│   └── tools.ts           # 工具函数 (05/06/07)
├── src/                   # 前端代码
│   ├── components/        # React 组件
│   ├── lib/              # 工具函数
│   └── types/            # TypeScript 类型定义
├── package.json          # 项目依赖和脚本
├── .env                  # 环境变量配置
└── README.md            # 项目说明文档
```

## 🔧 Development Commands

### Common Commands
```bash
# 进入任意项目目录
cd 06-chatbot-ui-agent

# 安装依赖
npm install

# 同时启动前后端开发服务器
npm run dev

# 分别启动
npm run dev:ui       # 前端开发服务器 (Vite)
npm run dev:server   # 后端开发服务器 (Node.js --watch)

# 生产构建
npm run build

# 代码检查
npm run lint
```

### Environment Setup
```bash
# 在项目根目录安装公共依赖
npm install

# 配置 API Key (每个项目的 .env 文件)
API_KEY=your_api_key_here
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat
RETURN_MODE=stream
USE_SDK=openai
```

## 📚 Learning Focus Areas

### 1. 代码注解标准
- **详细中文注释**: 每个函数和类都有功能说明
- **工作流程注释**: 关键步骤和数据流说明
- **设计思路注释**: 架构决策和实现原理
- **关键特性注释**: 技术亮点和使用场景

### 2. 架构模式理解
- **Workflow Pattern**: 用户决策，固定流程 (05 项目)
- **Agent Pattern**: AI 自主决策，智能循环 (06 项目)
- **LangGraph Pattern**: 状态图驱动，企业级架构 (07 项目)

### 3. 核心技术要点
- **SSE 流式通信**: 实时双向通信实现
- **工具调用系统**: LangChain Tools 集成
- **状态管理**: 对话上下文和工具结果管理
- **错误处理**: 用户中断和网络异常处理

## 🐛 Common Issues & Solutions

### Environment Issues
- **Node.js 版本**: 需要 >= v22.x
- **API Key 配置**: 检查 .env 文件格式和权限
- **端口冲突**: 前端默认 5173，后端默认 3000

### API Integration Issues
- **模型服务**: 国内网络可能需要代理
- **Token 额度**: 新用户有免费额度，注意用量
- **搜索限制**: Bing RSS API 有访问频率限制

### Development Issues
- **TypeScript 类型**: 严格模式，注意类型定义
- **热重载**: 使用 --watch 参数支持后端热重载
- **SSE 连接**: 检查 CORS 配置和连接状态

## 🎯 Development Guidelines

### 代码规范
- 所有核心文件必须有详细的中文注释
- 遵循 ESLint 规范，确保代码质量
- 确保每个项目可以独立运行和测试
- 使用 TypeScript 严格模式，提供类型安全

### 学习建议
- **按顺序学习**: 01 → 02 → 03 → 04 → 05 → 06 → 07
- **理解架构演进**: 重点理解 05/06/07 三种模式的差异
- **实践导向**: 运行每个项目，体验不同架构的特点
- **对比分析**: 思考不同适用场景下的架构选择

### 扩展方向
- **新工具集成**: 添加更多 LangChain Tools
- **多模态支持**: 图片、文件处理能力
- **用户系统**: 登录、历史记录、个性化
- **部署方案**: Docker、云服务部署

## 📞 Support Resources

### 项目资源
- **GitHub Issues**: [项目问题反馈](https://github.com/micooz/ai-app-examples/issues)
- **视频教程**: [Bilibili - 捣鼓键盘的小麦](https://space.bilibili.com/3349949/lists/6061232)

### 技术文档
- **LangChain 官方文档**: [langchain.com](https://langchain.com/)
- **LangGraph 文档**: [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/)
- **React 官方文档**: [react.dev](https://react.dev/)

### API 服务
- **DeepSeek API**: [platform.deepseek.com](https://platform.deepseek.com/)
- **通义千问**: [bailian.console.aliyun.com](https://bailian.console.aliyun.com/)
- **Kimi API**: [platform.moonshot.cn](https://platform.moonshot.cn/)

---

**最后更新**: 2025-01-15
**维护者**: Link & Claude Code