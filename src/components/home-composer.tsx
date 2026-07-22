'use client';

import {
  ArrowUp,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Database,
  FileAudio,
  FileText,
  Globe2,
  Image as ImageIcon,
  MessageSquareText,
  Mic2,
  Paperclip,
  PenLine,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { type ChangeEvent, type ComponentType, useEffect, useRef, useState } from 'react';
import { type ViewType } from '@/app/page';
import { showToast } from './toast';

interface HomeComposerProps {
  onNavigate: (view: ViewType) => void;
}

interface WorkTask {
  id: string;
  title: string;
  project: string;
  due: string;
  status: 'todo' | 'review' | 'done';
  priority: 'normal' | 'urgent';
}

interface ToolDefinition {
  name: string;
  description: string;
  recent: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  view: ViewType;
  tone: string;
  iconTone: string;
}

const QUICK_TASKS = [
  { label: '写一份方案', prompt: '帮我写一份企业文化活动方案，面向全体员工，包含目标、流程、传播计划和执行排期。' },
  { label: '总结文件', prompt: '总结我接下来上传的文件，提取核心结论、风险和建议，整理成管理层一页简报。' },
  { label: '整理会议纪要', prompt: '整理会议记录，输出会议结论、待办事项、负责人和截止时间。' },
  { label: '生成视频脚本', prompt: '围绕员工成长故事生成一份 90 秒视频脚本，包含旁白、画面和字幕建议。' },
  { label: '制作海报', prompt: '为企业文化主题活动制作一份海报创意方案，给出主视觉方向、标题和关键信息层级。' },
  { label: '分析数据', prompt: '分析我接下来上传的数据，找出趋势、异常和可执行建议，并生成简洁图表说明。' },
];

const TOOLS: ToolDefinition[] = [
  { name: 'AI 文案', description: '方案、通知、脚本与总结', recent: '昨天使用', icon: PenLine, view: 'studio', tone: 'bg-[#EEF1FF]', iconTone: 'text-[#5B68DD]' },
  { name: 'AI 图片', description: '海报、封面与内容配图', recent: '3 天前使用', icon: ImageIcon, view: 'studio', tone: 'bg-[#F6EEFF]', iconTone: 'text-[#8257D7]' },
  { name: 'AI 视频', description: '脚本、分镜与字幕生成', recent: '上周使用', icon: Video, view: 'scripts', tone: 'bg-[#EBF7FF]', iconTone: 'text-[#3689C4]' },
  { name: 'AI 会议', description: '转写、纪要与行动项', recent: '今天 10:20', icon: FileAudio, view: 'requests', tone: 'bg-[#EAF8F4]', iconTone: 'text-[#299773]' },
  { name: 'AI 文件', description: '阅读、对比与信息提取', recent: '今天 09:42', icon: FileText, view: 'knowledge', tone: 'bg-[#FFF4E8]', iconTone: 'text-[#C27A2C]' },
];

const INITIAL_TASKS: WorkTask[] = [
  { id: 'task-1', title: '确认 22 周年员工故事终稿', project: '22 周年文化传播', due: '今天 17:00', status: 'review', priority: 'urgent' },
  { id: 'task-2', title: '补充新员工培训活动预算', project: '新员工文化融入', due: '明天 12:00', status: 'todo', priority: 'normal' },
  { id: 'task-3', title: '整理 7 月选题会行动项', project: '月度内容运营', due: '周四', status: 'todo', priority: 'normal' },
];

const PROJECTS = [
  { name: '22 周年文化传播', stage: '内容制作', progress: 76, due: '本周五', color: '#5267E8' },
  { name: '新员工文化融入', stage: '方案确认', progress: 48, due: '7 月 29 日', color: '#4FC7E8' },
  { name: '品牌故事案例库', stage: '素材归档', progress: 91, due: '8 月 2 日', color: '#25A76F' },
];

const SCHEDULES = [
  { time: '10:30', title: '月度内容例会', detail: '3 号会议室 · 6 人' },
  { time: '14:00', title: '员工故事采访', detail: '线上会议 · 45 分钟' },
  { time: '16:30', title: '传播项目周检', detail: '项目空间 · 4 人' },
];

const RECENT_FILES = [
  { name: '22周年传播方案 V3.docx', detail: '刚刚更新 · 项目文件', type: 'DOC' },
  { name: '员工采访素材汇总.pdf', detail: '昨天更新 · 团队空间', type: 'PDF' },
  { name: '7月内容排期.xlsx', detail: '2 天前更新 · 我的文件', type: 'XLS' },
];

const STORAGE_KEY = 'eccp-workspace-composer';

export function HomeComposer({ onNavigate }: HomeComposerProps) {
  const [brief, setBrief] = useState('');
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(true);
  const [webEnabled, setWebEnabled] = useState(false);
  const [mode, setMode] = useState('智能模式');
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>(INITIAL_TASKS);
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as Partial<{ brief: string; knowledgeEnabled: boolean; webEnabled: boolean; mode: string }>;
      if (typeof parsed.brief === 'string') setBrief(parsed.brief);
      if (typeof parsed.knowledgeEnabled === 'boolean') setKnowledgeEnabled(parsed.knowledgeEnabled);
      if (typeof parsed.webEnabled === 'boolean') setWebEnabled(parsed.webEnabled);
      if (typeof parsed.mode === 'string') setMode(parsed.mode);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ brief, knowledgeEnabled, webEnabled, mode }));
  }, [brief, knowledgeEnabled, mode, webEnabled]);

  useEffect(() => () => {
    if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current);
  }, []);

  const applyQuickTask = (prompt: string) => {
    setBrief(prompt);
    inputRef.current?.focus();
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).map(file => file.name);
    if (!selected.length) return;
    setFileNames(current => Array.from(new Set([...current, ...selected])).slice(0, 4));
    showToast(`已添加 ${selected.length} 个文件`, 'success');
    event.target.value = '';
  };

  const startWork = () => {
    const content = brief.trim();
    if (!content) {
      inputRef.current?.focus();
      showToast('先描述你想完成的工作', 'info');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratedTitle('');
    completionTimerRef.current = window.setTimeout(() => {
      const title = content.length > 26 ? `${content.slice(0, 26)}…` : content;
      setGeneratedTitle(title);
      setIsGenerating(false);
      const generatedTask: WorkTask = {
        id: `task-${Date.now()}`,
        title,
        project: mode,
        due: '刚刚创建',
        status: 'review',
        priority: 'normal',
      };
      setTasks(current => [generatedTask, ...current].slice(0, 4));
      showToast('AI 已完成任务识别，并创建待确认结果', 'success');
    }, 1100);
  };

  const toggleTask = (taskId: string) => {
    setTasks(current => current.map(task => task.id === taskId
      ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
      : task));
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[radial-gradient(circle_at_72%_-20%,rgba(115,87,255,0.10),transparent_32%),linear-gradient(180deg,#F5F8FA_0%,#F2F6F8_46%,#EEF3F6_100%)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1440px] space-y-7">
        <section className="workspace-reveal">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#5267E8]">下午好，彬彬</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D] sm:text-[32px] lg:text-[36px]">
                今天，想让 AI 帮你完成什么？
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[#687985] sm:text-[14px]">从灵感到执行，让工作少绕一步。</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="w-fit rounded-xl border border-[#DDE5EA] bg-white px-3.5 py-2 text-[11px] font-medium text-[#60707D] shadow-sm transition-colors hover:border-[#BAC7F5] hover:text-[#5267E8]"
            >
              今天有 3 项任务待处理，1 个项目本周到期
            </button>
          </div>

          <div className="relative mt-6 rounded-[22px] bg-[linear-gradient(135deg,rgba(115,87,255,0.62),rgba(85,123,255,0.52)_50%,rgba(79,199,232,0.58))] p-px shadow-[0_16px_40px_rgba(65,84,150,0.11)]">
            <div className="rounded-[21px] bg-white p-4 sm:p-5">
              <textarea
                ref={inputRef}
                value={brief}
                onChange={event => setBrief(event.target.value)}
                onKeyDown={event => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') startWork();
                }}
                rows={3}
                aria-label="描述你想完成的工作"
                placeholder="描述你想完成的工作，或上传文件开始处理。"
                className="min-h-[74px] w-full resize-none bg-transparent text-[15px] leading-7 text-[#263640] outline-none placeholder:text-[#A0ACB5] sm:text-[16px]"
              />

              {fileNames.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {fileNames.map(fileName => (
                    <span key={fileName} className="flex max-w-full items-center gap-1.5 rounded-lg border border-[#E2E8ED] bg-[#F7F9FC] px-2.5 py-1.5 text-[10px] text-[#5F707C]">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[#5267E8]" />
                      <span className="max-w-[180px] truncate">{fileName}</span>
                      <button type="button" aria-label={`移除 ${fileName}`} onClick={() => setFileNames(current => current.filter(item => item !== fileName))} className="rounded text-[#91A0AB] hover:text-[#DC5A60]">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-[#EDF1F4] pt-3">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
                <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="添加文件" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#71818D] transition-colors hover:bg-[#F1F4F8] hover:text-[#5267E8]">
                  <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="添加图片" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#71818D] transition-colors hover:bg-[#F1F4F8] hover:text-[#5267E8]">
                  <ImageIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  aria-label="语音输入"
                  onClick={() => {
                    setIsListening(listening => !listening);
                    showToast(isListening ? '语音输入已停止' : '语音输入已开启', 'info');
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isListening ? 'bg-[#FFF0F1] text-[#DC5A60]' : 'text-[#71818D] hover:bg-[#F1F4F8] hover:text-[#5267E8]'}`}
                >
                  <Mic2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </button>

                <div className="mx-0.5 hidden h-5 w-px bg-[#E3E9ED] lg:block" />

                <button type="button" role="switch" aria-checked={knowledgeEnabled} onClick={() => setKnowledgeEnabled(value => !value)} className="flex h-9 items-center gap-2 rounded-xl px-2 text-[11px] font-medium text-[#60707D] transition-colors hover:bg-[#F4F7FA]">
                  <Database className="h-4 w-4 text-[#5267E8]" strokeWidth={1.8} />
                  <span className="hidden lg:inline">知识库</span>
                  <span className={`relative h-4 w-7 rounded-full transition-colors ${knowledgeEnabled ? 'bg-[#5267E8]' : 'bg-[#CFD8DE]'}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${knowledgeEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </span>
                </button>

                <button type="button" role="switch" aria-checked={webEnabled} onClick={() => setWebEnabled(value => !value)} className="flex h-9 items-center gap-2 rounded-xl px-2 text-[11px] font-medium text-[#60707D] transition-colors hover:bg-[#F4F7FA]">
                  <Globe2 className="h-4 w-4 text-[#3FA3C2]" strokeWidth={1.8} />
                  <span className="hidden lg:inline">联网搜索</span>
                  <span className={`relative h-4 w-7 rounded-full transition-colors ${webEnabled ? 'bg-[#4AA9C6]' : 'bg-[#CFD8DE]'}`}>
                    <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${webEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </span>
                </button>

                <div className="flex w-full items-center justify-end gap-2 lg:ml-auto lg:w-auto">
                  <select value={mode} onChange={event => setMode(event.target.value)} aria-label="工作模式" className="h-9 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-2 text-[11px] font-medium text-[#60707D] outline-none focus:border-[#AEBBF4] sm:px-3">
                    <option>智能模式</option>
                    <option>快速模式</option>
                    <option>深度分析</option>
                  </select>
                  <button
                    type="button"
                    onClick={startWork}
                    disabled={isGenerating}
                    aria-label="发送任务"
                    className="ai-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_rgba(82,103,232,0.28)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                  >
                    {isGenerating ? <Sparkles className="h-[18px] w-[18px] animate-pulse" strokeWidth={1.9} /> : <ArrowUp className="h-[19px] w-[19px]" strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {QUICK_TASKS.map(task => (
              <button key={task.label} type="button" onClick={() => applyQuickTask(task.prompt)} className="shrink-0 rounded-full border border-[#DFE6EB] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[#60707D] transition-colors hover:border-[#B9C8FF] hover:bg-[#F3F5FF] hover:text-[#5267E8]">
                {task.label}
              </button>
            ))}
          </div>

          {isGenerating || generatedTitle ? (
            <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-2xl border border-[#DFE5FF] bg-[#F6F7FF] px-4 py-3">
              <span className="ai-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white">
                {isGenerating ? <Sparkles className="h-[17px] w-[17px] animate-pulse" /> : <Check className="h-[17px] w-[17px]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-[#3446A8]">{isGenerating ? '正在识别任务并匹配知识与工具' : '已生成待确认结果'}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[#6D79A7]">{isGenerating ? '正在读取任务要求，随后会创建可继续编辑的结果。' : generatedTitle}</span>
              </span>
              {!isGenerating ? <button type="button" onClick={() => onNavigate('tasks')} className="shrink-0 text-[11px] font-semibold text-[#5267E8]">查看结果</button> : null}
            </div>
          ) : null}
        </section>

        <section className="workspace-reveal">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-[#21313C]">常用 AI 工具</h3>
              <p className="mt-1 text-[11px] text-[#8695A0]">从工作场景开始，不需要先选择模型</p>
            </div>
            <button type="button" onClick={() => onNavigate('studio')} className="flex items-center gap-1 text-[11px] font-medium text-[#5267E8]">查看全部 <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3 2xl:grid-cols-5">
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <button key={tool.name} type="button" onClick={() => onNavigate(tool.view)} className="group min-h-[132px] rounded-2xl border border-[#E3E9EE] bg-white p-4 text-left shadow-[0_6px_20px_rgba(35,54,72,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#C9D3F8] hover:shadow-[0_12px_28px_rgba(42,61,102,0.09)]">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.tone} ${tool.iconTone}`}>
                    <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
                  </span>
                  <span className="mt-3 block text-[13px] font-semibold text-[#263640] group-hover:text-[#4358CD]">{tool.name}</span>
                  <span className="mt-1 block truncate text-[10px] text-[#748590]">{tool.description}</span>
                  <span className="mt-2 block text-[9px] text-[#A1ADB6]">{tool.recent}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="workspace-reveal grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="space-y-5">
            <div className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EDF1F4] px-4 py-4 sm:px-5">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#263640]">今日任务</h3>
                  <p className="mt-1 text-[10px] text-[#8A99A4]">优先处理待确认与临期事项</p>
                </div>
                <button type="button" onClick={() => onNavigate('tasks')} className="text-[11px] font-medium text-[#5267E8]">全部任务</button>
              </div>
              <div className="divide-y divide-[#EFF3F5] px-2 sm:px-3">
                {tasks.map(task => {
                  const done = task.status === 'done';
                  return (
                    <div key={task.id} className="flex items-center gap-3 rounded-xl px-2 py-3 sm:px-3">
                      <button type="button" onClick={() => toggleTask(task.id)} aria-label={done ? `恢复任务 ${task.title}` : `完成任务 ${task.title}`} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${done ? 'bg-[#EAF7F1] text-[#25A76F]' : 'bg-[#F4F7F9] text-[#9AA8B3] hover:bg-[#EDEFFF] hover:text-[#5267E8]'}`}>
                        {done ? <CheckCircle2 className="h-[17px] w-[17px]" strokeWidth={1.9} /> : <Circle className="h-[17px] w-[17px]" strokeWidth={1.8} />}
                      </button>
                      <button type="button" onClick={() => onNavigate('tasks')} className="min-w-0 flex-1 text-left">
                        <span className={`block truncate text-[12px] font-semibold ${done ? 'text-[#98A5AE] line-through' : 'text-[#31414B]'}`}>{task.title}</span>
                        <span className="mt-1 block truncate text-[10px] text-[#8A99A4]">{task.project}</span>
                      </button>
                      <span className={`hidden shrink-0 rounded-lg px-2 py-1 text-[9px] font-medium sm:inline ${task.status === 'review' ? 'bg-[#FFF5E8] text-[#B36F27]' : done ? 'bg-[#EAF7F1] text-[#21865D]' : 'bg-[#F1F4F7] text-[#748590]'}`}>
                        {task.status === 'review' ? '待确认' : done ? '已完成' : '进行中'}
                      </span>
                      <span className={`shrink-0 text-[10px] ${task.priority === 'urgent' && !done ? 'font-semibold text-[#DC5A60]' : 'text-[#8B9AA5]'}`}>{task.due}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#263640]">项目进度</h3>
                  <p className="mt-1 text-[10px] text-[#8A99A4]">1 个项目将在本周到期</p>
                </div>
                <button type="button" onClick={() => onNavigate('campaigns')} className="text-[11px] font-medium text-[#5267E8]">项目空间</button>
              </div>
              <div className="space-y-4">
                {PROJECTS.map(project => (
                  <button key={project.name} type="button" onClick={() => onNavigate('campaigns')} className="block w-full text-left">
                    <span className="flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate text-[11px] font-semibold text-[#3A4A54]">{project.name}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-[#60707D]">{project.progress}%</span>
                        </span>
                        <span className="mt-1 flex items-center justify-between text-[9px] text-[#93A1AB]"><span>{project.stage}</span><span>{project.due}</span></span>
                        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EDF2F5]"><span className="block h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: project.color }} /></span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="surface-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#263640]"><CalendarDays className="h-[17px] w-[17px] text-[#5267E8]" strokeWidth={1.8} /> 今日日程</h3>
                <button type="button" onClick={() => onNavigate('requests')} className="text-[10px] font-medium text-[#5267E8]">查看日历</button>
              </div>
              <div className="mt-4 space-y-1">
                {SCHEDULES.map(schedule => (
                  <button key={`${schedule.time}-${schedule.title}`} type="button" onClick={() => onNavigate('requests')} className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#F6F8FC]">
                    <span className="w-10 shrink-0 text-[10px] font-semibold text-[#5267E8]">{schedule.time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#3B4A54]">{schedule.title}</span>
                      <span className="mt-1 block truncate text-[9px] text-[#93A1AB]">{schedule.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#263640]"><MessageSquareText className="h-[17px] w-[17px] text-[#7357FF]" strokeWidth={1.8} /> 待处理消息</h3>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F0EDFF] px-1.5 text-[9px] font-semibold text-[#6D53E6]">2</span>
              </div>
              <div className="mt-3 space-y-2">
                <button type="button" onClick={() => onNavigate('requests')} className="w-full rounded-xl bg-[#F7F8FF] p-3 text-left">
                  <span className="block text-[11px] font-semibold text-[#3A4A54]">会议纪要待确认</span>
                  <span className="mt-1 block text-[9px] leading-4 text-[#7F8E99]">7 月内容例会已生成 4 个行动项</span>
                  <span className="mt-2 text-[9px] font-semibold text-[#5267E8]">立即确认</span>
                </button>
                <button type="button" onClick={() => onNavigate('tasks')} className="w-full rounded-xl bg-[#F7FAFB] p-3 text-left">
                  <span className="block text-[11px] font-semibold text-[#3A4A54]">AI 结果已完成</span>
                  <span className="mt-1 block text-[9px] leading-4 text-[#7F8E99]">员工故事初稿可以继续编辑</span>
                  <span className="mt-2 text-[9px] font-semibold text-[#5267E8]">查看结果</span>
                </button>
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#263640]"><BookOpen className="h-[17px] w-[17px] text-[#3FA3C2]" strokeWidth={1.8} /> 最近文件</h3>
                <button type="button" onClick={() => onNavigate('knowledge')} className="text-[10px] font-medium text-[#5267E8]">全部文件</button>
              </div>
              <div className="mt-3 space-y-1">
                {RECENT_FILES.map(file => (
                  <button key={file.name} type="button" onClick={() => onNavigate('knowledge')} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#F6F8FC]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F6] text-[8px] font-bold text-[#667986]">{file.type}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-semibold text-[#3B4A54]">{file.name}</span>
                      <span className="mt-1 block truncate text-[9px] text-[#93A1AB]">{file.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#DDE5EA] py-5 text-[10px] text-[#91A0AB] lg:flex-row lg:items-center lg:justify-between">
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#5267E8]" /> ECCP 会保留引用来源和人工确认步骤</span>
          <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> 工作状态已自动保存</span>
        </footer>
      </div>
    </div>
  );
}
