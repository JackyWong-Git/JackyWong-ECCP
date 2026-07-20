import { NextRequest, NextResponse } from "next/server";
import { SearchClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

async function doSearch(query: string, source: string, headers: Headers) {
  const customHeaders = HeaderUtils.extractForwardHeaders(headers);
  const config = new Config();
  const client = new SearchClient(config, customHeaders);

  const sourceQueries: Record<string, string> = {
    douyin: `${query} 抖音热门话题 热搜`,
    weibo: `${query} 微博热搜 热门话题`,
    tech: `${query} 科技行业最新动态 AI 互联网`,
    all: `${query} 今日热点新闻 热搜 热门`,
    general: `${query} 今日热点新闻`,
  };

  const searchQuery = sourceQueries[source] || sourceQueries.general;

  const response = await client.advancedSearch(searchQuery, {
    count: 15,
    needSummary: true,
    timeRange: "1d",
  });

  const topics = (response.web_items || []).map((item, idx) => ({
    id: `discover-${Date.now()}-${idx}`,
    title: item.title,
    description: item.summary || item.snippet || "",
    source: item.site_name || source,
    url: item.url || "",
    heat: Math.max(20, 100 - idx * 5),
    category: inferCategory(item.title, source),
    publishTime: item.publish_time || new Date().toISOString(),
  }));

  return { topics, summary: response.summary || "", source, query: searchQuery };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "今日热点新闻";
  const source = searchParams.get("source") || "general";

  try {
    const result = await doSearch(query, source, request.headers);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: msg, topics: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const query = body.keyword || body.q || "今日热点新闻";
  const source = body.source || "general";

  try {
    const result = await doSearch(query, source, request.headers);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: msg, topics: [] }, { status: 500 });
  }
}

function inferCategory(title: string, source: string): string {
  const lower = title.toLowerCase();
  if (/ai|人工智能|大模型|gpt|llm|智能/.test(lower)) return "AI/科技";
  if (/财经|股市|基金|投资|经济/.test(lower)) return "财经";
  if (/娱乐|明星|电影|综艺|音乐/.test(lower)) return "娱乐";
  if (/体育|比赛|冠军|联赛/.test(lower)) return "体育";
  if (/社会|民生|政策|法律/.test(lower)) return "社会";
  if (/国际|全球|海外|国外/.test(lower)) return "国际";
  if (source === "tech") return "科技";
  return "热点";
}
