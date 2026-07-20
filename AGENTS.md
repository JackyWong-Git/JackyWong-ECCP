# AGENTS.md

## 项目概览

ContentFlow - 基于 Open Design 架构模式的内容创作全链路平台。采用四层知识体系（Skills/Templates/Design Systems/Craft），实现从选题、脚本、多渠道适配到发布的一站式内容创作工作空间。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Styling**: 自定义设计系统（暖铜色调，编辑感风格）

## 目录结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局（next/font 字体优化）
│   ├── page.tsx                # 主页面（6 模块视图切换）
│   ├── globals.css             # 全局样式 + 设计 Token
│   └── api/
│       ├── generate/route.ts   # AI 内容生成（流式 SSE，coze-coding-dev-sdk LLMClient）
│       ├── discover/route.ts   # 热榜发现（coze-coding-dev-sdk SearchClient）
│       └── adapt/route.ts      # 多渠道适配（流式 SSE，LLMClient）
├── components/
│   ├── sidebar.tsx             # 侧边栏导航（6 模块 + 用户信息）
│   ├── top-bar.tsx             # 顶栏（面包屑 + Cmd+K 命令面板 + 通知）
│   ├── toast.tsx               # 全局 Toast 通知系统
│   ├── home-composer.tsx       # Home 统一入口（技能选择 + 设计系统 + 简报）
│   ├── studio-multi-artifact.tsx # Studio 多产出物（一源多渠适配）
│   ├── design-system-manager.tsx # Design System 品牌契约管理
│   ├── automation-page.tsx     # Automation 自动化编排
│   ├── craft-rules.tsx         # Craft 工艺规则库
│   ├── topics-board.tsx        # 选题看板（NocoDB 风格 + 热榜发现）
│   ├── script-editor.tsx       # 脚本编辑器（Ghost + AFFiNE 风格 + AI 适配）
│   ├── workflow-builder.tsx    # 工作流编排（Dify 风格）
│   ├── knowledge-base.tsx      # 知识库（Dify RAG 风格）
│   ├── analytics-dashboard.tsx # 数据看板（Vercel 风格）
│   └── ui/                     # shadcn/ui 组件库
```

## 架构模式（对标 Open Design）

### 四层知识体系

| 层级 | 作用 | 平台对应 |
|------|------|---------|
| Skills | 功能能力（做什么） | 选题/脚本/适配/发布 各模块 |
| Design Templates | 产出物形状（长什么样） | 各渠道的内容模板 |
| Design Systems | 品牌契约（用什么风格） | 每个账号/频道的视觉规范 |
| Craft | 通用工艺知识（怎么做好） | 内容创作规则库 |

### 核心模块

| 模块 | 对标 | 核心交互 |
|------|------|---------|
| Home | Open Design Home | 统一创作入口 + 技能选择 + 设计系统绑定 |
| Studio | Open Design Studio | 一源多渠适配（脚本→多平台版本）|
| Design System | Open Design DS | 品牌契约管理（Token + 规范 + 渠道）|
| Automation | Open Design Auto | 自动化编排（调度 + 插件 + 触发器）|
| Craft | Open Design Craft | 工艺规则库（标题/封面/SEO/排版）|
| Topics | NocoDB | 卡片拖拽 + 弹窗详情 + 看板/表格切换 |
| Scripts | Ghost + AFFiNE | 块编辑器 + 斜杠菜单 + 右侧面板 |
| Workflows | Dify | 节点拖拽 + 连线 + 配置面板 |
| Knowledge | Dify Knowledge | 文档上传 + 分块管理 + RAG 可视化 |
| Analytics | Vercel Dashboard | 指标卡片 + 趋势图 + 渠道分布 |

## 设计规范

详见 `DESIGN.md`。核心：暖铜色(#D4A574)强调色，米白(#FAFAF8)背景，深色(#1A1A1A)侧栏。

## 开发命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务器
```
