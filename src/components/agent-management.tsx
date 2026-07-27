'use client';

import {
  BarChart3,
  Bot,
  Check,
  CirclePause,
  Database,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { type ComponentType, useDeferredValue, useEffect, useState } from 'react';
import { executeAgentTask, type AgentRun } from '@/lib/agent-runtime';
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

const emptyForm = { name: '', description: '', category: 'content' as AgentCategory, model_id: 'gpt-5.4', system_prompt: '' };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json() as T & { error?: string; detail?: string };
  if (!response.ok) throw new Error(data.error || data.detail || '请求失败');
  return data;
}

export function AgentManagement() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [category, setCategory] = useState<'all' | AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [bindingMode, setBindingMode] = useState<'skill' | 'knowledge' | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [showTest, setShowTest] = useState(false);
  const [testInput, setTestInput] = useState('请根据采访素材生成一个员工故事开头。');
  const [testRun, setTestRun] = useState<AgentRun | null>(null);
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedAgent = agents.find(agent => agent.id === selectedId) ?? agents[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentData, skillData, knowledgeData] = await Promise.all([
        api<{ items: AgentItem[] }>('/api/backend/v1/agents'),
        api<{ items: SkillItem[] }>('/api/backend/v1/skills?status=installed'),
        api<{ items: KnowledgeBaseItem[] }>('/api/backend/v1/knowledge-bases'),
      ]);
      setAgents(agentData.items);
      setSkills(skillData.items.filter(item => item.installation?.enabled));
      setKnowledgeBases(knowledgeData.items);
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

  const saveModel = async () => {
    if (!selectedAgent || !draftModel.trim() || draftModel.trim() === selectedAgent.model_id) return;
    try {
      const updated = await api<AgentItem>(`/api/backend/v1/agents/${selectedAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: draftModel.trim() }),
      });
      setAgents(current => current.map(item => item.id === updated.id ? updated : item));
      setDraftModel(updated.model_id);
      showToast(`模型已切换为 ${updated.model_id}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '模型更新失败', 'error');
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
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold tracking-[0.12em] text-[#5267E8]">AGENT STUDIO</p><h1 className="mt-1 text-[26px] font-semibold text-[#20313C]">Agent 工作室</h1><p className="mt-2 text-[11px] text-[#7B8A95]">在一个页面中创建、配置、对话测试并发布 Agent，运行过程会记录真实 Skill 与 RAG 调用。</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadData()} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DDE5EA] bg-white px-3 text-[10px] font-semibold text-[#60707D]"><RefreshCw className="h-3.5 w-3.5" />刷新</button><button type="button" onClick={() => setShowCreate(true)} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white"><Plus className="h-3.5 w-3.5" />新建 Agent</button></div></header>

      <div className="grid min-h-[660px] overflow-hidden rounded-3xl border border-[#E1E8ED] bg-white shadow-[0_12px_40px_rgba(37,54,70,0.06)] lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="border-b border-[#E6EBEF] bg-[#F8FAFB] lg:border-b-0 lg:border-r"><div className="space-y-3 p-4"><label className="flex h-9 items-center gap-2 rounded-xl border border-[#DFE6EB] bg-white px-3"><Search className="h-3.5 w-3.5 text-[#8B99A3]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索 Agent" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" /></label><div className="flex flex-wrap gap-1.5">{(['all', ...Object.keys(categoryDefinition)] as Array<'all' | AgentCategory>).map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${category === item ? 'bg-[#E9EDFF] text-[#5267E8]' : 'text-[#7A8994] hover:bg-white'}`}>{item === 'all' ? '全部' : categoryDefinition[item].label}</button>)}</div></div><div className="max-h-[560px] space-y-1 overflow-y-auto px-3 pb-4">{filteredAgents.map(agent => <button key={agent.id} type="button" onClick={() => selectAgent(agent)} className={`w-full rounded-2xl p-3 text-left ${agent.id === selectedAgent.id ? 'bg-white shadow-[0_6px_18px_rgba(41,57,74,0.07)] ring-1 ring-[#DCE3FF]' : 'hover:bg-white/70'}`}><span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-[#35454F]">{agent.name}</span><span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold ${statusDefinition[agent.status].tone}`}>{statusDefinition[agent.status].label}</span></span><span className="mt-1.5 line-clamp-2 block text-[9px] leading-4 text-[#82909A]">{agent.description}</span><span className="mt-2 block text-[8px] text-[#A0ABB3]">{agent.skill_bindings.length} Skills · {agent.knowledge_bindings.length} 知识库 · {agent.run_count} 次运行</span></button>)}</div></aside>

        <main className="min-w-0 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E9EEF1] pb-5"><div className="flex gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${categoryDefinition[selectedAgent.category].tone}`}><CategoryIcon className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[18px] font-semibold text-[#253640]">{selectedAgent.name}</h2><span className="rounded-lg bg-[#F0F2FF] px-2 py-1 text-[8px] font-semibold text-[#5267E8]">v{selectedAgent.current_version}</span></div><p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#7A8994]">{selectedAgent.description}</p></div></div><div className="flex gap-2"><button type="button" onClick={toggleStatus} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DDE5EA] px-3 text-[9px] font-semibold text-[#60707D]"><CirclePause className="h-3.5 w-3.5" />{selectedAgent.status === 'inactive' ? '启用路由' : '暂停'}</button><button type="button" onClick={() => document.getElementById('agent-conversation')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#263B49] px-3 text-[9px] font-semibold text-white"><Play className="h-3.5 w-3.5" />对话使用</button></div></div>

          <section id="agent-conversation" className="mt-5 overflow-hidden rounded-2xl border border-[#DDE4FF] bg-[linear-gradient(135deg,#F8F9FF_0%,#F4FBFC_100%)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E8F7] px-4 py-3">
              <div>
                <h3 className="flex items-center gap-2 text-[12px] font-semibold text-[#35454F]"><Bot className="h-4 w-4 text-[#5267E8]" />对话使用与调试</h3>
                <p className="mt-1 text-[9px] text-[#7E8D98]">当前对话固定由此 Agent 承接，并展示 RAG、Skill、模型和审批步骤。</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${statusDefinition[selectedAgent.status].tone}`}>{statusDefinition[selectedAgent.status].label}</span>
            </div>
            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <div>
                <textarea value={testInput} onChange={event => setTestInput(event.target.value)} rows={5} placeholder="输入任务，测试当前 Agent…" className="w-full resize-y rounded-xl border border-[#DDE5EA] bg-white p-3 text-[10px] leading-5 text-[#4C5D68] outline-none focus:border-[#AEBBF4]" />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[8px] text-[#8A99A4]">测试会写入服务端 AgentRun，不使用前端模拟数据。</span>
                  <button type="button" onClick={runTest} disabled={isTesting || !testInput.trim()} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[9px] font-semibold text-white disabled:opacity-50"><Play className="h-3.5 w-3.5" />{isTesting ? '运行中…' : '发送给当前 Agent'}</button>
                </div>
              </div>
              <div className="min-h-[150px] rounded-xl border border-white bg-white/80 p-3">
                {testRun ? (
                  <>
                    <div className="flex items-center justify-between text-[9px] font-semibold text-[#4357C9]"><span>{testRun.agent_name} · v{testRun.agent_version}</span><span>{testRun.status}</span></div>
                    <p className="mt-2 text-[8px] leading-4 text-[#7B8994]">{testRun.route_reason}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{testRun.steps.map(step => <span key={step.id} className="rounded-lg bg-[#F1F4F8] px-2 py-1 text-[8px] text-[#687985]">{step.name} · {step.status}</span>)}</div>
                    <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap text-[9px] leading-5 text-[#52636E]">{testResult}</p>
                  </>
                ) : (
                  <div className="flex min-h-[126px] flex-col items-center justify-center text-center"><Sparkles className="h-5 w-5 text-[#7A8CEE]" /><p className="mt-2 text-[9px] font-semibold text-[#657580]">等待第一次真实运行</p><p className="mt-1 text-[8px] text-[#96A2AA]">结果和步骤会显示在这里</p></div>
                )}
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#F6F8FA] p-4"><span className="text-[9px] text-[#87959F]">真实运行</span><strong className="mt-1 block text-[20px] text-[#2F414C]">{selectedAgent.run_count}</strong></div><div className="rounded-2xl bg-[#F6F8FA] p-4"><span className="text-[9px] text-[#87959F]">成功率</span><strong className="mt-1 block text-[20px] text-[#2F414C]">{selectedAgent.success_rate}%</strong></div><div className="rounded-2xl bg-[#F6F8FA] p-4"><span className="text-[9px] text-[#87959F]">运行模型</span><div className="mt-2 flex gap-1.5"><input value={draftModel} onChange={event => setDraftModel(event.target.value)} aria-label="Agent 运行模型" className="h-8 min-w-0 flex-1 rounded-lg border border-[#DDE5EA] bg-white px-2 text-[9px] font-semibold text-[#2F414C] outline-none focus:border-[#AEBBF4]" /><button type="button" onClick={saveModel} disabled={!draftModel.trim() || draftModel.trim() === selectedAgent.model_id} className="rounded-lg bg-[#5267E8] px-2 text-[8px] font-semibold text-white disabled:opacity-35">保存</button></div></div></div>

          <section className="mt-5 rounded-2xl border border-[#E2E8ED] p-4"><div className="flex items-center justify-between"><div><h3 className="text-[12px] font-semibold text-[#35454F]">System Prompt</h3><p className="mt-1 text-[9px] text-[#87959F]">每次保存都会创建不可覆盖的新版本。</p></div><button type="button" onClick={savePrompt} disabled={draftPrompt === selectedAgent.current_prompt} className="flex h-8 items-center gap-1.5 rounded-xl bg-[#5267E8] px-3 text-[9px] font-semibold text-white disabled:opacity-40"><Save className="h-3.5 w-3.5" />发布新版本</button></div><textarea value={draftPrompt} onChange={event => setDraftPrompt(event.target.value)} rows={7} className="mt-3 w-full resize-y rounded-xl border border-[#E1E7EB] bg-[#FAFBFC] p-3 text-[10px] leading-5 text-[#4C5D68] outline-none focus:border-[#AEBBF4]" /></section>

          <div className="mt-5 grid gap-4 xl:grid-cols-2"><section className="rounded-2xl border border-[#E2E8ED] p-4"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[11px] font-semibold text-[#35454F]"><Zap className="h-4 w-4 text-[#B36F27]" />已绑定真实 Skills</h3><button type="button" onClick={() => setBindingMode('skill')} className="text-[9px] font-semibold text-[#5267E8]">管理绑定</button></div><div className="mt-3 space-y-2">{selectedAgent.skill_bindings.map(binding => <div key={binding.skill_id} className="rounded-xl bg-[#F8FAFB] p-3"><span className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold text-[#52636E]">{binding.name}</span><span className={`rounded-full px-2 py-0.5 text-[7px] font-semibold ${binding.regression_status === 'pending' ? 'bg-[#FFF0ED] text-[#C65345]' : 'bg-[#EAF7F1] text-[#21865D]'}`}>{binding.regression_status === 'pending' ? '待复测' : `v${binding.version}`}</span></span></div>)}{!selectedAgent.skill_bindings.length ? <p className="rounded-xl border border-dashed border-[#DDE5EA] p-4 text-center text-[9px] text-[#8B99A3]">未绑定 Skill，不再显示虚构工具。</p> : null}</div></section><section className="rounded-2xl border border-[#E2E8ED] p-4"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-[11px] font-semibold text-[#35454F]"><Database className="h-4 w-4 text-[#5267E8]" />RAG 知识库</h3><button type="button" onClick={() => setBindingMode('knowledge')} className="text-[9px] font-semibold text-[#5267E8]">管理绑定</button></div><div className="mt-3 space-y-2">{selectedAgent.knowledge_bindings.map(binding => <div key={binding.knowledge_base_id} className="rounded-xl bg-[#F8FAFB] p-3 text-[9px] font-semibold text-[#52636E]">{binding.name}<span className="ml-2 text-[8px] font-normal text-[#92A0A9]">Top {binding.top_k}</span></div>)}{!selectedAgent.knowledge_bindings.length ? <p className="rounded-xl border border-dashed border-[#DDE5EA] p-4 text-center text-[9px] text-[#8B99A3]">未绑定知识库，运行时会明确显示跳过 RAG。</p> : null}</div></section></div>
        </main>
      </div>

      <PlatformDialog open={showCreate} onClose={() => setShowCreate(false)} title="创建 Agent" description="先建立服务端草稿，再绑定真实 Skill 与知识库。" width="lg" footer={<><button type="button" onClick={() => setShowCreate(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D]">取消</button><button type="button" onClick={createAgent} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">创建草稿</button></>}><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-[9px] font-semibold text-[#60707D]">名称</span><input value={createForm.name} onChange={event => setCreateForm(current => ({ ...current, name: event.target.value }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[10px] outline-none" /></label><label><span className="mb-1.5 block text-[9px] font-semibold text-[#60707D]">类型</span><select value={createForm.category} onChange={event => setCreateForm(current => ({ ...current, category: event.target.value as AgentCategory }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[10px]">{Object.entries(categoryDefinition).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[9px] font-semibold text-[#60707D]">描述</span><input value={createForm.description} onChange={event => setCreateForm(current => ({ ...current, description: event.target.value }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[10px]" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[9px] font-semibold text-[#60707D]">System Prompt</span><textarea value={createForm.system_prompt} onChange={event => setCreateForm(current => ({ ...current, system_prompt: event.target.value }))} rows={6} className="w-full rounded-xl border border-[#DDE5EA] p-3 text-[10px] leading-5" /></label></div></PlatformDialog>

      <PlatformDialog open={Boolean(bindingMode)} onClose={() => setBindingMode(null)} title={bindingMode === 'skill' ? '绑定已安装 Skills' : '绑定真实知识库'} description={bindingMode === 'skill' ? '这里只显示 Skill 中心已安装且启用的能力。' : '绑定后运行时会执行真实向量检索。'} width="lg" footer={<button type="button" onClick={() => setBindingMode(null)} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">完成</button>}><div className="max-h-[460px] space-y-2 overflow-y-auto">{bindingMode === 'skill' ? skills.map(skill => { const active = selectedAgent.skill_bindings.some(item => item.skill_id === skill.id); return <button key={skill.id} type="button" onClick={() => toggleSkill(skill)} className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left ${active ? 'border-[#BFC9F7] bg-[#F0F2FF]' : 'border-[#E3E9EE]'}`}><span><span className="block text-[10px] font-semibold text-[#45545E]">{skill.name}</span><span className="mt-1 block text-[8px] leading-4 text-[#82909A]">{skill.description}</span><span className="mt-1 block text-[8px] text-[#9A7A5A]">风险 {skill.risk_level} · v{skill.installation?.version}</span></span>{active ? <Check className="h-4 w-4 text-[#5267E8]" /> : <Plus className="h-4 w-4 text-[#9AA7B0]" />}</button>; }) : knowledgeBases.map(knowledgeBase => { const active = selectedAgent.knowledge_bindings.some(item => item.knowledge_base_id === knowledgeBase.id); return <button key={knowledgeBase.id} type="button" onClick={() => toggleKnowledge(knowledgeBase)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${active ? 'border-[#BFC9F7] bg-[#F0F2FF]' : 'border-[#E3E9EE]'}`}><span><span className="block text-[10px] font-semibold text-[#45545E]">{knowledgeBase.name}</span><span className="mt-1 block text-[8px] text-[#82909A]">{knowledgeBase.description || `${knowledgeBase.document_count || 0} 个文档`}</span></span>{active ? <Check className="h-4 w-4 text-[#5267E8]" /> : <Plus className="h-4 w-4 text-[#9AA7B0]" />}</button>; })}{bindingMode === 'skill' && !skills.length ? <p className="p-8 text-center text-[10px] text-[#82909A]">Skill 中心暂无已安装能力，请先完成发现、预检和安装。</p> : null}</div></PlatformDialog>

      <PlatformDialog open={showTest} onClose={() => setShowTest(false)} title={`真实测试 · ${selectedAgent.name}`} description="测试会创建服务端 AgentRun，并记录每个 RAG、Skill 与模型步骤。" width="lg" footer={<><button type="button" onClick={() => setShowTest(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D]">关闭</button><button type="button" onClick={runTest} disabled={isTesting} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white disabled:opacity-50"><Play className="h-3.5 w-3.5" />{isTesting ? '运行中…' : '运行测试'}</button></>}><textarea value={testInput} onChange={event => setTestInput(event.target.value)} rows={5} className="w-full rounded-xl border border-[#DDE5EA] p-3 text-[10px] leading-5" />{testRun ? <div className="mt-4 rounded-2xl border border-[#DDE5FF] bg-[#F6F7FF] p-4"><div className="flex items-center justify-between text-[9px] font-semibold text-[#4357C9]"><span className="flex items-center gap-2"><Bot className="h-4 w-4" />{testRun.agent_name}</span><span>{statusDefinition[testRun.agent_status as keyof typeof statusDefinition]?.label || testRun.status}</span></div><div className="mt-3 flex flex-wrap gap-2">{testRun.steps.map(step => <span key={step.id} className="rounded-lg bg-white px-2 py-1 text-[8px] text-[#687985]">{step.name} · {step.status}</span>)}</div><p className="mt-3 whitespace-pre-wrap text-[10px] leading-6 text-[#52636E]">{testResult}</p></div> : null}</PlatformDialog>
    </div>
  );
}
