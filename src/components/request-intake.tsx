'use client';

import { CalendarDays, Check, FileText, LayoutGrid, List, LoaderCircle, MapPin, Paperclip, Plus, Search, Send, UserRound, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { type ListResponse, type MaterialItem, type MaterialStatus, formatDate, workflowApi } from '@/lib/workflow-api';
import { showToast } from './toast';

const statusDefinition: Record<MaterialStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待筛选', color: '#657682', bg: '#EEF2F5' },
  selected: { label: '已选中', color: '#5267E8', bg: '#EEF0FF' },
  in_progress: { label: '制作中', color: '#B36F27', bg: '#FFF4E6' },
  published: { label: '已发布', color: '#21865D', bg: '#EAF7F1' },
  rejected: { label: '暂不采用', color: '#9A6470', bg: '#F8EDF0' },
};

const urgencyDefinition = {
  low: { label: '低', color: '#7C8D98' },
  normal: { label: '普通', color: '#5267E8' },
  high: { label: '高', color: '#E28A32' },
  urgent: { label: '紧急', color: '#DC5A60' },
};

const emptyForm = {
  title: '', description: '', material_type: 'event', category: '员工故事', source_department: '人事总务部', source_contact: '', happened_at: '', location: '', urgency: 'normal', tags: '', expected_channels: '内网', notes: '',
};

export function RequestIntake() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filter, setFilter] = useState<'all' | MaterialStatus>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MaterialItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const deferredQuery = useDeferredValue(query.toLocaleLowerCase().trim());

  useEffect(() => {
    let active = true;
    workflowApi<ListResponse<MaterialItem>>('materials')
      .then(payload => { if (active) setMaterials(payload.items); })
      .catch(error => showToast(error instanceof Error ? error.message : '素材加载失败', 'error'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = materials.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const haystack = `${item.title} ${item.description} ${item.source_department} ${item.tags.join(' ')}`.toLocaleLowerCase();
    return matchesFilter && (!deferredQuery || haystack.includes(deferredQuery));
  });

  const replaceMaterial = (material: MaterialItem) => {
    setMaterials(current => current.map(item => item.id === material.id ? material : item));
    setSelected(current => current?.id === material.id ? material : current);
  };

  const createMaterial = async () => {
    if (form.title.trim().length < 2 || form.source_department.trim().length < 2) {
      showToast('请完整填写素材标题和来源部门', 'error');
      return;
    }
    setBusyId('create');
    try {
      let created = await workflowApi<MaterialItem>('materials', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          happened_at: form.happened_at || null,
          tags: form.tags.split(/[,，]/).map(item => item.trim()).filter(Boolean),
          expected_channels: form.expected_channels.split(/[,，]/).map(item => item.trim()).filter(Boolean),
        }),
      });
      if (file) {
        const body = new FormData();
        body.append('file', file);
        created = await workflowApi<MaterialItem>(`materials/${created.id}/attachment`, { method: 'POST', body });
      }
      setMaterials(current => [created, ...current]);
      setForm(emptyForm);
      setFile(null);
      setShowCreate(false);
      setSelected(created);
      showToast('素材已上报', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '上报失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const updateStatus = async (material: MaterialItem, status: MaterialStatus) => {
    setBusyId(material.id);
    try {
      const updated = await workflowApi<MaterialItem>(`materials/${material.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      replaceMaterial(updated);
      showToast(`素材已更新为“${statusDefinition[status].label}”`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '更新失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const schedule = async (material: MaterialItem) => {
    setBusyId(material.id);
    try {
      const result = await workflowApi<{ material: MaterialItem }>(`workflow/materials/${material.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ create_topic: true, priority: material.urgency === 'urgent' ? 'urgent' : material.urgency, project_name: '素材转内容' }),
      });
      replaceMaterial(result.material);
      showToast('已创建选题和内容任务', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '调度失败', 'error');
    } finally {
      setBusyId('');
    }
  };

  const fields: Array<{ key: keyof typeof emptyForm; label: string; placeholder?: string; type?: string; wide?: boolean }> = [
    { key: 'title', label: '素材标题', placeholder: '例如：一线改善提案获奖', wide: true },
    { key: 'source_department', label: '来源部门' },
    { key: 'source_contact', label: '联系人' },
    { key: 'happened_at', label: '发生日期', type: 'date' },
    { key: 'location', label: '发生地点' },
    { key: 'tags', label: '标签', placeholder: '用逗号分隔' },
    { key: 'expected_channels', label: '期望渠道', placeholder: '内网,公众号' },
  ];

  return (
    <div className="min-h-full bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-semibold text-[#5267E8]">需求入口</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">素材上报</h1><p className="mt-2 text-[12px] text-[#71818D]">统一接收一线素材，筛选后一键转为选题和内容任务。</p></div><button onClick={() => setShowCreate(true)} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]"><Plus className="h-4 w-4"/>上报新素材</button></header>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E1E8ED] bg-white p-3 shadow-[0_8px_24px_rgba(35,54,72,0.04)] lg:flex-row lg:items-center"><div className="no-scrollbar flex gap-1 overflow-x-auto">{([{ id: 'all', label: '全部' }, ...Object.entries(statusDefinition).map(([id, value]) => ({ id, label: value.label }))] as Array<{ id: 'all' | MaterialStatus; label: string }>).map(option => <button key={option.id} onClick={() => setFilter(option.id)} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-medium ${filter === option.id ? 'bg-[#EEF0FF] text-[#5267E8]' : 'text-[#6F808C] hover:bg-[#F4F7F9]'}`}>{option.label}<span className="ml-1.5 text-[9px] opacity-70">{option.id === 'all' ? materials.length : materials.filter(item => item.status === option.id).length}</span></button>)}</div><div className="ml-auto flex items-center gap-2"><label className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 lg:w-64"><Search className="h-3.5 w-3.5 text-[#82919C]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题、部门或标签" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"/></label><div className="flex rounded-xl bg-[#F1F4F7] p-1"><button aria-label="看板" onClick={() => setView('board')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${view === 'board' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><LayoutGrid className="h-3.5 w-3.5"/></button><button aria-label="列表" onClick={() => setView('list')} className={`flex h-7 w-7 items-center justify-center rounded-lg ${view === 'list' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#83929D]'}`}><List className="h-3.5 w-3.5"/></button></div></div></div>

        {loading ? <div className="flex h-64 items-center justify-center text-xs text-[#71818D]"><LoaderCircle className="mr-2 h-5 w-5 animate-spin"/>正在读取素材</div> : view === 'board' ? <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-4">{(Object.keys(statusDefinition) as MaterialStatus[]).map(status => <section key={status} className="w-[304px] shrink-0 rounded-2xl border border-[#E1E8ED] bg-[#F7F9FB] p-3"><div className="mb-3 flex items-center justify-between px-1"><span className="flex items-center gap-2 text-[11px] font-semibold text-[#4B5C67]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusDefinition[status].color }}/>{statusDefinition[status].label}</span><span className="rounded-full bg-white px-2 py-1 text-[9px] text-[#748590]">{visible.filter(item => item.status === status).length}</span></div><div className="space-y-2">{visible.filter(item => item.status === status).map(item => <MaterialCard key={item.id} item={item} onOpen={() => setSelected(item)}/>)}</div></section>)}</div> : <div className="mt-4 overflow-hidden rounded-2xl border border-[#E1E8ED] bg-white"><div className="divide-y divide-[#EDF1F4]">{visible.map(item => <button key={item.id} onClick={() => setSelected(item)} className="grid w-full gap-2 px-4 py-4 text-left hover:bg-[#FAFBFE] sm:grid-cols-[minmax(0,1.5fr)_160px_110px_100px] sm:items-center"><span><strong className="block truncate text-[11px] text-[#34444E]">{item.title}</strong><small className="mt-1 block text-[9px] text-[#8D9BA5]">{item.source_department} · {formatDate(item.created_at)}</small></span><span className="text-[10px] text-[#687985]">{item.source_contact || '未填写'}</span><span className="text-[10px]" style={{ color: urgencyDefinition[item.urgency].color }}>{urgencyDefinition[item.urgency].label}</span><span className="w-fit rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ color: statusDefinition[item.status].color, backgroundColor: statusDefinition[item.status].bg }}>{statusDefinition[item.status].label}</span></button>)}{!visible.length && <Empty/>}</div></div>}
      </div>

      {showCreate && <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#17232D]/25 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.currentTarget === event.target) setShowCreate(false); }}><div className="my-6 w-full max-w-[760px] rounded-3xl border border-white/80 bg-white p-5 shadow-[0_28px_80px_rgba(26,44,58,0.22)] sm:p-7"><div className="flex justify-between"><div><p className="text-[10px] font-semibold text-[#5267E8]">素材录入</p><h2 className="mt-1 text-xl font-semibold text-[#263640]">上报新素材</h2></div><button aria-label="关闭" onClick={() => setShowCreate(false)} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#F1F4F7]"><X className="h-4 w-4"/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map(field => <label key={field.key} className={field.wide ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-[10px] font-semibold text-[#6C7C87]">{field.label}</span><input type={field.type || 'text'} value={form[field.key]} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-sm outline-none focus:border-[#7083EE]"/></label>)}<label><span className="mb-1.5 block text-[10px] font-semibold text-[#6C7C87]">紧急程度</span><select value={form.urgency} onChange={event => setForm(current => ({ ...current, urgency: event.target.value }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-white px-3 text-sm"><option value="normal">普通</option><option value="high">高</option><option value="urgent">紧急</option><option value="low">低</option></select></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#6C7C87]">附件</span><span className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#C7D2DA] px-3 text-xs text-[#71818D]"><Paperclip className="h-4 w-4"/><span className="truncate">{file?.name || '选择文件（可选）'}</span><input type="file" className="hidden" onChange={event => setFile(event.target.files?.[0] || null)}/></span></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#6C7C87]">素材详情</span><textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows={4} className="w-full resize-none rounded-xl border border-[#DDE5EA] p-3 text-sm outline-none focus:border-[#7083EE]" placeholder="记录人物、事件、亮点与可核实信息"/></label></div><button disabled={busyId === 'create'} onClick={() => void createMaterial()} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-xs font-semibold text-white disabled:opacity-60">{busyId === 'create' ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}提交素材</button></div></div>}

      {selected && <div className="fixed inset-0 z-[70] flex justify-end bg-[#17232D]/22 backdrop-blur-[2px]" onMouseDown={event => { if (event.currentTarget === event.target) setSelected(null); }}><aside className="h-full w-full max-w-[460px] overflow-y-auto border-l border-[#E1E8ED] bg-white p-5 shadow-[-18px_0_50px_rgba(31,50,68,0.16)]"><div className="flex justify-between"><span className="rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ color: statusDefinition[selected.status].color, backgroundColor: statusDefinition[selected.status].bg }}>{statusDefinition[selected.status].label}</span><button aria-label="关闭" onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#F1F4F7]"><X className="h-4 w-4"/></button></div><h2 className="mt-5 text-xl font-semibold leading-8 text-[#263640]">{selected.title}</h2><p className="mt-4 whitespace-pre-wrap text-[12px] leading-6 text-[#667985]">{selected.description || '暂无详情。'}</p><div className="mt-6 space-y-3 rounded-2xl bg-[#F7F9FB] p-4 text-[10px] text-[#60707D]"><Info icon={<UserRound/>} label="来源" value={`${selected.source_department} · ${selected.source_contact || '未填写'}`}/><Info icon={<CalendarDays/>} label="发生日期" value={selected.happened_at || '未填写'}/><Info icon={<MapPin/>} label="地点" value={selected.location || '未填写'}/><Info icon={<FileText/>} label="附件" value={selected.original_filename || '无'}/></div>{selected.tags.length > 0 && <div className="mt-5 flex flex-wrap gap-1.5">{selected.tags.map(tag => <span key={tag} className="rounded-lg bg-[#EEF2F5] px-2 py-1 text-[9px] text-[#657682]">#{tag}</span>)}</div>}<div className="mt-7 grid grid-cols-2 gap-2">{selected.status === 'pending' && <><button disabled={busyId === selected.id} onClick={() => void updateStatus(selected, 'selected')} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#C9D3FA] text-xs font-semibold text-[#5267E8]"><Check className="h-4 w-4"/>选中</button><button disabled={busyId === selected.id} onClick={() => void updateStatus(selected, 'rejected')} className="h-10 rounded-xl border border-[#E5D7DB] text-xs font-semibold text-[#9A6470]">暂不采用</button></>}{(selected.status === 'pending' || selected.status === 'selected') && <button disabled={busyId === selected.id} onClick={() => void schedule(selected)} className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-xs font-semibold text-white disabled:opacity-60">{busyId === selected.id ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}调度为选题与内容任务</button>}</div></aside></div>}
    </div>
  );
}

function MaterialCard({ item, onOpen }: { item: MaterialItem; onOpen: () => void }) {
  return <button onClick={onOpen} className="w-full rounded-xl border border-[#E4EAEF] bg-white p-3.5 text-left shadow-[0_4px_14px_rgba(35,54,72,0.03)] transition hover:-translate-y-0.5 hover:border-[#C6D0F5]"><div className="flex items-start justify-between gap-3"><strong className="line-clamp-2 text-[11px] leading-5 text-[#34444E]">{item.title}</strong><span className="shrink-0 text-[9px] font-semibold" style={{ color: urgencyDefinition[item.urgency].color }}>{urgencyDefinition[item.urgency].label}</span></div><p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#81909B]">{item.description || '暂无描述'}</p><div className="mt-3 flex items-center justify-between text-[9px] text-[#8B9AA5]"><span className="truncate">{item.source_department}</span><span>{formatDate(item.created_at)}</span></div>{item.original_filename && <div className="mt-2 flex items-center gap-1 truncate text-[9px] text-[#5267E8]"><Paperclip className="h-3 w-3"/>{item.original_filename}</div>}</button>;
}

function Info({ icon, label, value }: { icon: React.ReactElement<{ className?: string }>; label: string; value: string }) {
  return <div className="flex items-center gap-2"><span className="text-[#94A2AE]">{icon}</span><span>{label}</span><span className="ml-auto max-w-[230px] truncate font-semibold text-[#3F505B]">{value}</span></div>;
}

function Empty() {
  return <div className="flex h-52 flex-col items-center justify-center text-center"><FileText className="h-7 w-7 text-[#AAB5BD]"/><p className="mt-3 text-xs font-semibold text-[#667985]">暂无素材</p><p className="mt-1 text-[10px] text-[#94A2AE]">点击“上报新素材”开始流程。</p></div>;
}
