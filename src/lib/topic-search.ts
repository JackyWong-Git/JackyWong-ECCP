import 'server-only';

import {
  type ExternalTopic,
  type TopicSearchProvider,
  type TopicSearchRange,
  type TopicSearchResponse,
} from './topic-search-types';

const SEARCH_TIMEOUT_MS = 12_000;
const SEARCH_LIMIT = 16;

interface SearchInput {
  query: string;
  provider: TopicSearchProvider;
  range: TopicSearchRange;
}

interface RssFeed {
  name: string;
  url: string;
}

interface RawSearchResult {
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  publishedAt?: string;
}

export class TopicSearchConfigurationError extends Error {}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

const asString = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

const decodeXml = (value: string) => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const textBetween = (source: string, tag: string): string => {
  const match = source.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
};

const safeDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const canonicalUrl = (value: string) => {
  try {
    const url = new URL(value);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => url.searchParams.delete(key));
    return url.toString();
  } catch {
    return value;
  }
};

const sourceFromUrl = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return '外部来源';
  }
};

const configuredRssFeeds = (): RssFeed[] => (process.env.TOPIC_SEARCH_RSS_FEEDS ?? '')
  .split(/\n|,|;/)
  .map(item => item.trim())
  .filter(Boolean)
  .map(item => {
    const [name, ...urlParts] = item.split('|');
    const url = (urlParts.length ? urlParts.join('|') : name).trim();
    return { name: urlParts.length ? name.trim() : sourceFromUrl(url), url };
  })
  .filter(feed => /^https?:\/\//i.test(feed.url));

const configuredProviders = (): Exclude<TopicSearchProvider, 'auto'>[] => {
  const providers: Exclude<TopicSearchProvider, 'auto'>[] = [];
  if (process.env.TOPIC_SEARCH_OPENSERP_URL) providers.push('openserp');
  if (process.env.TOPIC_SEARCH_SEARXNG_URL) providers.push('searxng');
  if (configuredRssFeeds().length) providers.push('rss');
  return providers;
};

const requestJson = async (url: URL, headers?: HeadersInit) => {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`请求失败 (${response.status})`);
  return response.json() as Promise<unknown>;
};

const requestText = async (url: string) => {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
  });
  if (!response.ok) throw new Error(`订阅获取失败 (${response.status})`);
  return response.text();
};

const searchOpenSerp = async (query: string, range: TopicSearchRange): Promise<RawSearchResult[]> => {
  const baseUrl = process.env.TOPIC_SEARCH_OPENSERP_URL;
  if (!baseUrl) return [];

  const url = new URL('/mega/search', baseUrl);
  url.searchParams.set('text', query);
  url.searchParams.set('limit', String(SEARCH_LIMIT));
  url.searchParams.set('mode', 'balanced');
  url.searchParams.set('dedupe', 'true');
  url.searchParams.set('engines', process.env.TOPIC_SEARCH_OPENSERP_ENGINES ?? 'baidu,bing,duckduckgo');
  if (range !== 'month') {
    const from = new Date();
    from.setDate(from.getDate() - (range === 'day' ? 1 : 7));
    url.searchParams.set('date', `${from.toISOString().slice(0, 10).replaceAll('-', '')}..${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`);
  }

  const apiKey = process.env.TOPIC_SEARCH_OPENSERP_API_KEY;
  const payload = asRecord(await requestJson(url, apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined));
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results.map(item => {
    const result = asRecord(item);
    const itemUrl = asString(result.url);
    return {
      title: asString(result.title),
      summary: asString(result.snippet) || asString(asRecord(result.extracted).content),
      url: itemUrl,
      sourceName: asString(result.engine) || sourceFromUrl(itemUrl),
      publishedAt: safeDate(asString(result.published_at) || asString(result.date)),
    };
  }).filter(result => result.title && result.url);
};

const searchSearXng = async (query: string): Promise<RawSearchResult[]> => {
  const baseUrl = process.env.TOPIC_SEARCH_SEARXNG_URL;
  if (!baseUrl) return [];

  const url = new URL('search', `${baseUrl.replace(/\/$/, '')}/`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('categories', 'news');
  url.searchParams.set('language', process.env.TOPIC_SEARCH_SEARXNG_LANGUAGE ?? 'zh-CN');
  url.searchParams.set('safesearch', '1');

  const payload = asRecord(await requestJson(url));
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results.map(item => {
    const result = asRecord(item);
    const itemUrl = asString(result.url);
    return {
      title: asString(result.title),
      summary: asString(result.content),
      url: itemUrl,
      sourceName: asString(result.engine) || sourceFromUrl(itemUrl),
      publishedAt: safeDate(asString(result.publishedDate) || asString(result.published_date)),
    };
  }).filter(result => result.title && result.url);
};

const rssItems = (xml: string, feed: RssFeed): RawSearchResult[] => {
  const entries = xml.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return entries.slice(0, SEARCH_LIMIT).map(entry => {
    const linkMatch = entry.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
    const itemUrl = linkMatch?.[1] || textBetween(entry, 'link');
    return {
      title: textBetween(entry, 'title'),
      summary: textBetween(entry, 'description') || textBetween(entry, 'summary') || textBetween(entry, 'content'),
      url: itemUrl.trim(),
      sourceName: feed.name,
      publishedAt: safeDate(textBetween(entry, 'pubDate') || textBetween(entry, 'published') || textBetween(entry, 'updated')),
    };
  }).filter(result => result.title && result.url);
};

const matchesQuery = (result: RawSearchResult, query: string) => {
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${result.title} ${result.summary}`.toLocaleLowerCase();
  return terms.some(term => haystack.includes(term));
};

const searchRss = async (query: string): Promise<RawSearchResult[]> => {
  const feeds = configuredRssFeeds();
  const responses = await Promise.allSettled(feeds.map(async feed => rssItems(await requestText(feed.url), feed)));
  return responses
    .flatMap(response => response.status === 'fulfilled' ? response.value : [])
    .filter(result => matchesQuery(result, query));
};

const scoreTopic = (result: RawSearchResult, query: string) => {
  const haystack = `${result.title} ${result.summary}`.toLocaleLowerCase();
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = terms.filter(term => haystack.includes(term)).length;
  const titleMatches = terms.filter(term => result.title.toLocaleLowerCase().includes(term)).length;
  let score = Math.min(60, matches * 18 + titleMatches * 12);

  if (result.publishedAt) {
    const ageHours = (Date.now() - new Date(result.publishedAt).getTime()) / 3_600_000;
    score += ageHours <= 24 ? 30 : ageHours <= 24 * 7 ? 20 : ageHours <= 24 * 31 ? 10 : 0;
  } else {
    score += 8;
  }

  return Math.min(99, Math.max(1, score));
};

const tagsFor = (title: string, query: string, sourceName: string) => {
  const words = [...query.split(/[\s,，、]+/), sourceName]
    .map(word => word.trim())
    .filter(word => word.length > 1 && (title.includes(word) || word === sourceName));
  return Array.from(new Set(words)).slice(0, 3);
};

const toExternalTopic = (raw: RawSearchResult, provider: Exclude<TopicSearchProvider, 'auto'>, query: string): ExternalTopic => ({
  id: `${provider}-${canonicalUrl(raw.url)}`,
  title: raw.title,
  summary: raw.summary.slice(0, 280),
  url: canonicalUrl(raw.url),
  sourceName: raw.sourceName,
  provider,
  publishedAt: raw.publishedAt,
  score: scoreTopic(raw, query),
  tags: tagsFor(raw.title, query, raw.sourceName),
});

export const searchExternalTopics = async (input: SearchInput): Promise<TopicSearchResponse> => {
  const availableProviders = configuredProviders();
  const providers = input.provider === 'auto' ? availableProviders : [input.provider];
  if (!providers.length) {
    throw new TopicSearchConfigurationError('尚未配置外部数据源。请配置 OpenSERP、SearXNG 或 RSS 订阅后再搜索。');
  }
  if (input.provider !== 'auto' && !availableProviders.includes(input.provider)) {
    throw new TopicSearchConfigurationError(`${input.provider} 尚未配置。请在部署环境中补充对应连接地址后再搜索。`);
  }

  const jobs = providers.map(async provider => {
    if (provider === 'openserp') return { provider, results: await searchOpenSerp(input.query, input.range) };
    if (provider === 'searxng') return { provider, results: await searchSearXng(input.query) };
    return { provider, results: await searchRss(input.query) };
  });
  const responses = await Promise.allSettled(jobs);
  const failures: string[] = [];
  const candidates: ExternalTopic[] = [];

  responses.forEach((response, index) => {
    const provider = providers[index];
    if (response.status === 'rejected') {
      failures.push(`${provider} 暂时不可用`);
      return;
    }
    candidates.push(...response.value.results.map(result => toExternalTopic(result, provider, input.query)));
  });

  const unique = new Map<string, ExternalTopic>();
  candidates.forEach(candidate => {
    const key = candidate.url || candidate.title.toLocaleLowerCase();
    const existing = unique.get(key);
    if (!existing || candidate.score > existing.score) unique.set(key, candidate);
  });

  return {
    results: Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, SEARCH_LIMIT),
    providers,
    failures,
  };
};
