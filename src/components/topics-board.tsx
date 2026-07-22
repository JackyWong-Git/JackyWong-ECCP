'use client';

import { ExternalLink, LayoutGrid, List, LoaderCircle, Plus, Radar, Search, Trash2, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import {
  type ExternalTopic,
  type TopicSearchProvider,
  type TopicSearchRange,
  type TopicSearchResponse,
} from '@/lib/topic-search-types';
import { type ListResponse, type TopicItem, type TopicStatus, formatDate, workflowApi } from '@/lib/workflow-api';
import { showToast } from '@/components/toast';

const statusColumns: Array<{ id: TopicStatus; label: string; color: string }> = [
  { id: 'idea', label: '灵感池', color: '#657682' },
  { id: 'research', label: '调研中', color: '#7357FF' },
  { id: 'approved', label: '已通过', color: '#5267E8' },
  { id: 'in_progress', label: '制作中', color: '#E99B3C' },
  { id: 'done', label: '已完成', color: '#25A76F' },
];

const priorityConfig = {
  urgent: { label: '紧急', color: '#DC5A60', bg: '#FCEDEF' },
  high: { label: '高', color: '#D1782C', bg: '#FFF3E8' },
  normal: { label: '普通', color: '#5267E8', bg: '#EEF0FF' },
  low: { label: '低', color: '#71818D', bg: '#EEF2F5' },
};

export function TopicsBoard() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery.trim().toLocaleLowerCase());
  const [dragTopic, setDragTopic] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TopicStatus | null>(null);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [externalQuery, setExternalQuery] = useState('企业文化');
  const [externalProvider, setExternalProvider] = useState<TopicSearchProvider>('auto');
  const [externalRange, setExternalRange] = useState<TopicSearchRange>('week');
  const [externalResults, setExternalResults] = useState<ExternalTopic[]>([]);
  const [searchingExternal, setSearchingExternal] = useState(false);
  const [externalError, setExternalError] = useState('');
  const [searchMeta, setSearchMeta] = useState<Pick<TopicSearchResponse, 'providers' | 'failures'> | null>(null);
  const [importedExternalIds, setImportedExternalIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    workflowApi<ListResponse<TopicItem>>('topics')
      .then(payload => { if (active) setTopics(payload.items); })
      .catch(error => showToast(error instanceof Error ? error.message : '选题加载失败', 'error'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = topics.filter(topic => {
    const haystack = `${topic.title} ${topic.description} ${topic.tags.join(' ')} ${topic.source}`.toLocaleLowerCase();
    return !deferredQuery || haystack.includes(deferredQuery);
  });

  const replaceTopic = (topic: TopicItem) => {
    setTopics(current => current.map(item => item.id === topic.id ? topic : item));
    setSelectedTopic(current => current?.id === topic.id ? topic : current);
  };

  const updateStatus = async (topic: TopicItem, status: TopicStatus) => {
    if (topic.status === status) return;
    setBusyId(topic.id);
    try {
      const updated = await workflowApi<TopicItem>(`topics/${topic.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      replaceTopic(updated);
      showToast('选题状态已同步', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '状态更新失败', 'error');
    } finally {
      setBusyId('');
      setDragTopic(null);
      setDragOverCol(null);
    }
  };

  const handleDrop = (status: TopicStatus) => {
    const topic = topics.find(item => item.id === dragTopic);
    if (topic) void updateStatus(topic, status);
  };

  const createTopic = async () => {
    if (newTopicTitle.trim().length < 2) return;
    setBusyId('create');
    try {
      const created = await workflowApi<TopicItem>('topics', { method: 'POST', body: JSON.stringify({ title: newTopicTitle.trim(), source: '团队创建' }) });
      setTopics(current => [created, ...current]);
      setNewTopicTitle('');
      setShowNewTopic(false);
      setSelectedTopic(created);
      showToast('选题已创建', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '创建失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const deleteTopic = async (topic: TopicItem) => {
    setBusyId(topic.id);
    try {
      await workflowApi(`topics/${topic.id}`, { method: 'DELETE' });
      setTopics(current => current.filter(item => item.id !== topic.id));
      setSelectedTopic(null);
      showToast('选题已删除', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '删除失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleExternalSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (externalQuery.trim().length < 2) return setExternalError('请输入至少 2 个字符。');
    setSearchingExternal(true);
    setExternalError('');
    try {
      const response = await fetch('/api/topics/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: externalQuery, provider: externalProvider, range: externalRange }) });
      const payload = await response.json() as TopicSearchResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || '外部搜索失败');
      setExternalResults(payload.results);
      setSearchMeta({ providers: payload.providers, failures: payload.failures });
      if (!payload.results.length) showToast('未找到匹配结果，请换一个关键词', 'info');
    } catch (error) {
      setExternalResults([]);
      setSearchMeta(null);
      setExternalError(error instanceof Error ? error.message : '外部搜索失败');
    } finally {
      setSearchingExternal(false);
    }
  };

  const importExternal = async (candidate: ExternalTopic) => {
    setBusyId(candidate.id);
    try {
      const created = await workflowApi<TopicItem>('topics', {
        method: 'POST',
        body: JSON.stringify({
          title: candidate.title,
          description: candidate.summary,
          status: 'research',
          priority: candidate.score >= 72 ? 'high' : candidate.score < 42 ? 'low' : 'normal',
          tags: candidate.tags,
          source: `外部 · ${candidate.sourceName}`,
          source_url: candidate.url,
          channel: '待评估',
          estimated_words: 2000,
        }),
      });
      setTopics(current => [created, ...current]);
      setImportedExternalIds(current => [...current, candidate.id]);
      showToast('已导入 PostgreSQL 选题池', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '导入失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="min-h-full bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-semibold text-[#5267E8]">内容策划</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">选题看板</h1><p className="mt-2 text-[12px] text-[#71818D]">整合内部素材与外部趋势，形成可追溯的选题池。</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setShowDiscovery(current => !current)} className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-[11px] font-semibold ${showDiscovery ? 'border-[#BFC9FA] bg-[#EEF0FF] text-[#5267E8]' : 'border-[#E1E8ED] bg-white text-[#60707D]'}`}><Radar className="h-4 w-4"/>外部发现</button><button onClick={() => setShowNewTopic(true)} className="flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[11px] font-semibold text-white"><Plus className="h-4 w-4"/>新建选题</button></div></header>

        {showNewTopic && <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#DCE4F8] bg-white p-3 sm:flex-row"><input autoFocus value={newTopicTitle} onChange={event => setNewTopicTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void createTopic(); }} placeholder="输入选题标题" className="h-10 flex-1 rounded-xl border border-[#E1E8ED] px-3 text-sm outline-none focus:border-[#7083EE]"/><button disabled={busyId === 'create'} onClick={() => void createTopic()} className="rounded-xl bg-[#5267E8] px-5 text-xs font-semibold text-white disabled:opacity-60">创建</button><button onClick={() => setShowNewTopic(false)} className="rounded-xl px-4 text-xs text-[#71818D]">取消</button></div>}

        {showDiscovery && <section className="mt-5 overflow-hidden rounded-3xl border border-[#DCE4F8] bg-[linear-gradient(135deg,#F7F8FF_0%,#F3FBFD_100%)] p-4 shadow-[0_12px_34px_rgba(49,74,108,0.06)] sm:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-semibold tracking-[0.12em] text-[#5267E8]">EXTERNAL TOPIC DISCOVERY</p><h2 className="mt-1 text-lg font-semibold text-[#263640]">搜索外部趋势并导入选题池</h2><p className="mt-1 text-[10px] text-[#71818D]">保留来源链接和数据源，不由模型虚构热点。</p></div>{searchMeta && <span className="text-[9px] text-[#7C8C97]">数据源：{searchMeta.providers.join(' + ')}{searchMeta.failures.length ? ` · ${searchMeta.failures.join('、')}` : ''}</span>}</div><form onSubmit={handleExternalSearch} className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_150px_130px_auto]"><input value={externalQuery} onChange={event => setExternalQuery(event.target.value)} placeholder="雇主品牌、员工故事、AI 组织变革" className="h-10 rounded-xl border border-[#DCE4EA] bg-white px-3 text-xs outline-none focus:border-[#7083EE]"/><select value={externalProvider} onChange={event => setExternalProvider(event.target.value as TopicSearchProvider)} className="h-10 rounded-xl border border-[#DCE4EA] bg-white px-3 text-xs"><option value="auto">自动选源</option><option value="openserp">OpenSERP</option><option value="searxng">SearXNG</option><option value="rss">RSS 订阅池</option></select><select value={externalRange} onChange={event => setExternalRange(event.target.value as TopicSearchRange)} className="h-10 rounded-xl border border-[#DCE4EA] bg-white px-3 text-xs"><option value="day">近 24 小时</option><option value="week">近 7 天</option><option value="month">近 30 天</option></select><button disabled={searchingExternal} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#17232D] px-4 text-xs font-semibold text-white disabled:opacity-60">{searchingExternal ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}开始发现</button></form>{externalError && <div className="mt-3 rounded-xl border border-[#F1D0D4] bg-[#FFF5F6] px-3 py-2 text-xs text-[#B34E5A]">{externalError}</div>}{externalResults.length > 0 && <div className="mt-4 grid gap-3 lg:grid-cols-2">{externalResults.map(candidate => { const imported = importedExternalIds.includes(candidate.id); return <article key={candidate.id} className="rounded-2xl border border-[#E0E7EC] bg-white p-4"><div className="flex items-start justify-between gap-3"><a href={candidate.url} target="_blank" rel="noreferrer" className="line-clamp-2 text-xs font-semibold leading-5 text-[#34444E] hover:text-[#5267E8]">{candidate.title}</a><span className="shrink-0 rounded-lg bg-[#EAF7F1] px-2 py-1 text-[9px] font-semibold text-[#21865D]">{candidate.score} 分</span></div><p className="mt-2 line-clamp-2 text-[10px] leading-5 text-[#71818D]">{candidate.summary || '无摘要'}</p><div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-[#8796A1]">{candidate.sourceName} · {candidate.provider}</span><button disabled={imported || busyId === candidate.id} onClick={() => void importExternal(candidate)} className="rounded-lg border border-[#C9D3FA] px-2.5 py-1.5 text-[10px] font-semibold text-[#5267E8] disabled:border-[#DCE8E1] disabled:text-[#25A76F]">{imported ? '已入库' : '导入选题'}</button></div></article>; })}</div>}</section>}

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#E1E8ED] bg-white p-3"><label className="flex h-9 flex-1 items-center gap-2 rounded-xl bg-[#F8FAFC] px-3"><Search className="h-3.5 w-3.5 text-[#82919C]"/><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="搜索选题、来源或标签" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"/></label><div className="flex rounded-xl bg-[#F1F4F7] p-1"><button aria-label="看板" onClick={() => setViewMode('kanban')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${viewMode === 'kanban' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><LayoutGrid className="h-3.5 w-3.5"/></button><button aria-label="列表" onClick={() => setViewMode('table')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${viewMode === 'table' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><List className="h-3.5 w-3.5"/></button></div></div>

        {loading ? <div className="flex h-64 items-center justify-center text-xs text-[#71818D]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin"/>正在读取选题</div> : viewMode === 'kanban' ? <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-4">{statusColumns.map(column => <section key={column.id} onDragOver={event => { event.preventDefault(); setDragOverCol(column.id); }} onDrop={() => handleDrop(column.id)} className={`w-[292px] shrink-0 rounded-2xl border p-3 transition ${dragOverCol === column.id ? 'border-[#98A8F3] bg-[#F0F2FF]' : 'border-[#E1E8ED] bg-[#F7F9FB]'}`}><div className="mb-3 flex items-center justify-between px-1"><span className="flex items-center gap-2 text-[11px] font-semibold text-[#4B5C67]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }}/>{column.label}</span><span className="rounded-full bg-white px-2 py-1 text-[9px]">{filtered.filter(topic => topic.status === column.id).length}</span></div><div className="space-y-2">{filtered.filter(topic => topic.status === column.id).map(topic => <TopicCard key={topic.id} topic={topic} busy={busyId === topic.id} onOpen={() => setSelectedTopic(topic)} onDragStart={() => setDragTopic(topic.id)} onDragEnd={() => { setDragTopic(null); setDragOverCol(null); }}/>)}</div></section>)}</div> : <div className="mt-4 overflow-hidden rounded-2xl border border-[#E1E8ED] bg-white"><div className="divide-y divide-[#EDF1F4]">{filtered.map(topic => <button key={topic.id} onClick={() => setSelectedTopic(topic)} className="grid w-full gap-2 px-4 py-4 text-left hover:bg-[#FAFBFE] sm:grid-cols-[minmax(0,1.5fr)_130px_120px_110px]"><span><strong className="block truncate text-[11px] text-[#34444E]">{topic.title}</strong><small className="mt-1 block truncate text-[9px] text-[#8D9BA5]">{topic.source}</small></span><span className="text-[10px] text-[#687985]">{topic.assignee_name || '待分配'}</span><span className="text-[10px] text-[#687985]">{topic.channel}</span><span className="w-fit rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ color: statusColumns.find(item => item.id === topic.status)?.color, background: '#F1F4F7' }}>{statusColumns.find(item => item.id === topic.status)?.label || '已归档'}</span></button>)}{!filtered.length && <div className="py-16 text-center text-xs text-[#8796A1]">暂无选题</div>}</div></div>}
      </div>

      {selectedTopic && <div className="fixed inset-0 z-[70] flex justify-end bg-[#17232D]/22 backdrop-blur-[2px]" onMouseDown={event => { if (event.currentTarget === event.target) setSelectedTopic(null); }}><aside className="h-full w-full max-w-[460px] overflow-y-auto border-l border-[#E1E8ED] bg-white p-5 shadow-[-18px_0_50px_rgba(31,50,68,0.16)]"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[#5267E8]">选题详情</span><button aria-label="关闭" onClick={() => setSelectedTopic(null)} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#F1F4F7]"><X className="h-4 w-4"/></button></div><h2 className="mt-5 text-xl font-semibold leading-8 text-[#263640]">{selectedTopic.title}</h2><p className="mt-4 text-[12px] leading-6 text-[#667985]">{selectedTopic.description || '暂无选题说明。'}</p><div className="mt-6 space-y-3 rounded-2xl bg-[#F7F9FB] p-4 text-[10px] text-[#60707D]"><div className="flex justify-between"><span>来源</span><span className="font-semibold text-[#3F505B]">{selectedTopic.source}</span></div><div className="flex justify-between"><span>负责人</span><span className="font-semibold text-[#3F505B]">{selectedTopic.assignee_name || '待分配'}</span></div><div className="flex justify-between"><span>渠道</span><span className="font-semibold text-[#3F505B]">{selectedTopic.channel}</span></div><div className="flex justify-between"><span>创建日期</span><span className="font-semibold text-[#3F505B]">{formatDate(selectedTopic.created_at)}</span></div></div>{selectedTopic.source_url && <a href={selectedTopic.source_url} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 rounded-xl border border-[#DCE4F8] p-3 text-xs font-semibold text-[#5267E8]"><ExternalLink className="h-4 w-4"/>查看原始来源</a>}<div className="mt-6"><span className="text-[10px] font-semibold text-[#60707D]">移动到</span><div className="mt-2 grid grid-cols-2 gap-2">{statusColumns.map(column => <button key={column.id} disabled={busyId === selectedTopic.id || selectedTopic.status === column.id} onClick={() => void updateStatus(selectedTopic, column.id)} className="rounded-xl border border-[#E1E8ED] px-3 py-2.5 text-[10px] font-semibold text-[#687985] disabled:bg-[#F1F4F7] disabled:opacity-60">{column.label}</button>)}</div></div><button disabled={busyId === selectedTopic.id} onClick={() => void deleteTopic(selectedTopic)} className="mt-7 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#F0D5D8] text-xs font-semibold text-[#C7515D]"><Trash2 className="h-4 w-4"/>删除选题</button></aside></div>}
    </div>
  );
}

function TopicCard({ topic, busy, onOpen, onDragStart, onDragEnd }: { topic: TopicItem; busy: boolean; onOpen: () => void; onDragStart: () => void; onDragEnd: () => void }) {
  const priority = priorityConfig[topic.priority];
  return <button draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onOpen} className="w-full cursor-grab rounded-xl border border-[#E4EAEF] bg-white p-3.5 text-left shadow-[0_4px_14px_rgba(35,54,72,0.03)] hover:border-[#C6D0F5] active:cursor-grabbing"><div className="flex items-start justify-between gap-2"><strong className="line-clamp-2 text-[11px] leading-5 text-[#34444E]">{topic.title}</strong>{busy ? <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-[#5267E8]"/> : <span className="shrink-0 rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ color: priority.color, backgroundColor: priority.bg }}>{priority.label}</span>}</div><p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#81909B]">{topic.description || '暂无描述'}</p>{topic.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{topic.tags.slice(0, 3).map(tag => <span key={tag} className="rounded bg-[#EEF2F5] px-1.5 py-0.5 text-[8px] text-[#71818D]">#{tag}</span>)}</div>}<div className="mt-3 flex justify-between text-[9px] text-[#8B9AA5]"><span className="truncate">{topic.source}</span><span>{topic.assignee_name || '待分配'}</span></div></button>;
}
