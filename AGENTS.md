# AGENTS.md

## 项目概览

ContentFlow - 内容创作全链路平台原型。从选题、脚本、工作流编排到发布的一站式内容创作工作空间。

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
│   ├── page.tsx                # 主页面（5 模块视图切换）
│   └── globals.css             # 全局样式 + 设计 Token
├── components/
│   ├── sidebar.tsx             # 侧边栏导航（5 模块 + 用户信息）
│   ├── top-bar.tsx             # 顶栏（面包屑 + Cmd+K 命令面板 + 通知）
│   ├── toast.tsx               # 全局 Toast 通知系统
│   ├── topics-board.tsx        # 选题看板（NocoDB 风格）
│   ├── script-editor.tsx       # 脚本编辑器（Ghost + AFFiNE 风格）
│   ├── workflow-builder.tsx    # 工作流编排（Dify 风格）
│   ├── knowledge-base.tsx      # 知识库（Dify RAG 风格）
│   ├── analytics-dashboard.tsx # 数据看板（Vercel 风格）
│   └── ui/                     # shadcn/ui 组件库
```

## 核心模块（对标优秀案例）

| 模块 | 对标 | 核心交互 |
|------|------|---------|
| 选题看板 | NocoDB | 卡片拖拽 + 弹窗详情（不跳页）+ 看板/表格切换 |
| 脚本编辑器 | Ghost + AFFiNE | 块编辑器 + 斜杠菜单 + 右侧面板（渠道适配/元数据/版本/AI）|
| 工作流编排 | Dify | 节点拖拽 + 连线 + 节点配置面板 + 模板库 |
| 知识库 | Dify Knowledge | 文档上传 + 分块管理 + RAG 流程可视化 + 语义搜索 |
| 数据看板 | Vercel Dashboard | 指标卡片 + 迷你趋势图 + 渠道分布 + 内容排行 |

## 设计规范

详见 `DESIGN.md`。核心：暖铜色(#D4A574)强调色，米白(#FAFAF8)背景，深色(#1A1A1A)侧栏。

## 开发命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务器
```
