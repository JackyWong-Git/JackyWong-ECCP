# projects

ECCP 采用 Next.js + FastAPI + PostgreSQL/pgvector + Redis + 对象存储架构。Django 暂时作为独立身份与权限服务，保留已确认的企业文化相关账号和服务端 Session。

## 快速开始

### 启动开发服务器

```bash
pnpm dev:all
```

该命令会同时启动 Django 认证、FastAPI 业务服务与 Next.js 工作台：

- 登录入口：[http://localhost:8000/accounts/login/](http://localhost:8000/accounts/login/)
- ECCP 工作台：[http://localhost:5000](http://localhost:5000)
- FastAPI 文档：[http://localhost:8100/docs](http://localhost:8100/docs)

企业文化系初始账号通过 Django 管理命令从审核后的名单数据导入。普通成员首次使用姓名拼音和工号初始密码登录，并会被要求立即设置新密码。

开发服务器支持热更新，修改代码后页面会自动刷新。

### Django 身份认证

Django 负责账号密码校验、CSRF 防护和服务端 Session；Next.js 只负责工作台界面，并通过 `/api/auth/session` 验证登录状态。未登录访问工作台会跳转到 Django 登录页面，成功后返回原页面。

```bash
# 只启动认证服务
pnpm dev:auth

# 运行认证测试
pnpm test:auth

# 首次导入企业文化系权限账号；管理员密码必须通过环境变量注入
ECCP_SUPERUSER_PASSWORD='replace-with-secret' .venv/bin/python manage.py import_culture_users
```

阿里云生产环境建议在同一 HTTPS 域名下反向代理：`/accounts/*`、`/api/auth/*` 指向 Django，其余请求指向 Next.js。生产环境必须设置随机 `DJANGO_SECRET_KEY`、`DJANGO_SECURE_COOKIES=1`，并将 SQLite 替换为 PostgreSQL。

### FastAPI、pgvector、Redis 与对象存储

FastAPI 承载知识库、RAG、AI 和后续自动化业务。浏览器不会直连 FastAPI：Next.js 先向 Django 校验 Session，再用短时 HMAC 身份头访问内部 API，避免客户端伪造工号或权限。

无 Docker 的本地开发默认使用 SQLite、本地对象目录和进程内索引任务，便于快速调试。正式联调与生产架构使用：

```bash
# 启动 PostgreSQL/pgvector、Redis、MinIO、FastAPI 和索引 Worker
pnpm infra:up

# 查看服务
curl http://localhost:8100/health
open http://localhost:9001

# 停止容器，保留数据卷
pnpm infra:down
```

文件上传后先写入对象存储，再把索引任务放入 Redis；Worker 负责解析 PDF、DOCX、XLSX、Markdown、文本、CSV 和 JSON，分块并将向量写入 pgvector。开发环境的 `local_hash` 只用于验证链路，生产必须配置兼容 `/embeddings` 的向量模型服务。

生产迁移由 Alembic 管理：

```bash
ECCP_API_DATABASE_URL='postgresql+asyncpg://...' \
  .venv/bin/alembic -c services/api/alembic.ini upgrade head
```

关键安全要求：`ECCP_INTERNAL_AUTH_SECRET` 与 `ECCP_API_INTERNAL_AUTH_SECRET` 必须使用同一条长随机密钥，且 FastAPI 端口只开放给内网或反向代理。

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

### 直接使用 pnpm 执行

```bash
pnpm install
pnpm build
pnpm start
```

### 部署说明

- 构建脚本位于 `scripts/build.sh`，会自动安装依赖、执行 Next.js 生产构建，并打包自定义 Node 服务。
- 启动脚本位于 `scripts/start.sh`，默认监听 `5000` 端口，可通过 `DEPLOY_RUN_PORT` 或 `PORT` 覆盖。
- 当工作目录包含中文或其他非 ASCII 字符时，构建脚本会自动切换到临时 ASCII 目录完成构建，再将产物同步回项目目录，避免 Next.js 16 Turbopack 路径崩溃。
- 交付前建议执行 `pnpm validate`，一次完成 TypeScript、ESLint 与 Stylelint 校验。

### 外部选题发现

选题看板的“外部发现”会从服务端连接已配置的数据源，检索结果保留来源链接、时间和数据源名称，并可一键导入为“调研中”选题。前端不会读取任何搜索密钥。

在部署环境中按需设置以下变量：

```bash
# 推荐：自建 OpenSERP（MIT），默认调用 /mega/search
TOPIC_SEARCH_OPENSERP_URL=http://127.0.0.1:7000
TOPIC_SEARCH_OPENSERP_ENGINES=baidu,bing,duckduckgo
# 仅使用 OpenSERP Cloud 等受鉴权服务时再配置
TOPIC_SEARCH_OPENSERP_API_KEY=

# 备选：自建 SearXNG（AGPL-3.0），使用 JSON 新闻搜索接口
TOPIC_SEARCH_SEARXNG_URL=http://127.0.0.1:8080
TOPIC_SEARCH_SEARXNG_LANGUAGE=zh-CN

# 持续订阅池。格式为“名称|RSS 地址”，多条以逗号、分号或换行分隔。
# 可以填 RSSHub 路由或官方 RSS；地址由管理员配置，避免任意 URL 请求。
TOPIC_SEARCH_RSS_FEEDS="行业媒体|https://example.com/feed.xml,企业观察|https://example.org/rss"
```

- OpenSERP 提供多搜索引擎聚合、去重和结构化 JSON，适合实时选题搜索。
- SearXNG 可作为私有元搜索服务；RSSHub 或官方 RSS 适合建立持续订阅的信息池。
- RSSHub、SearXNG 均采用 AGPL-3.0。本项目只通过其公开 HTTP 接口集成，不包含或复制其源代码；部署前请按企业合规要求审查许可证和数据源条款。

### DeepSeek V4

AI 助手和配置为 DeepSeek V4 的 Agent 会通过服务端调用官方 API，密钥不会下发到浏览器。复制 `.env.example` 为 `.env.local` 并配置：

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-pro
```

支持 `deepseek-v4-pro` 与 `deepseek-v4-flash`。默认使用 Pro，适合内容创作、复杂分析和 Agent 任务；Flash 可用于追求低延迟的批量处理。

## 项目结构

```
src/
├── app/                      # Next.js App Router 目录
│   ├── layout.tsx           # 根布局组件
│   ├── page.tsx             # 首页
│   ├── globals.css          # 全局样式（包含 shadcn 主题变量）
│   └── [route]/             # 其他路由页面
├── components/              # React 组件目录
│   └── ui/                  # shadcn/ui 基础组件（优先使用）
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/                     # 工具函数库
│   └── utils.ts            # cn() 等工具函数
└── hooks/                   # 自定义 React Hooks（可选）

server/
├── index.ts                 # 自定义服务器入口
├── tsconfig.json           # Server TypeScript 配置
└── dist/                    # 编译输出目录（自动生成）
```

## 核心开发规范

### 1. 组件开发

**优先使用 shadcn/ui 基础组件**

本项目已预装完整的 shadcn/ui 组件库，位于 `src/components/ui/` 目录。开发时应优先使用这些组件作为基础：

```tsx
// ✅ 推荐：使用 shadcn 基础组件
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>标题</CardHeader>
      <CardContent>
        <Input placeholder="输入内容" />
        <Button>提交</Button>
      </CardContent>
    </Card>
  );
}
```

**可用的 shadcn 组件清单**

- 表单：`button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`
- 布局：`card`, `separator`, `tabs`, `accordion`, `collapsible`, `scroll-area`
- 反馈：`alert`, `alert-dialog`, `dialog`, `toast`, `sonner`, `progress`
- 导航：`dropdown-menu`, `menubar`, `navigation-menu`, `context-menu`
- 数据展示：`table`, `avatar`, `badge`, `hover-card`, `tooltip`, `popover`
- 其他：`calendar`, `command`, `carousel`, `resizable`, `sidebar`

详见 `src/components/ui/` 目录下的具体组件实现。

### 2. 路由开发

Next.js 使用文件系统路由，在 `src/app/` 目录下创建文件夹即可添加路由：

```bash
# 创建新路由 /about
src/app/about/page.tsx

# 创建动态路由 /posts/[id]
src/app/posts/[id]/page.tsx

# 创建路由组（不影响 URL）
src/app/(marketing)/about/page.tsx

# 创建 API 路由
src/app/api/users/route.ts
```

**页面组件示例**

```tsx
// src/app/about/page.tsx
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '关于我们',
  description: '关于页面描述',
};

export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <Button>了解更多</Button>
    </div>
  );
}
```

**动态路由示例**

```tsx
// src/app/posts/[id]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <div>文章 ID: {id}</div>;
}
```

**API 路由示例**

```tsx
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### 3. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# ✅ 安装依赖
pnpm install

# ✅ 添加新依赖
pnpm add package-name

# ✅ 添加开发依赖
pnpm add -D package-name

# ❌ 禁止使用 npm 或 yarn
# npm install  # 错误！
# yarn add     # 错误！
```

项目已配置 `preinstall` 脚本，使用其他包管理器会报错。

### 4. 样式开发

**使用 Tailwind CSS v4**

本项目使用 Tailwind CSS v4 进行样式开发，并已配置 shadcn 主题变量。

```tsx
// 使用 Tailwind 类名
<div className="flex items-center gap-4 p-4 rounded-lg bg-background">
  <Button className="bg-primary text-primary-foreground">
    主要按钮
  </Button>
</div>

// 使用 cn() 工具函数合并类名
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)}>
  内容
</div>
```

**主题变量**

主题变量定义在 `src/app/globals.css` 中，支持亮色/暗色模式：

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### 5. 表单开发

推荐使用 `react-hook-form` + `zod` 进行表单开发：

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  username: z.string().min(2, '用户名至少 2 个字符'),
  email: z.string().email('请输入有效的邮箱'),
});

export default function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('username')} />
      <Input {...form.register('email')} />
      <Button type="submit">提交</Button>
    </form>
  );
}
```

### 6. 数据获取

**服务端组件（推荐）**

```tsx
// src/app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store', // 或 'force-cache'
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**客户端组件**

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

## 常见开发场景

### 添加新页面

1. 在 `src/app/` 下创建文件夹和 `page.tsx`
2. 使用 shadcn 组件构建 UI
3. 根据需要添加 `layout.tsx` 和 `loading.tsx`

### 创建业务组件

1. 在 `src/components/` 下创建组件文件（非 UI 组件）
2. 优先组合使用 `src/components/ui/` 中的基础组件
3. 使用 TypeScript 定义 Props 类型

### 添加全局状态

推荐使用 React Context 或 Zustand：

```tsx
// src/lib/store.ts
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 集成数据库

推荐使用 Prisma 或 Drizzle ORM，在 `src/lib/db.ts` 中配置。

## 技术栈

- **框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS v4
- **表单**: React Hook Form + Zod
- **图标**: Lucide React
- **字体**: Geist Sans & Geist Mono
- **包管理器**: pnpm 9+
- **TypeScript**: 5.x

## 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 组件文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **优先使用 shadcn/ui 组件** 而不是从零开发基础组件
3. **遵循 Next.js App Router 规范**，正确区分服务端/客户端组件
4. **使用 TypeScript** 进行类型安全开发
5. **使用 `@/` 路径别名** 导入模块（已配置）
