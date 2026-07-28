'use client';

import {
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CirclePause,
  Database,
  Link2,
  MessageSquareText,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { type ComponentType, useDeferredValue, useEffect, useState } from 'react';
import { executeAgentTask, type AgentRun } from '@/lib/agent-runtime';
import { getModelRuntimeStatus, type ModelRuntimeStatus } from '@/lib/model-provider-api';
import { PlatformDialog } from './platform-dialog';
import { showToast } from './toast';

type AgentCategory = 'content' | 'review' | 'analysis' | 'automation';

interface AgentSkillBinding {
  skill_id: string;
  name: string;
  version: string;
  risk_level: string;
  enabled: boolean;
  required: boolean;
  regression_status: string;
}

interface AgentKnowledgeBinding {
  knowledge_base_id: string;
  name: string;
  enabled: boolean;
  top_k: number;
}

interface AgentItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AgentCategory;
  status: 'active' | 'inactive' | 'draft' | 'retest';
  model_id: string;
  current_version: number;
  current_prompt: string;
  run_count: number;
  success_rate: number;
  last_run_at: string | null;
  routing_keywords: string[];
  business_keys: string[];
  skill_bindings: AgentSkillBinding[];
  knowledge_bindings: AgentKnowledgeBinding[];
}

interface SkillItem {
  id: string;
  name: string;
  description: string;
  latest_version: string;
  risk_level: string;
  suggested_businesses: string[];
  installation: { version: string; enabled: boolean } | null;
}

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  document_count: number;
}

const categoryDefinition: Record<AgentCategory, { label: string; icon: ComponentType<{ className?: string }>; tone: string }> = {
  content: { label: '内容创作', icon: WandSparkles, tone: 'bg-[#F2EEFF] text-[#7357E6]' },
  review: { label: '审核检测', icon: ShieldCheck, tone: 'bg-[#EAF7F1] text-[#21865D]' },
  analysis: { label: '分析推荐', icon: BarChart3, tone: 'bg-[#E9F7FA] text-[#1994B1]' },
  automation: { label: '自动化', icon: Zap, tone: 'bg-[#FFF4E6] text-[#B36F27]' },
};

const statusDefinition = {
  active: { label: '可路由', tone: 'bg-[#EAF7F1] text-[#21865D]' },
  inactive: { label: '已暂停', tone: 'bg-[#FFF4E6] text-[#B36F27]' },
  draft: { label: '草稿', tone: 'bg-[#EEF2F5] text-[#657682]' },
  retest: { label: '待复测', tone: 'bg-[#FFF0ED] text-[#C65345]' },
};

const emptyForm = { name: '', description: '', category: 'content' as AgentCategory, model_id: 'platform-default', system_prompt: '' };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json() as T & { error?: string; detail?: string };
  if (!response.ok) throw new Error(data.error || data.detail || '请求失败');
  return data;
}

export function AgentManagement({ embedded = false }: { embedded?: boolean }) {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [category, setCategory] = useState<'all' | AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [modelRuntime, setModelRuntime] = useState<ModelRuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [bindingMode, setBindingMode] = useState<'skill' | 'knowledge' | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [testInput, setTestInput] = useState('请根据采访素材生成一个员工故事开头。');
  const [testRun, setTestRun] = useState<AgentRun | null>(null);
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedAgent = agents.find(agent => agent.id === selectedId) ?? agents[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentData, skillData, knowledgeData, runtimeData] = await Promise.all([
        api<{ items: AgentItem[] }>('/api/backend/v1/agents'),
        api<{ items: SkillItem[] }>('/api/backend/v1/skills?status=installed'),
        api<{ items: KnowledgeBaseItem[] }>('/api/backend/v1/knowledge-bases'),
        getModelRuntimeStatus(),
      ]);
      setAgents(agentData.items);
      setSkills(skillData.items.filter(item => item.installation?.enabled));
      setKnowledgeBases(knowledgeData.items);
      setModelRuntime(runtimeData);
      setCreateForm(current => ({ ...current, model_id: runtimeData.model }));
      const nextSelected = agentData.items.find(item => item.id === selectedId) ?? agentData.items[0];
      if (nextSelected) {
        setSelectedId(nextSelected.id);
        setDraftPrompt(nextSelected.current_prompt);
        setDraftModel(nextSelected.model_id);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Agent 数据加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filteredAgents = agents.filter(agent => {
    const categoryMatch = category === 'all' || agent.category === category;
    return categoryMatch && (!deferredQuery || `${agent.name} ${agent.description}`.toLocaleLowerCase().includes(deferredQuery));
  });

  const selectAgent = (agent: AgentItem) => {
    setSelectedId(agent.id);
    setDraftPrompt(agent.current_prompt);
    setDraftModel(agent.model_id);
    setTestRun(null);
    setTestResult('');
  };

  const savePrompt = async () => {
    if (!selectedAgent || draftPrompt.trim().length < 10) return;
    try {
      const updated = await api<AgentItem>(`/api/backend/v1/agents/${selectedAgent.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: draftPrompt, change_note: '管理台更新 Prompt', config: {} }),
      });
      setAgents(current => current.map(item => item.id === updated.id ? updated : item));
      showToast(`已发布 Agent v${updated.current_version}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败', 'error');
    }
  };

  const toggleStatus = async () => {
    if (!selectedAgent) return;
    const status = selectedAgent.status === 'inactive' ? 'active' : 'inactive';
    try {
      const updated = await api<AgentItem>(`/api/backend/v1/agents/${selectedAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setAgents(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : '状态更新失败', 'error');
    }
  };

  const toggleSkill = async (skill: SkillItem) => {
    if (!selectedAgent) return;
    const existing = selectedAgent.skill_bindings.some(item => item.skill_id === skill.id);
    const bindings = existing
      ? selectedAgent.skill_bindings.filter(item => item.skill_id !== skill.id)
      : [...selectedAgent.skill_bindings, { skill_id: skill.id, enabled: true, required: false }];
    try {
      const updated = await api<AgentItem>(`/api/backend/v1/agents/${selectedAgent.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindings: bindings.map(item => ({ skill_id: item.skill_id, enabled: item.enabled, required: item.required })) }),
      });
      setAgents(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Skill 绑定失败', 'error');
    }
  };

  const toggleKnowledge = async (knowledgeBase: KnowledgeBaseItem) => {
    if (!selectedAgent) return;
    const existing = selectedAgent.knowledge_bindings.some(item => item.knowledge_base_id === knowledgeBase.id);
    const bindings = existing
      ? selectedAgent.knowledge_bindings.filter(item => item.knowledge_base_id !== knowledgeBase.id)
      : [...selectedAgent.knowledge_bindings, { knowledge_base_id: knowledgeBase.id, enabled: true, top_k: 4 }];
    try {
      const updated = await api<AgentItem>(`/api/backend/v1/agents/${selectedAgent.id}/knowledge-bases`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindings: bindings.map(item => ({ knowledge_base_id: item.knowledge_base_id, enabled: item.enabled, top_k: item.top_k })) }),
      });
      setAgents(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (error) {
      showToast(error instanceof Error ? error.message : '知识库绑定失败', 'error');
    }
  };

  const createAgent = async () => {
    if (createForm.name.trim().length < 2 || createForm.description.trim().length < 4 || createForm.system_prompt.trim().length < 10) {
      showToast('请完整填写 Agent 名称、职责描述与系统提示词', 'info');
      return;
    }
    try {
      const created = await api<AgentItem>('/api/backend/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      setAgents(current => [...current, created]);
      selectAgent(created);
      setShowCreate(false);
      setCreateForm(emptyForm);
      showToast('Agent 已创建为草稿', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    }
  };

  const runTest = async () => {
    if (!selectedAgent || !testInput.trim()) return;
    setIsTesting(true);
    try {
      const result = await executeAgentTask({ source: 'test', agent_id: selectedAgent.id, input_text: testInput });
      setTestRun(result.run);
      setTestResult(result.content);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '测试失败', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  if (loading && !agents.length) return <div className="flex min-h-[480px] items-center justify-center text-[11px] text-[#7A8994]"><Sparkles className="mr-2 h-4 w-4 animate-pulse text-[#5267E8]" />正在加载真实 Agent 数据…</div>;
  if (!selectedAgent) return <div className="p-10 text-center text-[11px] text-[#7A8994]">暂无 Agent，请检查后端服务。</div>;

  const CategoryIcon = categoryDefinition[selectedAgent.category].icon;
  return (
    <div className={embedded ? 'space-y-4' : 'mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8'}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.14em] text-[#5267E8]">{embedded ? 'AGENT TEAM' : 'AGENT STUDIO'}</p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-[#253640]">{embedded ? 'Agent 团队' : 'Agent 工作室'}</h2>
          <p className="mt-1.5 text-[9px] text-[#7B8A95]">用角色卡片配置职责、模型、Skill 与 RAG，选中卡片后可立即测试真实运行。</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadData()} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DDE5EA] bg-white px-3 text-[9px] font-semibold text-[#60707D]"><RefreshCw className="h-3.5 w-3.5" />刷新</button>
          <button type="button" onClick={() => setShowCreate(true)} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#17243B] px-4 text-[9px] font-semibold text-white shadow-[0_9px_20px_rgba(23,36,59,0.18)]"><Plus className="h-3.5 w-3.5" />新建 Agent</button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E1E8ED] bg-white p-2.5">
        <label className="flex h-9 min-w-[210px] flex-1 items-center gap-2 rounded-xl bg-[#F6F8FA] px-3 sm:max-w-[300px]"><Search className="h-3.5 w-3.5 text-[#8B99A3]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索 Agent 名称或职责" className="min-w-0 flex-1 bg-transparent text-[9px] outline-none" /></label>
        <div className="flex flex-wrap gap-1">{(['all', ...Object.keys(categoryDefinition)] as Array<'all' | AgentCategory>).map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-lg px-2.5 py-2 text-[8px] font-semibold transition-colors ${category === item ? 'bg-[#E9EDFF] text-[#5267E8]' : 'text-[#7A8994] hover:bg-[#F6F8FA]'}`}>{item === 'all' ? '全部角色' : categoryDefinition[item].label}</button>)}</div>
        <span className="ml-auto px-2 text-[8px] text-[#98A4AC]">{filteredAgents.length} 个 Agent</span>
      </div>

      <section className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {showCreate ? (
          <article className="animate-slide-up min-h-[340px] rounded-3xl border border-dashed border-[#9EB0F4] bg-[linear-gradient(145deg,#F4F6FF_0%,#F1FAFB_100%)] p-4 shadow-[0_12px_32px_rgba(82,103,232,0.08)]">
            <div className="flex items-center justify-between"><div><p className="text-[8px] font-semibold tracking-[0.12em] text-[#5267E8]">CREATE AGENT</p><h3 className="mt-1 text-[12px] font-semibold text-[#334650]">创建角色卡</h3></div><button type="button" aria-label="取消创建 Agent" onClick={() => setShowCreate(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#7D8C97]"><X className="h-3.5 w-3.5" /></button></div>
            <div className="mt-4 space-y-2.5">
              <input autoFocus value={createForm.name} onChange={event => setCreateForm(current => ({ ...current, name: event.target.value }))} placeholder="Agent 名称，例如：员工故事主编" className="h-10 w-full rounded-xl border border-[#DCE4EA] bg-white px-3 text-[9px] outline-none focus:border-[#AEBBF4]" />
              <select value={createForm.category} onChange={event => setCreateForm(current => ({ ...current, category: event.target.value as AgentCategory }))} className="h-10 w-full rounded-xl border border-[#DCE4EA] bg-white px-3 text-[9px] outline-none">{Object.entries(categoryDefinition).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select>
              <input value={createForm.description} onChange={event => setCreateForm(current => ({ ...current, description: event.target.value }))} placeholder="职责描述与交付目标" className="h-10 w-full rounded-xl border border-[#DCE4EA] bg-white px-3 text-[9px] outline-none focus:border-[#AEBBF4]" />
              <textarea value={createForm.system_prompt} onChange={event => setCreateForm(current => ({ ...current, system_prompt: event.target.value }))} rows={5} placeholder="系统提示词：角色、边界、步骤与输出格式…" className="w-full resize-none rounded-xl border border-[#DCE4EA] bg-white p-3 text-[9px] leading-4 outline-none focus:border-[#AEBBF4]" />
            </div>
            <div className="mt-3 flex items-center justify-between"><span className="text-[7px] text-[#8B99A3]">创建后再绑定 Skill 与 RAG</span><button type="button" onClick={createAgent} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[8px] font-semibold text-white">创建草稿</button></div>
          </article>
        ) : null}

        {filteredAgents.map(agent => {
          const definition = categoryDefinition[agent.category];
          const Icon = definition.icon;
          const selected = agent.id === selectedAgent.id;
          return (
            <article key={agent.id} className={`group relative min-h-[340px] overflow-hidden rounded-3xl border bg-white p-4 transition-all ${selected ? 'border-[#AEBBF4] shadow-[0_16px_38px_rgba(74,91,154,0.13)] ring-2 ring-[#E8EBFF]' : 'border-[#E1E8ED] shadow-[0_8px_24px_rgba(47,65,82,0.045)] hover:-translate-y-0.5 hover:border-[#CDD5F6] hover:shadow-[0_14px_30px_rgba(47,65,82,0.08)]'}`}>
              <button type="button" aria-label={`配置 ${agent.name}`} onClick={() => selectAgent(agent)} className="absolute inset-0 z-0" />
              <div className="relative z-10 pointer-events-none">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${definition.tone}`}><Icon className="h-4.5 w-4.5" /></span>
                  <div className="flex items-center gap-1.5"><span className={`rounded-full px-2 py-1 text-[7px] font-semibold ${statusDefinition[agent.status].tone}`}>{statusDefinition[agent.status].label}</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F7F9] text-[#8A98A2]"><Settings2 className="h-3.5 w-3.5" /></span></div>
                </div>
                <h3 className="mt-4 text-[14px] font-semibold tracking-[-0.02em] text-[#2A3B45]">{agent.name}</h3>
                <p className="mt-1 text-[7px] font-medium tracking-[0.12em] text-[#A0ABB3]">AGENT_{agent.slug.toUpperCase().replaceAll('-', '_')}</p>
                <p className="mt-3 line-clamp-3 min-h-[54px] text-[9px] leading-[18px] text-[#71818D]">{agent.description}</p>
                <div className="mt-4 border-t border-[#EBEFF2] pt-3">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-1 text-[7px] font-semibold tracking-[0.08em] text-[#82909A]"><Zap className="h-3 w-3 text-[#B36F27]" />INSTALLED SKILLS</span><span className="text-[7px] text-[#9AA7B0]">{agent.skill_bindings.length}</span></div>
                  <div className="mt-2 flex min-h-7 flex-wrap gap-1.5">{agent.skill_bindings.slice(0, 2).map(binding => <span key={binding.skill_id} className="rounded-lg bg-[#FFF6EA] px-2 py-1 text-[7px] font-medium text-[#9A642C]">{binding.name}</span>)}{!agent.skill_bindings.length ? <span className="text-[7px] italic text-[#B0BAC1]">尚未绑定 Skill</span> : null}</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[7px] text-[#8B99A3]"><span className="flex items-center gap-1"><Database className="h-3 w-3 text-[#168EA7]" />{agent.knowledge_bindings.length} RAG</span><span>{agent.run_count} 次运行 · {agent.success_rate}%</span></div>
              </div>
              <div className="relative z-20 mt-4 flex gap-2 border-t border-[#EBEFF2] pt-3">
                <button type="button" onClick={() => selectAgent(agent)} className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-xl text-[8px] font-semibold ${selected ? 'bg-[#EEF1FF] text-[#5267E8]' : 'bg-[#F6F8FA] text-[#657682]'}`}><Settings2 className="h-3 w-3" />{selected ? '正在配置' : '配置'}</button>
                <button type="button" onClick={() => { selectAgent(agent); document.getElementById('agent-test-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-[#17243B] text-[8px] font-semibold text-white"><MessageSquareText className="h-3 w-3" />测试运行</button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#DDE4F3] bg-white shadow-[0_14px_42px_rgba(47,65,82,0.07)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8EDF1] bg-[linear-gradient(120deg,#FFFFFF_0%,#F5F7FF_58%,#F1FAFB_100%)] p-5">
          <div className="flex gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${categoryDefinition[selectedAgent.category].tone}`}><CategoryIcon className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[16px] font-semibold text-[#253640]">{selectedAgent.name}</h2><span className="rounded-lg bg-white px-2 py-1 text-[7px] font-semibold text-[#5267E8] shadow-sm">v{selectedAgent.current_version}</span></div><p className="mt-1 max-w-2xl text-[9px] leading-5 text-[#7A8994]">{selectedAgent.description}</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={toggleStatus} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DDE5EA] bg-white px-3 text-[8px] font-semibold text-[#60707D]"><CirclePause className="h-3.5 w-3.5" />{selectedAgent.status === 'inactive' ? '启用路由' : '暂停 Agent'}</button><button type="button" onClick={() => document.getElementById('agent-test-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-3 text-[8px] font-semibold text-white"><Play className="h-3.5 w-3.5" />测试运行</button></div>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-[#E2E8ED] p-4"><div className="flex items-center justify-between"><div><h3 className="text-[11px] font-semibold text-[#35454F]">System Prompt</h3><p className="mt-1 text-[8px] text-[#87959F]">描述职责、边界、执行步骤和交付格式。</p></div><button type="button" onClick={savePrompt} disabled={draftPrompt === selectedAgent.current_prompt} className="flex h-8 items-center gap-1.5 rounded-xl bg-[#5267E8] px-3 text-[8px] font-semibold text-white disabled:opacity-35"><Save className="h-3 w-3" />发布新版本</button></div><textarea value={draftPrompt} onChange={event => setDraftPrompt(event.target.value)} rows={7} className="mt-3 w-full resize-y rounded-xl border border-[#E1E7EB] bg-[#FAFBFC] p-3 text-[9px] leading-5 text-[#4C5D68] outline-none focus:border-[#AEBBF4]" /></section>
            <div className="grid gap-3 sm:grid-cols-2"><section className="rounded-2xl border border-[#E2E8ED] p-4"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[10px] font-semibold text-[#35454F]"><Zap className="h-3.5 w-3.5 text-[#B36F27]" />Skills</h3><button type="button" onClick={() => setBindingMode('skill')} className="flex items-center gap-1 text-[8px] font-semibold text-[#5267E8]">管理<Link2 className="h-3 w-3" /></button></div><div className="mt-3 flex flex-wrap gap-1.5">{selectedAgent.skill_bindings.map(binding => <span key={binding.skill_id} className="rounded-lg bg-[#FFF6EA] px-2 py-1.5 text-[7px] font-medium text-[#9A642C]">{binding.name} · v{binding.version}</span>)}{!selectedAgent.skill_bindings.length ? <p className="text-[8px] text-[#9AA7B0]">未绑定真实 Skill</p> : null}</div></section><section className="rounded-2xl border border-[#E2E8ED] p-4"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[10px] font-semibold text-[#35454F]"><Database className="h-3.5 w-3.5 text-[#168EA7]" />RAG 知识库</h3><button type="button" onClick={() => setBindingMode('knowledge')} className="flex items-center gap-1 text-[8px] font-semibold text-[#5267E8]">管理<Link2 className="h-3 w-3" /></button></div><div className="mt-3 flex flex-wrap gap-1.5">{selectedAgent.knowledge_bindings.map(binding => <span key={binding.knowledge_base_id} className="rounded-lg bg-[#EAF8FA] px-2 py-1.5 text-[7px] font-medium text-[#168EA7]">{binding.name} · Top {binding.top_k}</span>)}{!selectedAgent.knowledge_bindings.length ? <p className="text-[8px] text-[#9AA7B0]">未绑定知识库</p> : null}</div></section></div>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-[#E2E8ED] bg-[#F8FAFB] p-4"><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-white p-3"><span className="text-[7px] text-[#87959F]">真实运行</span><strong className="mt-1 block text-[18px] text-[#2F414C]">{selectedAgent.run_count}</strong></div><div className="rounded-xl bg-white p-3"><span className="text-[7px] text-[#87959F]">成功率</span><strong className="mt-1 block text-[18px] text-[#2F414C]">{selectedAgent.success_rate}%</strong></div></div><div className="mt-3 rounded-xl border border-[#DDE5EA] bg-white p-3"><span className="flex items-center justify-between gap-2"><span className="text-[8px] font-semibold text-[#60707D]">平台验证模型</span><span className={`rounded-md px-1.5 py-0.5 text-[7px] font-semibold ${modelRuntime?.configured ? 'bg-[#EAF7F1] text-[#21865D]' : 'bg-[#FFF0F1] text-[#C44F55]'}`}>{modelRuntime?.configured ? '可运行' : '未就绪'}</span></span><strong className="mt-2 block truncate font-mono text-[9px] text-[#2F414C]">{modelRuntime?.model || draftModel || '尚未配置'}</strong><p className="mt-1 text-[7px] leading-4 text-[#87959F]">{modelRuntime ? `${modelRuntime.provider} · ${modelRuntime.message}` : '正在读取平台模型状态'}</p></div></section>
            <section id="agent-test-panel" className="rounded-2xl border border-[#DDE4FF] bg-[linear-gradient(135deg,#F7F8FF_0%,#F2FAFB_100%)] p-4"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[10px] font-semibold text-[#35454F]"><MessageSquareText className="h-3.5 w-3.5 text-[#5267E8]" />真实测试</h3><span className="text-[7px] text-[#8A99A4]">写入 AgentRun</span></div><textarea value={testInput} onChange={event => setTestInput(event.target.value)} rows={4} placeholder="输入任务，测试当前 Agent…" className="mt-3 w-full resize-none rounded-xl border border-[#DDE5EA] bg-white p-3 text-[8px] leading-4 text-[#4C5D68] outline-none focus:border-[#AEBBF4]" /><button type="button" onClick={runTest} disabled={isTesting || !testInput.trim()} className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#17243B] text-[8px] font-semibold text-white disabled:opacity-50"><Play className="h-3 w-3" />{isTesting ? '运行中…' : '发送给当前 Agent'}</button>{testRun ? <div className="mt-3 rounded-xl bg-white p-3"><div className="flex items-center justify-between text-[8px] font-semibold text-[#4357C9]"><span>{testRun.agent_name} · v{testRun.agent_version}</span><span>{testRun.status}</span></div><div className="mt-2 flex flex-wrap gap-1">{testRun.steps.map(step => <span key={step.id} className="rounded-md bg-[#F1F4F8] px-1.5 py-1 text-[7px] text-[#687985]">{step.name} · {step.status}</span>)}</div><p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-[8px] leading-4 text-[#52636E]">{testResult}</p></div> : <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#D7DEEF] p-3 text-[7px] text-[#8A98A2]"><span>运行后显示 RAG、Skill、模型与审批步骤</span><ChevronRight className="h-3 w-3" /></div>}</section>
          </div>
        </div>
      </section>

      <PlatformDialog open={Boolean(bindingMode)} onClose={() => setBindingMode(null)} title={bindingMode === 'skill' ? '绑定已安装 Skills' : '绑定真实知识库'} description={bindingMode === 'skill' ? '这里只显示 Skill 中心已安装且启用的能力。' : '绑定后运行时会执行真实向量检索。'} width="lg" footer={<button type="button" onClick={() => setBindingMode(null)} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">完成</button>}><div className="max-h-[460px] space-y-2 overflow-y-auto">{bindingMode === 'skill' ? skills.map(skill => { const active = selectedAgent.skill_bindings.some(item => item.skill_id === skill.id); return <button key={skill.id} type="button" onClick={() => toggleSkill(skill)} className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left ${active ? 'border-[#BFC9F7] bg-[#F0F2FF]' : 'border-[#E3E9EE]'}`}><span><span className="block text-[10px] font-semibold text-[#45545E]">{skill.name}</span><span className="mt-1 block text-[8px] leading-4 text-[#82909A]">{skill.description}</span><span className="mt-1 block text-[8px] text-[#9A7A5A]">风险 {skill.risk_level} · v{skill.installation?.version}</span></span>{active ? <Check className="h-4 w-4 text-[#5267E8]" /> : <Plus className="h-4 w-4 text-[#9AA7B0]" />}</button>; }) : knowledgeBases.map(knowledgeBase => { const active = selectedAgent.knowledge_bindings.some(item => item.knowledge_base_id === knowledgeBase.id); return <button key={knowledgeBase.id} type="button" onClick={() => toggleKnowledge(knowledgeBase)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${active ? 'border-[#BFC9F7] bg-[#F0F2FF]' : 'border-[#E3E9EE]'}`}><span><span className="block text-[10px] font-semibold text-[#45545E]">{knowledgeBase.name}</span><span className="mt-1 block text-[8px] text-[#82909A]">{knowledgeBase.description || `${knowledgeBase.document_count || 0} 个文档`}</span></span>{active ? <Check className="h-4 w-4 text-[#5267E8]" /> : <Plus className="h-4 w-4 text-[#9AA7B0]" />}</button>; })}{bindingMode === 'skill' && !skills.length ? <p className="p-8 text-center text-[10px] text-[#82909A]">Skill 中心暂无已安装能力，请先完成发现、预检和安装。</p> : null}</div></PlatformDialog>
    </div>
  );
}
