'use client';

import {
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { type ViewType } from '@/app/page';
import { showToast } from './toast';

interface TaskCenterProps {
  onNavigate: (view: ViewType) => void;
}

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';

interface TaskItem {
  id: string;
  title: string;
  project: string;
  owner: string;
  due: string;
  priority: 'high' | 'normal' | 'low';
  status: TaskStatus;
  aiCreated?: boolean;
  description: string;
}

const statusDefinition: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: '待开始', color: '#657682', bg: '#EEF2F5' },
  doing: { label: '进行中', color: '#4660D3', bg: '#EDF0FF' },
  review: { label: '待确认', color: '#B36F27', bg: '#FFF4E6' },
  done: { label: '已完成', color: '#21865D', bg: '#EAF7F1' },
};

const initialTasks: TaskItem[] = [
  { id: 'task-1', title: '确认 22 周年员工故事终稿', project: '22 周年文化传播', owner: '王彬彬', due: '今天 17:00', priority: 'high', status: 'review', aiCreated: true, description: '检查引用、人物信息和品牌表达，确认后进入渠道适配。' },
  { id: 'task-2', title: '补充新员工培训活动预算', project: '新员工文化融入', owner: '刘思敏', due: '明天 12:00', priority: 'normal', status: 'doing', description: '补充场地、物料、讲师和传播预算，并注明测算依据。' },
  { id: 'task-3', title: '整理 7 月选题会行动项', project: '月度内容运营', owner: '王彬彬', due: '周四', priority: 'normal', status: 'todo', description: '将会议结论拆分为选题调研、采访和审核任务。' },
  { id: 'task-4', title: '完成品牌案例库素材归档', project: '品牌故事案例库', owner: '陈清', due: '7 月 29 日', priority: 'low', status: 'doing', description: '归档本月优秀内容，并补齐渠道、主题和表现标签。' },
  { id: 'task-5', title: '确认月度内容例会纪要', project: '月度内容运营', owner: '王彬彬', due: '今天 15:30', priority: 'high', status: 'review', aiCreated: true, description: '确认会议决策与 4 个行动项的负责人和截止时间。' },
  { id: 'task-6', title: '发布员工采访邀约', project: '22 周年文化传播', owner: '李欣', due: '昨天', priority: 'normal', status: 'done', description: '采访邀约已发布，共收到 8 位员工回复。' },
];

const filters: Array<{ id: 'all' | TaskStatus; label: string }> = [
  { id: 'all', label: '全部任务' },
  { id: 'todo', label: '待开始' },
  { id: 'doing', label: '进行中' },
  { id: 'review', label: '待确认' },
  { id: 'done', label: '已完成' },
];

export function TaskCenter({ onNavigate }: TaskCenterProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  const visibleTasks = tasks.filter(task => {
    const matchesFilter = activeFilter === 'all' || task.status === activeFilter;
    const matchesQuery = !deferredQuery || `${task.title} ${task.project} ${task.owner}`.toLocaleLowerCase().includes(deferredQuery);
    return matchesFilter && matchesQuery;
  });

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(current => current.map(task => task.id === taskId ? { ...task, status } : task));
    setSelectedTask(current => current?.id === taskId ? { ...current, status } : current);
    showToast(`任务已更新为“${statusDefinition[status].label}”`, 'success');
  };

  const createTask = () => {
    const task: TaskItem = {
      id: `task-${Date.now()}`,
      title: '未命名任务',
      project: '暂未关联项目',
      owner: '王彬彬',
      due: '待设置',
      priority: 'normal',
      status: 'todo',
      description: '这是一个新任务，请在后续迭代中补充目标、负责人和截止时间。',
    };
    setTasks(current => [task, ...current]);
    setActiveFilter('all');
    setSelectedTask(task);
    showToast('新任务已创建，并已打开详情', 'success');
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">我的工作</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">任务中心</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">集中处理今日待办、AI 结果与团队协作事项。</p>
          </div>
          <button type="button" onClick={createTask} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]">
            <Plus className="h-4 w-4" /> 新建任务
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E1E8ED] bg-white p-3 shadow-[0_8px_24px_rgba(35,54,72,0.04)] lg:flex-row lg:items-center">
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {filters.map(filter => (
              <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-medium ${activeFilter === filter.id ? 'bg-[#EEF0FF] text-[#5267E8]' : 'text-[#6F808C] hover:bg-[#F4F7F9]'}`}>
                {filter.label}
                <span className="ml-1.5 text-[9px] opacity-70">{filter.id === 'all' ? tasks.length : tasks.filter(task => task.status === filter.id).length}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 lg:w-64">
              <Search className="h-3.5 w-3.5 text-[#82919C]" />
              <input value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索任务" placeholder="搜索任务、项目或负责人" className="min-w-0 flex-1 bg-transparent text-[10px] text-[#4D5E69] outline-none placeholder:text-[#9AA7B0]" />
            </label>
            <button type="button" aria-label="筛选任务" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E1E8ED] text-[#70808C] hover:text-[#5267E8]"><Filter className="h-4 w-4" /></button>
            <div className="flex rounded-xl bg-[#F1F4F7] p-1">
              <button type="button" aria-label="列表视图" onClick={() => setViewMode('list')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${viewMode === 'list' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><List className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label="看板视图" onClick={() => setViewMode('board')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${viewMode === 'board' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#E1E8ED] bg-white shadow-[0_8px_24px_rgba(35,54,72,0.04)]">
            <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(140px,1fr)_110px_110px_90px] gap-4 border-b border-[#E8EDF1] bg-[#F9FBFC] px-5 py-3 text-[9px] font-semibold tracking-[0.04em] text-[#8D9BA5] xl:grid">
              <span>任务</span><span>所属项目</span><span>负责人</span><span>截止时间</span><span>状态</span>
            </div>
            <div className="divide-y divide-[#EDF1F4]">
              {visibleTasks.map(task => {
                const status = statusDefinition[task.status];
                return (
                  <button key={task.id} type="button" onClick={() => setSelectedTask(task)} className="grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-[#FAFBFE] xl:grid-cols-[minmax(0,1.8fr)_minmax(140px,1fr)_110px_110px_90px] xl:items-center xl:gap-4 xl:px-5">
                    <span className="flex min-w-0 items-start gap-3">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${task.status === 'done' ? 'bg-[#EAF7F1] text-[#25A76F]' : 'bg-[#F2F5F7] text-[#9AA8B3]'}`}>
                        {task.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-[11px] font-semibold ${task.status === 'done' ? 'text-[#98A5AE] line-through' : 'text-[#34444E]'}`}>{task.title}</span>
                          {task.aiCreated ? <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#7357FF]" /> : null}
                        </span>
                        <span className="mt-1 block text-[9px] text-[#8D9BA5] xl:hidden">{task.project} · {task.owner}</span>
                      </span>
                    </span>
                    <span className="hidden truncate text-[10px] text-[#687985] xl:block">{task.project}</span>
                    <span className="hidden items-center gap-1.5 text-[10px] text-[#687985] xl:flex"><UserRound className="h-3.5 w-3.5 text-[#97A4AD]" />{task.owner}</span>
                    <span className={`hidden items-center gap-1.5 text-[10px] xl:flex ${task.priority === 'high' && task.status !== 'done' ? 'font-semibold text-[#DC5A60]' : 'text-[#687985]'}`}><Clock3 className="h-3.5 w-3.5" />{task.due}</span>
                    <span className="w-fit rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                  </button>
                );
              })}
              {!visibleTasks.length ? <div className="px-5 py-14 text-center text-[12px] text-[#8796A1]">没有符合条件的任务</div> : null}
            </div>
          </div>
        ) : (
          <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-3">
            {(Object.keys(statusDefinition) as TaskStatus[]).map(statusId => {
              const definition = statusDefinition[statusId];
              const columnTasks = visibleTasks.filter(task => task.status === statusId);
              return (
                <section key={statusId} className="w-[280px] shrink-0 rounded-2xl border border-[#E1E8ED] bg-[#F7F9FB] p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-[#4B5C67]">{definition.label}</span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[9px] font-semibold text-[#748590]">{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {columnTasks.map(task => (
                      <button key={task.id} type="button" onClick={() => setSelectedTask(task)} className="w-full rounded-xl border border-[#E4EAEF] bg-white p-3 text-left shadow-[0_4px_14px_rgba(35,54,72,0.03)] hover:border-[#C6D0F5]">
                        <span className="flex items-start gap-2"><span className="min-w-0 flex-1 text-[11px] font-semibold leading-5 text-[#3B4B55]">{task.title}</span>{task.aiCreated ? <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#7357FF]" /> : null}</span>
                        <span className="mt-3 block truncate text-[9px] text-[#8B9AA5]">{task.project}</span>
                        <span className="mt-2 flex items-center justify-between text-[9px] text-[#7B8B96]"><span>{task.owner}</span><span>{task.due}</span></span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {selectedTask ? (
        <div className="fixed inset-0 z-[70] flex justify-end bg-[#17232D]/22 backdrop-blur-[2px]" onMouseDown={event => { if (event.currentTarget === event.target) setSelectedTask(null); }}>
          <aside className="h-full w-full max-w-[420px] overflow-y-auto border-l border-[#E1E8ED] bg-white p-5 shadow-[-18px_0_50px_rgba(31,50,68,0.16)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#5267E8]">任务详情</span>
              <button type="button" aria-label="关闭任务详情" onClick={() => setSelectedTask(null)} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#71818D] hover:bg-[#F1F4F7]"><X className="h-4 w-4" /></button>
            </div>
            <h2 className="mt-5 text-[20px] font-semibold leading-8 text-[#263640]">{selectedTask.title}</h2>
            {selectedTask.aiCreated ? <div className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-[#F0EDFF] px-2 py-1 text-[9px] font-semibold text-[#6D53E6]"><Sparkles className="h-3 w-3" /> AI 生成，等待人工确认</div> : null}
            <p className="mt-5 text-[12px] leading-6 text-[#667985]">{selectedTask.description}</p>
            <div className="mt-6 space-y-3 rounded-2xl bg-[#F7F9FB] p-4 text-[10px] text-[#60707D]">
              <div className="flex items-center justify-between"><span>所属项目</span><button type="button" onClick={() => onNavigate('campaigns')} className="font-semibold text-[#5267E8]">{selectedTask.project}</button></div>
              <div className="flex items-center justify-between"><span>负责人</span><span className="font-semibold text-[#35454F]">{selectedTask.owner}</span></div>
              <div className="flex items-center justify-between"><span>截止时间</span><span className="font-semibold text-[#35454F]">{selectedTask.due}</span></div>
            </div>
            <div className="mt-6">
              <label className="text-[10px] font-semibold text-[#60707D]">更新状态</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(statusDefinition) as TaskStatus[]).map(statusId => (
                  <button key={statusId} type="button" onClick={() => updateTaskStatus(selectedTask.id, statusId)} className={`rounded-xl border px-3 py-2.5 text-[10px] font-semibold ${selectedTask.status === statusId ? 'border-[#AEBBF4] bg-[#F0F2FF] text-[#5267E8]' : 'border-[#E1E8ED] text-[#687985] hover:bg-[#F7F9FB]'}`}>{statusDefinition[statusId].label}</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => { updateTaskStatus(selectedTask.id, 'done'); setSelectedTask(null); }} className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-[12px] font-semibold text-white"><CheckCircle2 className="h-4 w-4" /> 标记为已完成</button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
