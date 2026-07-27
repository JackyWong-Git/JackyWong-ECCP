'use client';

import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Copy,
  Database,
  GitBranch,
  Layers3,
  LoaderCircle,
  Network,
  Orbit,
  PencilLine,
  Play,
  Plus,
  RefreshCw,
  Route,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { type ComponentType, useEffect, useState } from 'react';
import { type ViewType } from '@/lib/access-control';
import { AgentManagement } from './agent-management';
import { showToast } from './toast';

type StudioTab = 'overview' | 'agents' | 'orchestration' | 'run';
type CollaborationMode =
  | 'single_agent_chat'
  | 'router_specialists'
  | 'planner_executor'
  | 'supervisor_dynamic'
  | 'peer_handoff';

interface AgentItem {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  model_id: string;
  run_count: number;
  success_rate: number;
  skill_bindings: Array<{ skill_id: string; name: string; enabled: boolean }>;
  knowledge_bindings: Array<{ knowledge_base_id: string; name: string; enabled: boolean }>;
}

interface WorkflowAgent {
  id: string;
  name: string;
  category: string;
  status: string;
  skill_count: number;
  knowledge_count: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  collaboration_mode: CollaborationMode;
  agent_ids: string[];
  agents: WorkflowAgent[];
  finalizer_enabled: boolean;
  status: string;
  updated_at: string;
}

interface AgentRun {
  id: string;
  agent_name: string;
  status: string;
  business_key: string;
  output_text: string;
  created_at: string;
  steps: Array<{ id: string; name: string; status: string; step_type: string; output_summary: string }>;
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

interface CollaborationResult {
  collaboration_id: string;
  status: string;
  content: string;
  runs: AgentRun[];
  trace: TraceEvent[];
}

interface WorkflowDraft {
  id?: string;
  name: string;
  description: string;
  collaboration_mode: CollaborationMode;
  agent_ids: string[];
  finalizer_enabled: boolean;
}

interface CreationOrchestrationStudioProps {
  onNavigate: (view: ViewType) => void;
  initialTab?: StudioTab;
}

const tabDefinitions: Array<{ id: StudioTab; label: string; description: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: '总览', description: '能力与运行状态', icon: Layers3 },
  { id: 'agents', label: 'Agent 配置', description: '角色、Skill 与 RAG', icon: Bot },
  { id: 'orchestration', label: '协作编排', description: '模式与执行顺序', icon: GitBranch },
  { id: 'run', label: '创作运行', description: '任务、流程与 Trace', icon: Play },
];

const modeDefinitions: Record<CollaborationMode, {
  label: string;
  short: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}> = {
  single_agent_chat: {
    label: '单 Agent',
    short: '直接执行',
    description: '由一个明确角色完整承接任务，适合边界清晰的单项创作。',
    icon: Bot,
    tone: 'bg-[#EEF2FF] text-[#5267E8]',
  },
  router_specialists: {
    label: '智能路由',
    short: '按任务选专家',
    description: '根据关键词和业务场景自动选择最匹配的专家 Agent。',
    icon: Route,
    tone: 'bg-[#EAF8FA] text-[#168EA7]',
  },
  planner_executor: {
    label: '计划执行',
    short: '规划后逐步交付',
    description: '先拆解目标，再按顺序执行、审核并产出最终成果。',
    icon: ClipboardCheck,
    tone: 'bg-[#F2EEFF] text-[#7657DA]',
  },
  supervisor_dynamic: {
    label: '动态监督',
    short: '监督者调度团队',
    description: '监督 Agent 制定计划、分派专家，并在最后统一验收。',
    icon: Orbit,
    tone: 'bg-[#EAF7F1] text-[#21865D]',
  },
  peer_handoff: {
    label: '同伴交接',
    short: '角色依次接力',
    description: '多个专家共享上下文并逐步补充、纠错和交接。',
    icon: UsersRound,
    tone: 'bg-[#FFF4E8] text-[#B36F27]',
  },
};

const categoryTone: Record<string, string> = {
  content: 'bg-[#F1EEFF] text-[#7357E6]',
  review: 'bg-[#EAF7F1] text-[#21865D]',
  analysis: 'bg-[#E9F7FA] text-[#1994B1]',
  automation: 'bg-[#FFF4E6] text-[#B36F27]',
};

const traceTone: Record<TraceEvent['phase'], { icon: ComponentType<{ className?: string }>; tone: string }> = {
  dispatch: { icon: Route, tone: 'bg-[#EEF2FF] text-[#5267E8]' },
  agent: { icon: Bot, tone: 'bg-[#F2EEFF] text-[#7357E6]' },
  rag: { icon: Database, tone: 'bg-[#EAF8FA] text-[#168EA7]' },
  skill: { icon: Zap, tone: 'bg-[#FFF4E8] text-[#B36F27]' },
  model: { icon: Sparkles, tone: 'bg-[#F0F2FF] text-[#5267E8]' },
  approval: { icon: ShieldCheck, tone: 'bg-[#FFF0ED] text-[#C65345]' },
  final: { icon: CheckCircle2, tone: 'bg-[#EAF7F1] text-[#21865D]' },
};

const emptyDraft: WorkflowDraft = {
  name: '',
  description: '',
  collaboration_mode: 'router_specialists',
  agent_ids: [],
  finalizer_enabled: true,
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const data = await response.json() as T & { error?: string; detail?: string };
  if (!response.ok) throw new Error(data.error || data.detail || '请求失败');
  return data;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function CreationOrchestrationStudio({ onNavigate, initialTab = 'overview' }: CreationOrchestrationStudioProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recentRuns, setRecentRuns] = useState<AgentRun[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [draft, setDraft] = useState<WorkflowDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runInput, setRunInput] = useState('围绕“22 周年员工故事”策划一篇微信公众号文章，并给出小红书图卡改编建议。');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CollaborationResult | null>(null);
  const selectedWorkflow = workflows.find(workflow => workflow.id === selectedWorkflowId) || workflows[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentData, workflowData, runData] = await Promise.all([
        api<{ items: AgentItem[] }>('/api/backend/v1/agents'),
        api<{ items: Workflow[] }>('/api/backend/v1/agent-workflows'),
        api<{ items: AgentRun[] }>('/api/backend/v1/agent-runs?limit=12'),
      ]);
      setAgents(agentData.items);
      setWorkflows(workflowData.items);
      setRecentRuns(runData.items);
      const nextWorkflow = workflowData.items.find(item => item.id === selectedWorkflowId) || workflowData.items[0];
      if (nextWorkflow) {
        setSelectedWorkflowId(nextWorkflow.id);
        if (initialTab === 'orchestration') {
          setDraft({
            id: nextWorkflow.id,
            name: nextWorkflow.name,
            description: nextWorkflow.description,
            collaboration_mode: nextWorkflow.collaboration_mode,
            agent_ids: nextWorkflow.agent_ids,
            finalizer_enabled: nextWorkflow.finalizer_enabled,
          });
        }
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创作编排室加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const editWorkflow = (workflow: Workflow) => {
    setSelectedWorkflowId(workflow.id);
    setDraft({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      collaboration_mode: workflow.collaboration_mode,
      agent_ids: workflow.agent_ids,
      finalizer_enabled: workflow.finalizer_enabled,
    });
  };

  const createWorkflow = () => {
    setDraft({ ...emptyDraft, agent_ids: agents.filter(agent => agent.status !== 'inactive').slice(0, 3).map(agent => agent.id) });
  };

  const openTab = (tab: StudioTab) => {
    if (tab === 'orchestration' && !draft.id && selectedWorkflow) editWorkflow(selectedWorkflow);
    setActiveTab(tab);
  };

  const saveWorkflow = async () => {
    if (draft.name.trim().length < 2 || !draft.agent_ids.length) {
      showToast('请填写方案名称并至少选择一个 Agent', 'info');
      return;
    }
    setSaving(true);
    try {
      const url = draft.id ? `/api/backend/v1/agent-workflows/${draft.id}` : '/api/backend/v1/agent-workflows';
      const saved = await api<Workflow>(url, {
        method: draft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          description: draft.description.trim(),
          collaboration_mode: draft.collaboration_mode,
          agent_ids: draft.agent_ids,
          finalizer_enabled: draft.finalizer_enabled,
        }),
      });
      setWorkflows(current => draft.id
        ? current.map(item => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      setSelectedWorkflowId(saved.id);
      setDraft({ ...draft, id: saved.id });
      showToast('协作方案已保存', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '方案保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDraftAgent = (agentId: string) => {
    setDraft(current => ({
      ...current,
      agent_ids: current.agent_ids.includes(agentId)
        ? current.agent_ids.filter(id => id !== agentId)
        : [...current.agent_ids, agentId].slice(0, 6),
    }));
  };

  const moveDraftAgent = (index: number, direction: -1 | 1) => {
    setDraft(current => {
      const next = [...current.agent_ids];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, agent_ids: next };
    });
  };

  const runWorkflow = async () => {
    if (!selectedWorkflow || !runInput.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const collaboration = await api<CollaborationResult>('/api/agent/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: selectedWorkflow.id, input_text: runInput }),
      });
      setResult(collaboration);
      showToast(
        collaboration.status === 'awaiting_approval' ? '成果已生成，等待人工审批' : '多 Agent 协作已完成',
        collaboration.status === 'awaiting_approval' ? 'info' : 'success',
      );
      void loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '协作运行失败', 'error');
    } finally {
      setRunning(false);
    }
  };

  const openRun = (workflow: Workflow) => {
    setSelectedWorkflowId(workflow.id);
    setResult(null);
    setActiveTab('run');
  };

  const activeAgents = agents.filter(agent => agent.status !== 'inactive');
  const installedSkillCount = new Set(agents.flatMap(agent => agent.skill_bindings.filter(item => item.enabled).map(item => item.skill_id))).size;
  const knowledgeCount = new Set(agents.flatMap(agent => agent.knowledge_bindings.filter(item => item.enabled).map(item => item.knowledge_base_id))).size;
  const completedRuns = recentRuns.filter(run => run.status === 'completed').length;

  return (
    <div className="mx-auto min-h-full max-w-[1560px] space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[28px] border border-[#DDE5F2] bg-[linear-gradient(125deg,#FFFFFF_0%,#F3F6FF_52%,#EDF9FA_100%)] px-5 py-5 shadow-[0_16px_50px_rgba(47,69,97,0.07)] sm:px-7">
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-[#91A4FF]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-90px] left-[38%] h-48 w-48 rounded-full bg-[#58CBD5]/12 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-[#5267E8]">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#5267E8] text-white shadow-[0_8px_18px_rgba(82,103,232,0.25)]"><WandSparkles className="h-3.5 w-3.5" /></span>
              CREATION ORCHESTRATION
            </div>
            <h1 className="mt-3 text-[25px] font-semibold tracking-[-0.035em] text-[#1F303B] sm:text-[29px]">创作编排室</h1>
            <p className="mt-2 text-[11px] leading-5 text-[#71818D]">配置 Agent 与能力，编排多角色协作，在同一个视图中完成内容创作、运行追踪、人工审批与成果沉淀。</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void loadData()} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DCE4EA] bg-white/80 px-3 text-[10px] font-semibold text-[#60707D] transition-colors hover:bg-white"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />刷新</button>
            <button type="button" onClick={() => { setActiveTab('run'); setResult(null); }} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white shadow-[0_9px_20px_rgba(82,103,232,0.22)] transition-colors hover:bg-[#465BD8]"><Play className="h-3.5 w-3.5" />开始创作</button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/55 p-1.5 backdrop-blur-sm sm:grid-cols-4">
          {tabDefinitions.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => openTab(tab.id)} className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${active ? 'bg-white text-[#3449C2] shadow-[0_5px_16px_rgba(52,73,116,0.09)]' : 'text-[#73838F] hover:bg-white/65'}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#EDF0FF] text-[#5267E8]' : 'bg-[#F2F5F7] text-[#7D8C97]'}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block truncate text-[10px] font-semibold">{tab.label}</span><span className="mt-0.5 hidden truncate text-[8px] font-normal text-[#93A0A9] lg:block">{tab.description}</span></span>
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === 'overview' ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: '可用 Agent', value: activeAgents.length, suffix: `共 ${agents.length} 个`, icon: Bot, tone: 'bg-[#EEF2FF] text-[#5267E8]' },
              { label: '已接入 Skill', value: installedSkillCount, suffix: '真实能力契约', icon: Zap, tone: 'bg-[#FFF4E8] text-[#B36F27]' },
              { label: 'RAG 知识库', value: knowledgeCount, suffix: '可追溯检索', icon: Database, tone: 'bg-[#EAF8FA] text-[#168EA7]' },
              { label: '近期完成运行', value: completedRuns, suffix: `最近 ${recentRuns.length} 次`, icon: Activity, tone: 'bg-[#EAF7F1] text-[#21865D]' },
            ].map(metric => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-2xl border border-[#E1E8ED] bg-white p-4 shadow-[0_8px_24px_rgba(47,65,82,0.045)]">
                  <div className="flex items-start justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}><Icon className="h-4 w-4" /></span><span className="text-[8px] font-medium text-[#9AA7B0]">{metric.suffix}</span></div>
                  <strong className="mt-4 block text-[24px] font-semibold tracking-[-0.04em] text-[#263741]">{metric.value}</strong>
                  <span className="mt-1 block text-[10px] font-medium text-[#71818D]">{metric.label}</span>
                </div>
              );
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <div className="rounded-3xl border border-[#E1E8ED] bg-white p-5 shadow-[0_10px_34px_rgba(47,65,82,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-[15px] font-semibold text-[#263741]">可运行协作方案</h2><p className="mt-1 text-[9px] text-[#87959F]">方案保存 Agent 顺序、协作模式和最终合成规则。</p></div>
                <button type="button" onClick={() => { createWorkflow(); setActiveTab('orchestration'); }} className="flex h-8 items-center gap-1.5 rounded-xl border border-[#DCE4EA] px-3 text-[9px] font-semibold text-[#5267E8]"><Plus className="h-3.5 w-3.5" />新建方案</button>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {workflows.map(workflow => {
                  const mode = modeDefinitions[workflow.collaboration_mode];
                  const ModeIcon = mode.icon;
                  return (
                    <article key={workflow.id} className="group rounded-2xl border border-[#E4E9EE] bg-[#FBFCFD] p-4 transition-all hover:-translate-y-0.5 hover:border-[#CDD5F6] hover:bg-white hover:shadow-[0_12px_28px_rgba(67,83,126,0.08)]">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${mode.tone}`}><ModeIcon className="h-4 w-4" /></span>
                        <span className="rounded-full bg-[#EAF7F1] px-2 py-1 text-[7px] font-semibold text-[#21865D]">可运行</span>
                      </div>
                      <h3 className="mt-3 text-[12px] font-semibold text-[#34454F]">{workflow.name}</h3>
                      <p className="mt-1 line-clamp-2 min-h-8 text-[9px] leading-4 text-[#7E8D98]">{workflow.description || mode.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex -space-x-1.5">{workflow.agents.slice(0, 4).map((agent, index) => <span key={agent.id} title={agent.name} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[7px] font-semibold ${categoryTone[agent.category] || 'bg-[#EEF2F5] text-[#657682]'}`} style={{ zIndex: 5 - index }}>{agent.name.slice(0, 1)}</span>)}</div>
                        <span className="text-[8px] text-[#8B99A3]">{mode.label} · {workflow.agents.length} 个 Agent</span>
                      </div>
                      <div className="mt-4 flex gap-2 border-t border-[#E9EDF1] pt-3">
                        <button type="button" onClick={() => { editWorkflow(workflow); setActiveTab('orchestration'); }} className="flex h-8 flex-1 items-center justify-center gap-1 text-[8px] font-semibold text-[#71818D]"><PencilLine className="h-3 w-3" />编辑</button>
                        <button type="button" onClick={() => openRun(workflow)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-[#EEF1FF] text-[8px] font-semibold text-[#5267E8]">运行<ArrowRight className="h-3 w-3" /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E1E8ED] bg-white p-5 shadow-[0_10px_34px_rgba(47,65,82,0.05)]">
              <h2 className="text-[15px] font-semibold text-[#263741]">从配置到成果</h2>
              <p className="mt-1 text-[9px] text-[#87959F]">统一工作区内完成四个阶段。</p>
              <div className="mt-5 space-y-1">
                {[
                  { step: '01', title: '配置 Agent', detail: '绑定模型、Skill 与 RAG', icon: Bot },
                  { step: '02', title: '定义协作', detail: '选择模式与角色顺序', icon: GitBranch },
                  { step: '03', title: '运行创作', detail: '输入任务并观察实时 Trace', icon: Play },
                  { step: '04', title: '审核沉淀', detail: '高风险动作人工确认', icon: ShieldCheck },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="relative flex gap-3 rounded-2xl p-3 hover:bg-[#F7F9FC]">
                      {index < 3 ? <span className="absolute left-[27px] top-12 h-5 w-px bg-[#DFE6EC]" /> : null}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F0F2FF] text-[#5267E8]"><Icon className="h-3.5 w-3.5" /></span>
                      <span><span className="block text-[10px] font-semibold text-[#40515B]">{item.title}</span><span className="mt-1 block text-[8px] text-[#8A98A2]">{item.detail}</span></span>
                      <span className="ml-auto text-[9px] font-semibold text-[#C0C9D0]">{item.step}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onNavigate('skills')} className="rounded-xl border border-[#E2E8ED] bg-[#FAFBFC] p-3 text-left"><Zap className="h-4 w-4 text-[#B36F27]" /><span className="mt-2 block text-[9px] font-semibold text-[#52636E]">发现 Skills</span></button>
                <button type="button" onClick={() => onNavigate('knowledge')} className="rounded-xl border border-[#E2E8ED] bg-[#FAFBFC] p-3 text-left"><Database className="h-4 w-4 text-[#168EA7]" /><span className="mt-2 block text-[9px] font-semibold text-[#52636E]">配置知识库</span></button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'agents' ? (
        <AgentManagement embedded />
      ) : null}

      {activeTab === 'orchestration' ? (
        <section className="grid min-h-[680px] overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-[0_12px_40px_rgba(37,54,70,0.055)] lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-b border-[#E5EBEF] bg-[#F8FAFB] p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between"><div><h2 className="text-[12px] font-semibold text-[#34454F]">协作方案</h2><p className="mt-1 text-[8px] text-[#8C99A3]">{workflows.length} 个可用方案</p></div><button type="button" aria-label="新建协作方案" onClick={createWorkflow} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5267E8] text-white"><Plus className="h-3.5 w-3.5" /></button></div>
            <div className="mt-4 space-y-2">
              {workflows.map(workflow => {
                const active = draft.id === workflow.id;
                const mode = modeDefinitions[workflow.collaboration_mode];
                const Icon = mode.icon;
                return (
                  <button key={workflow.id} type="button" onClick={() => editWorkflow(workflow)} className={`w-full rounded-2xl p-3 text-left transition-all ${active ? 'bg-white shadow-[0_7px_22px_rgba(46,63,80,0.08)] ring-1 ring-[#D6DEFB]' : 'hover:bg-white/75'}`}>
                    <span className="flex items-start gap-2.5"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${mode.tone}`}><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="block truncate text-[10px] font-semibold text-[#40515B]">{workflow.name}</span><span className="mt-1 block text-[8px] text-[#8A98A2]">{mode.label} · {workflow.agents.length} Agents</span></span></span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-[9px] font-semibold tracking-[0.1em] text-[#5267E8]">{draft.id ? 'EDIT WORKFLOW' : 'NEW WORKFLOW'}</p><h2 className="mt-1 text-[18px] font-semibold text-[#253640]">{draft.id ? '编辑协作方案' : '创建协作方案'}</h2><p className="mt-1 text-[9px] text-[#82909A]">顺序决定计划执行与同伴交接的运行顺序，第一个 Agent 同时承担动态监督角色。</p></div>
              <button type="button" onClick={saveWorkflow} disabled={saving} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[9px] font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{saving ? '保存中' : '保存方案'}</button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <label><span className="mb-1.5 block text-[9px] font-semibold text-[#60707D]">方案名称</span><input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="例如：员工故事全流程" className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-[#FBFCFD] px-3 text-[10px] text-[#40515B] outline-none focus:border-[#AEBBF4] focus:bg-white" /></label>
              <label><span className="mb-1.5 block text-[9px] font-semibold text-[#60707D]">方案说明</span><input value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} placeholder="说明适用场景与最终交付物" className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-[#FBFCFD] px-3 text-[10px] text-[#40515B] outline-none focus:border-[#AEBBF4] focus:bg-white" /></label>
            </div>

            <div className="mt-6"><div className="flex items-end justify-between"><div><h3 className="text-[12px] font-semibold text-[#35454F]">选择协作模式</h3><p className="mt-1 text-[8px] text-[#8B99A3]">不是装饰选项，每种模式对应不同的真实调度策略。</p></div><span className="text-[8px] font-medium text-[#5267E8]">{modeDefinitions[draft.collaboration_mode].short}</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-5">
                {(Object.entries(modeDefinitions) as Array<[CollaborationMode, typeof modeDefinitions[CollaborationMode]]>).map(([modeId, mode]) => {
                  const Icon = mode.icon;
                  const active = draft.collaboration_mode === modeId;
                  return (
                    <button key={modeId} type="button" onClick={() => setDraft(current => ({ ...current, collaboration_mode: modeId }))} className={`relative rounded-2xl border p-3 text-left transition-all ${active ? 'border-[#BFC9F7] bg-[#F4F6FF] shadow-[0_7px_20px_rgba(82,103,232,0.08)]' : 'border-[#E2E8ED] hover:border-[#CED6DE] hover:bg-[#FBFCFD]'}`}>
                      {active ? <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#5267E8] text-white"><Check className="h-2.5 w-2.5" /></span> : null}
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${mode.tone}`}><Icon className="h-3.5 w-3.5" /></span>
                      <span className="mt-2.5 block text-[9px] font-semibold text-[#40515B]">{mode.label}</span>
                      <span className="mt-1 block text-[7px] leading-3.5 text-[#8997A1]">{mode.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
              <div><div className="flex items-end justify-between"><div><h3 className="text-[12px] font-semibold text-[#35454F]">绑定 Agent</h3><p className="mt-1 text-[8px] text-[#8B99A3]">最多 6 个，只显示服务端真实 Agent。</p></div><span className="rounded-full bg-[#EEF1FF] px-2.5 py-1 text-[8px] font-semibold text-[#5267E8]">{draft.agent_ids.length}/6</span></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {agents.map(agent => {
                    const active = draft.agent_ids.includes(agent.id);
                    return (
                      <button key={agent.id} type="button" disabled={agent.status === 'inactive'} onClick={() => toggleDraftAgent(agent.id)} className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${active ? 'border-[#BFC9F7] bg-[#F6F7FF]' : 'border-[#E2E8ED] bg-white hover:bg-[#FAFBFC]'}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${categoryTone[agent.category] || 'bg-[#EEF2F5] text-[#657682]'}`}><Bot className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-[9px] font-semibold text-[#40515B]">{agent.name}</span>{active ? <CheckCircle2 className="h-3 w-3 shrink-0 text-[#5267E8]" /> : null}</span><span className="mt-1 block truncate text-[7px] text-[#8A98A2]">{agent.skill_bindings.length} Skills · {agent.knowledge_bindings.length} 知识库 · {agent.model_id}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#DFE6EC] bg-[#F8FAFB] p-4">
                <div className="flex items-center justify-between"><div><h3 className="text-[11px] font-semibold text-[#40515B]">执行顺序</h3><p className="mt-1 text-[7px] text-[#8A98A2]">拖动替代：使用箭头调整角色顺序。</p></div><Network className="h-4 w-4 text-[#5267E8]" /></div>
                <div className="mt-3 space-y-1.5">
                  {draft.agent_ids.map((agentId, index) => {
                    const agent = agents.find(item => item.id === agentId);
                    if (!agent) return null;
                    return (
                      <div key={agentId} className="flex items-center gap-2 rounded-xl border border-[#E2E8ED] bg-white p-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EEF1FF] text-[8px] font-semibold text-[#5267E8]">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-[8px] font-semibold text-[#52636E]">{agent.name}</span>
                        <button type="button" aria-label="上移 Agent" disabled={index === 0} onClick={() => moveDraftAgent(index, -1)} className="text-[#8A98A2] disabled:opacity-25"><ArrowUp className="h-3 w-3" /></button>
                        <button type="button" aria-label="下移 Agent" disabled={index === draft.agent_ids.length - 1} onClick={() => moveDraftAgent(index, 1)} className="text-[#8A98A2] disabled:opacity-25"><ArrowDown className="h-3 w-3" /></button>
                      </div>
                    );
                  })}
                  {!draft.agent_ids.length ? <div className="rounded-xl border border-dashed border-[#D5DDE4] p-6 text-center text-[8px] text-[#96A2AA]">从左侧选择参与协作的 Agent</div> : null}
                </div>
                <label className="mt-3 flex items-center gap-2 rounded-xl bg-white p-3"><input type="checkbox" checked={draft.finalizer_enabled} onChange={event => setDraft(current => ({ ...current, finalizer_enabled: event.target.checked }))} className="h-3.5 w-3.5 accent-[#5267E8]" /><span><span className="block text-[8px] font-semibold text-[#52636E]">启用最终合成</span><span className="mt-0.5 block text-[7px] text-[#93A0A9]">动态监督模式由监督者统一验收成果</span></span></label>
              </div>
            </div>
          </main>
        </section>
      ) : null}

      {activeTab === 'run' ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E1E8ED] bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF7F1] text-[#21865D]"><CircleDot className={`h-4 w-4 ${running ? 'animate-pulse' : ''}`} /></span><span className="min-w-0"><span className="block text-[10px] font-semibold text-[#40515B]">{running ? '协作运行中' : result ? '最近一次运行已完成' : '准备开始创作'}</span><span className="mt-0.5 block truncate text-[8px] text-[#8A98A2]">{selectedWorkflow ? `${selectedWorkflow.name} · ${modeDefinitions[selectedWorkflow.collaboration_mode].label}` : '请先创建协作方案'}</span></span></div>
            <select value={selectedWorkflow?.id || ''} onChange={event => { setSelectedWorkflowId(event.target.value); setResult(null); }} className="h-9 max-w-[320px] rounded-xl border border-[#DCE4EA] bg-[#F8FAFB] px-3 text-[9px] font-semibold text-[#52636E] outline-none focus:border-[#AEBBF4]">{workflows.map(workflow => <option key={workflow.id} value={workflow.id}>{workflow.name} · {modeDefinitions[workflow.collaboration_mode].label}</option>)}</select>
          </div>

          <div className="grid min-h-[680px] gap-3 xl:grid-cols-[300px_minmax(420px,1fr)_340px]">
            <div className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-[0_10px_30px_rgba(47,65,82,0.045)]">
              <div className="border-b border-[#E8EDF1] px-4 py-3"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-[11px] font-semibold text-[#40515B]"><Network className="h-4 w-4 text-[#5267E8]" />协作流程</h2><span className="text-[7px] font-semibold tracking-[0.08em] text-[#9AA7B0]">LIVE GRAPH</span></div></div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,#DCE4EA_1px,transparent_0)] bg-[size:18px_18px] p-5">
                {selectedWorkflow ? (
                  <div className="mx-auto flex max-w-[230px] flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#CDD6DD] bg-white text-[#71818D] shadow-sm"><Send className="h-3.5 w-3.5" /></span>
                    <span className="h-5 w-px bg-[#C9D4DD]" />
                    <div className="w-full rounded-2xl border border-[#C7D1FA] bg-[#F4F6FF] p-3 text-center"><Route className="mx-auto h-4 w-4 text-[#5267E8]" /><span className="mt-1.5 block text-[8px] font-semibold text-[#4055C5]">{modeDefinitions[selectedWorkflow.collaboration_mode].label}</span><span className="mt-1 block text-[7px] text-[#8190A0]">{modeDefinitions[selectedWorkflow.collaboration_mode].short}</span></div>
                    {selectedWorkflow.agents.map((agent, index) => {
                      const agentRun = result?.runs.find(run => run.agent_name === agent.name);
                      return (
                        <div key={`${agent.id}-${index}`} className="flex w-full flex-col items-center">
                          <span className={`h-5 w-px ${agentRun ? 'bg-[#5267E8]' : 'bg-[#C9D4DD]'}`} />
                          <div className={`flex w-full items-center gap-2.5 rounded-2xl border p-3 shadow-sm ${agentRun ? 'border-[#BFC9F7] bg-white' : 'border-[#DFE6EB] bg-white/90'}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${categoryTone[agent.category] || 'bg-[#EEF2F5] text-[#657682]'}`}><Bot className="h-3.5 w-3.5" /></span>
                            <span className="min-w-0 flex-1"><span className="block truncate text-[8px] font-semibold text-[#40515B]">{agent.name}</span><span className="mt-1 block text-[7px] text-[#8C99A3]">{agent.skill_count} Skills · {agent.knowledge_count} RAG</span></span>
                            {agentRun ? <CheckCircle2 className="h-3.5 w-3.5 text-[#21865D]" /> : <span className="h-2 w-2 rounded-full bg-[#D3DBE1]" />}
                          </div>
                        </div>
                      );
                    })}
                    <span className="h-5 w-px bg-[#C9D4DD]" />
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${result ? 'border-[#9ED4BE] bg-[#EAF7F1] text-[#21865D]' : 'border-[#CDD6DD] bg-white text-[#8A98A2]'}`}><Check className="h-3.5 w-3.5" /></span>
                  </div>
                ) : <div className="flex h-full items-center justify-center text-[9px] text-[#8B99A3]">暂无协作方案</div>}
              </div>
              <div className="border-t border-[#E8EDF1] bg-[#F8FAFB] px-4 py-3 text-[8px] text-[#788894]">{result ? `运行 ID · ${result.collaboration_id.slice(0, 12)}` : '运行后节点状态会在此更新'}</div>
            </div>

            <div className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-[0_10px_30px_rgba(47,65,82,0.045)]">
              <div className="flex items-center justify-between border-b border-[#E8EDF1] px-5 py-3"><div><h2 className="flex items-center gap-2 text-[11px] font-semibold text-[#40515B]"><WandSparkles className="h-4 w-4 text-[#5267E8]" />内容创作</h2><p className="mt-1 text-[7px] text-[#8A98A2]">最终成果会保存在服务端 Agent 运行记录中。</p></div>{result ? <span className={`rounded-full px-2.5 py-1 text-[7px] font-semibold ${result.status === 'awaiting_approval' ? 'bg-[#FFF0ED] text-[#C65345]' : 'bg-[#EAF7F1] text-[#21865D]'}`}>{result.status === 'awaiting_approval' ? '等待审批' : '已完成'}</span> : null}</div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#FBFCFD] p-4 sm:p-5">
                <div className="rounded-2xl border border-[#E0E6EC] bg-white p-4"><div className="flex items-center gap-2 text-[8px] font-semibold text-[#5267E8]"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEF1FF]"><Braces className="h-3 w-3" /></span>创作任务</div><p className="mt-3 whitespace-pre-wrap text-[10px] leading-5 text-[#52636E]">{runInput || '输入创作任务后开始运行。'}</p></div>
                {running ? (
                  <div className="mt-4 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[#DDE4FF] bg-[linear-gradient(135deg,#F7F8FF_0%,#F2FAFB_100%)] text-center"><span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#5267E8] shadow-[0_10px_24px_rgba(82,103,232,0.12)]"><LoaderCircle className="h-5 w-5 animate-spin" /><span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-[#59C4CC]" /></span><h3 className="mt-4 text-[11px] font-semibold text-[#40515B]">Agent 团队正在协作</h3><p className="mt-1 text-[8px] text-[#8A98A2]">正在执行路由、RAG、Skill、模型与审核步骤，请勿关闭页面。</p></div>
                ) : result ? (
                  <div className="mt-4 rounded-2xl border border-[#DCE5E9] bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[9px] font-semibold text-[#21865D]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF7F1]"><CheckCircle2 className="h-3.5 w-3.5" /></span>最终成果</div><button type="button" onClick={() => { void navigator.clipboard.writeText(result.content); showToast('成果已复制', 'success'); }} className="flex h-8 items-center gap-1 rounded-xl border border-[#E0E6EB] px-2.5 text-[8px] font-semibold text-[#71818D]"><Copy className="h-3 w-3" />复制</button></div><div className="mt-4 whitespace-pre-wrap text-[10px] leading-6 text-[#465862]">{result.content}</div>{result.status === 'awaiting_approval' ? <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#F1D5CE] bg-[#FFF7F5] p-3 text-[8px] leading-4 text-[#A65346]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />检测到发布类高风险 Skill，成果已生成但不会自动发布，请在任务中心完成人工审批。</div> : null}</div>
                ) : (
                  <div className="mt-4 flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7E0E6] bg-white text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F2FF] text-[#687BEA]"><Sparkles className="h-5 w-5" /></span><h3 className="mt-4 text-[11px] font-semibold text-[#52636E]">等待第一次协作运行</h3><p className="mt-1 max-w-[280px] text-[8px] leading-4 text-[#91A0AA]">输入目标、素材、渠道和交付要求，系统会按当前方案调度 Agent。</p></div>
                )}
              </div>
              <div className="border-t border-[#E8EDF1] bg-white p-3"><textarea value={runInput} onChange={event => setRunInput(event.target.value)} rows={3} placeholder="描述要创作的内容、使用素材、目标渠道与交付要求…" className="w-full resize-none rounded-xl border border-[#DDE5EA] bg-[#F8FAFB] p-3 text-[9px] leading-5 text-[#52636E] outline-none focus:border-[#AEBBF4] focus:bg-white" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[7px] text-[#91A0AA]">任务将使用当前方案的真实 Agent、Skill、RAG 与模型配置</span><button type="button" onClick={runWorkflow} disabled={running || !selectedWorkflow || !runInput.trim()} className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[9px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.2)] disabled:opacity-45">{running ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{running ? '运行中' : '发送任务'}</button></div></div>
            </div>

            <div className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-[0_10px_30px_rgba(47,65,82,0.045)]">
              <div className="flex items-center justify-between border-b border-[#E8EDF1] px-4 py-3"><div><h2 className="flex items-center gap-2 text-[11px] font-semibold text-[#40515B]"><Activity className="h-4 w-4 text-[#5267E8]" />运行 Trace</h2><p className="mt-1 text-[7px] text-[#8A98A2]">真实步骤与审批状态</p></div><span className={`rounded-full px-2 py-1 text-[7px] font-semibold ${running ? 'bg-[#EAF7F1] text-[#21865D]' : 'bg-[#EEF2F5] text-[#71818D]'}`}>{running ? '实时' : result ? `${result.trace.length} 事件` : '待运行'}</span></div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {result?.trace.length ? (
                  <div className="space-y-1">
                    {result.trace.map((event, index) => {
                      const definition = traceTone[event.phase];
                      const Icon = definition.icon;
                      return (
                        <div key={event.id} className="relative flex gap-3 rounded-2xl p-3 hover:bg-[#F8FAFB]">
                          {index < result.trace.length - 1 ? <span className="absolute left-[27px] top-11 h-[calc(100%-24px)] w-px bg-[#E1E7EC]" /> : null}
                          <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${definition.tone}`}><Icon className="h-3.5 w-3.5" /></span>
                          <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-[8px] font-semibold text-[#465862]">{event.title}</span><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[6px] font-semibold ${event.status === 'completed' ? 'bg-[#EAF7F1] text-[#21865D]' : event.status === 'pending' || event.status === 'awaiting_approval' ? 'bg-[#FFF0ED] text-[#C65345]' : 'bg-[#EEF2F5] text-[#71818D]'}`}>{event.status}</span></span>{event.agent_name ? <span className="mt-1 block text-[7px] font-medium text-[#5267E8]">{event.agent_name}</span> : null}<span className="mt-1 block text-[7px] leading-4 text-[#8A98A2]">{event.detail}</span></span>
                        </div>
                      );
                    })}
                  </div>
                ) : running ? (
                  <div className="space-y-2">{[0, 1, 2, 3].map(item => <div key={item} className="flex animate-pulse gap-3 rounded-2xl p-3"><span className="h-8 w-8 rounded-xl bg-[#EEF1F4]" /><span className="flex-1"><span className="block h-2.5 w-24 rounded bg-[#E8EDF1]" /><span className="mt-2 block h-2 w-full rounded bg-[#F0F3F5]" /></span></div>)}</div>
                ) : (
                  <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F5F7] text-[#9AA7B0]"><Activity className="h-4 w-4" /></span><p className="mt-3 text-[9px] font-semibold text-[#71818D]">Trace 等待运行</p><p className="mt-1 max-w-[190px] text-[7px] leading-4 text-[#A0ABB3]">路由、知识检索、Skill、模型和审批事件会依次显示。</p></div>
                )}
              </div>
              {result?.runs.some(run => run.approval) ? <button type="button" onClick={() => onNavigate('tasks')} className="m-3 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#FFF0ED] text-[8px] font-semibold text-[#C65345]"><ShieldCheck className="h-3.5 w-3.5" />前往任务中心审批<ChevronRight className="h-3 w-3" /></button> : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
