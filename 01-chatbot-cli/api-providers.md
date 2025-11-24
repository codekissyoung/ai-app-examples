# OpenAI 兼容 API 服务商配置速查

本项目支持所有兼容 OpenAI API 格式的服务商，只需修改 `.env` 文件中的三个参数即可切换。

## 📋 快速切换配置

### Kimi (Moonshot) ⭐ 当前使用
```bash
API_KEY=sk-xxx
BASE_URL=https://api.moonshot.cn/v1
MODEL=kimi-k2-turbo-preview
```

**模型列表**：
- `kimi-k2-turbo-preview` - 最快速版本
---

### DeepSeek ⭐ 推荐尝试
```bash
API_KEY=sk-xxx
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat
```

**模型细节**（2025-11 更新）：

| 模型 | deepseek-chat | deepseek-reasoner |
|:---|:---:|:---:|
| **版本** | V3.2-Exp (非思考) | V3.2-Exp (思考) |
| **上下文** | 128K | 128K |
| **输出** | 默认 4K, 最大 8K | 默认 32K, 最大 64K |
| **Function Calling** | ✅ | ❌ |
| **JSON Output** | ✅ | ✅ |

**价格**（百万 tokens）：
```
输入 (缓存命中):    0.2 元
输入 (缓存未命中):  2 元
输出:              3 元
```

**特点**：
- ✅ **128K 超长上下文**（与 Kimi 持平）
- ✅ 性价比极高
- ✅ 支持 Function Calling（Agent 开发）
- ✅ 支持 JSON Output
- ✅ 完全兼容 OpenAI API

**模型选择**：
- `deepseek-chat` - 通用对话、代码生成（**推荐**）
- `deepseek-reasoner` - 思考模式（复杂推理、数学）

**注意**：deepseek-reasoner 如果请求含 `tools` 参数，会自动使用 deepseek-chat

**获取 API Key**：https://platform.deepseek.com/

---

### 通义千问 (Qwen)
```bash
API_KEY=sk-xxx
BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL=qwen-turbo
```

**特点**：
- ✅ 阿里云官方
- ✅ 稳定性好
- ✅ 中文能力强
- 💰 免费额度：100 万 tokens / 月

**模型列表**：
- `qwen-turbo` - 快速版
- `qwen-plus` - 增强版
- `qwen-max` - 最强版

**获取 API Key**：https://bailian.console.aliyun.com/

---

### 智谱 GLM
```bash
API_KEY=xxx.yyy
BASE_URL=https://open.bigmodel.cn/api/paas/v4
MODEL=glm-4
```

**特点**：
- ✅ 清华系模型
- ✅ 中文理解好
- ✅ 多模态支持
- 💰 免费额度：18 元 / 月

**模型列表**：
- `glm-4` - 最新版本
- `glm-3-turbo` - 快速版

**获取 API Key**：https://open.bigmodel.cn/

---

### OpenAI（官方）
```bash
API_KEY=sk-proj-xxx
BASE_URL=https://api.openai.com/v1
MODEL=gpt-3.5-turbo
```

**特点**：
- ✅ 官方原版
- ✅ 能力最强（GPT-4）
- ❌ 需要国外信用卡
- ❌ 国内访问困难
- 💰 按量计费（较贵）

**模型列表**：
- `gpt-3.5-turbo` - 快速版
- `gpt-4-turbo` - 最强版
- `gpt-4` - 标准版

---

## 🔄 快速切换示例

### 场景 1：测试不同服务商
```bash
# 1. 编辑 .env 文件，修改三个参数
nano .env

# 2. 运行项目
npm start

# 3. 对比不同服务商的效果
```

### 场景 2：成本优化
```
任务类型                推荐服务商
──────────────────────────────────
简单对话/翻译          DeepSeek    （最便宜）
代码生成/调试          DeepSeek Coder
长文本处理            Kimi 128K   （最长上下文）
中文创作              通义千问
最高质量要求          GPT-4       （最强）
```

### 场景 3：开发环境 vs 生产环境
```bash
# 开发环境：使用免费额度多的服务
API_KEY=xxx
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat

# 生产环境：使用稳定性好的服务
API_KEY=xxx
BASE_URL=https://api.moonshot.cn/v1
MODEL=moonshot-v1-32k
```

---

## 💡 使用建议

### 1. 注册多个服务商
```
✅ DeepSeek  - 日常开发使用（免费额度大）
✅ Kimi      - 长文本任务
✅ 通义千问   - 稳定可靠
```

### 2. 成本对比（参考价格）
```
服务商              输入价格              输出价格
────────────────────────────────────────────────
DeepSeek Chat     ¥0.001 / 1K tokens   ¥0.002 / 1K tokens
Kimi              ¥0.012 / 1K tokens   ¥0.012 / 1K tokens
通义千问          ¥0.008 / 1K tokens   ¥0.008 / 1K tokens
GPT-3.5 Turbo     ¥0.010 / 1K tokens   ¥0.020 / 1K tokens
GPT-4             ¥0.210 / 1K tokens   ¥0.420 / 1K tokens

💡 结论：DeepSeek 性价比最高（比 GPT-3.5 便宜 10 倍）
```

### 3. 能力对比
```
能力维度          DeepSeek   Kimi    通义千问   GPT-4
────────────────────────────────────────────────
中文理解          ⭐⭐⭐⭐   ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐⭐   ⭐⭐⭐⭐
代码能力          ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐   ⭐⭐⭐⭐    ⭐⭐⭐⭐⭐
长文本            ⭐⭐⭐     ⭐⭐⭐⭐⭐  ⭐⭐⭐      ⭐⭐⭐⭐
性价比            ⭐⭐⭐⭐⭐  ⭐⭐⭐    ⭐⭐⭐⭐    ⭐⭐
稳定性            ⭐⭐⭐⭐   ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐⭐   ⭐⭐⭐⭐⭐
```

---

## 🔐 安全提醒

**API Key 管理最佳实践**：

```bash
# ❌ 错误：硬编码在代码里
const apiKey = "sk-xxx";

# ✅ 正确：使用环境变量
const apiKey = process.env.API_KEY;

# ✅ 更好：使用 .env 文件（加入 .gitignore）
# .gitignore
.env
```

**不要将 API Key 提交到 Git**：
```bash
# 检查是否暴露
git log --all --full-history -- .env

# 如果已提交，立即废除 Key 并重新生成
```

---

## 📝 测试清单

切换服务商后，建议测试：

```bash
# 1. 基础对话测试
User: 你好
Assistant: [检查是否正常回复]

# 2. 中文能力测试
User: 写一首七言绝句
Assistant: [检查诗词质量]

# 3. 代码能力测试
User: 用 Python 写一个快速排序
Assistant: [检查代码正确性]

# 4. 流式输出测试
RETURN_MODE=stream npm start
[检查是否逐字显示]

# 5. 三种 SDK 模式测试
USE_SDK=native npm start      # L1 原生
USE_SDK=openai npm start      # L2 SDK
USE_SDK=langchain npm start   # L3 框架
```

---

## 🎯 推荐配置（2025年）

**学习开发**：
```bash
API_KEY=your-deepseek-key
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat
# 理由：免费额度大，性价比高
```

**生产环境**：
```bash
API_KEY=your-kimi-key
BASE_URL=https://api.moonshot.cn/v1
MODEL=moonshot-v1-32k
# 理由：稳定可靠，长文本支持好
```

**代码助手**：
```bash
API_KEY=your-deepseek-key
BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-coder
# 理由：代码专用模型，效果最好
```

---

**更新日期**: 2025-11-24
