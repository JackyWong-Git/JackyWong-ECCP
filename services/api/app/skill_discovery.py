import asyncio
import base64
import hashlib
import re
from dataclasses import asdict, dataclass
from urllib.parse import quote, urlparse

import httpx
import yaml


GITHUB_API = "https://api.github.com"
MAX_REPOSITORY_SKILLS = 40


class SkillDiscoveryError(ValueError):
    pass


@dataclass(frozen=True)
class GitHubLocation:
    owner: str
    repository: str
    git_ref: str
    skill_path: str

    @property
    def repository_url(self) -> str:
        return f"https://github.com/{self.owner}/{self.repository}"


@dataclass(frozen=True)
class DiscoveredSkill:
    owner: str
    repository: str
    git_ref: str
    repository_url: str
    skill_path: str
    name: str
    description: str
    version: str
    homepage: str
    author: str
    category: str
    commit_sha: str
    checksum: str
    capabilities: list[str]
    required_env: list[str]
    required_bins: list[str]
    suggested_businesses: list[str]
    risk_level: str
    risk_findings: list[dict[str, str]]
    deprecated_by: str
    manifest: dict

    def to_manifest(self) -> dict:
        return asdict(self)


def parse_github_url(url: str) -> GitHubLocation:
    parsed = urlparse(url.strip())
    if parsed.scheme != "https" or parsed.hostname not in {"github.com", "www.github.com"}:
        raise SkillDiscoveryError("目前仅支持 https://github.com 上的公开 Skill 来源")
    segments = [segment for segment in parsed.path.split("/") if segment]
    if len(segments) < 2:
        raise SkillDiscoveryError("GitHub 地址需要包含仓库所有者和仓库名")
    owner, repository = segments[0], segments[1].removesuffix(".git")
    git_ref = "main"
    skill_path = ""
    if len(segments) >= 4 and segments[2] == "tree":
        git_ref = segments[3]
        skill_path = "/".join(segments[4:]).removesuffix("/SKILL.md")
    elif len(segments) > 2:
        raise SkillDiscoveryError("请使用仓库首页或包含 /tree/分支/目录 的 Skill 地址")
    return GitHubLocation(owner, repository, git_ref, skill_path)


def _frontmatter(markdown: str) -> dict:
    match = re.match(r"^---\s*\n(.*?)\n---\s*(?:\n|$)", markdown, flags=re.DOTALL)
    if not match:
        raise SkillDiscoveryError("未找到有效的 SKILL.md YAML 清单")
    try:
        data = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError as error:
        raise SkillDiscoveryError("SKILL.md 的 YAML 清单无法解析") from error
    if not isinstance(data, dict) or not data.get("name"):
        raise SkillDiscoveryError("SKILL.md 缺少 name 字段")
    return data


def _nested_list(value: object, *keys: str) -> list[str]:
    current = value
    for key in keys:
        if not isinstance(current, dict):
            return []
        current = current.get(key)
    if not isinstance(current, list):
        return []
    return sorted({str(item).strip() for item in current if str(item).strip()})


def _classify(name: str, description: str, markdown: str) -> tuple[str, list[str], list[str]]:
    text = f"{name} {description} {markdown[:12000]}".lower()
    businesses: list[str] = []
    capabilities: list[str] = []
    if any(token in text for token in ("小红书", "xhs", "image card", "图片卡片")):
        businesses.append("xiaohongshu")
        capabilities.extend(["社交媒体图卡生成", "多版式内容拆解"])
    if any(token in text for token in ("微信公众号", "wechat", "微信图文")):
        businesses.append("wechat")
        capabilities.append("微信公众号内容处理")
    if any(token in text for token in ("video", "视频", "字幕")):
        businesses.append("video")
        capabilities.append("视频内容处理")
    if any(token in text for token in ("publish", "post to", "发布")):
        capabilities.append("渠道发布")
    if any(token in text for token in ("image", "图片", "封面")):
        capabilities.append("图片生成与处理")
    if not capabilities:
        capabilities.append("通用 Agent 能力")
    if not businesses:
        businesses.append("general")
    category = "渠道发布" if "渠道发布" in capabilities else "内容生成" if "图片生成与处理" in capabilities else "通用能力"
    return category, list(dict.fromkeys(capabilities)), list(dict.fromkeys(businesses))


def _risk_analysis(markdown: str, required_bins: list[str], required_env: list[str]) -> tuple[str, list[dict[str, str]]]:
    text = markdown.lower()
    findings: list[dict[str, str]] = []

    def add(code: str, title: str, detail: str, severity: str) -> None:
        findings.append({"code": code, "title": title, "detail": detail, "severity": severity})

    if any(token in text for token in ("chrome", "cdp", "browser automation", "浏览器")):
        add("browser_automation", "浏览器自动化", "可能控制浏览器会话或读取登录态。", "high")
    if required_env or re.search(r"\b(api key|appsecret|credential(?:s)?|access token)\b", text):
        add("credentials", "平台凭据", "需要读取 API Key、Token 或平台密钥。", "high")
    if re.search(r"(--submit|draft/add|\bpublish(?:ing|ed)?\b|发布公众号|\bpost to\b)", text):
        add("external_publish", "对外发布", "能够向外部渠道提交或发布内容。", "high")
    if required_bins or any(token in text for token in ("scripts/", "bun ", "npx ", "python ", "shell")):
        binaries = "、".join(required_bins) if required_bins else "本地运行时"
        add("local_execution", "本地脚本执行", f"依赖 {binaries} 执行受控脚本。", "medium")
    if any(token in text for token in ("ssh", "scp", "remote host", "远程")):
        add("remote_network", "远程网络访问", "包含远程连接或网络转发能力。", "high")
    if any(item["severity"] == "high" for item in findings):
        return "high", findings
    if findings:
        return "medium", findings
    return "low", [{"code": "manifest_only", "title": "清单能力", "detail": "暂未识别高风险系统操作。", "severity": "low"}]


def parse_skill(markdown: str, location: GitHubLocation, commit_sha: str) -> DiscoveredSkill:
    manifest = _frontmatter(markdown)
    metadata = manifest.get("metadata") if isinstance(manifest.get("metadata"), dict) else {}
    openclaw = metadata.get("openclaw") if isinstance(metadata.get("openclaw"), dict) else {}
    required_bins = _nested_list(manifest, "metadata", "openclaw", "requires", "anyBins")
    required_env = _nested_list(manifest, "metadata", "openclaw", "requires", "env")
    name = str(manifest.get("name", "")).strip()
    description = str(manifest.get("description", "")).strip()
    category, capabilities, businesses = _classify(name, description, markdown)
    risk_level, risk_findings = _risk_analysis(markdown, required_bins, required_env)
    deprecated_by = str(manifest.get("deprecated_by") or openclaw.get("deprecated_by") or "").strip()
    return DiscoveredSkill(
        owner=location.owner,
        repository=location.repository,
        git_ref=location.git_ref,
        repository_url=location.repository_url,
        skill_path=location.skill_path,
        name=name,
        description=description,
        version=str(manifest.get("version") or "0.0.0"),
        homepage=str(openclaw.get("homepage") or location.repository_url),
        author=str(manifest.get("author") or location.owner),
        category=category,
        commit_sha=commit_sha,
        checksum=hashlib.sha256(markdown.encode()).hexdigest(),
        capabilities=capabilities,
        required_env=required_env,
        required_bins=required_bins,
        suggested_businesses=businesses,
        risk_level=risk_level,
        risk_findings=risk_findings,
        deprecated_by=deprecated_by,
        manifest=manifest,
    )


async def _github_json(client: httpx.AsyncClient, path: str) -> dict:
    response = await client.get(f"{GITHUB_API}{path}")
    if response.status_code == 404:
        raise SkillDiscoveryError("GitHub 仓库、分支或 SKILL.md 不存在")
    if response.status_code == 403:
        raise SkillDiscoveryError("GitHub 扫描频率已受限，请稍后重试")
    try:
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise SkillDiscoveryError("暂时无法读取 GitHub Skill 来源") from error
    data = response.json()
    if not isinstance(data, dict):
        raise SkillDiscoveryError("GitHub 返回了无法识别的数据")
    return data


async def _fetch_skill(client: httpx.AsyncClient, location: GitHubLocation) -> DiscoveredSkill:
    skill_file = f"{location.skill_path.rstrip('/')}/SKILL.md".lstrip("/")
    path = quote(skill_file, safe="/")
    data = await _github_json(
        client,
        f"/repos/{quote(location.owner)}/{quote(location.repository)}/contents/{path}?ref={quote(location.git_ref)}",
    )
    encoded = data.get("content")
    if not isinstance(encoded, str):
        raise SkillDiscoveryError(f"{skill_file} 不是可读取的文件")
    markdown = base64.b64decode(encoded).decode("utf-8")
    return parse_skill(markdown, location, str(data.get("sha") or ""))


async def discover_github_skills(url: str) -> list[DiscoveredSkill]:
    location = parse_github_url(url)
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "GTMC-ECCP-Skill-Registry/1.0"}
    async with httpx.AsyncClient(headers=headers, timeout=httpx.Timeout(30.0)) as client:
        if location.skill_path:
            return [await _fetch_skill(client, location)]
        tree = await _github_json(
            client,
            f"/repos/{quote(location.owner)}/{quote(location.repository)}/git/trees/{quote(location.git_ref)}?recursive=1",
        )
        files = [
            str(item.get("path"))
            for item in tree.get("tree", [])
            if isinstance(item, dict) and str(item.get("path", "")).endswith("/SKILL.md")
        ][:MAX_REPOSITORY_SKILLS]
        if not files:
            raise SkillDiscoveryError("仓库中没有找到 SKILL.md")
        semaphore = asyncio.Semaphore(5)

        async def fetch(path: str) -> DiscoveredSkill:
            async with semaphore:
                nested = GitHubLocation(location.owner, location.repository, location.git_ref, path.removesuffix("/SKILL.md"))
                return await _fetch_skill(client, nested)

        results = await asyncio.gather(*(fetch(path) for path in files), return_exceptions=True)
        discovered = [item for item in results if isinstance(item, DiscoveredSkill)]
        if not discovered:
            raise SkillDiscoveryError("找到 Skill 清单，但没有可解析的候选能力")
        return discovered
