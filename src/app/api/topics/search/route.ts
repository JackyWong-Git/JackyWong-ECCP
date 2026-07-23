import { NextResponse } from 'next/server';
import { TopicSearchConfigurationError, searchExternalTopics } from '@/lib/topic-search';
import { type TopicSearchProvider, type TopicSearchRange } from '@/lib/topic-search-types';
import { getAuthentication } from '@/lib/server-auth';
import { hasPermission } from '@/lib/access-control';

export const runtime = 'nodejs';

const providers: TopicSearchProvider[] = ['auto', 'openserp', 'searxng', 'rss'];
const ranges: TopicSearchRange[] = ['day', 'week', 'month'];

export async function POST(request: Request) {
  try {
    const authentication = await getAuthentication(request);
    if (authentication.status === 'unavailable') {
      return NextResponse.json({ error: '认证服务暂时不可用。' }, { status: 503 });
    }
    if (authentication.status !== 'authenticated') {
      return NextResponse.json({ error: '登录状态已失效，请重新登录。' }, { status: 401 });
    }
    if (!hasPermission(authentication.user.permissions, 'accounts.view_topics')) {
      return NextResponse.json({ error: '当前账号没有访问选题中心的权限。' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const provider = typeof body.provider === 'string' && providers.includes(body.provider as TopicSearchProvider)
      ? body.provider as TopicSearchProvider
      : 'auto';
    const range = typeof body.range === 'string' && ranges.includes(body.range as TopicSearchRange)
      ? body.range as TopicSearchRange
      : 'week';

    if (query.length < 2 || query.length > 100) {
      return NextResponse.json({ error: '请输入 2 到 100 个字符的搜索主题。' }, { status: 400 });
    }

    return NextResponse.json(await searchExternalTopics({ query, provider, range }));
  } catch (error) {
    if (error instanceof TopicSearchConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: '外部选题搜索暂时不可用，请稍后重试。' }, { status: 502 });
  }
}
