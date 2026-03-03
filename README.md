# 健康森林 - 智能健康管理与 AI 食谱推荐平台

[![Vue 3](https://img.shields.io/badge/Vue-3.x-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.x-646CFF.svg)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.x-409EFF.svg)](https://element-plus.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Client-3ECF8E.svg)](https://supabase.com/)

一个集健康数据追踪与 AI 智能决策于一体的 Web 应用。通过整合 DeepSeek 大模型能力，为用户提供基于身体数据（BMI、代谢率等）的个性化饮食建议和结构化食谱生成服务。

---

## 🌲 项目特色

*   **AI Agent 架构**：内置 `RecipeAgent` 智能体，利用 DeepSeek LLM 根据用户 BMI、过敏原及口味偏好生成个性化食谱。
*   **治愈系 UI 设计**：采用“吉卜力”风格的视觉设计，提供动态渐变封面与柔和的交互体验。
*   **全栈数据流**：基于 Supabase (PostgreSQL) 的 Serverless 架构，支持 RLS (Row Level Security) 数据安全策略。
*   **多端适配**：响应式布局，完美适配桌面端与移动端。

## 🛠️ 技术栈

*   **前端框架**：Vue 3 + TypeScript
*   **构建工具**：Vite
*   **状态管理**：Pinia
*   **UI 组件库**：Element Plus + SCSS
*   **后端服务**：Supabase (自托管 Docker 版本)
*   **AI 模型**：DeepSeek API

## 🚀 部署要求与指南

### 前置条件

1.  **Node.js**: v16.0.0 或更高版本
2.  **Docker & Docker Compose**: 用于运行本地 Supabase 实例
3.  **DeepSeek API Key**: 需要申请 DeepSeek 的 API 访问权限

### 快速开始

1.  **克隆项目**

    ```bash
    git clone https://github.com/your-username/health-care-system.git
    cd health-care-system
    ```

2.  **安装依赖**

    ```bash
    npm install
    ```

3.  **配置环境变量**

    复制 `.env.example` 为 `.env`，并填入你的配置信息：

    ```bash
    cp .env.example .env
    ```

    *   `VITE_SUPABASE_URL`: 你的 Supabase API URL
    *   `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥
    *   `VITE_DEEPSEEK_API_KEY`: 你的 DeepSeek API Key

4.  **启动本地 Supabase (可选)**

    如果你使用自托管 Supabase，请确保 Docker 已启动并运行相关容器。

5.  **启动开发服务器**

    ```bash
    npm run dev
    ```

    访问 `http://localhost:3000` 即可查看项目。

## ⚠️ 免责声明

**本项目仅用于学习 AI Agent 相关技术与全栈开发实践。**

1.  **健康建议仅供参考**：本项目生成的食谱和健康建议由 AI 生成，不构成医疗建议。在使用任何饮食计划前，请咨询专业医生或营养师。
2.  **数据隐私**：在本地部署模式下，数据存储在您的本地数据库中。如果部署到公网，请务必配置好 Supabase 的 RLS 策略以保护用户隐私。
3.  **API 成本**：使用 DeepSeek API 可能会产生费用，请关注您的 API 使用量。

## 📄 License

MIT License
