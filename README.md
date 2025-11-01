# 智能云盘（快速原型）

一个用于存储图片/视频并一键进行智能处理的云盘原型。前端基于 Vue 3 + Vite + Arco Design，后端使用 Node.js + Express，内置文件管理、共享链接、AI 实验室任务（缩略图、转码、审核、分类、OCR、ASR）与仪表盘统计。任务与共享记录默认落地到本地 JSON，支持后端重启恢复。

> 目标：用最少依赖实现可演示、可评审的端到端闭环原型，便于后续演进为真实 AI 服务和数据库。

---

## 功能一览

- 文件管理：上传、删除、搜索、列表/网格视图
- 共享管理：一键分享、复制链接、取消共享
- AI 实验室：基于“云盘已有文件”提交任务，队列流转（排队/处理/完成/取消/删除），结果抽屉
- 仪表盘：文件与共享统计、AI 处理统计、最近上传与存储占用
- 持久化：`data/jobs.json`、`data/shares.json`（后续可无缝迁移 DB）

## 目录结构

```
cloud/
├─ server.mjs                 # 后端（Express）：文件/共享/任务/统计 API、静态文件 /files
├─ files/                     # 用户文件（上传目标目录 & 静态直链）
├─ data/                      # 持久化数据（自动创建）
│  ├─ jobs.json               # 任务列表与状态（重启恢复）
│  └─ shares.json             # 共享文件名集合
├─ src/                       # 前端源码（Vue 3）
│  ├─ views/                  # 页面：仪表盘、我的文件、共享、AI 实验室等
│  ├─ components/             # 组件：顶部栏、侧边栏等
│  └─ api/                    # axios 封装
├─ vite.config.ts             # Vite 配置
├─ package.json               # 项目元数据
├─ pnpm-workspace.yaml        # pnpm workspace
└─ README.md                  # 本文件
```

## 开发环境

- Node.js ≥ 18（已在 Node 22 上验证）
- pnpm ≥ 8

## 快速开始

1) 安装依赖（若首次克隆）

```bash
pnpm install
```

2) 启动后端（默认 http://localhost:3001）

```bash
node server.mjs
```

- 首次启动后会在项目根目录创建 `data/` 用于持久化。
- 静态文件直链为 `http://localhost:3001/files/<文件名>`。

3) 启动前端（默认 http://localhost:5173）

```bash
pnpm dev --host
```

> 打开浏览器访问前端后，可以通过顶部搜索与“上传”开始体验。建议先进入“我的文件”，上传 1~2 个图片或视频，再到“AI 实验室”基于这些文件提交任务。

## 关键页面

- 仪表盘：顶部统计卡片，AI 处理统计（与任务联动），最近上传与已用空间进度条
- 我的文件（/my-files）：上传、删除、搜索、列表/网格切换；分享将写入共享中心
- 共享中心：列表展示 + 操作（复制链接、打开、取消共享）
- AI 实验室：选择任务类型→“选择云盘文件”弹窗（按类型过滤 image / video / audio）→ 确认入队；列表可取消/删除任务，完成后可点任务ID查看结果抽屉

## API 速查

- 文件
  - GET `/api/files`（?search=）
  - POST `/api/files`（multipart）
  - DELETE `/api/files/:filename`
  - GET `/api/files/recent`（?limit=4）
  - GET `/api/files/download/:filename`
- 共享
  - GET `/api/shares`
  - POST `/api/shares` { name }
  - DELETE `/api/shares/:name`
- 任务
  - GET `/api/jobs`
  - POST `/api/jobs` { type, payload:{ fileName } }
  - PATCH `/api/jobs/:id`（cancel/advance）
  - DELETE `/api/jobs/:id`
- 统计
  - GET `/api/stats/dashboard`（总数/图片/视频/共享）
  - GET `/api/stats/storage`（已用/容量/百分比）
  - GET `/api/stats/ai`（各任务类型数量）

## 数据与持久化

- 用户文件：存放在仓库根目录的 `files/`，同时作为静态目录映射到 `/files/*`（直链）。
- 共享记录：`data/shares.json`（字符串数组）。
- 任务列表：`data/jobs.json`（数组，包含 id/type/status/createdAt/payload 等）。
- 状态恢复：后端重启后根据 `createdAt` 对未终态的任务进行补偿（<2s queued、2~10s processing、≥10s done）。

## 常见问题（FAQ）

- 刷新 /files 路由 404？
  - 前端“我的文件”页面使用 `/my-files`，避免和根目录 `files/` 静态目录冲突（Vite 会优先命中文件夹）。
- 共享数量与仪表盘不一致？
  - 统计值来自 `shares.json ∩ files/` 的交集，删除文件会自动从共享集合移除。
- 任务或共享丢失？
  - 请确认你没有清理 `data/` 目录；该目录用于持久化。

## 配置与演进

- 端口：前端 5173、后端 3001（在 `server.mjs` 和前端 `src/api/client.ts` 中可调整）。
- 演进方向：
  - 存储：本地 `files/` → 对象存储（S3/OSS）
  - 数据：JSON → SQLite/PostgreSQL
  - 任务：定时器 → 专用 Worker/队列（如 BullMQ/RabbitMQ/Kafka）
  - AI/转码：模拟 → 接入真实模型服务或旁路服务

## 许可

本项目用于课程/方案演示与快速原型，未指定开源许可证；如需用于生产，请补充鉴权、审计、限流、监控等工程能力并评审安全与合规。
