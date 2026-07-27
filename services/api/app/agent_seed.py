from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import Agent, AgentSkillBinding, AgentVersion, SkillInstallation, SkillPackage


DEFAULT_AGENTS = [
    {
        "slug": "employee-story",
        "name": "员工故事创作 Agent",
        "description": "根据员工素材和企业知识生成可追溯的故事稿件。",
        "category": "content",
        "keywords": ["员工故事", "采访", "人物", "故事", "成长"],
        "businesses": ["story", "general"],
        "prompt": "你是企业文化员工故事创作 Agent。只使用用户提供或知识库检索到的事实，信息不足时明确列出待补充项。文字真诚、克制、有具体场景，并保留事实来源与人工确认环节。",
    },
    {
        "slug": "material-screening",
        "name": "素材初筛 Agent",
        "description": "判断报送素材的真实性、完整性、传播价值和时效性。",
        "category": "review",
        "keywords": ["素材", "上报", "初筛", "质量", "标签"],
        "businesses": ["material"],
        "prompt": "你是企业文化素材初筛 Agent。请从真实性、完整性、传播价值和时效性四个维度评分，清晰区分事实、推断与缺失信息，并给出下一步处理建议。",
    },
    {
        "slug": "content-review",
        "name": "内容审核 Agent",
        "description": "检查品牌表达、敏感信息、法规和事实引用风险。",
        "category": "review",
        "keywords": ["审核", "合规", "敏感词", "校对", "风险"],
        "businesses": ["review"],
        "prompt": "你是内容审核 Agent。逐项检查品牌表达、敏感信息、法规风险和事实引用，按风险等级输出原文位置、问题和可直接采用的修改建议。不要自动发布。",
    },
    {
        "slug": "topic-planning",
        "name": "选题推荐 Agent",
        "description": "结合外部趋势、内部素材和传播节点推荐选题。",
        "category": "analysis",
        "keywords": ["选题", "热点", "趋势", "推荐", "策划"],
        "businesses": ["topic"],
        "prompt": "你是企业文化选题策划 Agent。综合用户提供的外部线索、内部素材和传播节点，给出带来源、适用受众、切入角度、风险和下一步动作的选题建议；无法验证的热点不得当作事实。",
    },
    {
        "slug": "performance-review",
        "name": "复盘分析 Agent",
        "description": "分析发布效果并生成可执行的复盘建议。",
        "category": "analysis",
        "keywords": ["复盘", "数据", "效果", "指标", "分析"],
        "businesses": ["analytics"],
        "status": "inactive",
        "prompt": "你是内容运营复盘 Agent。区分数据事实与归因假设，说明指标口径，输出表现、可能驱动因素、验证方式和下一周期行动。",
    },
    {
        "slug": "multi-channel",
        "name": "多渠道适配 Agent",
        "description": "将内容适配为公众号、小红书、视频和官网版本。",
        "category": "automation",
        "keywords": ["公众号", "微信", "小红书", "视频号", "渠道", "发布", "推送", "图卡"],
        "businesses": ["wechat", "xiaohongshu", "video", "website"],
        "prompt": "你是多渠道内容适配 Agent。保留核心事实，按目标渠道调整结构、篇幅、标题、配图和互动方式。调用发布类高风险 Skill 前必须停在人工审批，不得宣称已发布。",
    },
]


async def seed_default_agents(session: AsyncSession) -> None:
    existing = {agent.slug: agent for agent in (await session.scalars(select(Agent))).all()}
    for definition in DEFAULT_AGENTS:
        if definition["slug"] in existing:
            continue
        agent = Agent(
            slug=definition["slug"],
            name=definition["name"],
            description=definition["description"],
            category=definition["category"],
            status=definition.get("status", "active"),
            model_id="gpt-5.6-terra",
            routing_keywords=definition["keywords"],
            business_keys=definition["businesses"],
            created_by_employee_id="system",
            created_by_name="ECCP 系统",
        )
        session.add(agent)
        await session.flush()
        session.add(
            AgentVersion(
                agent_id=agent.id,
                version=1,
                system_prompt=definition["prompt"],
                config={"temperature": 0.4},
                change_note="系统初始版本",
                created_by_employee_id="system",
                created_by_name="ECCP 系统",
            )
        )
    await session.flush()

    multichannel = await session.scalar(
        select(Agent).where(Agent.slug == "multi-channel").options(selectinload(Agent.skill_bindings))
    )
    if multichannel:
        installed_skills = (
            await session.scalars(
                select(SkillPackage)
                .join(SkillInstallation)
                .where(SkillInstallation.status == "active", SkillInstallation.enabled.is_(True))
                .options(selectinload(SkillPackage.installation).selectinload(SkillInstallation.release))
            )
        ).all()
        existing_skill_ids = {binding.skill_id for binding in multichannel.skill_bindings}
        for skill in installed_skills:
            if skill.slug not in {"baoyu-xhs-images", "baoyu-post-to-wechat"} or skill.id in existing_skill_ids:
                continue
            session.add(
                AgentSkillBinding(
                    agent_id=multichannel.id,
                    skill_id=skill.id,
                    enabled=True,
                    required=False,
                    regression_status="passed",
                    bound_version=skill.installation.release.version if skill.installation else skill.latest_version,
                )
            )
    await session.commit()
