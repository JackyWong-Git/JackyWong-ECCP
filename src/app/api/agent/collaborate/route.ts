import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/access-control';
import {
  createDeepSeekChatCompletion,
  DeepSeekConfigurationError,
  DeepSeekRequestError,
} from '@/lib/deepseek';
import { createFastApiHeaders, fastApiUrl } from '@/lib/fastapi-proxy';
import { getAuthentication, type AuthenticatedUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

type CollaborationMode =
  | 'single_agent_chat'
  | 'router_specialists'
  | 'planner_executor'
  | 'supervisor_dynamic'
  | 'peer_handoff';

interface AgentSummary {
  id: string;
  name: string;
  model_id: string;
  current_prompt: string;
  routing_keywords: string[];
  business_keys: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  collaboration_mode: CollaborationMode;
  agent_ids: string[];
  finalizer_enabled: boolean;
  status: string;
}

interface RunStep {
  id: string;
  ordinal: number;
  step_type: string;
  name: string;
  status: string;
  output_summary: string;
  metadata: Record<string, unknown>;
}

interface AgentRun {
  id: string;
  agent_id: string;
  agent_name: string;
  system_prompt: string;
  model_id: string;
  route_reason: string;
  status: string;
  output_text: string;
  steps: RunStep[];
  approval: { id: string; status: string; reason: string } | null;
}

interface TraceEvent {
  id: string;
  phase: 'dispatch' | 'agent' | 'rag' | 'skill' | 'model' | 'approval' | 'final';
  title: string;
  detail: string;
  status: string;
  agent_name?: string;
  run_id?: string;
}

async function fastApi<T>(
  user: AuthenticatedUser,
  path: string[],
  init?: { method?: string; body?: object },
): Promise<T> {
  const response = await fetch(fastApiUrl(path), {
    method: init?.method || 'GET',
    headers: createFastApiHeaders(user, init?.body ? 'application/json' : null),
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  const data = await response.json() as T & { detail?: string };
  if (!response.ok) throw new Error(data.detail || '协作运行服务请求失败');
  return data;
}

function selectSpecialist(agents: AgentSummary[], input: string) {
  const normalized = input.toLocaleLowerCase();
  return agents
    .map(agent => ({
      agent,
      score: [...agent.routing_keywords, ...agent.business_keys]
        .reduce((score, keyword) => score + (keyword && normalized.includes(keyword.toLocaleLowerCase()) ? 1 : 0), 0),
    }))
    .sort((left, right) => right.score - left.score)[0]?.agent || agents[0];
}

function traceFromRun(run: AgentRun): TraceEvent[] {
  return run.steps.map(step => ({
    id: step.id,
    phase: step.step_type === 'route'
      ? 'dispatch'
      : step.step_type === 'rag'
        ? 'rag'
        : step.step_type === 'skill'
          ? 'skill'
          : step.step_type === 'model'
            ? 'model'
            : 'agent',
    title: step.name,
    detail: step.output_summary || run.route_reason,
    status: step.status,
    agent_name: run.agent_name,
    run_id: run.id,
  }));
}

async function executeAgent(input: {
  user: AuthenticatedUser;
  agent: AgentSummary;
  task: string;
  instruction: string;
  conversationId: string;
}) {
  let run = await fastApi<AgentRun>(input.user, ['v1', 'agent-runs'], {
    method: 'POST',
    body: {
      input_text: input.task,
      source: 'studio',
      agent_id: input.agent.id,
      conversation_id: input.conversationId,
      knowledge_enabled: true,
    },
  });

  try {
    const references = run.steps.flatMap(step => {
      const value = step.metadata.references;
      return Array.isArray(value) ? value : [];
    });
    const ragContext = references.length
      ? `\n\n本次检索资料：\n${references.map((reference, index) => {
          const item = reference as { document?: string; content?: string };
          return `[资料 ${index + 1}] ${item.document || '知识库'}：${item.content || ''}`;
        }).join('\n')}`
      : '';
    const result = await createDeepSeekChatCompletion({
      user: input.user,
      messages: [
        {
          role: 'system',
          content: `${run.system_prompt}\n\n你正在参与 ECCP 多 Agent 协作。${input.instruction}${ragContext}`,
        },
        { role: 'user', content: input.task },
      ],
    });
    run = await fastApi<AgentRun>(input.user, ['v1', 'agent-runs', run.id, 'complete'], {
      method: 'POST',
      body: { success: true, output_text: result.content },
    });
    return run;
  } catch (error) {
    await fastApi<AgentRun>(input.user, ['v1', 'agent-runs', run.id, 'complete'], {
      method: 'POST',
      body: {
        success: false,
        error_message: error instanceof Error ? error.message : '模型调用失败',
      },
    });
    throw error;
  }
}

function contextTask(original: string, outputs: AgentRun[]) {
  if (!outputs.length) return original;
  return `${original}\n\n以下是前序 Agent 的工作结果，请在此基础上继续，不要虚构未提供的事实：\n${outputs
    .map(run => `【${run.agent_name}】\n${run.output_text}`)
    .join('\n\n')}`;
}

export async function POST(request: Request) {
  try {
    const authentication = await getAuthentication(request);
    if (authentication.status === 'unavailable') {
      return NextResponse.json({ error: '认证服务暂时不可用。' }, { status: 503 });
    }
    if (authentication.status !== 'authenticated') {
      return NextResponse.json({ error: '登录状态已失效，请重新登录。' }, { status: 401 });
    }
    if (!hasPermission(authentication.user.permissions, 'accounts.use_ai_assistant')) {
      return NextResponse.json({ error: '当前账号没有运行 Agent 协作的权限。' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const workflowId = typeof body.workflow_id === 'string' ? body.workflow_id : '';
    const inputText = typeof body.input_text === 'string' ? body.input_text.trim().slice(0, 50_000) : '';
    if (!workflowId || !inputText) {
      return NextResponse.json({ error: '请选择协作方案并输入创作任务。' }, { status: 400 });
    }

    const user = authentication.user;
    const [workflow, agentList] = await Promise.all([
      fastApi<Workflow>(user, ['v1', 'agent-workflows', workflowId]),
      fastApi<{ items: AgentSummary[] }>(user, ['v1', 'agents']),
    ]);
    if (workflow.status !== 'active') {
      return NextResponse.json({ error: '当前协作方案未启用。' }, { status: 409 });
    }
    const agentsById = new Map(agentList.items.map(agent => [agent.id, agent]));
    const agents = workflow.agent_ids.flatMap(id => agentsById.get(id) || []);
    if (!agents.length) {
      return NextResponse.json({ error: '协作方案没有可用 Agent。' }, { status: 409 });
    }

    const collaborationId = randomUUID();
    const runs: AgentRun[] = [];
    const trace: TraceEvent[] = [{
      id: `dispatch-${collaborationId}`,
      phase: 'dispatch',
      title: '协作方案已启动',
      detail: `${workflow.name} · ${workflow.collaboration_mode} · ${agents.length} 个 Agent`,
      status: 'completed',
    }];
    const runAgent = async (agent: AgentSummary, task: string, instruction: string) => {
      const run = await executeAgent({ user, agent, task, instruction, conversationId: collaborationId });
      runs.push(run);
      trace.push(...traceFromRun(run));
      if (run.approval) {
        trace.push({
          id: `approval-${run.approval.id}`,
          phase: 'approval',
          title: '等待人工审批',
          detail: run.approval.reason,
          status: run.approval.status,
          agent_name: run.agent_name,
          run_id: run.id,
        });
      }
      return run;
    };

    if (workflow.collaboration_mode === 'single_agent_chat') {
      await runAgent(agents[0], inputText, '你是本方案唯一执行者，请直接完成任务并给出可交付成果。');
    } else if (workflow.collaboration_mode === 'router_specialists') {
      const specialist = selectSpecialist(agents, inputText);
      trace.push({
        id: `route-${collaborationId}`,
        phase: 'dispatch',
        title: '路由器选择专家',
        detail: `根据任务关键词交由 ${specialist.name} 承接`,
        status: 'completed',
        agent_name: specialist.name,
      });
      await runAgent(specialist, inputText, '你被路由器选为最匹配的专家，请完整承接并输出结果。');
    } else if (workflow.collaboration_mode === 'planner_executor') {
      for (const [index, agent] of agents.entries()) {
        const isFirst = index === 0;
        const isLast = index === agents.length - 1;
        const instruction = isFirst
          ? '你是规划者，请先拆解目标、事实边界、步骤和交付标准。'
          : isLast
            ? '你是最终审核与交付者，请整合前序结果、修正风险并输出最终成果。'
            : '你是执行者，请根据前序计划完成你擅长的部分，并明确交接信息。';
        await runAgent(agent, contextTask(inputText, runs), instruction);
      }
    } else if (workflow.collaboration_mode === 'supervisor_dynamic') {
      const [supervisor, ...workers] = agents;
      const plan = await runAgent(
        supervisor,
        inputText,
        '你是监督者，请制定执行计划，明确每类专家的任务和验收标准。',
      );
      for (const worker of workers) {
        await runAgent(
          worker,
          `${inputText}\n\n【监督者计划】\n${plan.output_text}`,
          '你是被监督者分派的专家，请完成与你职责匹配的部分。',
        );
      }
      if (workflow.finalizer_enabled && workers.length) {
        await runAgent(
          supervisor,
          contextTask(inputText, runs),
          '你是最终监督者，请核对所有专家输出并合成为单一可交付成果。',
        );
      }
    } else {
      for (const [index, agent] of agents.entries()) {
        await runAgent(
          agent,
          contextTask(inputText, runs),
          index === 0
            ? '你是同伴协作的发起者，请完成第一版并说明下一位应继续处理什么。'
            : '你接到上一位同伴的交接，请补充、纠错并继续向可交付成果推进。',
        );
      }
    }

    const finalRun = runs.at(-1);
    trace.push({
      id: `final-${collaborationId}`,
      phase: 'final',
      title: finalRun?.approval ? '成果生成，等待审批' : '协作运行完成',
      detail: finalRun ? `最终成果由 ${finalRun.agent_name} 输出` : '没有生成成果',
      status: finalRun?.approval ? 'awaiting_approval' : 'completed',
      agent_name: finalRun?.agent_name,
      run_id: finalRun?.id,
    });
    return NextResponse.json({
      collaboration_id: collaborationId,
      workflow,
      status: finalRun?.approval ? 'awaiting_approval' : 'completed',
      content: finalRun?.output_text || '',
      runs,
      trace,
    });
  } catch (error) {
    if (error instanceof DeepSeekConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof DeepSeekRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status === 429 ? 429 : 502 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '多 Agent 协作运行失败。' },
      { status: 502 },
    );
  }
}
