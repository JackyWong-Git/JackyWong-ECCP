'use client';

import {
  ArrowUp,
  Bot,
  Check,
  CircleCheck,
  Copy,
  Database,
  FileText,
  FolderKanban,
  MessageSquarePlus,
  Paperclip,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useDeferredValue, useRef, useState } from 'react';
import { type ViewType } from '@/lib/access-control';
import { executeAgentTask, type AgentReference, type AgentRun } from '@/lib/agent-runtime';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { showToast } from './toast';

interface AssistantWorkspaceProps {
  onNavigate: (view: ViewType) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  agentName?: string;
  citations?: number[];
}

interface Conversation {
  id: string;
  title: string;
  time: string;
  messages: ChatMessage[];
}

const firstConversation: Conversation = {
  id: 'conversation-initial',
  title: '新工作任务',
  time: '刚刚',
  messages: [],
};

const statusLabel: Record<string, string> = {
  running: '运行中',
  completed: '已完成',
  awaiting_approval: '等待人工审批',
  ready_for_execution: '等待 Worker 执行',
  rejected: '已拒绝',
  failed: '运行失败',
};

export function AssistantWorkspace({ onNavigate }: AssistantWorkspaceProps) {
  const [conversations, setConversations] = usePersistedState<Conversation[]>('eccp-assistant-conversations-v2', [firstConversation]);
  const [activeId, setActiveId] = useState(conversations[0]?.id || firstConversation.id);
  const [prompt, setPrompt] = useState('');
  const [query, setQuery] = useState('');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [references, setReferences] = useState<AgentReference[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const activeConversation = conversations.find(item => item.id === activeId) ?? conversations[0] ?? firstConversation;
  const filteredConversations = conversations.filter(item => !deferredQuery || item.title.toLocaleLowerCase().includes(deferredQuery));

  const updateConversation = (id: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations(current => current.map(item => item.id === id ? updater(item) : item));
  };

  const newConversation = () => {
    const conversation = { ...firstConversation, id: `conversation-${Date.now()}` };
    setConversations(current => [conversation, ...current]);
    setActiveId(conversation.id);
    setActiveRun(null);
    setReferences([]);
    setPrompt('');
  };

  const sendMessage = async () => {
    const content = prompt.trim();
    if (!content || isGenerating) return;
    const conversationId = activeId;
    const userMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      role: 'user',
      content: fileNames.length ? `${content}\n\n附件：${fileNames.join('、')}` : content,
    };
    const requestMessages = [...activeConversation.messages, userMessage];
    updateConversation(conversationId, conversation => ({
      ...conversation,
      title: conversation.messages.length ? conversation.title : content.slice(0, 18),
      time: '刚刚',
      messages: requestMessages,
    }));
    setPrompt('');
    setFileNames([]);
    setIsGenerating(true);
    try {
      const result = await executeAgentTask({
        source: 'assistant',
        conversation_id: conversationId,
        messages: requestMessages.map(message => ({ role: message.role, content: message.content })),
      });
      setActiveRun(result.run);
      setReferences(result.references);
      updateConversation(conversationId, conversation => ({
        ...conversation,
        messages: [...conversation.messages, {
          id: `message-${Date.now()}-assistant`,
          role: 'assistant',
          content: result.content,
          model: result.model,
          agentName: result.run.agent_name,
          citations: result.references.map((_, index) => index + 1),
        }],
      }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Agent 执行失败', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const decideApproval = async (decision: 'approved' | 'rejected') => {
    if (!activeRun?.approval) return;
    const response = await fetch(`/api/backend/v1/approvals/${activeRun.approval.id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note: decision === 'approved' ? 'AI 助手人工确认' : 'AI 助手人工拒绝' }),
    });
    const data = await response.json() as AgentRun & { error?: string; detail?: string };
    if (!response.ok) {
      showToast(data.error || data.detail || '审批操作失败', 'error');
      return;
    }
    setActiveRun(data);
    showToast(decision === 'approved' ? '已批准，等待受控 Worker 执行' : '已拒绝，Skill 未执行', 'success');
  };

  const handleFiles = (files: FileList | null) => {
    const names = Array.from(files ?? []).map(file => file.name);
    setFileNames(current => Array.from(new Set([...current, ...names])));
  };

  return (
    <div className="grid h-full min-h-[calc(100vh-64px)] bg-[#F2F6F8] lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)_320px]">
      <aside className="hidden min-h-0 flex-col border-r border-[#E3E9EE] bg-[#F8FAFB] lg:flex">
        <div className="p-3">
          <button type="button" onClick={newConversation} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-[11px] font-semibold text-white"><MessageSquarePlus className="h-4 w-4" /> 新建任务</button>
          <label className="mt-3 flex h-9 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-white px-3"><Search className="h-3.5 w-3.5 text-[#81909B]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索对话" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" /></label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {filteredConversations.map(conversation => <button key={conversation.id} type="button" onClick={() => { setActiveId(conversation.id); setActiveRun(null); setReferences([]); }} className={`mb-1 w-full rounded-xl p-2.5 text-left ${conversation.id === activeId ? 'bg-[#ECEFFF]' : 'hover:bg-[#EFF4F7]'}`}><span className="block truncate text-[10px] font-semibold text-[#4E5F6A]">{conversation.title}</span><span className="mt-1 block text-[8px] text-[#96A3AD]">{conversation.time}</span></button>)}
        </div>
        <div className="border-t border-[#E4EAEE] p-3"><button type="button" onClick={() => onNavigate('agents')} className="w-full rounded-xl px-2 py-2 text-left text-[10px] font-medium text-[#687985] hover:bg-[#EFF4F7]">管理 Agent</button></div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8EDF1] px-4 sm:px-6">
          <div className="min-w-0"><h2 className="truncate text-[13px] font-semibold text-[#263640]">{activeConversation.title}</h2><p className="mt-0.5 text-[9px] text-[#8B9AA5]">{activeRun ? `当前由 ${activeRun.agent_name} 承接 · Agent v${activeRun.agent_version}` : '任务会自动匹配 Agent、Skill 与知识库'}</p></div>
          <button type="button" onClick={() => { setSaved(true); showToast('对话和运行记录已保存', 'success'); }} className={`flex h-8 items-center gap-1.5 rounded-xl border px-3 text-[9px] font-medium ${saved ? 'border-[#CDE7DA] bg-[#EAF7F1] text-[#21865D]' : 'border-[#DDE5EA] text-[#60707D]'}`}>{saved ? <Check className="h-3.5 w-3.5" /> : <FolderKanban className="h-3.5 w-3.5" />}{saved ? '已保存' : '保存到项目'}</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFD_100%)]">
          <div className="mx-auto max-w-[820px] space-y-6 px-4 py-7 sm:px-8">
            {activeRun ? <section className="rounded-2xl border border-[#DCE3FF] bg-[#F7F8FF] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 text-[11px] font-semibold text-[#4054C9]"><Bot className="h-4 w-4" />{activeRun.agent_name}</span><span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-semibold text-[#6674A5]">{statusLabel[activeRun.status] || activeRun.status}</span></div>
              <p className="mt-2 text-[9px] leading-5 text-[#74809F]">{activeRun.route_reason}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{activeRun.steps.map(step => <div key={step.id} className="flex items-start gap-2 rounded-xl bg-white px-3 py-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${step.status === 'completed' ? 'bg-[#E8F7F0] text-[#21865D]' : step.status === 'blocked' ? 'bg-[#FFF0ED] text-[#C65345]' : 'bg-[#EEF1FF] text-[#5267E8]'}`}>{step.status === 'completed' ? <CircleCheck className="h-3 w-3" /> : step.status === 'blocked' ? <ShieldAlert className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}</span><span><span className="block text-[9px] font-semibold text-[#45545E]">{step.name}</span><span className="mt-0.5 block text-[8px] leading-4 text-[#84919A]">{step.output_summary || step.status}</span></span></div>)}</div>
              {activeRun.approval?.status === 'pending' ? <div className="mt-3 rounded-xl border border-[#F3D8C5] bg-[#FFF9F4] p-3"><p className="text-[9px] leading-5 text-[#8D613D]">{activeRun.approval.reason}</p><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => decideApproval('rejected')} className="h-8 rounded-lg px-3 text-[9px] font-semibold text-[#A15B52]">拒绝执行</button><button type="button" onClick={() => decideApproval('approved')} className="h-8 rounded-lg bg-[#5267E8] px-3 text-[9px] font-semibold text-white">批准进入队列</button></div></div> : null}
            </section> : null}

            {activeConversation.messages.length ? activeConversation.messages.map(message => <article key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[85%]' : ''}>{message.role === 'user' ? <div className="whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[#EEF1FF] px-4 py-3 text-[12px] leading-6 text-[#34435F]">{message.content}</div> : <div className="flex gap-3"><span className="ai-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"><Sparkles className="h-4 w-4" /></span><div className="min-w-0 flex-1">{message.agentName ? <p className="mb-1 text-[9px] font-semibold text-[#5267E8]">{message.agentName}</p> : null}<div className="whitespace-pre-wrap text-[13px] leading-7 text-[#30404A]">{message.content}</div><div className="mt-3 flex flex-wrap items-center gap-2">{message.model ? <span className="rounded-md bg-[#EEF1FF] px-2 py-1 text-[8px] font-semibold text-[#5267E8]">{message.model}</span> : null}{message.citations?.map(citation => <button key={citation} type="button" onClick={() => onNavigate('knowledge')} className="rounded-lg border border-[#DFE6EC] px-2 py-1 text-[8px] text-[#667985]">引用 {citation}</button>)}<button type="button" aria-label="复制回答" onClick={() => navigator.clipboard.writeText(message.content).then(() => showToast('回答已复制', 'success'))} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#82919C] hover:bg-[#F0F4F7]"><Copy className="h-3.5 w-3.5" /></button></div></div></div>}</article>) : <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><span className="ai-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white"><Sparkles className="h-5 w-5" /></span><h2 className="mt-4 text-[18px] font-semibold text-[#263640]">开始一个真实 Agent 任务</h2><p className="mt-2 max-w-md text-[11px] leading-5 text-[#7B8B96]">系统会展示由谁承接、检索了什么、解析了哪些 Skill，以及是否需要人工审批。</p></div>}
            {isGenerating ? <div className="flex items-center gap-3 text-[11px] text-[#6F7F8A]"><span className="ai-gradient flex h-8 w-8 items-center justify-center rounded-xl text-white"><Sparkles className="h-4 w-4 animate-pulse" /></span>正在路由 Agent 并执行任务…</div> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E8EDF1] bg-white p-3 sm:p-4"><div className="mx-auto max-w-[820px] rounded-2xl border border-[#DDE5EA] p-3 shadow-[0_10px_30px_rgba(40,58,74,0.08)]"><textarea value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') sendMessage(); }} rows={2} placeholder="描述任务，系统会自动选择 Agent…" className="w-full resize-none bg-transparent text-[12px] leading-5 outline-none" />{fileNames.length ? <div className="mb-2 flex flex-wrap gap-1.5">{fileNames.map(name => <span key={name} className="flex items-center gap-1 rounded-lg bg-[#F1F4F7] px-2 py-1 text-[8px]"><FileText className="h-3 w-3" />{name}<button type="button" onClick={() => setFileNames(current => current.filter(item => item !== name))}><X className="h-3 w-3" /></button></span>)}</div> : null}<div className="flex items-center gap-2"><input ref={fileInputRef} type="file" multiple className="hidden" onChange={event => handleFiles(event.target.files)} /><button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#73838E] hover:bg-[#F1F4F7]"><Paperclip className="h-4 w-4" /></button><button type="button" onClick={() => onNavigate('knowledge')} className="flex h-8 items-center gap-1.5 rounded-lg bg-[#F4F6FF] px-2.5 text-[9px] font-medium text-[#5267E8]"><Database className="h-3.5 w-3.5" /> 知识库</button><button type="button" onClick={sendMessage} disabled={!prompt.trim() || isGenerating} className="ai-gradient ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-white disabled:opacity-45"><ArrowUp className="h-4 w-4" /></button></div></div></div>
      </main>

      <aside className="hidden min-h-0 flex-col border-l border-[#E3E9EE] bg-[#F8FAFB] 2xl:flex"><div className="border-b border-[#E3E9EE] px-4 py-4"><h3 className="text-[12px] font-semibold text-[#30404A]">本次真实引用</h3><p className="mt-1 text-[9px] text-[#8998A3]">仅展示 RAG 实际命中的资料</p></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">{references.map((reference, index) => <button key={`${reference.document}-${index}`} type="button" onClick={() => onNavigate('knowledge')} className="w-full rounded-2xl border border-[#E2E8ED] bg-white p-3 text-left"><span className="text-[10px] font-semibold text-[#3B4B55]">{index + 1}. {reference.document}</span><span className="mt-1 block text-[8px] text-[#8796A1]">相关度 {Math.round(reference.score * 100)}%</span><span className="mt-2 line-clamp-4 block text-[9px] leading-5 text-[#73838E]">{reference.content}</span></button>)}{!references.length ? <div className="rounded-2xl border border-dashed border-[#DDE5EA] p-5 text-center text-[9px] leading-5 text-[#8B99A3]">本次尚未命中资料。请先为 Agent 绑定真实知识库。</div> : null}</div></aside>
    </div>
  );
}
