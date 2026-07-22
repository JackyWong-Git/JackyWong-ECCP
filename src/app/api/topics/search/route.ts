import { NextResponse } from 'next/server';
import { TopicSearchConfigurationError, searchExternalTopics } from '@/lib/topic-search';
import { type TopicSearchProvider, type TopicSearchRange } from '@/lib/topic-search-types';

export const runtime = 'nodejs';

const providers: TopicSearchProvider[] = ['auto', 'openserp', 'searxng', 'rss'];
const ranges: TopicSearchRange[] = ['day', 'week', 'month'];

export async function POST(request: Request) {
  try {
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
