'use client';

import {
  ArrowUp,
  Bot,
  Check,
  ChevronRight,
  Database,
  FolderKanban,
  Globe2,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Route,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { executeAgentTask, type AgentRun } from '@/lib/agent-runtime';
import { type ViewType } from '@/lib/access-control';
import { type ContentTaskItem, workflowApi } from '@/lib/workflow-api';
import { showToast } from './toast';

interface MainAgentWorkspaceProps {
  onNavigate: (view: ViewType) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  run?: AgentRun;
}

interface ProjectDraft {
  name: string;
  request: string;
  plan: string;
}

interface AgentDraft {
  name: string;
  request: string;
  plan: string;
}

interface SkillDraft {
  url: string;
  request: string;
  plan: string;
}

interface ConversationRecord {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

type Complexity = 'simple' | 'normal' | 'complex';

const complexityOptions: Array<{ id: Complexity; label: string; detail: string; maxTokens: number }> = [
  { id: 'simple', label: '简单', detail: '快速答复', maxTokens: 500 },
  { id: 'normal', label: '普通', detail: '完整方案', maxTokens: 1200 },
  { id: 'complex', label: '复杂', detail: '深度规划', maxTokens: 2400 },
];

const starters = [
  { icon: FolderKanban, title: '创建宣传项目', prompt: '帮我创建一个 22 周年故事会宣传项目，先给方案再执行。' },
  { icon: Globe2, title: '搜索热点并策划', prompt: '搜索近期企业文化热点，结合我们的知识库形成 3 个可执行选题。' },
  { icon: WandSparkles, title: '创建专属 Agent', prompt: '帮我创建一个员工故事创作 Agent，先生成配置草案。' },
];

function projectNameFrom(input: string) {
  const normalized = input
    .replace(/^(请|帮我|我要|想要|现在)?\s*(创建|新建|发起|做一个|做一场)\s*/u, '')
    .replace(/(项目|活动)(，|,|。|；|;).*$/u, '$1')
    .trim();
  const match = normalized.match(/^(.{2,36}?)(项目|活动)/u);
  return match ? `${match[1]}${match[2]}` : (normalized.slice(0, 28) || '新宣传项目');
}

function isProjectIntent(input: string) {
  return /(创建|新建|发起|做一个|做一场).{0,24}(项目|活动)|(项目|活动).{0,12}(宣传|策划)/u.test(input);
}

function isAgentIntent(input: string) {
  return /(创建|新建|配置).{0,20}(Agent|agent|智能体)/u.test(input);
}

function isSkillIntent(input: string) {
  return /(添加|创建|新建|发现|安装|接入).{0,20}(Skill|skill|技能)/u.test(input);
}

function githubUrlFrom(input: string) {
  return input.match(/https:\/\/github\.com\/[^\s，。；]+/u)?.[0] || '';
}

function agentNameFrom(input: string) {
  const match = input.match(/(?:创建|新建|配置)(?:一个|一名)?\s*([^，。,.]{2,30}?)(?:\s*(?:Agent|agent|智能体))/u);
  return match?.[1]?.trim() ? `${match[1].trim()} Agent` : '企业内容协同 Agent';
}

export function MainAgentWorkspace({ onNavigate }: MainAgentWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState(`conversation-${Date.now()}`);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [agentDraft, setAgentDraft] = useState<AgentDraft | null>(null);
  const [skillDraft, setSkillDraft] = useState<SkillDraft | null>(null);
  const [createdTask, setCreatedTask] = useState<ContentTaskItem | null>(null);
  const [complexity, setComplexity] = useState<Complexity>('normal');
  const endRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('eccp-main-agent-conversations');
    try {
      const records = saved ? JSON.parse(saved) as ConversationRecord[] : [];
      if (records.length) {
        setConversations(records);
        setActiveConversationId(records[0].id);
        setMessages(records[0].messages);
      }
    } catch {
      window.localStorage.removeItem('eccp-main-agent-conversations');
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    setConversations(current => {
      const firstUserMessage = messages.find(message => message.role === 'user')?.content;
      const record: ConversationRecord = {
        id: activeConversationId,
        title: firstUserMessage?.slice(0, 24) || '新对话',
        messages: messages.slice(-40),
        updatedAt: new Date().toISOString(),
      };
      const next = [record, ...current.filter(item => item.id !== activeConversationId)].slice(0, 20);
      window.localStorage.setItem('eccp-main-agent-conversations', JSON.stringify(next));
      return next;
    });
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationId, messages, draft, agentDraft, skillDraft, createdTask]);

  const startConversation = () => {
    if (loading) return;
    setActiveConversationId(`conversation-${Date.now()}`);
    setMessages([]);
    setDraft(null);
    setAgentDraft(null);
    setSkillDraft(null);
    setCreatedTask(null);
  };

  const openConversation = (conversation: ConversationRecord) => {
    if (loading) return;
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setDraft(null);
    setAgentDraft(null);
    setSkillDraft(null);
    setCreatedTask(null);
  };

  const send = async (preset?: string) => {
    const content = (preset || prompt).trim();
    if (!content || submittingRef.current) return;
    submittingRef.current = true;
    setPrompt('');
    setDraft(null);
    setAgentDraft(null);
    setSkillDraft(null);
    setCreatedTask(null);
    setMessages(current => [...current, { id: `user-${Date.now()}`, role: 'user', content }]);
    setLoading(true);
    try {
      const agentIntent = isAgentIntent(content);
      const skillIntent = isSkillIntent(content);
      const projectIntent = !agentIntent && !skillIntent && isProjectIntent(content);
      const selectedComplexity = complexityOptions.find(item => item.id === complexity) || complexityOptions[1];
      const skillUrl = skillIntent ? githubUrlFrom(content) : '';
      const result = await executeAgentTask({
        source: 'assistant',
        conversation_id: activeConversationId,
        web_enabled: true,
        knowledge_enabled: true,
        max_tokens: selectedComplexity.maxTokens,
        temperature: complexity === 'simple' ? 0.3 : complexity === 'complex' ? 0.65 : 0.5,
        input_text: agentIntent
          ? [
              '你是 ECCP 主 Agent。用户希望创建一个业务 Agent。',
              '请输出可确认的配置草案，包含：名称、职责、路由关键词、适用业务、系统提示词摘要、建议绑定的 Skill 与知识库。',
              '此时只规划，不要声称已经创建。',
              `用户需求：${content}`,
            ].join('\n')
          : skillIntent
            ? [
                '你是 ECCP 主 Agent。用户希望接入一个 Skill。',
                '请说明该 Skill 的预期用途、适用业务、潜在权限和安全风险。',
                skillUrl ? `待发现的 GitHub 地址：${skillUrl}` : '用户尚未提供 GitHub 仓库或 Skill 目录地址，请明确要求用户补充地址。',
                '此时不要声称已经安装。',
                `用户需求：${content}`,
              ].join('\n')
            : projectIntent
          ? [
              '你是 ECCP 企业内容协同平台的主 Agent。',
              '用户希望创建项目。请先理解真实业务目标，输出简明项目方案，必须包含：目标、受众、关键阶段、建议 Agent/Skill/RAG、首批任务、需要用户确认的风险。',
              '此时只规划，不要声称已经创建或执行。',
              `用户需求：${content}`,
            ].join('\n')
          : [
              '你是 ECCP 企业内容协同平台的主 Agent，负责理解需求、调度能力并把结果沉淀到业务。',
              '请给出可执行答复；涉及创建、发布或配置等有副作用的操作，必须先征得用户确认。',
              `用户需求：${content}`,
            ].join('\n'),
      });
      setMessages(current => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.content,
        agentName: result.run.agent_name,
        run: result.run,
      }]);
      if (projectIntent) setDraft({ name: projectNameFrom(content), request: content, plan: result.content });
      if (agentIntent) setAgentDraft({ name: agentNameFrom(content), request: content, plan: result.content });
      if (skillIntent && skillUrl) setSkillDraft({ url: skillUrl, request: content, plan: result.content });
    } catch (error) {
      showToast(error instanceof Error ? error.message : '主 Agent 暂时不可用', 'error');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const confirmAgent = async () => {
    if (!agentDraft || creating) return;
    setCreating(true);
    try {
      const created = await workflowApi<{ id: string; name: string }>('agents', {
        method: 'POST',
        body: JSON.stringify({
          name: agentDraft.name,
          description: agentDraft.request,
          category: 'content',
          system_prompt: `你是“${agentDraft.name}”。请围绕以下职责工作：${agentDraft.request}。执行前先理解目标，涉及发布、配置和外部写入时必须请求人工确认。`,
          routing_keywords: ['企业文化', '内容创作', agentDraft.name.replace(/\s*Agent$/u, '')],
          business_keys: ['content_creation'],
        }),
      });
      setAgentDraft(null);
      setMessages(current => [...current, {
        id: `assistant-agent-${Date.now()}`,
        role: 'assistant',
        agentName: 'ECCP 主 Agent',
        content: `Agent“${created.name}”已创建为草稿。下一步可在创作编排室绑定 Skill、知识库并完成测试后发布。`,
      }]);
      showToast('Agent 草稿已创建', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Agent 创建失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  const confirmSkillDiscovery = async () => {
    if (!skillDraft || creating) return;
    setCreating(true);
    try {
      const discovered = await workflowApi<{ discovered: number; new_releases: number }>('skills/discover', {
        method: 'POST',
        body: JSON.stringify({ url: skillDraft.url }),
      });
      setSkillDraft(null);
      setMessages(current => [...current, {
        id: `assistant-skill-${Date.now()}`,
        role: 'assistant',
        agentName: 'ECCP 主 Agent',
        content: `已从仓库发现 ${discovered.discovered} 个 Skill，新增 ${discovered.new_releases} 个版本。它们已登记到 Skill 能力中心；安装前仍需完成风险预检和人工确认。`,
      }]);
      showToast('Skill 已发现并登记', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Skill 发现失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  const confirmProject = async () => {
    if (!draft || creating) return;
    setCreating(true);
    try {
      const task = await workflowApi<ContentTaskItem>('content-tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `${draft.name} · 项目启动与计划确认`,
          description: `${draft.request}\n\n主 Agent 项目方案：\n${draft.plan}`,
          project_name: draft.name,
          priority: 'high',
          owner_name: '待分配',
          ai_created: true,
        }),
      });
      setCreatedTask(task);
      setDraft(null);
      setMessages(current => [...current, {
        id: `assistant-project-${Date.now()}`,
        role: 'assistant',
        agentName: 'ECCP 主 Agent',
        content: `项目“${task.project_name}”已创建，并已生成首个 Agent 任务“${task.title}”。后续产出将继续归档到这个项目下。`,
      }]);
      showToast('项目与首个 Agent 任务已保存', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '项目创建失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_20%_0%,#EEF1FF_0,transparent_32%),linear-gradient(180deg,#F7FAFC_0%,#EEF4F6_100%)] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-[1500px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(38,57,72,0.07)] backdrop-blur xl:block">
          <div className="flex items-center gap-3">
            <span className="ai-gradient flex h-10 w-10 items-center justify-center rounded-2xl text-white"><Sparkles className="h-5 w-5" /></span>
            <div><p className="text-[12px] font-semibold text-[#263943]">ECCP 主 Agent</p><p className="mt-0.5 text-[9px] text-[#84939E]">平台级任务协调者</p></div>
          </div>
          <button type="button" onClick={startConversation} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#EEF0FF] text-[10px] font-semibold text-[#5267E8]"><Plus className="h-4 w-4" />新建对话</button>
          <div className="mt-5">
            <div className="flex items-center justify-between px-1"><p className="text-[9px] font-semibold text-[#60717C]">对话记录</p><span className="text-[8px] text-[#9AA8B3]">{conversations.length}</span></div>
            <div className="no-scrollbar mt-2 max-h-48 space-y-1 overflow-y-auto">
              {conversations.filter(item => item.messages.length).map(conversation => (
                <button key={conversation.id} type="button" onClick={() => openConversation(conversation)} className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${conversation.id === activeConversationId ? 'bg-[#EEF0FF] text-[#4257D2]' : 'text-[#657681] hover:bg-[#F3F6F8]'}`}>
                  <span className="block truncate text-[9px] font-medium">{conversation.title}</span>
                  <span className="mt-1 block text-[7px] opacity-65">{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(conversation.updatedAt))}</span>
                </button>
              ))}
              {!conversations.some(item => item.messages.length) ? <p className="px-3 py-4 text-center text-[8px] text-[#9AA8B3]">发送消息后会保存在这里</p> : null}
            </div>
          </div>
          <div className="mt-6 space-y-3 border-t border-[#E8EDF1] pt-5">
            {[
              { icon: MessageSquareText, title: '理解业务需求', detail: '识别目标、受众与交付物' },
              { icon: Route, title: '规划执行路径', detail: '选择 Agent、Skill 与知识库' },
              { icon: FolderKanban, title: '沉淀项目成果', detail: '确认后写入项目与任务' },
            ].map(item => <div key={item.title} className="rounded-2xl border border-[#E8EDF1] bg-white p-3.5"><item.icon className="h-4 w-4 text-[#5267E8]" /><p className="mt-3 text-[10px] font-semibold text-[#40515C]">{item.title}</p><p className="mt-1 text-[9px] leading-5 text-[#8796A1]">{item.detail}</p></div>)}
          </div>
          <div className="mt-6 rounded-2xl bg-[#F2F4FF] p-4">
            <p className="text-[9px] font-semibold text-[#5267E8]">操作原则</p>
            <p className="mt-2 text-[9px] leading-5 text-[#697A87]">搜索和分析可直接执行；创建项目、修改配置和发布内容必须由你确认。</p>
          </div>
        </aside>

        <section className="flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/90 bg-white shadow-[0_22px_65px_rgba(38,57,72,0.09)]">
          <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#E8EDF1] px-5 sm:px-6">
            <span className="ai-gradient flex h-10 w-10 items-center justify-center rounded-2xl text-white"><Bot className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><h1 className="text-[14px] font-semibold text-[#263943]">主 Agent</h1><p className="mt-0.5 truncate text-[9px] text-[#83929D]">从一句需求开始，规划、确认、执行并沉淀到项目</p></div>
            <select
              aria-label="切换历史对话"
              value={activeConversationId}
              onChange={event => {
                const conversation = conversations.find(item => item.id === event.target.value);
                if (conversation) openConversation(conversation);
              }}
              className="hidden h-9 max-w-36 rounded-xl border border-[#E1E8ED] bg-white px-2 text-[9px] text-[#60717C] sm:block xl:hidden"
            >
              {conversations.filter(item => item.messages.length).map(conversation => <option key={conversation.id} value={conversation.id}>{conversation.title}</option>)}
              {!conversations.some(item => item.messages.length) ? <option value={activeConversationId}>新对话</option> : null}
            </select>
            <button type="button" onClick={startConversation} aria-label="新建对话" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E1E8ED] text-[#5267E8] xl:hidden"><Plus className="h-4 w-4" /></button>
            <span className="flex items-center gap-1.5 rounded-full bg-[#EAF7F1] px-3 py-1.5 text-[9px] font-semibold text-[#21865D]"><span className="h-1.5 w-1.5 rounded-full bg-[#2EB67D]" />可用</span>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            {!messages.length ? (
              <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-8">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-[#5267E8]">MAIN AGENT</p>
                <h2 className="mt-3 text-[28px] font-semibold leading-[1.35] tracking-[-0.04em] text-[#1E303B] sm:text-[36px]">今天想推进什么工作？</h2>
                <p className="mt-3 max-w-xl text-[11px] leading-6 text-[#71818D]">告诉我目标即可。我会先理解需求并给出计划；确认后，再创建项目、调度 Agent 和保存成果。</p>
                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {starters.map(item => <button key={item.title} type="button" onClick={() => void send(item.prompt)} className="group rounded-2xl border border-[#E2E8ED] bg-[#FBFCFD] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#BFC9F6] hover:bg-white hover:shadow-[0_12px_28px_rgba(64,82,140,0.09)]"><item.icon className="h-5 w-5 text-[#5267E8]" /><p className="mt-4 text-[10px] font-semibold text-[#40515C]">{item.title}</p><p className="mt-2 text-[9px] leading-5 text-[#8796A1]">{item.prompt}</p></button>)}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map(message => (
                  <div key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[82%]' : 'max-w-[96%]'}>
                    {message.role === 'user' ? <div className="rounded-[20px] rounded-tr-md bg-[#EEF0FF] px-4 py-3 text-[11px] leading-6 text-[#34445F]">{message.content}</div> : <div className="flex gap-3"><span className="ai-gradient mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"><Bot className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-semibold text-[#5267E8]">{message.agentName || '主 Agent'}</p><p className="mt-2 whitespace-pre-wrap text-[11px] leading-7 text-[#40515C]">{message.content}</p>{message.run ? <div className="mt-3 flex flex-wrap gap-1.5">{message.run.steps.slice(0, 5).map(step => <span key={step.id} className="rounded-lg border border-[#E4E9F8] bg-[#F8F9FF] px-2 py-1 text-[8px] text-[#6B7A90]">{step.name} · {step.status}</span>)}</div> : null}</div></div>}
                  </div>
                ))}
                {loading ? <div className="flex items-center gap-3 text-[10px] text-[#71818D]"><span className="ai-gradient flex h-8 w-8 items-center justify-center rounded-xl text-white"><LoaderCircle className="h-4 w-4 animate-spin" /></span>正在理解需求并匹配 Agent、搜索与知识库…</div> : null}
                {draft ? <div className="ml-11 rounded-[22px] border border-[#C9D2F8] bg-[linear-gradient(135deg,#F7F8FF,#F4FBFA)] p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#5267E8] shadow-sm"><FolderKanban className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold text-[#334651]">准备创建项目</p><p className="mt-1 text-[13px] font-semibold text-[#263943]">{draft.name}</p><p className="mt-2 text-[9px] leading-5 text-[#71818D]">确认后将项目方案和首个任务写入数据库。之后生成的大纲、脚本和发布任务都可归档到该项目。</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={creating} onClick={() => void confirmProject()} className="ai-gradient flex h-9 items-center gap-2 rounded-xl px-4 text-[10px] font-semibold text-white disabled:opacity-60">{creating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}确认创建</button><button type="button" onClick={() => setDraft(null)} className="h-9 rounded-xl border border-[#DDE4EA] bg-white px-4 text-[10px] font-semibold text-[#71818D]">暂不创建</button></div></div> : null}
                {agentDraft ? <div className="ml-11 rounded-[22px] border border-[#C9D2F8] bg-[linear-gradient(135deg,#F7F8FF,#F4FBFA)] p-4"><div className="flex items-start gap-3"><span className="ai-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"><Bot className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold text-[#334651]">准备创建 Agent 草稿</p><p className="mt-1 text-[13px] font-semibold text-[#263943]">{agentDraft.name}</p><p className="mt-2 text-[9px] leading-5 text-[#71818D]">确认后写入 Agent 工作室。创建后仍需绑定 Skill、知识库并测试，系统不会直接发布。</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={creating} onClick={() => void confirmAgent()} className="ai-gradient flex h-9 items-center gap-2 rounded-xl px-4 text-[10px] font-semibold text-white disabled:opacity-60">{creating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}确认创建 Agent</button><button type="button" onClick={() => setAgentDraft(null)} className="h-9 rounded-xl border border-[#DDE4EA] bg-white px-4 text-[10px] font-semibold text-[#71818D]">取消</button></div></div> : null}
                {skillDraft ? <div className="ml-11 rounded-[22px] border border-[#D8E9E3] bg-[#F4FBF8] p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#21865D] shadow-sm"><WandSparkles className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold text-[#2C5948]">准备发现 Skill</p><p className="mt-1 break-all text-[9px] font-medium text-[#526E63]">{skillDraft.url}</p><p className="mt-2 text-[9px] leading-5 text-[#718C81]">确认后只扫描并登记，不会自动安装。登记后需在 Skill 能力中心完成风险预检。</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={creating} onClick={() => void confirmSkillDiscovery()} className="flex h-9 items-center gap-2 rounded-xl bg-[#21865D] px-4 text-[10px] font-semibold text-white disabled:opacity-60">{creating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}确认发现</button><button type="button" onClick={() => setSkillDraft(null)} className="h-9 rounded-xl border border-[#D7E7E1] bg-white px-4 text-[10px] font-semibold text-[#718C81]">取消</button></div></div> : null}
                {createdTask ? <button type="button" onClick={() => onNavigate('tasks')} className="ml-11 flex w-[calc(100%-2.75rem)] items-center gap-3 rounded-[20px] border border-[#D7E9E1] bg-[#F4FBF8] p-4 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#21865D]"><Check className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold text-[#2C5948]">已保存到 Agent 任务中心</span><span className="mt-1 block truncate text-[9px] text-[#718C81]">{createdTask.project_name} · {createdTask.title}</span></span><ChevronRight className="h-4 w-4 text-[#5F8B7A]" /></button> : null}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-[#E8EDF1] bg-white p-3 sm:p-4">
            <div className="mx-auto max-w-3xl rounded-[20px] border border-[#DCE4EA] bg-[#FAFCFD] p-2.5 shadow-[0_8px_24px_rgba(38,57,72,0.05)] focus-within:border-[#AEBBF4]">
              <textarea value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void send(); }} rows={2} placeholder="描述你的目标，例如：创建 22 周年故事会宣传项目…" className="w-full resize-none bg-transparent px-2 py-1 text-[11px] leading-6 text-[#34454F] outline-none" />
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex rounded-xl bg-[#EEF2F5] p-1">
                  {complexityOptions.map(option => <button key={option.id} type="button" title={option.detail} onClick={() => setComplexity(option.id)} className={`rounded-lg px-2.5 py-1.5 text-[8px] font-semibold transition-colors ${complexity === option.id ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}>{option.label}</button>)}
                </div>
                <span className="hidden text-[8px] text-[#96A3AD] sm:block">创建与安装前会请你确认</span>
                <button type="button" onClick={() => void send()} disabled={!prompt.trim() || loading} className="ai-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
              </div>
            </div>
          </footer>
        </section>

        <aside className="hidden space-y-4 xl:block">
          <div className="rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(38,57,72,0.07)] backdrop-blur">
            <p className="text-[10px] font-semibold text-[#40515C]">当前能力链</p>
            <div className="mt-4 space-y-2.5">{[{ icon: Globe2, label: '外部热点搜索', state: '按需调用' }, { icon: Database, label: '企业知识库', state: '自动检索' }, { icon: Route, label: 'Agent 路由', state: '动态匹配' }].map(item => <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[#F6F8FA] p-3"><item.icon className="h-4 w-4 text-[#5267E8]" /><span className="min-w-0 flex-1 text-[9px] font-medium text-[#52636E]">{item.label}</span><span className="text-[8px] text-[#8A99A4]">{item.state}</span></div>)}</div>
          </div>
          <button type="button" onClick={() => onNavigate('tasks')} className="flex w-full items-center gap-3 rounded-[22px] border border-[#DDE4EA] bg-white p-4 text-left shadow-[0_12px_34px_rgba(38,57,72,0.05)]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF0FF] text-[#5267E8]"><FolderKanban className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold text-[#40515C]">Agent 任务中心</span><span className="mt-1 block text-[8px] text-[#8796A1]">查看运行与业务任务</span></span><ChevronRight className="h-4 w-4 text-[#91A0AA]" /></button>
        </aside>
      </div>
    </div>
  );
}
