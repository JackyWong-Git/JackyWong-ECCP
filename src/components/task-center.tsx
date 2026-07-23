'use client';

import {
  CheckCircle2,
  Circle,
  Clock3,
  LayoutGrid,
  List,
  LoaderCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { type ViewType } from '@/lib/access-control';
import {
  type ContentTaskItem,
  type ListResponse,
  type PublicationItem,
  type TaskStatus,
  formatDate,
  workflowApi,
} from '@/lib/workflow-api';
import { showToast } from './toast';

interface TaskCenterProps {
  onNavigate: (view: ViewType) => void;
}

const statusDefinition: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: '待开始', color: '#657682', bg: '#EEF2F5' },
  doing: { label: '制作中', color: '#4660D3', bg: '#EDF0FF' },
  review: { label: '待审核', color: '#B36F27', bg: '#FFF4E6' },
  approved: { label: '已通过', color: '#21865D', bg: '#EAF7F1' },
  published: { label: '已发布', color: '#087B8C', bg: '#E8F7FA' },
  cancelled: { label: '已取消', color: '#9A6470', bg: '#F8EDF0' },
};

const transitions: Record<TaskStatus, TaskStatus[]> = {
  todo: ['doing', 'cancelled'],
  doing: ['review', 'cancelled'],
  review: ['approved', 'doing', 'cancelled'],
  approved: ['doing', 'cancelled'],
  published: [],
  cancelled: ['todo'],
};

const filters: Array<{ id: 'all' | TaskStatus; label: string }> = [
  { id: 'all', label: '全部任务' },
  ...Object.entries(statusDefinition).map(([id, value]) => ({ id: id as TaskStatus, label: value.label })),
];

export function TaskCenter({ onNavigate }: TaskCenterProps) {
  const [tasks, setTasks] = useState<ContentTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<ContentTaskItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [publishChannel, setPublishChannel] = useState('内网');
  const [publishUrl, setPublishUrl] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  useEffect(() => {
    let active = true;
    workflowApi<ListResponse<ContentTaskItem>>('content-tasks')
      .then(payload => { if (active) setTasks(payload.items); })
      .catch(error => showToast(error instanceof Error ? error.message : '任务加载失败', 'error'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleTasks = tasks.filter(task => {
    const matchesFilter = activeFilter === 'all' || task.status === activeFilter;
    const haystack = `${task.title} ${task.project_name} ${task.owner_name}`.toLocaleLowerCase();
    return matchesFilter && (!deferredQuery || haystack.includes(deferredQuery));
  });

  const replaceTask = (task: ContentTaskItem) => {
    setTasks(current => current.map(item => item.id === task.id ? task : item));
    setSelectedTask(current => current?.id === task.id ? task : current);
  };

  const createTask = async () => {
    if (newTitle.trim().length < 2) return;
    setBusyId('create');
    try {
      const task = await workflowApi<ContentTaskItem>('content-tasks', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), project_name: '内容协同', owner_name: '待分配' }),
      });
      setTasks(current => [task, ...current]);
      setSelectedTask(task);
      setNewTitle('');
      setShowCreate(false);
      showToast('任务已创建', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const updateTaskStatus = async (task: ContentTaskItem, status: TaskStatus) => {
    setBusyId(task.id);
    try {
      const updated = await workflowApi<ContentTaskItem>(`content-tasks/${task.id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status, note: `工作台操作：${statusDefinition[status].label}` }),
      });
      replaceTask(updated);
      showToast(`任务已进入“${statusDefinition[status].label}”`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '状态更新失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const publishTask = async (task: ContentTaskItem) => {
    setBusyId(task.id);
    try {
      await workflowApi<PublicationItem>(`workflow/content-tasks/${task.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ channel: publishChannel, external_url: publishUrl }),
      });
      replaceTask({ ...task, status: 'published', version: task.version + 1 });
      showToast('内容已发布，可在数据看板回填表现数据', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '发布失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[11px] font-semibold text-[#5267E8]">内容生产线</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">任务中心</h1><p className="mt-2 text-[12px] text-[#71818D]">从制作、审核到发布，状态全程留痕。</p></div>
          <button type="button" onClick={() => setShowCreate(true)} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]"><Plus className="h-4 w-4" /> 新建任务</button>
        </div>

        {showCreate && <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#DCE4F8] bg-white p-3 shadow-sm sm:flex-row"><input autoFocus value={newTitle} onChange={event => setNewTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void createTask(); }} placeholder="输入任务标题" className="h-10 flex-1 rounded-xl border border-[#E1E8ED] px-3 text-sm outline-none focus:border-[#7083EE]"/><button disabled={busyId === 'create'} onClick={() => void createTask()} className="rounded-xl bg-[#5267E8] px-5 text-xs font-semibold text-white disabled:opacity-60">创建</button><button onClick={() => setShowCreate(false)} className="rounded-xl px-4 text-xs text-[#71818D]">取消</button></div>}

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E1E8ED] bg-white p-3 shadow-[0_8px_24px_rgba(35,54,72,0.04)] lg:flex-row lg:items-center">
          <div className="no-scrollbar flex gap-1 overflow-x-auto">{filters.map(filter => <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-medium ${activeFilter === filter.id ? 'bg-[#EEF0FF] text-[#5267E8]' : 'text-[#6F808C] hover:bg-[#F4F7F9]'}`}>{filter.label}<span className="ml-1.5 text-[9px] opacity-70">{filter.id === 'all' ? tasks.length : tasks.filter(task => task.status === filter.id).length}</span></button>)}</div>
          <div className="ml-auto flex items-center gap-2"><label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 lg:w-64"><Search className="h-3.5 w-3.5 text-[#82919C]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索任务、活动或负责人" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"/></label><div className="flex rounded-xl bg-[#F1F4F7] p-1"><button aria-label="列表视图" onClick={() => setViewMode('list')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${viewMode === 'list' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><List className="h-3.5 w-3.5"/></button><button aria-label="看板视图" onClick={() => setViewMode('board')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${viewMode === 'board' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><LayoutGrid className="h-3.5 w-3.5"/></button></div></div>
        </div>

        {loading ? <div className="flex h-56 items-center justify-center text-[#71818D]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin"/>正在读取任务</div> : viewMode === 'list' ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#E1E8ED] bg-white shadow-[0_8px_24px_rgba(35,54,72,0.04)]">
            <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(140px,1fr)_110px_110px_90px] gap-4 border-b border-[#E8EDF1] bg-[#F9FBFC] px-5 py-3 text-[9px] font-semibold text-[#8D9BA5] xl:grid"><span>任务</span><span>所属活动</span><span>负责人</span><span>截止时间</span><span>状态</span></div>
            <div className="divide-y divide-[#EDF1F4]">{visibleTasks.map(task => { const status = statusDefinition[task.status]; return <button key={task.id} onClick={() => setSelectedTask(task)} className="grid w-full gap-3 px-4 py-4 text-left hover:bg-[#FAFBFE] xl:grid-cols-[minmax(0,1.8fr)_minmax(140px,1fr)_110px_110px_90px] xl:items-center xl:gap-4 xl:px-5"><span className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${task.status === 'published' ? 'bg-[#EAF7F1] text-[#25A76F]' : 'bg-[#F2F5F7] text-[#9AA8B3]'}`}>{task.status === 'published' ? <CheckCircle2 className="h-4 w-4"/> : <Circle className="h-4 w-4"/>}</span><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-[11px] font-semibold text-[#34444E]">{task.title}</span>{task.ai_created && <Sparkles className="h-3.5 w-3.5 text-[#7357FF]"/>}</span><span className="mt-1 block text-[9px] text-[#8D9BA5] xl:hidden">{task.project_name} · {task.owner_name || '待分配'}</span></span></span><span className="hidden truncate text-[10px] text-[#687985] xl:block">{task.project_name}</span><span className="hidden items-center gap-1.5 text-[10px] text-[#687985] xl:flex"><UserRound className="h-3.5 w-3.5"/>{task.owner_name || '待分配'}</span><span className="hidden items-center gap-1.5 text-[10px] text-[#687985] xl:flex"><Clock3 className="h-3.5 w-3.5"/>{formatDate(task.due_at, true)}</span><span className="w-fit rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span></button>; })}{!visibleTasks.length && <div className="px-5 py-14 text-center text-[12px] text-[#8796A1]">暂无任务，可从素材调度自动创建</div>}</div>
          </div>
        ) : <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-3">{(Object.keys(statusDefinition) as TaskStatus[]).map(statusId => <section key={statusId} className="w-[280px] shrink-0 rounded-2xl border border-[#E1E8ED] bg-[#F7F9FB] p-3"><div className="mb-3 flex items-center justify-between px-1"><span className="text-[11px] font-semibold text-[#4B5C67]">{statusDefinition[statusId].label}</span><span className="rounded-full bg-white px-2 py-1 text-[9px]">{visibleTasks.filter(task => task.status === statusId).length}</span></div><div className="space-y-2">{visibleTasks.filter(task => task.status === statusId).map(task => <button key={task.id} onClick={() => setSelectedTask(task)} className="w-full rounded-xl border border-[#E4EAEF] bg-white p-3 text-left hover:border-[#C6D0F5]"><span className="text-[11px] font-semibold leading-5 text-[#3B4B55]">{task.title}</span><span className="mt-3 block text-[9px] text-[#8B9AA5]">{task.project_name}</span><span className="mt-2 flex justify-between text-[9px] text-[#7B8B96]"><span>{task.owner_name || '待分配'}</span><span>{formatDate(task.due_at)}</span></span></button>)}</div></section>)}</div>}
      </div>

      {selectedTask && <div className="fixed inset-0 z-[70] flex justify-end bg-[#17232D]/22 backdrop-blur-[2px]" onMouseDown={event => { if (event.currentTarget === event.target) setSelectedTask(null); }}><aside className="h-full w-full max-w-[440px] overflow-y-auto border-l border-[#E1E8ED] bg-white p-5 shadow-[-18px_0_50px_rgba(31,50,68,0.16)]"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[#5267E8]">任务详情 · V{selectedTask.version}</span><button aria-label="关闭" onClick={() => setSelectedTask(null)} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#F1F4F7]"><X className="h-4 w-4"/></button></div><h2 className="mt-5 text-[20px] font-semibold leading-8 text-[#263640]">{selectedTask.title}</h2><p className="mt-4 text-[12px] leading-6 text-[#667985]">{selectedTask.description || '暂无详细说明。'}</p><div className="mt-6 space-y-3 rounded-2xl bg-[#F7F9FB] p-4 text-[10px] text-[#60707D]"><div className="flex justify-between"><span>所属活动</span><button onClick={() => onNavigate('campaigns')} className="font-semibold text-[#5267E8]">{selectedTask.project_name}</button></div><div className="flex justify-between"><span>负责人</span><span className="font-semibold">{selectedTask.owner_name || '待分配'}</span></div><div className="flex justify-between"><span>当前状态</span><span className="font-semibold">{statusDefinition[selectedTask.status].label}</span></div></div>
        {selectedTask.status === 'approved' ? <div className="mt-6 rounded-2xl border border-[#D8ECE4] bg-[#F4FBF8] p-4"><p className="text-xs font-semibold text-[#267857]">审核已通过，可执行发布</p><div className="mt-3 grid grid-cols-2 gap-2"><select value={publishChannel} onChange={event => setPublishChannel(event.target.value)} className="h-10 rounded-xl border border-[#D8E5DF] bg-white px-3 text-xs"><option>内网</option><option>公众号</option><option>视频号</option><option>微博</option><option>内刊</option></select><input value={publishUrl} onChange={event => setPublishUrl(event.target.value)} placeholder="发布链接（可选）" className="h-10 rounded-xl border border-[#D8E5DF] bg-white px-3 text-xs"/></div><button disabled={busyId === selectedTask.id} onClick={() => void publishTask(selectedTask)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#21865D] text-xs font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4"/>确认发布</button></div> : null}
        {transitions[selectedTask.status].length > 0 && <div className="mt-6"><label className="text-[10px] font-semibold text-[#60707D]">可执行操作</label><div className="mt-2 grid grid-cols-2 gap-2">{transitions[selectedTask.status].map(status => <button disabled={busyId === selectedTask.id} key={status} onClick={() => void updateTaskStatus(selectedTask, status)} className="rounded-xl border border-[#E1E8ED] px-3 py-2.5 text-[10px] font-semibold text-[#687985] hover:bg-[#F7F9FB] disabled:opacity-50">{statusDefinition[status].label}</button>)}</div></div>}
        {busyId === selectedTask.id && <div className="mt-4 flex items-center justify-center text-xs text-[#71818D]"><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>正在同步</div>}</aside></div>}
    </div>
  );
}
