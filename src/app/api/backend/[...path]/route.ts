import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/access-control';
import { createFastApiHeaders, fastApiUrl } from '@/lib/fastapi-proxy';
import { getAuthentication } from '@/lib/server-auth';

export const runtime = 'nodejs';

const allowedMethods = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
const maxProxyBodyBytes = 52 * 1024 * 1024;

function requiredPermission(method: string, path: string[]) {
  if (path[0] !== 'v1') return null;

  if (path[1] === 'knowledge-bases') {
    return method === 'GET' || path.at(-1) === 'search'
      ? 'accounts.view_knowledge'
      : 'accounts.create_content';
  }
  if (path[1] === 'materials') return 'accounts.manage_projects';
  if (path[1] === 'topics') {
    return method === 'GET' ? 'accounts.view_topics' : 'accounts.create_content';
  }
  if (path[1] === 'content-tasks') {
    return method === 'GET' ? 'accounts.view_tasks' : 'accounts.manage_projects';
  }
  if (path[1] === 'publications' || path[1] === 'publication-metrics') {
    return method === 'GET' ? 'accounts.view_analytics' : 'accounts.create_content';
  }
  if (path[1] === 'analytics') return 'accounts.view_analytics';
  if (path[1] === 'skills' || path[1] === 'skill-sources' || path[1] === 'skill-audit-logs') {
    return 'accounts.manage_platform';
  }
  if (path[1] === 'workflow' && path[2] === 'materials') return 'accounts.manage_projects';
  if (path[1] === 'workflow' && path[2] === 'content-tasks') return 'accounts.create_content';
  return null;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const permission = requiredPermission(request.method, path);
  if (!permission || !allowedMethods.has(request.method)) {
    return NextResponse.json({ error: '不支持的业务接口。' }, { status: 404 });
  }

  const authentication = await getAuthentication(request);
  if (authentication.status === 'unavailable') {
    return NextResponse.json({ error: '认证服务暂时不可用。' }, { status: 503 });
  }
  if (authentication.status !== 'authenticated') {
    return NextResponse.json({ error: '登录状态已失效，请重新登录。' }, { status: 401 });
  }
  if (!hasPermission(authentication.user.permissions, permission)) {
    return NextResponse.json({ error: '当前账号没有执行此操作的权限。' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > maxProxyBodyBytes) {
    return NextResponse.json({ error: '上传内容超过 50 MB 限制。' }, { status: 413 });
  }

  try {
    const body = request.method === 'GET' || request.method === 'DELETE'
      ? undefined
      : Buffer.from(await request.arrayBuffer());
    const upstreamUrl = new URL(fastApiUrl(path));
    upstreamUrl.search = new URL(request.url).search;
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers: createFastApiHeaders(authentication.user, request.headers.get('content-type')),
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, private',
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ error: '业务服务暂时不可用，请稍后重试。' }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
