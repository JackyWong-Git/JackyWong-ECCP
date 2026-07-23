import hashlib
import math
import re

import httpx

from .config import get_settings


TOKEN_PATTERN = re.compile(r"[\u4e00-\u9fff]|[A-Za-z0-9_]+")


def local_hash_embedding(text: str, dimensions: int) -> list[float]:
    vector = [0.0] * dimensions
    for token in TOKEN_PATTERN.findall(text.lower()):
        digest = hashlib.blake2b(token.encode(), digest_size=16).digest()
        bucket = int.from_bytes(digest[:8], "big") % dimensions
        vector[bucket] += 1.0 if digest[8] & 1 else -1.0
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


async def embed_texts(texts: list[str]) -> list[list[float]]:
    settings = get_settings()
    if settings.embedding_provider == "local_hash":
        return [local_hash_embedding(text, settings.embedding_dimensions) for text in texts]
    if not settings.embedding_api_url or not settings.embedding_api_key:
        raise RuntimeError("Embedding API is not configured")
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            settings.embedding_api_url.rstrip("/") + "/embeddings",
            headers={"Authorization": f"Bearer {settings.embedding_api_key}"},
            json={"model": settings.embedding_model, "input": texts},
        )
        response.raise_for_status()
        data = response.json()["data"]
    return [item["embedding"] for item in sorted(data, key=lambda item: item["index"])]
