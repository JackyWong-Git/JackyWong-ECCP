import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import TopicDiscoveryRule, TopicDiscoveryRun
from ..security import InternalUser, get_internal_user, require_permission
from ..topic_discovery import execute_rule, next_run_at
from ..workflow_schemas import (
    TopicDiscoveryRuleCreate,
    TopicDiscoveryRuleItem,
    TopicDiscoveryRuleUpdate,
    TopicDiscoveryRunItem,
)


router = APIRouter(prefix="/v1/topic-discovery-rules", tags=["topic-discovery"])
Session = Annotated[AsyncSession, Depends(get_session)]
User = Annotated[InternalUser, Depends(get_internal_user)]


async def _rule_or_404(session: AsyncSession, rule_id: uuid.UUID) -> TopicDiscoveryRule:
    rule = await session.get(TopicDiscoveryRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="自动发现规则不存在")
    return rule


@router.get("", response_model=list[TopicDiscoveryRuleItem])
async def list_rules(session: Session, user: User) -> list[TopicDiscoveryRuleItem]:
    require_permission(user, "accounts.view_topics")
    rules = (await session.scalars(select(TopicDiscoveryRule).order_by(TopicDiscoveryRule.created_at.desc()))).all()
    return [TopicDiscoveryRuleItem.model_validate(rule) for rule in rules]


@router.post("", response_model=TopicDiscoveryRuleItem, status_code=status.HTTP_201_CREATED)
async def create_rule(payload: TopicDiscoveryRuleCreate, session: Session, user: User) -> TopicDiscoveryRuleItem:
    require_permission(user, "accounts.create_content")
    rule = TopicDiscoveryRule(
        **payload.model_dump(),
        next_run_at=next_run_at(payload.schedule),
        created_by_employee_id=user.employeeId,
        created_by_name=user.displayName,
    )
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return TopicDiscoveryRuleItem.model_validate(rule)


@router.patch("/{rule_id}", response_model=TopicDiscoveryRuleItem)
async def update_rule(
    rule_id: uuid.UUID,
    payload: TopicDiscoveryRuleUpdate,
    session: Session,
    user: User,
) -> TopicDiscoveryRuleItem:
    require_permission(user, "accounts.create_content")
    rule = await _rule_or_404(session, rule_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)
    if "schedule" in payload.model_fields_set or ("enabled" in payload.model_fields_set and rule.enabled):
        rule.next_run_at = next_run_at(rule.schedule)
    await session.commit()
    await session.refresh(rule)
    return TopicDiscoveryRuleItem.model_validate(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.create_content")
    await session.delete(await _rule_or_404(session, rule_id))
    await session.commit()


@router.post("/{rule_id}/run", response_model=TopicDiscoveryRunItem)
async def run_rule(rule_id: uuid.UUID, session: Session, user: User) -> TopicDiscoveryRunItem:
    require_permission(user, "accounts.create_content")
    return TopicDiscoveryRunItem.model_validate(await execute_rule(session, await _rule_or_404(session, rule_id)))


@router.get("/{rule_id}/runs", response_model=list[TopicDiscoveryRunItem])
async def list_runs(rule_id: uuid.UUID, session: Session, user: User) -> list[TopicDiscoveryRunItem]:
    require_permission(user, "accounts.view_topics")
    await _rule_or_404(session, rule_id)
    runs = (
        await session.scalars(
            select(TopicDiscoveryRun)
            .where(TopicDiscoveryRun.rule_id == rule_id)
            .order_by(TopicDiscoveryRun.started_at.desc())
            .limit(20)
        )
    ).all()
    return [TopicDiscoveryRunItem.model_validate(run) for run in runs]


async def run_due_rules(session: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    rules = (
        await session.scalars(
            select(TopicDiscoveryRule)
            .where(
                TopicDiscoveryRule.enabled.is_(True),
                TopicDiscoveryRule.next_run_at.is_not(None),
                TopicDiscoveryRule.next_run_at <= now,
            )
            .order_by(TopicDiscoveryRule.next_run_at)
            .limit(10)
        )
    ).all()
    for rule in rules:
        await execute_rule(session, rule)
    return len(rules)
