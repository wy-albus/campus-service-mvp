# 校园学习服务站 MVP

这是一个面向高中学生与校友的校园服务与交流网站。项目从静态学习工具起步，现已扩展为包含论坛后端、Neon 数据库、Render API、Doubao / Ark 校园智能导航助手，以及 Netlify / GitHub Pages 双前端部署的完整 MVP。

## 当前状态

- 前端：Vite + React + TypeScript + Tailwind CSS
- 后端：Express + Prisma
- 数据库：PostgreSQL，当前使用 Neon
- 后端部署：Render
- 前端部署：Netlify 与 GitHub Pages 均支持
- AI 能力：Doubao / Ark OpenAI-compatible API

## 网站功能

- 首页：展示校园学习入口、日期时间、学习提醒和主要功能导航。
- 学习资源：包含每日一题、背单词、随机点名、倒计时、官方资源入口等学习工具。
- 论坛社区：支持注册登录、发帖、评论、点赞、举报和管理员处理。
- 大学话题区：支持按大学/城市维护话题区，并统计相关帖子。
- 校园图册：展示校园图片素材和说明。
- 更新日志：通过 `src/data/changelog.json` 维护网站迭代记录。
- 关于本站：展示项目说明、维护者说明和免责声明。
- 校园助手：右下角 AI Agent，可回答网站功能、搜索资源和论坛、推荐标签、生成发帖草稿。

## 校园智能导航助手

Agent 前端组件：

```text
src/components/AgentChatWidget.tsx
```

Agent 后端接口：

```text
POST /api/agent/chat
```

Agent 服务文件：

```text
server/src/routes/agent.js
server/src/services/doubaoAgent.js
server/src/services/agentTools.js
```

当前支持的工具：

- `get_site_guide`：查询网站功能说明
- `search_posts`：搜索论坛帖子，优先使用真实数据库
- `search_resources`：搜索学习资源、考试、大学信息等站内内容
- `recommend_tags`：推荐论坛标签
- `draft_post`：生成发帖草稿，不自动发布

Agent 不会自动发布、删除、审核、封禁或修改用户资料。

## 本地开发

安装依赖：

```bash
npm install
```

启动后端：

```bash
npm run server:dev
```

启动前端：

```bash
npm run dev
```

本地默认地址：

```text
http://localhost:5173
```

如果端口被占用，Vite 可能自动切换到 `http://localhost:5174`。

## 环境变量

本地开发使用 `.env`。不要把真实 `.env` 提交到仓库。

关键变量：

```env
DATABASE_URL="Neon 或其他 PostgreSQL 连接串"
JWT_SECRET="本地或生产 JWT 密钥"
CLIENT_ORIGINS="http://localhost:5173,http://localhost:5174,https://your-netlify-site.netlify.app,https://your-github-username.github.io"
ARK_API_KEY="Doubao / Ark API Key"
ARK_MODEL_ID="doubao-seed-2-0-lite-260428"
ARK_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
```

前端部署变量：

```env
VITE_BASE_PATH="/"
VITE_API_BASE_URL="https://your-render-service.onrender.com/api"
```

Netlify 通常不需要设置 `VITE_API_BASE_URL`，因为项目保留了 `netlify.toml` 中的 `/api` 代理。GitHub Pages 必须设置 `VITE_API_BASE_URL` 指向 Render 后端。

## 部署结构

```text
Netlify 或 GitHub Pages 前端
        ↓
Render 后端 API
        ↓
Neon PostgreSQL
        ↓
Doubao / Ark 模型服务
```

详细部署说明见：

```text
DEPLOYMENT.md
```

## 数据维护

静态内容主要在：

```text
src/data/
```

常用文件：

- `src/data/changelog.json`：网站更新日志
- `src/data/resources.json`：学习资源
- `src/data/exams.json`：考试安排
- `src/data/universities.json`：大学信息
- `src/data/gallery.json`：图册内容
- `src/data/webmasterNotes.json`：站长说明
- `src/data/dailyQuestions.json`：每日一题
- `src/data/words.json`：背单词词库

如果修改公共图片、音频等素材，请放入：

```text
public/
```

并在代码中使用 `src/utils/assets.ts` 中的 `publicAsset()` 生成路径，保证 Netlify 和 GitHub Pages 都能正确加载资源。

## 重要里程碑

- 2026-04-29：完成第一版静态 MVP。
- 2026-05-03：完成视觉产品化升级。
- 2026-05-22：增强论坛社区后端能力。
- 2026-06-03：完成 Neon 数据库、Render 后端、Doubao / Ark Agent 联调。
- 2026-06-04：支持 Netlify 与 GitHub Pages 双前端部署。
- 2026-06-09：同步项目进度、说明文档和网站更新日志。

## 注意事项

- 不要把 `.env`、数据库连接串、Ark API Key 提交到仓库。
- Netlify 的 `/api` 代理配置保留在 `netlify.toml`，不要删除。
- GitHub Pages 没有 `/api` 代理，因此需要 `VITE_API_BASE_URL` 指向 Render。
- Render 后端需要用 `CLIENT_ORIGINS` 允许 Netlify、GitHub Pages 和本地域名。
