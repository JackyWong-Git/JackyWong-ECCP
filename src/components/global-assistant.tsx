'use client';

import {
  ArrowUp,
  Bot,
  ChevronRight,
  CircleCheck,
  Database,
  Maximize2,
  MessageCircle,
  Minimize2,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { executeAgentTask, type AgentRun } from '@/lib/agent-runtime';
import { type ViewType } from '@/lib/access-control';
import { showToast } from './toast';

interface GlobalAssistantProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
}

const viewContext: Record<ViewType, { label: string; guidance: string; suggestions: string[] }> = {
  home: {
    label: '工作台',
    guidance: '帮助用户了解平台状态、调度跨模块任务和处理待办，不直接修改高风险配置。',
    suggestions: ['检查今天需要处理的事项', '帮我规划一个跨模块任务'],
  },
  studio: {
    label: '智能创作',
    guidance: '帮助用户检索素材、完善选题、生成或改写内容，并说明后续审核发布步骤。',
    suggestions: ['帮我优化当前创作思路', '检查内容是否适合多渠道发布'],
  },
  agents: {
    label: 'Agent 工作室',
    guidance: '帮助用户创建、配置、测试 Agent，并推荐合适的 Skill、RAG 和审批规则。',
    suggestions: ['帮我设计一个小红书 Agent', '检查当前 Agent 配置是否完整'],
  },
  tasks: {
    label: '任务中心',
    guidance: '帮助用户解释任务状态、梳理阻塞点和下一步操作。',
    suggestions: ['帮我判断哪些任务最紧急', '解释待审批任务的风险'],
  },
  campaigns: {
    label: '活动宣传',
    guidance: '帮助用户拆解活动传播计划、内容节点和渠道任务。',
    suggestions: ['帮我检查活动传播节奏', '生成活动物料清单'],
  },
  knowledge: {
    label: '文件与知识库',
    guidance: '帮助用户导入资料、优化切片、测试召回和排查知识缺口。',
    suggestions: ['如何提高当前知识库召回率', '帮我规划资料分类'],
  },
  requests: {
    label: '协作与报送',
    guidance: '帮助用户完善报送要求、整理协作者和跟进材料。',
    suggestions: ['帮我写一份素材报送通知', '检查报送信息是否完整'],
  },
  topics: {
    label: '选题中心',
    guidance: '帮助用户搜索和评估内外部选题，形成可执行的内容方向。',
    suggestions: ['帮我评估当前选题', '给我一个外部热点搜索方案'],
  },
  scripts: {
    label: '我的作品',
    guidance: '帮助用户编辑作品、检查规范并准备审核发布。',
    suggestions: ['帮我检查作品结构', '给出发布前检查清单'],
  },
  analytics: {
    label: '数据概览',
    guidance: '帮助用户解释指标变化、总结传播表现并提出改进建议。',
    suggestions: ['帮我解释最近的数据变化', '总结本期传播效果'],
  },
  skills: {
    label: 'Skill 能力中心',
    guidance: '帮助用户发现、评估和选择 Skill；安装和启用仍需遵循安全预检。',
    suggestions: ['帮我搜索适合微信的 Skill', '如何判断 Skill 是否安全'],
  },
  workflows: {
    label: '工作流编排',
    guidance: '帮助用户设计节点、条件、审批和失败处理。',
    suggestions: ['帮我检查工作流断点', '设计一个审核发布流程'],
  },
  connections: {
    label: '连接管理',
    guidance: '帮助用户理解连接用途和排查状态，不在对话中展示或索取密钥。',
    suggestions: ['检查连接配置思路', '哪些 Agent 会使用这些连接'],
  },
  'design-system': {
    label: '系统设置',
    guidance: '帮助管理员理解界面与平台设置，变更前先给出影响说明。',
    suggestions: ['解释当前系统设置', '给出安全的修改建议'],
  },
  automation: {
    label: '自动化',
    guidance: '帮助用户设计自动触发、执行条件、审批和异常恢复。',
    suggestions: ['帮我设计自动化规则', '检查自动化风险'],
  },
  craft: {
    label: '内容规范',
    guidance: '帮助用户理解和应用品牌、语言、格式与合规规则。',
    suggestions: ['帮我检查品牌语气', '整理一份内容规范清单'],
  },
};

export function GlobalAssistant({ currentView, onNavigate }: GlobalAssistantProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [loading, setLoading] = useState(false);
  const context = viewContext[currentView];

  const send = async (suggestion?: string) => {
    const content = (suggestion || prompt).trim();
    if (!content || loading) return;
    const userMessage: AssistantMessage = { id: `user-${Date.now()}`, role: 'user', content };
    setMessages(current => [...current, userMessage]);
    setPrompt('');
    setLoading(true);
    try {
      const result = await executeAgentTask({
        source: 'assistant',
        conversation_id: `context-${currentView}`,
        input_text: [
          `当前页面：${context.label}`,
          `页面协助边界：${context.guidance}`,
          `用户请求：${content}`,
        ].join('\n'),
      });
      setRun(result.run);
      setMessages(current => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.content,
        agentName: result.run.agent_name,
      }]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'AI 助手暂时不可用', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`打开 AI 助手，当前页面：${context.label}`}
          className="ai-gradient fixed bottom-5 right-5 z-[70] flex h-12 items-center gap-2 rounded-2xl px-4 text-[12px] font-semibold text-white shadow-[0_16px_38px_rgba(70,89,210,0.34)] transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">AI 助手</span>
        </button>
      ) : null}

      {open ? (
        <aside
          aria-label="全局 AI 助手"
          className={`fixed bottom-3 right-3 z-[90] flex overflow-hidden rounded-[24px] border border-[#DDE5EC] bg-white shadow-[0_26px_80px_rgba(25,43,57,0.22)] transition-[width,height] ${
            expanded
              ? 'h-[calc(100dvh-24px)] w-[min(760px,calc(100vw-24px))]'
              : 'h-[min(680px,calc(100dvh-24px))] w-[min(420px,calc(100vw-24px))]'
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#E8EDF1] bg-[linear-gradient(135deg,#F4F6FF_0%,#F3FBFC_100%)] px-4">
              <span className="ai-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-semibold text-[#273943]">AI 助手</h2>
                <p className="mt-0.5 truncate text-[9px] text-[#71828E]">正在协助：{context.label}</p>
              </div>
              <button type="button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? '缩小助手' : '展开助手'} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#72828D] hover:bg-white/80">
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭助手" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#72828D] hover:bg-white/80">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFCFD_100%)] p-4">
              {!messages.length ? (
                <div className="flex min-h-full flex-col justify-center">
                  <span className="mb-3 text-[10px] font-semibold tracking-[0.1em] text-[#5267E8]">PAGE COPILOT</span>
                  <h3 className="max-w-sm text-[20px] font-semibold leading-8 text-[#263943]">在{context.label}中，我可以直接结合当前页面协助你。</h3>
                  <p className="mt-2 text-[11px] leading-6 text-[#758691]">{context.guidance}</p>
                  <div className="mt-5 space-y-2">
                    {context.suggestions.map(suggestion => (
                      <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="flex w-full items-center justify-between rounded-2xl border border-[#E2E8ED] bg-white px-4 py-3 text-left text-[11px] font-medium text-[#52636E] hover:border-[#C6D0F8] hover:bg-[#F7F8FF]">
                        {suggestion}
                        <ChevronRight className="h-4 w-4 text-[#91A0AA]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <div key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[88%]' : 'max-w-[96%]'}>
                      {message.role === 'user' ? (
                        <div className="rounded-2xl rounded-tr-md bg-[#EEF1FF] px-4 py-3 text-[11px] leading-6 text-[#34445F]">{message.content}</div>
                      ) : (
                        <div className="flex gap-2.5">
                          <span className="ai-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"><Bot className="h-3.5 w-3.5" /></span>
                          <div>
                            <p className="mb-1 text-[9px] font-semibold text-[#5267E8]">{message.agentName}</p>
                            <p className="whitespace-pre-wrap text-[11px] leading-6 text-[#3E505B]">{message.content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {loading ? <div className="flex items-center gap-2 text-[10px] text-[#71818D]"><Sparkles className="h-4 w-4 animate-pulse text-[#5267E8]" />正在匹配 Agent、Skill 与知识库…</div> : null}
                  {run ? (
                    <div className="rounded-2xl border border-[#E0E5FF] bg-[#F7F8FF] p-3">
                      <div className="flex items-center justify-between text-[9px] font-semibold text-[#5267E8]">
                        <span>{run.agent_name} · v{run.agent_version}</span>
                        <span>{run.status === 'completed' ? '已完成' : run.status}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {run.steps.slice(0, 4).map(step => (
                          <span key={step.id} className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[8px] text-[#6D7D88]">
                            {step.step_type === 'rag' ? <Database className="h-3 w-3" /> : <CircleCheck className="h-3 w-3" />}
                            {step.name}
                          </span>
                        ))}
                      </div>
                      <button type="button" onClick={() => { setOpen(false); onNavigate('agents'); }} className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-[#5267E8]">在 Agent 工作室查看完整运行 <ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-[#E7EDF1] bg-white p-3">
              <div className="rounded-2xl border border-[#DCE4EA] bg-[#FBFCFD] p-2.5 focus-within:border-[#AEBBF4]">
                <textarea
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  onKeyDown={event => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void send();
                  }}
                  rows={2}
                  placeholder={`询问关于${context.label}的问题…`}
                  className="w-full resize-none bg-transparent px-1 text-[11px] leading-5 text-[#34454F] outline-none"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="px-1 text-[8px] text-[#98A5AE]">自动携带当前页面上下文</span>
                  <button type="button" onClick={() => void send()} disabled={!prompt.trim() || loading} className="ai-gradient flex h-8 w-8 items-center justify-center rounded-xl text-white disabled:opacity-40">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </aside>
      ) : null}
    </>
  );
}
