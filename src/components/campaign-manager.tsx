'use client';

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Filter,
  FolderKanban,
  GanttChartSquare,
  List,
  Megaphone,
  Plus,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { showToast } from './toast';

interface CampaignItem {
  id: string;
  title: string;
  channel: string;
  date: string;
  status: 'draft' | 'ready' | 'published' | 'scheduled';
  format: string;
}

interface CampaignPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  items: CampaignItem[];
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  owner: string;
  phases: CampaignPhase[];
  channels: string[];
  progress: number;
  totalItems: number;
  completedItems: number;
}

const initialCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: '22 周年文化传播',
    description: '周年庆生、员工故事与共创活动的全流程宣传计划。',
    status: 'active', startDate: '2026-07-15', endDate: '2026-09-30', owner: '王彬彬', progress: 58, totalItems: 12, completedItems: 7,
    channels: ['公众号', '视频号', '内网', '小红书'],
    phases: [
      { id: 'phase-1', name: '预热与人物征集', startDate: '07-15', endDate: '07-31', status: 'completed', items: [
        { id: 'item-1', title: '员工故事征集通知', channel: '内网', date: '07-17', status: 'published', format: '图文' },
        { id: 'item-2', title: '周年故事预告短片', channel: '视频号', date: '07-24', status: 'published', format: '视频' },
      ] },
      { id: 'phase-2', name: '核心内容发布', startDate: '08-01', endDate: '08-31', status: 'active', items: [
        { id: 'item-3', title: '二十二年同行主题长图', channel: '公众号', date: '08-05', status: 'ready', format: '长图' },
        { id: 'item-4', title: '一线员工人物故事', channel: '公众号', date: '08-12', status: 'draft', format: '文章' },
        { id: 'item-5', title: '周年故事会精华', channel: '视频号', date: '08-17', status: 'scheduled', format: '视频' },
      ] },
      { id: 'phase-3', name: '沉淀与复盘', startDate: '09-01', endDate: '09-30', status: 'upcoming', items: [
        { id: 'item-6', title: '周年活动复盘报告', channel: '内网', date: '09-12', status: 'draft', format: '报告' },
      ] },
    ],
  },
  {
    id: 'camp-002',
    name: '新员工文化融入',
    description: '帮助新员工理解品牌文化与关键行为准则。',
    status: 'planning', startDate: '2026-08-01', endDate: '2026-10-15', owner: '刘思敏', progress: 24, totalItems: 8, completedItems: 2,
    channels: ['内网', '企业微信', '线下活动'],
    phases: [
      { id: 'phase-4', name: '方案筹备', startDate: '08-01', endDate: '08-15', status: 'active', items: [
        { id: 'item-7', title: '文化融入活动方案', channel: '内网', date: '08-06', status: 'ready', format: '方案' },
      ] },
      { id: 'phase-5', name: '活动执行', startDate: '08-16', endDate: '09-30', status: 'upcoming', items: [] },
    ],
  },
  {
    id: 'camp-003',
    name: '品牌案例库共建',
    description: '持续收集、评审并沉淀各渠道优秀文化内容。',
    status: 'active', startDate: '2026-06-01', endDate: '2026-12-31', owner: '陈清', progress: 42, totalItems: 24, completedItems: 10,
    channels: ['公众号', '视频号', '小红书'],
    phases: [
      { id: 'phase-6', name: '月度案例收集', startDate: '07-01', endDate: '07-31', status: 'active', items: [
        { id: 'item-8', title: '7 月优秀案例评审', channel: '小红书', date: '07-28', status: 'scheduled', format: '评审' },
      ] },
    ],
  },
];

const campaignStatus = {
  planning: { label: '筹备中', bg: '#EEF2F5', color: '#657682' },
  active: { label: '进行中', bg: '#EDF0FF', color: '#4660D3' },
  paused: { label: '已暂停', bg: '#FFF4E6', color: '#B36F27' },
  completed: { label: '已完成', bg: '#EAF7F1', color: '#21865D' },
} as const;

const itemStatus = {
  draft: { label: '草稿', bg: '#EEF2F5', color: '#657682' },
  ready: { label: '待确认', bg: '#FFF4E6', color: '#B36F27' },
  published: { label: '已发布', bg: '#EAF7F1', color: '#21865D' },
  scheduled: { label: '已排期', bg: '#EDF0FF', color: '#4660D3' },
} as const;

const phaseStatus = {
  upcoming: { label: '待开始', dot: '#A6B2BA' },
  active: { label: '进行中', dot: '#5267E8' },
  completed: { label: '已完成', dot: '#25A76F' },
} as const;

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedId, setSelectedId] = useState(initialCampaigns[0].id);
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');
  const [channelFilter, setChannelFilter] = useState('all');
  const selectedCampaign = campaigns.find(campaign => campaign.id === selectedId) ?? campaigns[0];

  const createProject = () => {
    const project: Campaign = {
      id: `camp-${Date.now()}`,
      name: `未命名活动 ${campaigns.length + 1}`,
      description: '等待补充活动目标、参与团队与传播计划。',
      status: 'planning', startDate: '待设置', endDate: '待设置', owner: '王彬彬', progress: 0, totalItems: 0, completedItems: 0,
      channels: ['内网'],
      phases: [{ id: `phase-${Date.now()}`, name: '活动筹备', startDate: '待设置', endDate: '待设置', status: 'upcoming', items: [] }],
    };
    setCampaigns(current => [...current, project]);
    setSelectedId(project.id);
    setChannelFilter('all');
    showToast('活动已创建，可以继续补充计划', 'success');
  };

  const createContentItem = () => {
    const item: CampaignItem = { id: `item-${Date.now()}`, title: '未命名内容任务', channel: selectedCampaign.channels[0] ?? '内网', date: '待设置', status: 'draft', format: '待设置' };
    setCampaigns(current => current.map(campaign => {
      if (campaign.id !== selectedCampaign.id) return campaign;
      const targetIndex = Math.max(0, campaign.phases.findIndex(phase => phase.status === 'active'));
      return {
        ...campaign,
        totalItems: campaign.totalItems + 1,
        phases: campaign.phases.map((phase, index) => index === targetIndex ? { ...phase, items: [item, ...phase.items] } : phase),
      };
    }));
    setViewMode('timeline');
    showToast('内容任务已加入当前阶段', 'success');
  };

  const filteredItems = (items: CampaignItem[]) => channelFilter === 'all' ? items : items.filter(item => item.channel === channelFilter);

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">协同执行</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">活动宣传</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">从活动目标、阶段节奏到内容发布，统一管理宣传计划。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={createContentItem} className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE5EA] bg-white px-4 text-[12px] font-semibold text-[#52636E] hover:border-[#BFCBDA]"><Plus className="h-4 w-4" /> 新建内容任务</button>
            <button type="button" onClick={createProject} className="flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]"><Megaphone className="h-4 w-4" /> 新建活动</button>
          </div>
        </div>

        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
          {campaigns.map(campaign => {
            const active = campaign.id === selectedCampaign.id;
            return (
              <button key={campaign.id} type="button" aria-pressed={active} onClick={() => { setSelectedId(campaign.id); setChannelFilter('all'); }} className={`flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${active ? 'border-[#C9D1FA] bg-[#F0F2FF]' : 'border-[#E1E8ED] bg-white hover:border-[#CBD5DD]'}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-white text-[#5267E8]' : 'bg-[#F2F5F7] text-[#7D8D98]'}`}><FolderKanban className="h-4 w-4" strokeWidth={1.8} /></span>
                <span><span className={`block text-[11px] font-semibold ${active ? 'text-[#4257D2]' : 'text-[#40515B]'}`}>{campaign.name}</span><span className="mt-0.5 block text-[9px] text-[#8A99A4]">{campaign.progress}% · {campaignStatus[campaign.status].label}</span></span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="surface-card h-fit overflow-hidden lg:sticky lg:top-4">
            <div className="border-b border-[#E8EDF1] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="text-[16px] font-semibold leading-6 text-[#263640]">{selectedCampaign.name}</h3><p className="mt-1 text-[10px] leading-5 text-[#7D8D98]">{selectedCampaign.description}</p></div>
                <span className="shrink-0 rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ backgroundColor: campaignStatus[selectedCampaign.status].bg, color: campaignStatus[selectedCampaign.status].color }}>{campaignStatus[selectedCampaign.status].label}</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[9px] text-[#81909B]"><span>整体进度</span><span>{selectedCampaign.completedItems}/{selectedCampaign.totalItems} 项</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EDF1F4]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#7357E6,#5267E8,#23A4C2)]" style={{ width: `${selectedCampaign.progress}%` }} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {[
                { label: '负责人', value: selectedCampaign.owner, icon: UserRound },
                { label: '开始时间', value: selectedCampaign.startDate, icon: CalendarDays },
                { label: '结束时间', value: selectedCampaign.endDate, icon: Clock3 },
                { label: '内容任务', value: `${selectedCampaign.totalItems} 项`, icon: Megaphone },
              ].map(item => {
                const Icon = item.icon;
                return <div key={item.label} className="rounded-xl bg-[#F7F9FB] p-3"><Icon className="h-3.5 w-3.5 text-[#7C8CE8]" /><span className="mt-2 block text-[9px] text-[#8A99A4]">{item.label}</span><span className="mt-1 block truncate text-[10px] font-semibold text-[#455660]">{item.value}</span></div>;
              })}
            </div>
            <div className="border-t border-[#E8EDF1] p-4">
              <div className="flex items-center justify-between"><p className="text-[10px] font-semibold text-[#60707D]">发布渠道</p>{channelFilter !== 'all' ? <button type="button" onClick={() => setChannelFilter('all')} className="text-[9px] font-semibold text-[#5267E8]">清除筛选</button> : null}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedCampaign.channels.map(channel => <button key={channel} type="button" aria-pressed={channelFilter === channel} onClick={() => setChannelFilter(current => current === channel ? 'all' : channel)} className={`rounded-lg px-2 py-1 text-[9px] font-medium ${channelFilter === channel ? 'bg-[#5267E8] text-white' : 'bg-[#F1F4F7] text-[#687985] hover:bg-[#E8EDF1]'}`}>{channel}</button>)}
              </div>
            </div>
            <div className="border-t border-[#E8EDF1] p-4">
              <p className="text-[10px] font-semibold text-[#60707D]">活动阶段</p>
              <div className="mt-3 space-y-2">
                {selectedCampaign.phases.map(phase => <div key={phase.id} className="flex items-center gap-2.5 rounded-xl border border-[#E7ECF0] p-2.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: phaseStatus[phase.status].dot }} /><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#455660]">{phase.name}</span><span className="mt-0.5 block text-[9px] text-[#8A99A4]">{phase.startDate} - {phase.endDate}</span></span><span className="text-[9px] text-[#8A99A4]">{phase.items.length} 项</span></div>)}
              </div>
            </div>
          </aside>

          <section className="surface-card min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#E8EDF1] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h3 className="text-[13px] font-semibold text-[#35454F]">内容计划</h3><p className="mt-1 text-[9px] text-[#8A99A4]">按阶段查看任务、渠道与发布状态</p></div>
              <div className="flex items-center gap-2">
                {channelFilter !== 'all' ? <span className="flex items-center gap-1.5 rounded-lg bg-[#EEF1FF] px-2 py-1.5 text-[9px] font-semibold text-[#5267E8]"><Filter className="h-3 w-3" />{channelFilter}</span> : null}
                <div className="flex rounded-xl bg-[#F1F4F7] p-1">
                  <button type="button" onClick={() => setViewMode('timeline')} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold ${viewMode === 'timeline' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#7D8D98]'}`}><List className="h-3.5 w-3.5" />时间线</button>
                  <button type="button" onClick={() => setViewMode('gantt')} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold ${viewMode === 'gantt' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#7D8D98]'}`}><GanttChartSquare className="h-3.5 w-3.5" />排期</button>
                </div>
              </div>
            </div>

            {viewMode === 'timeline' ? (
              <div className="space-y-6 p-4 sm:p-5">
                {selectedCampaign.phases.map(phase => {
                  const items = filteredItems(phase.items);
                  return (
                    <div key={phase.id}>
                      <div className="mb-3 flex flex-wrap items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phaseStatus[phase.status].dot }} /><h4 className="text-[12px] font-semibold text-[#3C4D57]">{phase.name}</h4><span className="text-[9px] text-[#8A99A4]">{phase.startDate} - {phase.endDate}</span><span className="rounded-lg bg-[#F1F4F7] px-2 py-1 text-[9px] text-[#71818D]">{phaseStatus[phase.status].label}</span></div>
                      <div className="space-y-2">
                        {items.map(item => {
                          const status = itemStatus[item.status];
                          return (
                            <button key={item.id} type="button" onClick={() => showToast(`已打开“${item.title}”`, 'info')} className="grid w-full gap-3 rounded-xl border border-[#E4EAF0] bg-white p-3 text-left transition-colors hover:border-[#C8D1F5] hover:bg-[#FAFBFE] lg:grid-cols-[70px_minmax(0,1fr)_90px_80px] lg:items-center">
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#657682]"><CalendarDays className="h-3.5 w-3.5 text-[#8C9AA4]" />{item.date}</span>
                              <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-[#35454F]">{item.title}</span><span className="mt-1 block text-[9px] text-[#8A99A4]">{item.channel} · {item.format}</span></span>
                              <span className="hidden text-[9px] text-[#71818D] lg:block">{item.channel}</span>
                              <span className="w-fit rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                            </button>
                          );
                        })}
                        {!items.length ? <div className="rounded-xl border border-dashed border-[#D9E1E7] px-4 py-8 text-center text-[10px] text-[#8A99A4]">{channelFilter === 'all' ? '当前阶段还没有内容任务' : '当前阶段没有该渠道的内容'}</div> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="min-w-[720px] overflow-hidden rounded-2xl border border-[#E4EAF0]">
                  <div className="grid grid-cols-[220px_repeat(5,1fr)] bg-[#F7F9FB] text-[9px] font-semibold text-[#81909B]"><span className="border-r border-[#E4EAF0] px-3 py-3">内容任务</span>{['7 月下', '8 月上', '8 月下', '9 月上', '9 月下'].map(period => <span key={period} className="border-r border-[#E4EAF0] px-2 py-3 text-center last:border-r-0">{period}</span>)}</div>
                  {selectedCampaign.phases.flatMap(phase => filteredItems(phase.items)).map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[220px_repeat(5,1fr)] border-t border-[#E4EAF0] text-[9px]">
                      <span className="border-r border-[#E4EAF0] px-3 py-3"><span className="block truncate font-semibold text-[#455660]">{item.title}</span><span className="mt-1 block text-[#8A99A4]">{item.channel} · {item.date}</span></span>
                      {Array.from({ length: 5 }, (_, period) => <span key={period} className="relative min-h-12 border-r border-[#E4EAF0] last:border-r-0">{period === Math.min(4, index + 1) ? <span className="absolute inset-x-2 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#7357E6,#23A4C2)]" /> : null}</span>)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[
            { label: '已完成活动', value: campaigns.filter(campaign => campaign.status === 'completed').length, icon: CheckCircle2 },
            { label: '进行中活动', value: campaigns.filter(campaign => campaign.status === 'active').length, icon: Circle },
            { label: '待确认内容', value: campaigns.flatMap(campaign => campaign.phases).flatMap(phase => phase.items).filter(item => item.status === 'ready').length, icon: Clock3 },
          ].map(stat => { const Icon = stat.icon; return <div key={stat.label} className="surface-card flex items-center justify-between p-4"><span className="flex items-center gap-2 text-[10px] font-medium text-[#71818D]"><Icon className="h-4 w-4 text-[#687BEA]" />{stat.label}</span><strong className="text-[18px] font-semibold text-[#263640]">{stat.value}</strong></div>; })}
        </div>
      </div>
    </div>
  );
}
