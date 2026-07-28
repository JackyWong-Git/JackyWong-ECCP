import hashlib
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from xml.etree import ElementTree

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .models import Topic, TopicDiscoveryRule, TopicDiscoveryRun


def next_run_at(schedule: str, now: datetime | None = None) -> datetime:
    current = now or datetime.now(timezone.utc)
    return current + {"hourly": timedelta(hours=1), "weekly": timedelta(days=7)}.get(
        schedule, timedelta(days=1)
    )


def _canonical_url(value: str) -> str:
    parsed = urlparse(value)
    query = urlencode(
        [(key, item) for key, item in parse_qsl(parsed.query) if not key.lower().startswith("utm_")]
    )
    return urlunparse(parsed._replace(fragment="", query=query))


def _source_name(value: str) -> str:
    return (urlparse(value).hostname or "外部来源").removeprefix("www.")


def _score(title: str, summary: str, query: str, published_at: str = "") -> int:
    terms = [item for item in re.split(r"[\s,，、]+", query.lower()) if item]
    haystack = f"{title} {summary}".lower()
    score = min(60, sum(18 for term in terms if term in haystack) + sum(12 for term in terms if term in title.lower()))
    if published_at:
        try:
            age = datetime.now(timezone.utc) - datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            score += 30 if age <= timedelta(days=1) else 20 if age <= timedelta(days=7) else 10
        except ValueError:
            score += 8
    else:
        score += 8
    return min(99, max(1, score))


def _normalize(items: list[dict], provider: str, query: str) -> list[dict]:
    results: list[dict] = []
    seen: set[str] = set()
    for item in items:
        title = str(item.get("title") or "").strip()
        url = _canonical_url(str(item.get("url") or "").strip())
        if not title or not url or url in seen:
            continue
        seen.add(url)
        summary = re.sub(r"<[^>]+>", " ", str(item.get("summary") or "")).strip()
        source_name = str(item.get("source_name") or _source_name(url))
        published_at = str(item.get("published_at") or "")
        results.append(
            {
                "id": hashlib.sha256(f"{provider}:{url}".encode()).hexdigest()[:20],
                "title": title[:240],
                "summary": summary[:2000],
                "url": url[:1000],
                "source_name": source_name[:120],
                "provider": provider,
                "published_at": published_at,
                "score": _score(title, summary, query, published_at),
                "tags": list(dict.fromkeys([*re.split(r"[\s,，、]+", query), source_name]))[:3],
            }
        )
    return results


async def _search_openserp(client: httpx.AsyncClient, query: str, search_range: str) -> list[dict]:
    settings = get_settings()
    if not settings.topic_search_openserp_url:
        return []
    params = {
        "text": query,
        "limit": 16,
        "mode": "balanced",
        "dedupe": "true",
        "engines": settings.topic_search_openserp_engines,
    }
    headers = {"Authorization": f"Bearer {settings.topic_search_openserp_api_key}"} if settings.topic_search_openserp_api_key else {}
    response = await client.get(f"{settings.topic_search_openserp_url.rstrip('/')}/mega/search", params=params, headers=headers)
    response.raise_for_status()
    payload = response.json()
    return _normalize(
        [
            {
                "title": item.get("title"),
                "summary": item.get("snippet") or (item.get("extracted") or {}).get("content"),
                "url": item.get("url"),
                "source_name": item.get("engine"),
                "published_at": item.get("published_at") or item.get("date"),
            }
            for item in payload.get("results", [])
        ],
        "openserp",
        query,
    )


async def _search_searxng(client: httpx.AsyncClient, query: str, search_range: str) -> list[dict]:
    settings = get_settings()
    if not settings.topic_search_searxng_url:
        return []
    response = await client.get(
        f"{settings.topic_search_searxng_url.rstrip('/')}/search",
        params={"q": query, "format": "json", "categories": "news", "language": settings.topic_search_searxng_language, "safesearch": 1},
    )
    response.raise_for_status()
    return _normalize(
        [
            {
                "title": item.get("title"),
                "summary": item.get("content"),
                "url": item.get("url"),
                "source_name": item.get("engine"),
                "published_at": item.get("publishedDate") or item.get("published_date"),
            }
            for item in response.json().get("results", [])
        ],
        "searxng",
        query,
    )


def _rss_sources() -> list[tuple[str, str]]:
    values = re.split(r"[\n,;]+", get_settings().topic_search_rss_feeds)
    sources = []
    for value in values:
        if not value.strip():
            continue
        name, separator, url = value.strip().partition("|")
        sources.append((name if separator else _source_name(name), url if separator else name))
    return sources


async def _search_rss(client: httpx.AsyncClient, query: str, search_range: str) -> list[dict]:
    collected: list[dict] = []
    for source_name, url in _rss_sources():
        response = await client.get(url, headers={"Accept": "application/rss+xml, application/atom+xml, application/xml"})
        response.raise_for_status()
        root = ElementTree.fromstring(response.content)
        for entry in list(root.findall(".//item")) + list(root.findall(".//{*}entry")):
            def text(name: str) -> str:
                node = entry.find(name) or entry.find(f"{{*}}{name}")
                return (node.text or "").strip() if node is not None else ""

            link_node = entry.find("link") or entry.find("{*}link")
            link = (link_node.get("href") if link_node is not None else "") or text("link")
            title = text("title")
            summary = text("description") or text("summary") or text("content")
            if any(term in f"{title} {summary}".lower() for term in re.split(r"[\s,，、]+", query.lower()) if term):
                collected.append({"title": title, "summary": summary, "url": link, "source_name": source_name, "published_at": text("pubDate") or text("published")})
    return _normalize(collected, "rss", query)


async def search_topics(query: str, provider: str, search_range: str) -> tuple[list[dict], list[str], list[str]]:
    available = {
        "openserp": bool(get_settings().topic_search_openserp_url),
        "searxng": bool(get_settings().topic_search_searxng_url),
        "rss": bool(_rss_sources()),
    }
    providers = [provider] if provider != "auto" else [name for name, enabled in available.items() if enabled]
    failures: list[str] = []
    results: list[dict] = []
    async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
        for name in providers:
            try:
                results.extend(await {"openserp": _search_openserp, "searxng": _search_searxng, "rss": _search_rss}[name](client, query, search_range))
            except Exception as error:
                failures.append(f"{name}: {str(error)[:160]}")
    deduped = {item["url"]: item for item in sorted(results, key=lambda item: item["score"])}
    return sorted(deduped.values(), key=lambda item: item["score"], reverse=True), providers, failures


async def execute_rule(session: AsyncSession, rule: TopicDiscoveryRule) -> TopicDiscoveryRun:
    now = datetime.now(timezone.utc)
    run = TopicDiscoveryRun(rule_id=rule.id)
    session.add(run)
    await session.flush()
    try:
        results, providers, failures = await search_topics(rule.query, rule.provider, rule.search_range)
        candidates = [item for item in results if item["score"] >= rule.score_threshold][: rule.max_items]
        existing_urls = set(
            await session.scalars(select(Topic.source_url).where(Topic.source_url.in_([item["url"] for item in candidates])))
        ) if candidates else set()
        imported = 0
        if rule.auto_import:
            for item in candidates:
                if item["url"] in existing_urls:
                    continue
                session.add(
                    Topic(
                        title=item["title"],
                        description=item["summary"],
                        status="research",
                        priority="high" if item["score"] >= 72 else "normal",
                        tags=item["tags"],
                        source=f"自动发现 · {item['source_name']}",
                        source_url=item["url"],
                        channel="待评估",
                        estimated_words=2000,
                        created_by_employee_id=rule.created_by_employee_id,
                        created_by_name=rule.created_by_name,
                    )
                )
                imported += 1
        run.status = "completed" if not failures else "partial"
        run.providers = providers
        run.found_count = len(results)
        run.imported_count = imported
        run.skipped_count = len(candidates) - imported
        run.failures = failures
    except Exception as error:
        run.status = "failed"
        run.failures = [str(error)[:500]]
    run.completed_at = now
    rule.last_run_at = now
    rule.next_run_at = next_run_at(rule.schedule, now)
    await session.commit()
    await session.refresh(run)
    return run
