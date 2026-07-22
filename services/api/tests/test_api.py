import base64
import json
import time

from fastapi.testclient import TestClient

from app.embeddings import local_hash_embedding
from app.ingestion import split_text
from app.main import app
from app.routers import skills as skills_router
from app.security import sign_internal_user
from app.skill_discovery import DiscoveredSkill


def auth_headers(permissions: list[str]) -> dict[str, str]:
    payload = {
        "id": 1,
        "username": "tester",
        "displayName": "测试用户",
        "employeeId": "0000001",
        "department": "人事总务部",
        "accessScope": "department",
        "isSuperuser": False,
        "permissions": permissions,
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload, ensure_ascii=False).encode()).decode().rstrip("=")
    timestamp = str(int(time.time()))
    return {
        "X-ECCP-User": encoded,
        "X-ECCP-Timestamp": timestamp,
        "X-ECCP-Signature": sign_internal_user(encoded, timestamp, "test-secret"),
    }


def test_local_embedding_is_deterministic_and_normalized() -> None:
    first = local_hash_embedding("企业文化 员工故事", 64)
    second = local_hash_embedding("企业文化 员工故事", 64)
    assert first == second
    assert abs(sum(value * value for value in first) - 1.0) < 1e-9


def test_split_text_keeps_overlap() -> None:
    chunks = split_text("A" * 1800, size=1000, overlap=100)
    assert len(chunks) == 2
    assert chunks[0][-100:] == chunks[1][:100]


def test_knowledge_base_upload_and_search_flow() -> None:
    headers = auth_headers(["accounts.view_knowledge", "accounts.create_content"])
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        created = client.post(
            "/v1/knowledge-bases",
            headers=headers,
            json={"name": "测试知识库", "description": "自动化测试"},
        )
        assert created.status_code == 201
        knowledge_base_id = created.json()["id"]

        uploaded = client.post(
            f"/v1/knowledge-bases/{knowledge_base_id}/documents",
            headers=headers,
            files={"file": ("culture.txt", "企业文化重视员工故事和真实表达。", "text/plain")},
        )
        assert uploaded.status_code == 202

        documents = client.get(
            f"/v1/knowledge-bases/{knowledge_base_id}/documents",
            headers=headers,
        )
        assert documents.status_code == 200
        assert documents.json()["items"][0]["status"] == "processed"

        searched = client.post(
            f"/v1/knowledge-bases/{knowledge_base_id}/search",
            headers=headers,
            json={"query": "员工故事", "top_k": 3},
        )
        assert searched.status_code == 200
        assert searched.json()["items"][0]["document_name"] == "culture.txt"


def test_write_requires_create_permission() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/v1/knowledge-bases",
            headers=auth_headers(["accounts.view_knowledge"]),
            json={"name": "不可创建", "description": ""},
        )
    assert response.status_code == 403


def test_complete_content_workflow() -> None:
    headers = auth_headers(
        [
            "accounts.manage_projects",
            "accounts.view_topics",
            "accounts.create_content",
            "accounts.view_tasks",
            "accounts.view_analytics",
        ]
    )
    with TestClient(app) as client:
        created = client.post(
            "/v1/materials",
            headers=headers,
            json={
                "title": "一线员工改善故事",
                "description": "生产现场员工通过小改善提升作业效率。",
                "source_department": "人事总务部",
                "source_contact": "王彬彬",
                "urgency": "high",
                "tags": ["员工故事", "改善"],
                "expected_channels": ["内网", "公众号"],
            },
        )
        assert created.status_code == 201
        material_id = created.json()["id"]

        attachment = client.post(
            f"/v1/materials/{material_id}/attachment",
            headers=headers,
            files={"file": ("story.txt", "真实素材正文", "text/plain")},
        )
        assert attachment.status_code == 200
        assert attachment.json()["original_filename"] == "story.txt"

        scheduled = client.post(
            f"/v1/workflow/materials/{material_id}/schedule",
            headers=headers,
            json={
                "create_topic": True,
                "owner_employee_id": "6210968",
                "owner_name": "王彬彬",
                "priority": "high",
            },
        )
        assert scheduled.status_code == 200
        assert scheduled.json()["material"]["status"] == "in_progress"
        assert scheduled.json()["topic"]["status"] == "in_progress"
        task_id = scheduled.json()["task"]["id"]

        for next_status in ("doing", "review", "approved"):
            transitioned = client.post(
                f"/v1/content-tasks/{task_id}/transition",
                headers=headers,
                json={"status": next_status, "note": f"进入 {next_status}"},
            )
            assert transitioned.status_code == 200
            assert transitioned.json()["status"] == next_status

        published = client.post(
            f"/v1/workflow/content-tasks/{task_id}/publish",
            headers=headers,
            json={
                "channel": "公众号",
                "external_url": "https://example.com/stories/1",
                "title": "改善，从一线开始",
            },
        )
        assert published.status_code == 200
        publication_id = published.json()["id"]

        feedback = client.put(
            f"/v1/publications/{publication_id}/metrics",
            headers=headers,
            json={
                "views": 12000,
                "likes": 860,
                "comments": 96,
                "shares": 128,
                "favorites": 210,
                "conversions": 35,
                "completion_rate": 82.5,
                "sentiment_score": 0.88,
            },
        )
        assert feedback.status_code == 200
        assert feedback.json()["views"] == 12000

        dashboard = client.get("/v1/analytics/dashboard", headers=headers)
        assert dashboard.status_code == 200
        assert dashboard.json()["total_views"] >= 12000
        assert any(item["publication_id"] == publication_id for item in dashboard.json()["items"])

        material = client.get(f"/v1/materials/{material_id}", headers=headers)
        assert material.status_code == 200
        assert material.json()["status"] == "published"
        assert "公众号" in material.json()["selected_channels"]


def test_skill_discovery_install_binding_and_uninstall(monkeypatch) -> None:
    async def fake_discovery(_url: str) -> list[DiscoveredSkill]:
        return [
            DiscoveredSkill(
                owner="eccp-test",
                repository="content-skills",
                git_ref="main",
                repository_url="https://github.com/eccp-test/content-skills",
                skill_path="skills/social-card-test",
                name="social-card-test",
                description="生成社交媒体图卡。",
                version="1.0.0",
                homepage="https://github.com/eccp-test/content-skills",
                author="ECCP Test",
                category="内容生成",
                commit_sha="abc123",
                checksum="0" * 64,
                capabilities=["社交媒体图卡生成"],
                required_env=[],
                required_bins=[],
                suggested_businesses=["xiaohongshu"],
                risk_level="medium",
                risk_findings=[
                    {
                        "code": "local_execution",
                        "title": "本地脚本执行",
                        "detail": "在受控 Worker 中运行。",
                        "severity": "medium",
                    }
                ],
                deprecated_by="",
                manifest={"name": "social-card-test", "version": "1.0.0"},
            )
        ]

    monkeypatch.setattr(skills_router, "discover_github_skills", fake_discovery)
    headers = auth_headers(["accounts.manage_platform"])
    with TestClient(app) as client:
        discovered = client.post(
            "/v1/skills/discover",
            headers=headers,
            json={"url": "https://github.com/eccp-test/content-skills/tree/main/skills/social-card-test"},
        )
        assert discovered.status_code == 200
        skill_id = discovered.json()["items"][0]["id"]

        preflight = client.post(f"/v1/skills/{skill_id}/preflight", headers=headers)
        assert preflight.status_code == 200
        assert preflight.json()["ready_for_install"] is True

        installed = client.post(
            f"/v1/skills/{skill_id}/install",
            headers=headers,
            json={
                "bindings": [
                    {
                        "business_key": "xiaohongshu",
                        "business_name": "小红书图文",
                        "enabled": True,
                        "config": {},
                    }
                ]
            },
        )
        assert installed.status_code == 200
        assert installed.json()["status"] == "installed"
        assert installed.json()["bindings"][0]["business_key"] == "xiaohongshu"

        disabled = client.patch(
            f"/v1/skills/{skill_id}/installation",
            headers=headers,
            json={"enabled": False},
        )
        assert disabled.status_code == 200
        assert disabled.json()["installation"]["enabled"] is False

        audit = client.get(f"/v1/skill-audit-logs?skill_id={skill_id}", headers=headers)
        assert audit.status_code == 200
        assert {item["action"] for item in audit.json()} >= {"discovered", "preflight", "installed"}

        uninstalled = client.delete(f"/v1/skills/{skill_id}/installation", headers=headers)
        assert uninstalled.status_code == 204
        available = client.get(f"/v1/skills/{skill_id}", headers=headers)
        assert available.json()["status"] == "available"
