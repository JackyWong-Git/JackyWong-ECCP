'use client';

import {
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CirclePause,
  Database,
  FileCheck2,
  MessageSquareText,
  Play,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { type ComponentType, useDeferredValue, useState } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { PlatformDialog } from './platform-dialog';
import { showToast } from './toast';

type AgentCategory = 'content' | 'review' | 'analysis' | 'automation';
type AgentStatus = 'active' | 'inactive' | 'draft';

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  status: AgentStatus;
  model: string;
  prompt: string;
  tools: string[];
  knowledgeBases: string[];
  lastRun?: string;
  runCount: number;
  successRate: number;
}

const initialAgents: AgentConfig[] = [
  { id: '1', name: '员工故事创作 Agent', description: '根据员工素材生成符合品牌调性的故事稿件。', category: 'content', status: 'active', model: 'DeepSeek-V4-Pro', prompt: '你是广汽丰田的内容创作专家。请基于真实员工素材，使用真诚、克制、有细节的表达完成故事稿，并保留事实来源。', tools: ['品牌话术检测', '文风检测', 'SEO 优化'], knowledgeBases: ['品牌手册', '优秀案例库', '渠道规范'], lastRun: '2 小时前', runCount: 156, successRate: 94 },
  { id: '2', name: '素材初筛 Agent', description: '判断部门报送素材的质量、相关性与可用性。', category: 'review', status: 'active', model: 'Kimi-K2', prompt: '你是企业文化素材审核专家。请从真实性、完整性、传播价值和时效性四个方面给出评分与建议。', tools: ['质量评分', '重复检测', '标签提取'], knowledgeBases: ['素材标准', '部门报送记录'], lastRun: '30 分钟前', runCount: 892, successRate: 98 },
  { id: '3', name: '内容审核 Agent', description: '检查生成内容的品牌规范和法规风险。', category: 'review', status: 'active', model: 'DeepSeek-V4-Pro', prompt: '你是内容合规审核专家。请识别品牌表达、敏感词、广告法和事实引用风险，并逐项说明修改建议。', tools: ['敏感词检测', '品牌话术检测', '法规合规检查'], knowledgeBases: ['品牌手册', '法规知识库'], lastRun: '1 小时前', runCount: 423, successRate: 99 },
  { id: '4', name: '选题推荐 Agent', description: '结合外部热点和内部素材推荐传播选题。', category: 'analysis', status: 'active', model: 'DeepSeek-V4-Pro', prompt: '你是企业文化选题策划专家。请综合热点趋势、员工故事和项目节点，给出可执行的选题建议。', tools: ['热点追踪', '数据分析', '趋势预测'], knowledgeBases: ['行业热点库', '历史选题库', '部门报送记录'], lastRun: '4 小时前', runCount: 67, successRate: 88 },
  { id: '5', name: '复盘分析 Agent', description: '分析发布效果并生成复盘报告与优化建议。', category: 'analysis', status: 'inactive', model: 'Kimi-K2', prompt: '你是内容运营分析专家。请基于渠道数据总结表现、归因关键动作，并提供下一周期建议。', tools: ['数据采集', '效果分析', '报告生成'], knowledgeBases: ['历史数据', '行业基准'], lastRun: '3 天前', runCount: 34, successRate: 91 },
  { id: '6', name: '多渠道适配 Agent', description: '将同一内容适配为公众号、视频号和小红书版本。', category: 'automation', status: 'draft', model: 'DeepSeek-V4-Flash', prompt: '你是多渠道内容适配专家。请保留核心事实，并按目标渠道调整结构、字数、标题和互动方式。', tools: ['格式转换', '字数控制', '标签生成'], knowledgeBases: ['渠道规范', '优秀案例库'], runCount: 0, successRate: 0 },
];

const categoryDefinition: Record<AgentCategory, { label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; tone: string }> = {
  content: { label: '内容创作', icon: WandSparkles, tone: 'bg-[#F2EEFF] text-[#7357E6]' },
  review: { label: '审核检测', icon: ShieldCheck, tone: 'bg-[#EAF7F1] text-[#21865D]' },
  analysis: { label: '分析推荐', icon: BarChart3, tone: 'bg-[#E9F7FA] text-[#1994B1]' },
  automation: { label: '自动化', icon: Zap, tone: 'bg-[#FFF4E6] text-[#B36F27]' },
};

const statusDefinition: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  active: { label: '运行中', color: '#21865D', bg: '#EAF7F1' },
  inactive: { label: '已暂停', color: '#B36F27', bg: '#FFF4E6' },
  draft: { label: '草稿', color: '#657682', bg: '#EEF2F5' },
};

const availableTools = ['品牌话术检测', '文风检测', 'SEO 优化', '质量评分', '重复检测', '标签提取', '热点追踪', '数据分析', '法规合规检查', '格式转换'];
const availableKnowledgeBases = ['品牌手册', '优秀案例库', '法规知识库', '部门报送记录', '渠道规范', '行业热点库'];
const emptyForm = { name: '', description: '', category: 'content' as AgentCategory, model: 'DeepSeek-V4-Pro', prompt: '' };
const deepSeekModelIds: Record<string, 'deepseek-v4-pro' | 'deepseek-v4-flash'> = {
  'DeepSeek-V4-Pro': 'deepseek-v4-pro',
  'DeepSeek-V4-Flash': 'deepseek-v4-flash',
};

export function AgentManagement() {
  const [agents, setAgents] = usePersistedState('eccp-agents-v2', initialAgents);
  const [selectedId, setSelectedId] = useState(initialAgents[0].id);
  const [category, setCategory] = useState<'all' | AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [draftPrompt, setDraftPrompt] = useState(initialAgents[0].prompt);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [bindingMode, setBindingMode] = useState<'tool' | 'knowledge' | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [testInput, setTestInput] = useState('请根据采访素材生成一个员工故事开头。');
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedAgent = agents.find(agent => agent.id === selectedId) ?? agents[0];

  const filteredAgents = agents.filter(agent => {
    const matchesCategory = category === 'all' || agent.category === category;
    const matchesQuery = !deferredQuery || `${agent.name} ${agent.description} ${agent.model}`.toLocaleLowerCase().includes(deferredQuery);
    return matchesCategory && matchesQuery;
  });

  const updateAgent = (id: string, updater: (agent: AgentConfig) => AgentConfig) => {
    setAgents(current => current.map(agent => agent.id === id ? updater(agent) : agent));
  };

  const selectAgent = (agent: AgentConfig) => {
    setSelectedId(agent.id);
    setDraftPrompt(agent.prompt);
    setTestResult('');
  };

  const createAgent = () => {
    const name = createForm.name.trim();
    if (!name) {
      showToast('请填写 Agent 名称', 'error');
      return;
    }
    const agent: AgentConfig = {
      id: `agent-${Date.now()}`,
      name,
      description: createForm.description.trim() || '等待补充 Agent 能力说明',
      category: createForm.category,
      status: 'draft',
      model: createForm.model,
      prompt: createForm.prompt.trim() || '请在此定义 Agent 的角色、目标、输入和输出要求。',
      tools: [],
      knowledgeBases: [],
      runCount: 0,
      successRate: 0,
    };
    setAgents(current => [...current, agent]);
    setSelectedId(agent.id);
    setDraftPrompt(agent.prompt);
    setCategory('all');
    setCreateForm(emptyForm);
    setShowCreate(false);
    showToast('Agent 已创建，可继续绑定能力并测试', 'success');
  };

  const savePrompt = () => {
    updateAgent(selectedAgent.id, agent => ({ ...agent, prompt: draftPrompt.trim() }));
    showToast('System Prompt 已保存', 'success');
  };

  const toggleAgent = () => {
    const nextStatus: AgentStatus = selectedAgent.status === 'active' ? 'inactive' : 'active';
    updateAgent(selectedAgent.id, agent => ({ ...agent, status: nextStatus }));
    showToast(nextStatus === 'active' ? 'Agent 已启动' : 'Agent 已暂停', 'success');
  };

  const runTest = async () => {
    if (!testInput.trim()) {
      showToast('请输入测试内容', 'error');
      return;
    }
    const model = deepSeekModelIds[selectedAgent.model];
    if (!model) {
      showToast(`${selectedAgent.model} 尚未配置服务端凭证`, 'error');
      return;
    }

    setIsTesting(true);
    setTestResult('');
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, system: draftPrompt.trim() || selectedAgent.prompt, messages: [{ role: 'user', content: testInput.trim() }] }),
      });
      const data = await response.json() as { content?: string; error?: string };
      if (!response.ok || !data.content) throw new Error(data.error || '模型未返回有效内容');
      setTestResult(data.content);
      updateAgent(selectedAgent.id, agent => ({ ...agent, runCount: agent.runCount + 1, lastRun: '刚刚', successRate: agent.runCount ? Math.round((agent.successRate * agent.runCount + 100) / (agent.runCount + 1)) : 100 }));
      showToast('DeepSeek V4 测试运行完成', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Agent 测试失败', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const toggleBinding = (item: string) => {
    if (bindingMode === 'tool') {
      updateAgent(selectedAgent.id, agent => ({ ...agent, tools: agent.tools.includes(item) ? agent.tools.filter(tool => tool !== item) : [...agent.tools, item] }));
    } else if (bindingMode === 'knowledge') {
      updateAgent(selectedAgent.id, agent => ({ ...agent, knowledgeBases: agent.knowledgeBases.includes(item) ? agent.knowledgeBases.filter(base => base !== item) : [...agent.knowledgeBases, item] }));
    }
  };

  const removeBinding = (type: 'tool' | 'knowledge', item: string) => {
    updateAgent(selectedAgent.id, agent => type === 'tool' ? { ...agent, tools: agent.tools.filter(tool => tool !== item) } : { ...agent, knowledgeBases: agent.knowledgeBases.filter(base => base !== item) });
  };

  const deleteAgent = () => {
    const remaining = agents.filter(agent => agent.id !== selectedAgent.id);
    setAgents(remaining);
    setSelectedId(remaining[0]?.id ?? '');
    if (remaining[0]) setDraftPrompt(remaining[0].prompt);
    showToast(`${selectedAgent.name} 已删除`, 'info');
  };

  const activeCount = agents.filter(agent => agent.status === 'active').length;
  const totalRuns = agents.reduce((sum, agent) => sum + agent.runCount, 0);
  const averageSuccess = agents.filter(agent => agent.runCount).length ? Math.round(agents.filter(agent => agent.runCount).reduce((sum, agent) => sum + agent.successRate, 0) / agents.filter(agent => agent.runCount).length) : 0;
  const CategoryIcon = categoryDefinition[selectedAgent.category].icon;
  const selectedStatus = statusDefinition[selectedAgent.status];

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">平台管理</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">Agent 管理</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">配置角色、模型、Skill 与知识库，并在发布前完成测试验证。</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]"><Plus className="h-4 w-4" /> 新建 Agent</button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            { label: '运行中的 Agent', value: activeCount, detail: `共 ${agents.length} 个`, icon: Bot, tone: 'bg-[#EEF1FF] text-[#5267E8]' },
            { label: '累计运行', value: totalRuns.toLocaleString(), detail: '已记录任务链路', icon: Play, tone: 'bg-[#E9F7FA] text-[#1994B1]' },
            { label: '平均成功率', value: `${averageSuccess}%`, detail: '近 30 天测试结果', icon: Check, tone: 'bg-[#EAF7F1] text-[#21865D]' },
          ].map(stat => { const Icon = stat.icon; return <div key={stat.label} className="surface-card flex items-center gap-4 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span><span><strong className="block text-[20px] font-semibold tracking-[-0.03em] text-[#263640]">{stat.value}</strong><span className="mt-0.5 block text-[10px] text-[#81909B]">{stat.label} · {stat.detail}</span></span></div>; })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
          <section className="surface-card h-fit overflow-hidden">
            <div className="border-b border-[#E8EDF1] p-3">
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 focus-within:border-[#B8C4F5] focus-within:bg-white"><Search className="h-4 w-4 text-[#82919C]" /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索 Agent" placeholder="搜索 Agent 或模型" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#4D5E69] outline-none placeholder:text-[#9AA7B0]" /></label>
              <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto"><button type="button" onClick={() => setCategory('all')} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${category === 'all' ? 'bg-[#EEF1FF] text-[#5267E8]' : 'text-[#71818D] hover:bg-[#F2F5F7]'}`}>全部</button>{(Object.keys(categoryDefinition) as AgentCategory[]).map(categoryId => <button key={categoryId} type="button" onClick={() => setCategory(categoryId)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${category === categoryId ? 'bg-[#EEF1FF] text-[#5267E8]' : 'text-[#71818D] hover:bg-[#F2F5F7]'}`}>{categoryDefinition[categoryId].label}</button>)}</div>
            </div>
            <div className="max-h-[650px] space-y-1 overflow-y-auto p-2">
              {filteredAgents.map(agent => {
                const definition = categoryDefinition[agent.category];
                const Icon = definition.icon;
                const active = selectedAgent?.id === agent.id;
                return <button key={agent.id} type="button" aria-pressed={active} onClick={() => selectAgent(agent)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-[#C9D1FA] bg-[#F0F2FF]' : 'border-transparent hover:bg-[#F5F8FA]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white text-[#5267E8]' : definition.tone}`}><Icon className="h-4 w-4" strokeWidth={1.8} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-[11px] text-[#35454F]">{agent.name}</strong><span className={`h-2 w-2 shrink-0 rounded-full ${agent.status === 'active' ? 'bg-[#25A76F]' : agent.status === 'inactive' ? 'bg-[#E1A04D]' : 'bg-[#A6B2BA]'}`} /></span><span className="mt-1 block line-clamp-2 text-[9px] leading-4 text-[#85949F]">{agent.description}</span><span className="mt-2 flex items-center justify-between text-[9px] text-[#71818D]"><span>{agent.model}</span><span>{agent.runCount} 次运行</span></span></span></button>;
              })}
            </div>
          </section>

          {selectedAgent ? (
            <section className="surface-card min-w-0 overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#E8EDF1] p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${categoryDefinition[selectedAgent.category].tone}`}><CategoryIcon className="h-5 w-5" strokeWidth={1.8} /></span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><h3 className="text-[17px] font-semibold text-[#263640]">{selectedAgent.name}</h3><span className="rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ backgroundColor: selectedStatus.bg, color: selectedStatus.color }}>{selectedStatus.label}</span></span><p className="mt-1 text-[10px] leading-5 text-[#7D8D98]">{selectedAgent.description}</p></span></div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setShowTest(true); setTestResult(''); }} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DDE5EA] px-3 text-[10px] font-semibold text-[#60707D] hover:border-[#BFCBF5] hover:text-[#5267E8]"><MessageSquareText className="h-3.5 w-3.5" />测试运行</button><button type="button" onClick={toggleAgent} className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-semibold ${selectedAgent.status === 'active' ? 'bg-[#FFF4E6] text-[#B36F27]' : 'bg-[#5267E8] text-white'}`}>{selectedAgent.status === 'active' ? <CirclePause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{selectedAgent.status === 'active' ? '暂停' : '启动'}</button></div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between"><label htmlFor="agent-prompt" className="text-[11px] font-semibold text-[#4D5E69]">System Prompt</label><button type="button" onClick={savePrompt} className="flex items-center gap-1 text-[9px] font-semibold text-[#5267E8]"><Save className="h-3 w-3" />保存 Prompt</button></div>
                    <textarea id="agent-prompt" value={draftPrompt} onChange={event => setDraftPrompt(event.target.value)} rows={8} className="mt-2 w-full resize-y rounded-2xl border border-[#DDE5EA] bg-[#FCFDFE] p-3 text-[11px] leading-6 text-[#455660] outline-none focus:border-[#AEBBF4] focus:bg-white" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between"><h4 className="text-[11px] font-semibold text-[#4D5E69]">工具 / Skills</h4><button type="button" onClick={() => setBindingMode('tool')} className="flex items-center gap-1 text-[9px] font-semibold text-[#5267E8]"><Plus className="h-3 w-3" />管理绑定</button></div>
                    <div className="mt-2 flex flex-wrap gap-2">{selectedAgent.tools.map(tool => <span key={tool} className="flex items-center gap-1.5 rounded-lg bg-[#EEF1FF] px-2.5 py-1.5 text-[9px] font-medium text-[#5267E8]"><Zap className="h-3 w-3" />{tool}<button type="button" aria-label={`移除 ${tool}`} onClick={() => removeBinding('tool', tool)} className="ml-0.5 text-[#7D8CE3] hover:text-[#C44F55]"><X className="h-3 w-3" /></button></span>)}{!selectedAgent.tools.length ? <p className="text-[9px] text-[#98A5AE]">尚未绑定 Skill</p> : null}</div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between"><h4 className="text-[11px] font-semibold text-[#4D5E69]">知识库</h4><button type="button" onClick={() => setBindingMode('knowledge')} className="flex items-center gap-1 text-[9px] font-semibold text-[#5267E8]"><Plus className="h-3 w-3" />管理绑定</button></div>
                    <div className="mt-2 flex flex-wrap gap-2">{selectedAgent.knowledgeBases.map(base => <span key={base} className="flex items-center gap-1.5 rounded-lg bg-[#EAF7F1] px-2.5 py-1.5 text-[9px] font-medium text-[#21865D]"><Database className="h-3 w-3" />{base}<button type="button" aria-label={`移除 ${base}`} onClick={() => removeBinding('knowledge', base)} className="ml-0.5 text-[#5AA184] hover:text-[#C44F55]"><X className="h-3 w-3" /></button></span>)}{!selectedAgent.knowledgeBases.length ? <p className="text-[9px] text-[#98A5AE]">尚未绑定知识库</p> : null}</div>
                  </div>
                </div>

                <aside className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">{[
                    { label: '运行次数', value: selectedAgent.runCount.toLocaleString() },
                    { label: '成功率', value: `${selectedAgent.successRate}%` },
                    { label: '模型', value: selectedAgent.model },
                    { label: '上次运行', value: selectedAgent.lastRun ?? '从未' },
                  ].map(item => <div key={item.label} className="rounded-xl bg-[#F7F9FB] p-3"><span className="block text-[9px] text-[#8A99A4]">{item.label}</span><span className="mt-1 block truncate text-[10px] font-semibold text-[#455660]">{item.value}</span></div>)}</div>
                  <div className="rounded-2xl bg-[#F7F9FB] p-4"><h4 className="text-[10px] font-semibold text-[#60707D]">发布检查</h4><div className="mt-3 space-y-3">{[
                    { label: 'Prompt 已配置', done: Boolean(selectedAgent.prompt.trim()) },
                    { label: '已绑定 Skill', done: Boolean(selectedAgent.tools.length) },
                    { label: '已绑定知识库', done: Boolean(selectedAgent.knowledgeBases.length) },
                  ].map(item => <div key={item.label} className="flex items-center gap-2 text-[9px] text-[#60707D]"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${item.done ? 'bg-[#EAF7F1] text-[#21865D]' : 'bg-[#EEF2F5] text-[#98A5AE]'}`}>{item.done ? <Check className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</span>{item.label}</div>)}</div></div>
                  <div className="rounded-2xl border border-[#E4EAF0] p-4"><h4 className="flex items-center gap-2 text-[10px] font-semibold text-[#60707D]"><FileCheck2 className="h-3.5 w-3.5 text-[#5267E8]" />最近运行</h4><p className="mt-2 text-[9px] leading-5 text-[#8A99A4]">{selectedAgent.lastRun ? `${selectedAgent.lastRun} 完成一次任务，结果已进入人工确认。` : '尚无运行记录，请先执行测试。'}</p></div>
                  <button type="button" onClick={deleteAgent} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-semibold text-[#C44F55] hover:bg-[#FFF0F1]"><Trash2 className="h-3.5 w-3.5" />删除 Agent</button>
                </aside>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <PlatformDialog open={showCreate} onClose={() => setShowCreate(false)} title="新建 Agent" description="先定义职责和模型，创建后再绑定 Skill 与知识库。" footer={<><button type="button" onClick={() => setShowCreate(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D] hover:bg-[#EEF2F5]">取消</button><button type="button" onClick={createAgent} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">创建 Agent</button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">Agent 名称</span><input value={createForm.name} onChange={event => setCreateForm(current => ({ ...current, name: event.target.value }))} placeholder="例如：员工故事采访 Agent" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">能力说明</span><input value={createForm.description} onChange={event => setCreateForm(current => ({ ...current, description: event.target.value }))} placeholder="说明这个 Agent 负责完成什么工作" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">分类</span><select value={createForm.category} onChange={event => setCreateForm(current => ({ ...current, category: event.target.value as AgentCategory }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-white px-3 text-[11px] outline-none focus:border-[#AEBBF4]">{(Object.keys(categoryDefinition) as AgentCategory[]).map(item => <option key={item} value={item}>{categoryDefinition[item].label}</option>)}</select></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">模型</span><select value={createForm.model} onChange={event => setCreateForm(current => ({ ...current, model: event.target.value }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-white px-3 text-[11px] outline-none focus:border-[#AEBBF4]"><option>DeepSeek-V4-Pro</option><option>DeepSeek-V4-Flash</option><option>Kimi-K2</option><option>GPT-4.1</option></select></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">System Prompt</span><textarea value={createForm.prompt} onChange={event => setCreateForm(current => ({ ...current, prompt: event.target.value }))} rows={5} placeholder="定义角色、工作目标、约束和输出格式" className="w-full resize-none rounded-xl border border-[#DDE5EA] p-3 text-[11px] leading-5 outline-none focus:border-[#AEBBF4]" /></label></div>
      </PlatformDialog>

      <PlatformDialog open={Boolean(bindingMode)} onClose={() => setBindingMode(null)} title={bindingMode === 'tool' ? '绑定工具 / Skills' : '绑定知识库'} description="点击条目即可添加或取消绑定。" width="sm" footer={<button type="button" onClick={() => setBindingMode(null)} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">完成</button>}>
        <div className="space-y-2">{(bindingMode === 'tool' ? availableTools : availableKnowledgeBases).map(item => { const active = bindingMode === 'tool' ? selectedAgent.tools.includes(item) : selectedAgent.knowledgeBases.includes(item); return <button key={item} type="button" aria-pressed={active} onClick={() => toggleBinding(item)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-[11px] font-medium ${active ? 'border-[#BFC9F7] bg-[#F0F2FF] text-[#5267E8]' : 'border-[#E3E9EE] text-[#52636E] hover:bg-[#F7F9FB]'}`}><span className="flex items-center gap-2">{bindingMode === 'tool' ? <Zap className="h-4 w-4" /> : <Database className="h-4 w-4" />}{item}</span>{active ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-[#9AA7B0]" />}</button>; })}</div>
      </PlatformDialog>

      <PlatformDialog open={showTest} onClose={() => setShowTest(false)} title={`测试 ${selectedAgent.name}`} description={`使用 ${selectedAgent.model}、当前 Prompt、绑定能力和知识库运行真实测试。`} width="lg" footer={<><button type="button" onClick={() => setShowTest(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D] hover:bg-[#EEF2F5]">关闭</button><button type="button" onClick={runTest} disabled={isTesting} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white disabled:opacity-50"><Play className="h-3.5 w-3.5" />{isTesting ? '模型运行中…' : '运行测试'}</button></>}>
        <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">测试输入</span><textarea value={testInput} onChange={event => setTestInput(event.target.value)} rows={5} className="w-full resize-y rounded-xl border border-[#DDE5EA] p-3 text-[11px] leading-5 outline-none focus:border-[#AEBBF4]" /></label>{testResult ? <div role="status" className="mt-4 rounded-2xl border border-[#DDE5FF] bg-[#F6F7FF] p-4"><div className="flex items-center gap-2 text-[10px] font-semibold text-[#4357C9]"><Sparkles className="h-4 w-4" />测试输出</div><p className="mt-2 text-[11px] leading-6 text-[#52636E]">{testResult}</p></div> : null}
      </PlatformDialog>
    </div>
  );
}
