# AGENTS.md

## 项目概览

内容协同体系中台 - 基于"内容协同体系1.0"构想的企业级内容中台平台原型。实现从素材上报、内容调度、渠道发布到数据回流的全链路协同。

## 业务架构（对齐内容协同体系1.0）

```
信息入口层          内容中台层           宣发出口层          反馈回流层
31个部门窗口   →   1总括 + 4渠道    →   6大渠道矩阵   →   数据闭环
统一归口           统筹调度              差异化适配          指导策划
```

## 技术栈

- **Web**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Business API**: FastAPI + SQLAlchemy 2 + Alembic
- **Identity**: Django Auth（账号、Session、RBAC）
- **Data**: PostgreSQL 17 + pgvector
- **Async/Cache**: Redis
- **Files**: S3-compatible object storage（本地 MinIO）

## 目录结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局（next/font 字体优化）
│   ├── page.tsx                # 主页面（5 模块视图切换）
│   └── globals.css             # 全局样式 + 设计 Token
├── components/
│   ├── sidebar.tsx             # 侧边栏导航（5 模块 + 团队信息）
│   ├── top-bar.tsx             # 顶栏（面包屑 + Cmd+K 命令面板 + 通知）
│   ├── toast.tsx               # 全局 Toast 通知系统
│   ├── material-submission.tsx # 素材上报（31部门窗口提交入口）
│   ├── content-coordination.tsx# 内容调度（中台看板 + 任务分配）
│   ├── channel-publishing.tsx  # 渠道发布（6大渠道适配管理）
│   ├── material-knowledge.tsx  # 素材知识库（资产沉淀 + AI赋能）
│   ├── data-feedback.tsx       # 数据回流（效果追踪 + 选题优化）
│   └── ui/                     # shadcn/ui 组件库

services/api/
├── app/                        # FastAPI、RAG、存储和任务 Worker
├── alembic/                    # PostgreSQL/pgvector 迁移
└── tests/                      # API 纵向集成测试

backend/
├── accounts/                   # Django 用户、权限和登录
└── eccp_backend/               # Django 配置
```

## 核心模块

| 模块 | 功能 | 核心交互 |
|------|------|---------|
| 素材上报 | 31部门窗口统一提交入口 | 表单提交 + 素材上传 + 标签分类 + 部门选择 |
| 内容调度 | 中台看板 + 任务分配 | 任务看板（待处理/制作中/待审/已发布）+ 渠道分配 + 优先级 |
| 渠道发布 | 6大渠道适配发布 | 渠道矩阵 + 内容适配 + 发布日历 + 状态追踪 |
| 素材知识库 | 资产沉淀 + AI赋能 | 分类浏览 + 语义搜索 + 复用追踪 + AI标签 |
| 数据回流 | 效果追踪 + 选题优化 | 渠道对比 + 内容排行 + 趋势分析 + 选题建议 |

## 团队角色

| 角色 | 职责 | 对应模块 |
|------|------|---------|
| 总括（滕紫原） | 体系统营、SOP维护、选题统筹 | 内容调度 |
| 流程架构（郭晓鹏） | SOP维护、周调度会、素材看板 | 内容调度 |
| 技术赋能（王彬彬） | AI辅助、工具研究、培训 | 素材知识库 |
| 内容创意（熊臣坤） | 话题策划、部门联络、选题脑暴 | 素材上报 |
| 现场联结（刘俊） | 31部门联络、线下宣传标准化 | 素材上报 |

## KPI 指标

- 素材入库：10-20条/月
- 素材复用：≥2次/条
- 跨渠道协同：1-4次/月
- 知识库条目：100条
- 正味作业率提高：10-30%

## 设计规范

详见 `DESIGN.md`。核心：暖铜色(#D4A574)强调色，米白(#FAFAF8)背景，深色(#1A1A1A)侧栏。

## 开发命令

```bash
pnpm dev:all   # Next.js + Django + FastAPI
pnpm infra:up  # PostgreSQL/pgvector + Redis + MinIO + API + Worker
pnpm validate  # TypeScript + ESLint + Stylelint
pnpm test:auth # Django 权限测试
pnpm test:api  # FastAPI RAG 纵向测试
pnpm build     # 构建生产版本
```

## 边界规则

- 浏览器只能请求 Next.js `/api/*`；不得直接携带内部签名调用 FastAPI。
- Django 是账号与权限的唯一来源；FastAPI 只接受 Next.js 生成的短时 HMAC 身份头。
- 原文件只进入对象存储；PostgreSQL 保存元数据、文本分块与向量，不保存大文件。
- 生产环境必须关闭 `ECCP_API_AUTO_CREATE_SCHEMA`，使用 Alembic 迁移。
- Redis 不可用时仅允许本地开发回退到 FastAPI BackgroundTasks；生产索引必须由 Worker 消费。
