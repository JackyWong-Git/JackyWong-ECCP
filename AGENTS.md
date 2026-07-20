# AGENTS.md

## 项目概览

ContentFlow - 内容创作全链路平台原型。从选题、写作、编辑到发布的一站式内容创作工作空间。

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
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面（视图切换）
│   └── globals.css         # 全局样式 + 设计 Token
├── components/
│   ├── sidebar.tsx         # 侧边栏导航
│   ├── content-dashboard.tsx  # 内容管理（列表/看板/日历）
│   ├── block-editor.tsx    # 块编辑器（斜杠菜单）
│   ├── storyboard-timeline.tsx  # 分镜时间轴
│   ├── knowledge-base.tsx  # 知识库文档树
│   └── ui/                 # shadcn/ui 组件库
```

## 核心模块

1. **内容管理仪表盘** - 三种视图（列表/看板/日历）切换，搜索过滤
2. **块编辑器** - 支持标题/正文/引用/代码/列表/图片/分割线，斜杠菜单插入
3. **分镜时间轴** - 场景卡片 + 时间轴可视化 + 详情面板
4. **知识库** - 文档树 + 搜索 + 标签 + 内容预览

## 设计规范

详见 `DESIGN.md`。核心：暖铜色(#D4A574)强调色，米白(#FAFAF8)背景，深色(#1A1A1A)侧栏。

## 开发命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务器
```
