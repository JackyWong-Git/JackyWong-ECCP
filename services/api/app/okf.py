import io
import posixpath
import re
import zipfile
from dataclasses import dataclass

import yaml


MAX_OKF_FILES = 500
MAX_OKF_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)#?]+\.md)(?:#[^)]+)?\)", re.IGNORECASE)


@dataclass(frozen=True)
class OkfDocument:
    path: str
    content: bytes
    metadata: dict
    links: list[str]


@dataclass(frozen=True)
class OkfBundle:
    version: str
    documents: list[OkfDocument]


def _normal_path(value: str) -> str:
    normalized = posixpath.normpath(value.replace("\\", "/")).lstrip("/")
    if normalized == ".." or normalized.startswith("../"):
        raise ValueError("OKF 压缩包包含不安全路径")
    return normalized


def _as_list(value) -> list:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _trust(metadata: dict) -> str:
    if bool(metadata.get("verified")):
        return "human-reviewed"
    if bool(metadata.get("generated")):
        return "machine-confirmed"
    return "unverified"


def parse_okf_bundle(data: bytes) -> OkfBundle:
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as error:
        raise ValueError("文件不是有效的 OKF ZIP 包") from error
    files = [item for item in archive.infolist() if not item.is_dir()]
    if len(files) > MAX_OKF_FILES:
        raise ValueError(f"OKF 文件数量不能超过 {MAX_OKF_FILES}")
    if sum(item.file_size for item in files) > MAX_OKF_UNCOMPRESSED_BYTES:
        raise ValueError("OKF 解压后总大小超过 50 MB")

    root_prefix = ""
    markdown_paths = [_normal_path(item.filename) for item in files if item.filename.lower().endswith(".md")]
    if markdown_paths and all("/" in path for path in markdown_paths):
        first = markdown_paths[0].split("/", 1)[0]
        if all(path.startswith(f"{first}/") for path in markdown_paths):
            root_prefix = f"{first}/"

    version = "1.0"
    documents: list[OkfDocument] = []
    for item in files:
        path = _normal_path(item.filename)
        if root_prefix and path.startswith(root_prefix):
            path = path[len(root_prefix):]
        if not path.lower().endswith(".md") or path in {"index.md", "log.md"}:
            continue
        raw = archive.read(item)
        text = raw.decode("utf-8")
        match = FRONTMATTER.match(text)
        if not match:
            raise ValueError(f"{path} 缺少 YAML frontmatter")
        metadata = yaml.safe_load(match.group(1)) or {}
        if not isinstance(metadata, dict) or not str(metadata.get("type") or "").strip():
            raise ValueError(f"{path} 缺少必填的 type 元数据")
        concept_id = path.removesuffix(".md")
        metadata = {
            **metadata,
            "title": str(metadata.get("title") or posixpath.basename(concept_id).replace("-", " ")),
            "description": str(metadata.get("description") or ""),
            "tags": [str(value) for value in _as_list(metadata.get("tags"))],
            "sources": _as_list(metadata.get("sources")),
            "status": str(metadata.get("status") or "draft"),
            "trust": _trust(metadata),
            "okf_path": path,
        }
        links = []
        for link in MARKDOWN_LINK.findall(text):
            resolved = _normal_path(posixpath.join(posixpath.dirname(path), link))
            links.append(resolved.removesuffix(".md"))
        documents.append(OkfDocument(path=path, content=raw, metadata=metadata, links=list(dict.fromkeys(links))))

    if not documents:
        raise ValueError("OKF 包中没有可导入的概念 Markdown")

    index_candidates = [item for item in files if _normal_path(item.filename).endswith("index.md")]
    if index_candidates:
        index_text = archive.read(index_candidates[0]).decode("utf-8", errors="replace")
        match = FRONTMATTER.match(index_text)
        if match:
            index_metadata = yaml.safe_load(match.group(1)) or {}
            version = str(index_metadata.get("okf_version") or version)
    return OkfBundle(version=version, documents=documents)
