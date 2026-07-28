import base64
import io
import json
import time
import zipfile

from fastapi.testclient import TestClient

from app.embeddings import local_hash_embedding
from app.ingestion import split_text
from app.okf import parse_okf_bundle
from app.main import app
from app.routers import agents as agents_router
from app.routers import model_providers as model_providers_router
from app.routers import skills as skills_router
from app.security import sign_internal_user
from app.skill_discovery import DiscoveredSkill


def auth_headers(permissions: list[str], *, is_superuser: bool = False) -> dict[str, str]:
    payload = {
        "id": 1,
        "username": "tester",
        "displayName": "测试用户",
        "employeeId": "0000001",
        "department": "人事总务部",
        "accessScope": "department",
        "isSuperuser": is_superuser,
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


def _okf_zip() -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as archive:
        archive.writestr("company-wiki/index.md", "---\nokf_version: '1.0'\n---\n# 企业知识")
        archive.writestr(
            "company-wiki/culture/values.md",
            "---\ntype: Concept\ntitle: 企业价值观\ntags: [文化, 品牌]\nverified: true\nstatus: stable\n---\n"
            "# 企业价值观\n参见[员工故事](stories.md)。",
        )
        archive.writestr(
            "company-wiki/culture/stories.md",
            "---\ntype: Collection\ntitle: 员工故事\ngenerated: true\n---\n# 员工故事",
        )
    return output.getvalue()


def test_okf_parser_builds_trust_and_links() -> None:
    bundle = parse_okf_bundle(_okf_zip())
    assert bundle.version == "1.0"
    assert bundle.documents[0].metadata["trust"] == "human-reviewed"
    assert bundle.documents[0].links == ["culture/stories"]


def test_agent_business_routing_prioritizes_channel_then_story() -> None:
    assert agents_router._business_for("根据采访素材整理员工故事") == "story"
    assert agents_router._business_for("把员工故事发布到微信公众号") == "wechat"


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


def test_okf_import_and_graph_flow() -> None:
    headers = auth_headers(["accounts.view_knowledge", "accounts.create_content"])
    with TestClient(app) as client:
        created = client.post(
            "/v1/knowledge-bases",
            headers=headers,
            json={"name": "OKF 企业 Wiki", "description": "结构化知识"},
        )
        knowledge_base_id = created.json()["id"]
        imported = client.post(
            f"/v1/knowledge-bases/{knowledge_base_id}/okf-bundles",
            headers=headers,
            files={"file": ("company-wiki.zip", _okf_zip(), "application/zip")},
        )
        assert imported.status_code == 202
        assert len(imported.json()["concepts"]) == 2
        assert imported.json()["trust_counts"]["human-reviewed"] == 1
        graph = client.get(f"/v1/knowledge-bases/{knowledge_base_id}/okf-graph", headers=headers)
        assert graph.status_code == 200
        assert graph.json()["edges"] == [{"source": "culture/values", "target": "culture/stories"}]


def test_topic_discovery_rule_uses_default_rss_provider(monkeypatch) -> None:
    async def fake_search_topics(query: str, provider: str, search_range: str):
        assert query == "员工故事"
        assert provider == "auto"
        assert search_range == "week"
        return [], ["rss"], []

    monkeypatch.setattr("app.topic_discovery.search_topics", fake_search_topics)
    headers = auth_headers(["accounts.view_topics", "accounts.create_content"])
    with TestClient(app) as client:
        created = client.post(
            "/v1/topic-discovery-rules",
            headers=headers,
            json={"name": "员工故事雷达", "query": "员工故事", "schedule": "daily"},
        )
        assert created.status_code == 201
        run = client.post(
            f"/v1/topic-discovery-rules/{created.json()['id']}/run",
            headers=headers,
        )
        assert run.status_code == 200
        assert run.json()["status"] == "completed"
        assert run.json()["providers"] == ["rss"]


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


def test_agent_skill_route_and_high_risk_approval(monkeypatch) -> None:
    async def fake_discovery(_url: str) -> list[DiscoveredSkill]:
        return [
            DiscoveredSkill(
                owner="eccp-test",
                repository="publisher-skills",
                git_ref="main",
                repository_url="https://github.com/eccp-test/publisher-skills",
                skill_path="skills/wechat-publisher-test",
                name="wechat-publisher-test",
                description="发布微信公众号内容。",
                version="1.0.0",
                homepage="https://github.com/eccp-test/publisher-skills",
                author="ECCP Test",
                category="内容发布",
                commit_sha="def456",
                checksum="1" * 64,
                capabilities=["微信公众号发布"],
                required_env=[],
                required_bins=[],
                suggested_businesses=["wechat"],
                risk_level="high",
                risk_findings=[{"code": "external_publish", "title": "外部发布", "detail": "需要人工审批。", "severity": "high"}],
                deprecated_by="",
                manifest={"name": "wechat-publisher-test", "version": "1.0.0"},
            )
        ]

    monkeypatch.setattr(skills_router, "discover_github_skills", fake_discovery)
    headers = auth_headers(["accounts.manage_platform", "accounts.use_ai_assistant", "accounts.create_content"])
    with TestClient(app) as client:
        discovered = client.post(
            "/v1/skills/discover",
            headers=headers,
            json={"url": "https://github.com/eccp-test/publisher-skills/tree/main/skills/wechat-publisher-test"},
        )
        assert discovered.status_code == 200
        skill_id = discovered.json()["items"][0]["id"]
        installed = client.post(
            f"/v1/skills/{skill_id}/install",
            headers=headers,
            json={
                "accept_risk": True,
                "bindings": [{"business_key": "wechat", "business_name": "微信公众号", "enabled": True, "config": {}}],
            },
        )
        assert installed.status_code == 200

        agents = client.get("/v1/agents", headers=headers)
        assert agents.status_code == 200
        multichannel = next(item for item in agents.json()["items"] if item["slug"] == "multi-channel")
        bound = client.put(
            f"/v1/agents/{multichannel['id']}/skills",
            headers=headers,
            json={"bindings": [{"skill_id": skill_id, "enabled": True, "required": False}]},
        )
        assert bound.status_code == 200
        assert bound.json()["skill_bindings"][0]["name"] == "wechat-publisher-test"

        created = client.post(
            "/v1/agent-runs",
            headers=headers,
            json={"input_text": "把这篇员工故事发布到微信公众号", "source": "assistant"},
        )
        assert created.status_code == 201
        assert created.json()["agent_name"] == "多渠道适配 Agent"
        assert created.json()["approval"]["status"] == "pending"
        run_id = created.json()["id"]

        completed = client.post(
            f"/v1/agent-runs/{run_id}/complete",
            headers=headers,
            json={"success": True, "output_text": "已生成公众号发布稿，尚未发布。"},
        )
        assert completed.status_code == 200
        assert completed.json()["status"] == "awaiting_approval"

        approved = client.post(
            f"/v1/approvals/{completed.json()['approval']['id']}/decision",
            headers=headers,
            json={"decision": "approved", "note": "内容审核通过"},
        )
        assert approved.status_code == 200
        assert approved.json()["status"] == "ready_for_execution"
        assert any(step["status"] == "pending" for step in approved.json()["steps"] if step["step_type"] == "skill")


def test_member_can_open_configure_and_use_agent_studio() -> None:
    headers = auth_headers(["accounts.use_ai_assistant"])
    with TestClient(app) as client:
        agents = client.get("/v1/agents", headers=headers)
        assert agents.status_code == 200
        selected = agents.json()["items"][0]

        updated = client.post(
            f"/v1/agents/{selected['id']}/versions",
            headers=headers,
            json={
                "system_prompt": f"{selected['current_prompt']}\n测试成员可在 Agent 工作室创建新版本。",
                "change_note": "成员配置权限测试",
                "config": {},
            },
        )
        assert updated.status_code == 200
        assert updated.json()["current_version"] == selected["current_version"] + 1

        run = client.post(
            "/v1/agent-runs",
            headers=headers,
            json={
                "agent_id": selected["id"],
                "input_text": "测试当前 Agent 是否可以正常承接任务",
                "source": "test",
            },
        )
        assert run.status_code == 201
        assert run.json()["agent_id"] == selected["id"]


def test_member_can_create_update_and_archive_agent_workflow() -> None:
    headers = auth_headers(["accounts.use_ai_assistant"])
    with TestClient(app) as client:
        agents = client.get("/v1/agents", headers=headers).json()["items"]
        agent_ids = [agents[0]["id"], agents[1]["id"]]

        created = client.post(
            "/v1/agent-workflows",
            headers=headers,
            json={
                "name": "测试协作方案",
                "description": "用于验证多 Agent 方案持久化。",
                "collaboration_mode": "peer_handoff",
                "agent_ids": agent_ids,
                "finalizer_enabled": True,
            },
        )
        assert created.status_code == 201
        workflow_id = created.json()["id"]
        assert [agent["id"] for agent in created.json()["agents"]] == agent_ids

        listed = client.get("/v1/agent-workflows", headers=headers)
        assert listed.status_code == 200
        assert any(item["id"] == workflow_id for item in listed.json()["items"])

        updated = client.patch(
            f"/v1/agent-workflows/{workflow_id}",
            headers=headers,
            json={"collaboration_mode": "planner_executor", "name": "测试计划执行方案"},
        )
        assert updated.status_code == 200
        assert updated.json()["collaboration_mode"] == "planner_executor"

        archived = client.delete(f"/v1/agent-workflows/{workflow_id}", headers=headers)
        assert archived.status_code == 204
        missing = client.get(f"/v1/agent-workflows/{workflow_id}", headers=headers)
        assert missing.status_code == 404


def test_model_provider_requires_superuser_and_never_returns_plaintext(monkeypatch) -> None:
    async def fake_call_provider(**kwargs):
        assert kwargs["api_key"] == "unit-test-model-credential-1234"
        return {
            "model": kwargs["model"],
            "choices": [{"message": {"content": "OK"}}],
            "usage": {"total_tokens": 2},
        }, 36

    monkeypatch.setattr(model_providers_router, "_call_provider", fake_call_provider)
    manager_headers = auth_headers(["accounts.manage_platform"])
    admin_headers = auth_headers(["accounts.manage_platform", "accounts.use_ai_assistant"], is_superuser=True)
    with TestClient(app) as client:
        forbidden = client.get("/v1/model-providers", headers=manager_headers)
        assert forbidden.status_code == 403

        created = client.post(
            "/v1/model-providers",
            headers=admin_headers,
            json={
                "name": "测试 Kudex",
                "provider_key": "kudex-test",
                "base_url": "https://example.com/v1/chat/completions",
                "default_model": "gpt-5.4",
                "api_key": "unit-test-model-credential-1234",
            },
        )
        assert created.status_code == 201
        provider = created.json()
        provider_id = provider["id"]
        assert "unit-test-model-credential-1234" not in json.dumps(provider)
        assert provider["api_key_masked"].endswith("1234")
        assert provider["status"] == "untested"

        blocked = client.post(
            f"/v1/model-providers/{provider_id}/activate",
            headers=admin_headers,
            json={"apply_model_to_agents": True},
        )
        assert blocked.status_code == 409

        tested = client.post(f"/v1/model-providers/{provider_id}/test", headers=admin_headers)
        assert tested.status_code == 200
        assert tested.json()["latency_ms"] == 36

        activated = client.post(
            f"/v1/model-providers/{provider_id}/activate",
            headers=admin_headers,
            json={"apply_model_to_agents": True},
        )
        assert activated.status_code == 200
        assert activated.json()["is_default"] is True

        chat = client.post(
            "/v1/model-runtime/chat",
            headers=admin_headers,
            json={"messages": [{"role": "user", "content": "测试模型"}]},
        )
        assert chat.status_code == 200
        assert chat.json()["content"] == "OK"
        assert chat.json()["provider"] == "测试 Kudex"

        listed = client.get("/v1/model-providers", headers=admin_headers)
        assert listed.status_code == 200
        serialized = json.dumps(listed.json(), ensure_ascii=False)
        assert "unit-test-model-credential-1234" not in serialized
