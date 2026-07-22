'use client';

import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Database,
  FileText,
  FolderKanban,
  MessageSquarePlus,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useDeferredValue, useRef, useState } from 'react';
import { type ViewType } from '@/lib/access-control';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { showToast } from './toast';

interface AssistantWorkspaceProps {
  onNavigate: (view: ViewType) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: number[];
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  time: string;
  messages: ChatMessage[];
}

const sources = [
  { id: 1, name: '广汽丰田品牌手册 2026', space: '企业知识库', updated: '2026-07-15', excerpt: '员工故事应以真实经历为基础，突出个人成长与组织价值之间的联系。' },
  { id: 2, name: '22 周年员工采访素材汇总', space: '22 周年文化传播', updated: '今天 09:30', excerpt: '受访者提到从一线岗位到项目负责人的成长过程，以及团队支持带来的改变。' },
  { id: 3, name: '优秀员工故事案例库', space: '团队知识库', updated: '2026-07-18', excerpt: '高表现内容通常使用具体场景开篇，并在结尾回到组织共同目标。' },
];

const storyMessages: ChatMessage[] = [
  { id: 'message-1', role: 'user', content: '根据员工采访素材，帮我整理一篇 22 周年员工故事初稿。语气真诚克制，重点写个人成长和团队支持。' },
  { id: 'message-2', role: 'assistant', content: '我已经结合品牌手册和采访素材整理了初稿结构。建议从一次具体的项目挑战切入，再展开个人成长、团队协作和组织价值，最后回到 22 周年的共同记忆。\n\n初稿已按“真实场景—关键转折—团队支持—共同目标”四段结构生成，并保留了采访中的事实表述。', citations: [1, 2, 3] },
];

const initialConversations: Conversation[] = [
  { id: 'conversation-1', title: '22 周年员工故事初稿', time: '10:42', messages: storyMessages },
  { id: 'conversation-2', title: '新员工培训活动方案', time: '昨天', messages: [{ id: 'c2-1', role: 'user', content: '帮我整理新员工文化融入活动方案。' }, { id: 'c2-2', role: 'assistant', content: '建议按“文化认知、场景体验、团队连接、行动承诺”四个模块设计，并把每个模块拆成可执行任务。', citations: [1] }] },
  { id: 'conversation-3', title: '品牌手册重点总结', time: '昨天', messages: [{ id: 'c3-1', role: 'user', content: '总结品牌手册里与员工内容相关的重点。' }, { id: 'c3-2', role: 'assistant', content: '已提取真实性、品牌一致性、事实引用和渠道规范四类要求。', citations: [1] }] },
  { id: 'conversation-4', title: '7 月内容选题分析', time: '周一', messages: [] },
  { id: 'conversation-5', title: '会议纪要行动项', time: '上周', messages: [] },
];

const assistantSystemPrompt = `你是 ECCP 企业文化内容创作助手。回答必须基于用户提供的事实，不能编造人物、数字或事件；信息不足时明确指出。使用简洁、真诚、克制的中文，并给出可直接执行的结构化结果。以下是当前可参考的企业知识摘要：\n${sources.map(source => `[资料 ${source.id}] ${source.name}：${source.excerpt}`).join('\n')}`;

async function requestAssistantResponse(messages: ChatMessage[]): Promise<{ content: string; model?: string }> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v4-pro',
      system: assistantSystemPrompt,
      messages: messages.map(message => ({ role: message.role, content: message.content })),
    }),
  });
  const data = await response.json() as { content?: string; model?: string; error?: string };
  if (!response.ok || !data.content) throw new Error(data.error || 'DeepSeek V4 未返回有效内容');
  return { content: data.content, model: data.model };
}

export function AssistantWorkspace({ onNavigate }: AssistantWorkspaceProps) {
  const [conversations, setConversations] = usePersistedState('eccp-assistant-conversations-v1', initialConversations);
  const [activeId, setActiveId] = useState(initialConversations[0].id);
  const [prompt, setPrompt] = useState('');
  const [conversationQuery, setConversationQuery] = useState('');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [helpfulIds, setHelpfulIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredConversationQuery = useDeferredValue(conversationQuery.trim().toLocaleLowerCase());
  const activeConversation = conversations.find(conversation => conversation.id === activeId) ?? conversations[0];
  const messages = activeConversation?.messages ?? [];
  const filteredConversations = conversations.filter(conversation => !deferredConversationQuery || conversation.title.toLocaleLowerCase().includes(deferredConversationQuery));

  const updateActiveMessages = (updater: (messages: ChatMessage[]) => ChatMessage[]) => {
    setConversations(current => current.map(conversation => conversation.id === activeId ? { ...conversation, messages: updater(conversation.messages), time: '刚刚' } : conversation));
  };

  const startNewConversation = () => {
    const conversation: Conversation = { id: `conversation-${Date.now()}`, title: `新对话 ${conversations.length + 1}`, time: '刚刚', messages: [] };
    setConversations(current => [conversation, ...current]);
    setActiveId(conversation.id);
    setPrompt('');
    setFileNames([]);
    setSaved(false);
    showToast('已开始新的对话', 'success');
  };

  const selectConversation = (conversation: Conversation) => {
    setActiveId(conversation.id);
    setPrompt('');
    setFileNames([]);
    setSaved(false);
  };

  const sendMessage = async () => {
    const content = prompt.trim();
    if (!content || isGenerating) return;
    const conversationId = activeId;
    const userMessage: ChatMessage = { id: `message-${Date.now()}`, role: 'user', content: fileNames.length ? `${content}\n\n附件：${fileNames.join('、')}` : content };
    const requestMessages = [...messages, userMessage];
    setConversations(current => current.map(conversation => conversation.id === conversationId ? { ...conversation, messages: requestMessages, time: '刚刚' } : conversation));
    if (!messages.length) {
      setConversations(current => current.map(conversation => conversation.id === conversationId ? { ...conversation, title: content.slice(0, 18) || conversation.title } : conversation));
    }
    setPrompt('');
    setFileNames([]);
    setIsGenerating(true);
    setSaved(false);

    try {
      const result = await requestAssistantResponse(requestMessages);
      const assistantMessage: ChatMessage = { id: `message-${Date.now()}-assistant`, role: 'assistant', content: result.content, citations: [1, 2, 3], model: result.model };
      setConversations(current => current.map(conversation => conversation.id === conversationId ? { ...conversation, messages: [...conversation.messages, assistantMessage], time: '刚刚' } : conversation));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'AI 服务请求失败', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateResponse = async () => {
    if (isGenerating) return;
    const conversationId = activeId;
    const lastAssistantIndex = messages.findLastIndex(message => message.role === 'assistant');
    if (lastAssistantIndex < 0) return;
    const requestMessages = messages.slice(0, lastAssistantIndex);
    if (!requestMessages.length || requestMessages[requestMessages.length - 1].role !== 'user') return;
    setIsGenerating(true);
    try {
      const result = await requestAssistantResponse(requestMessages);
      setConversations(current => current.map(conversation => conversation.id === conversationId ? {
        ...conversation,
        messages: conversation.messages.map((message, index) => index === lastAssistantIndex ? { ...message, content: result.content, model: result.model } : message),
        time: '刚刚',
      } : conversation));
      showToast('已通过 DeepSeek V4 重新生成', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '重新生成失败', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      showToast('回答已复制', 'success');
    } catch {
      showToast('复制失败，请手动选择文本', 'error');
    }
  };

  const handleFiles = (files: FileList | null) => {
    const names = Array.from(files ?? []).map(file => file.name);
    if (!names.length) return;
    setFileNames(current => Array.from(new Set([...current, ...names])));
    showToast(`已添加 ${names.length} 个附件`, 'success');
  };

  const saveToProject = () => {
    setSaved(true);
    showToast('对话与引用已保存到 22 周年文化传播项目', 'success');
  };

  return (
    <div className="grid h-full min-h-[calc(100vh-64px)] bg-[#F2F6F8] lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)_320px]">
      <aside className="hidden min-h-0 flex-col border-r border-[#E3E9EE] bg-[#F8FAFB] lg:flex">
        <div className="p-3">
          <button type="button" onClick={startNewConversation} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.18)]"><MessageSquarePlus className="h-4 w-4" strokeWidth={1.9} /> 新建对话</button>
          <label className="mt-3 flex h-9 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-white px-3 text-[#81909B]"><Search className="h-3.5 w-3.5" /><input value={conversationQuery} onChange={event => setConversationQuery(event.target.value)} aria-label="搜索对话" placeholder="搜索对话" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#9EABB4]" /></label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <div className="flex items-center justify-between px-2 py-2 text-[9px] font-semibold tracking-[0.08em] text-[#98A6B0]"><span>最近对话</span><span>{filteredConversations.length}</span></div>
          {filteredConversations.map(conversation => {
            const active = conversation.id === activeId;
            return <button key={conversation.id} type="button" aria-pressed={active} onClick={() => selectConversation(conversation)} className={`group mb-1 flex w-full items-start gap-2 rounded-xl p-2.5 text-left ${active ? 'bg-[#ECEFFF]' : 'hover:bg-[#EFF4F7]'}`}><span className="min-w-0 flex-1"><span className={`block truncate text-[11px] font-semibold ${active ? 'text-[#4357C9]' : 'text-[#4E5F6A]'}`}>{conversation.title}</span><span className="mt-1 block text-[9px] text-[#96A3AD]">{conversation.time}</span></span><MoreHorizontal className="h-3.5 w-3.5 shrink-0 text-[#A2AFB8] opacity-0 group-hover:opacity-100" /></button>;
          })}
          {!filteredConversations.length ? <div className="px-3 py-10 text-center text-[9px] leading-5 text-[#98A5AE]">没有找到匹配对话</div> : null}
        </div>
        <div className="border-t border-[#E4EAEE] p-3"><button type="button" onClick={() => onNavigate('agents')} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[10px] font-medium text-[#687985] hover:bg-[#EFF4F7]">管理 Agent <ChevronRight className="h-3.5 w-3.5" /></button></div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#E8EDF1] px-4 sm:px-6">
          <div className="min-w-0"><h2 className="truncate text-[13px] font-semibold text-[#263640]">{activeConversation?.title ?? '新对话'}</h2><p className="mt-0.5 text-[9px] text-[#8B9AA5]">企业知识库已开启 · 引用可追溯</p></div>
          <button type="button" onClick={saveToProject} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-medium ${saved ? 'border-[#CDE7DA] bg-[#EAF7F1] text-[#21865D]' : 'border-[#DDE5EA] text-[#60707D] hover:border-[#BCC9F5] hover:text-[#5267E8]'}`}>{saved ? <Check className="h-3.5 w-3.5" /> : <FolderKanban className="h-3.5 w-3.5" />}{saved ? '已保存' : '保存到项目'}</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFD_100%)]">
          <div className="mx-auto max-w-[820px] space-y-7 px-4 py-7 sm:px-8">
            {messages.length ? messages.map(message => (
              <article key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[88%] sm:max-w-[82%]' : 'max-w-full'}>
                {message.role === 'user' ? <div className="whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[#EEF1FF] px-4 py-3 text-[12px] leading-6 text-[#34435F]">{message.content}</div> : <div className="flex gap-3"><span className="ai-gradient mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"><Sparkles className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="whitespace-pre-wrap text-[13px] leading-7 text-[#30404A]">{message.content}</div>{message.model ? <span className="mt-2 inline-flex rounded-md bg-[#EEF1FF] px-2 py-1 text-[8px] font-semibold text-[#5267E8]">{message.model}</span> : null}{message.citations?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.citations.map(citation => <button key={citation} type="button" onClick={() => onNavigate('knowledge')} className="rounded-lg border border-[#DFE6EC] bg-[#F8FAFC] px-2 py-1 text-[9px] font-medium text-[#667985] hover:border-[#BFCBF5] hover:text-[#5267E8]">引用 {citation}</button>)}</div> : null}<div className="mt-3 flex items-center gap-1"><button type="button" aria-label="复制回答" onClick={() => copyMessage(message)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#82919C] hover:bg-[#F0F4F7] hover:text-[#5267E8]"><Copy className="h-3.5 w-3.5" /></button><button type="button" aria-label="回答有帮助" aria-pressed={helpfulIds.includes(message.id)} onClick={() => setHelpfulIds(current => current.includes(message.id) ? current.filter(id => id !== message.id) : [...current, message.id])} className={`flex h-7 w-7 items-center justify-center rounded-lg ${helpfulIds.includes(message.id) ? 'bg-[#EAF7F1] text-[#21865D]' : 'text-[#82919C] hover:bg-[#F0F4F7] hover:text-[#5267E8]'}`}><ThumbsUp className="h-3.5 w-3.5" /></button><button type="button" aria-label="重新生成" onClick={regenerateResponse} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#82919C] hover:bg-[#F0F4F7] hover:text-[#5267E8]"><RefreshCw className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onNavigate('scripts')} className="ml-1 rounded-lg px-2 py-1.5 text-[9px] font-semibold text-[#5267E8] hover:bg-[#F0F2FF]">继续编辑</button></div></div></div>}
              </article>
            )) : <div className="flex min-h-[340px] flex-col items-center justify-center text-center"><span className="ai-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white"><Sparkles className="h-5 w-5" /></span><h2 className="mt-4 text-[18px] font-semibold text-[#263640]">开始一个新的工作任务</h2><p className="mt-2 max-w-sm text-[11px] leading-5 text-[#7B8B96]">描述你要完成的工作，AI 会自动匹配知识、工具和输出方式。</p></div>}
            {isGenerating ? <div role="status" className="flex items-center gap-3 text-[11px] text-[#6F7F8A]"><span className="ai-gradient flex h-8 w-8 items-center justify-center rounded-xl text-white"><Sparkles className="h-4 w-4 animate-pulse" /></span> 正在读取资料并整理回答…</div> : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E8EDF1] bg-white p-3 sm:p-4">
          <div className="mx-auto max-w-[820px] rounded-2xl border border-[#DDE5EA] bg-white p-3 shadow-[0_10px_30px_rgba(40,58,74,0.08)] focus-within:border-[#AEBBF4]">
            <textarea value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') sendMessage(); }} rows={2} aria-label="向 AI 助手提问" placeholder="继续提问，或要求调整内容…" className="w-full resize-none bg-transparent text-[12px] leading-5 text-[#30404A] outline-none placeholder:text-[#9AA7B0]" />
            {fileNames.length ? <div className="mb-2 flex flex-wrap gap-1.5">{fileNames.map(fileName => <span key={fileName} className="flex max-w-full items-center gap-1.5 rounded-lg bg-[#F1F4F7] px-2 py-1 text-[8px] text-[#60707D]"><FileText className="h-3 w-3 text-[#5267E8]" /><span className="max-w-[160px] truncate">{fileName}</span><button type="button" aria-label={`移除 ${fileName}`} onClick={() => setFileNames(current => current.filter(item => item !== fileName))}><X className="h-3 w-3" /></button></span>)}</div> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2"><input ref={fileInputRef} type="file" multiple className="hidden" onChange={event => handleFiles(event.target.files)} /><button type="button" aria-label="添加文件" onClick={() => fileInputRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#73838E] hover:bg-[#F1F4F7] hover:text-[#5267E8]"><Paperclip className="h-4 w-4" /></button><button type="button" onClick={() => onNavigate('knowledge')} className="flex h-8 items-center gap-1.5 rounded-lg bg-[#F4F6FF] px-2.5 text-[9px] font-medium text-[#5267E8]"><Database className="h-3.5 w-3.5" /> 企业知识库</button><button type="button" onClick={sendMessage} disabled={!prompt.trim() || isGenerating} aria-label="发送消息" className="ai-gradient ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)] disabled:opacity-45"><ArrowUp className="h-4 w-4" strokeWidth={2} /></button></div>
          </div>
        </div>
      </main>

      <aside className="hidden min-h-0 flex-col border-l border-[#E3E9EE] bg-[#F8FAFB] 2xl:flex"><div className="border-b border-[#E3E9EE] px-4 py-4"><h3 className="flex items-center gap-2 text-[12px] font-semibold text-[#30404A]"><BookOpen className="h-4 w-4 text-[#5267E8]" /> 引用资料</h3><p className="mt-1 text-[9px] text-[#8998A3]">本次回答可使用 3 项资料</p></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">{sources.map(source => <button key={source.id} type="button" onClick={() => onNavigate('knowledge')} className="w-full rounded-2xl border border-[#E2E8ED] bg-white p-3 text-left shadow-[0_4px_14px_rgba(40,58,74,0.03)] hover:border-[#C4CEF5]"><div className="flex items-start gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF1FF] text-[9px] font-bold text-[#5267E8]">{source.id}</span><span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold leading-4 text-[#3B4B55]">{source.name}</span><span className="mt-1 block text-[9px] text-[#8796A1]">{source.space} · {source.updated}</span></span></div><span className="mt-3 block text-[9px] leading-5 text-[#73838E]">{source.excerpt}</span></button>)}</div><div className="border-t border-[#E3E9EE] p-3"><button type="button" onClick={() => onNavigate('knowledge')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE5EA] bg-white py-2 text-[10px] font-medium text-[#60707D] hover:text-[#5267E8]"><FileText className="h-3.5 w-3.5" /> 管理引用资料</button></div></aside>
    </div>
  );
}
