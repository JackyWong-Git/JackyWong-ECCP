'use client';

import { useState } from 'react';
import { showToast } from './toast';

// --- Types ---
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

interface CampaignPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  items: CampaignItem[];
}

interface CampaignItem {
  id: string;
  title: string;
  channel: string;
  date: string;
  status: 'draft' | 'ready' | 'published' | 'scheduled';
  format: string;
}

// --- Mock Data (based on the anniversary plan) ---
const mockCampaigns: Campaign[] = [
  {
    id: 'camp-001',
    name: '22周年系列活动',
    description: '22周年庆生+故事会+共创活动全流程传播',
    status: 'active',
    startDate: '2025-08-17',
    endDate: '2025-09-30',
    owner: '蔡雯欣',
    progress: 35,
    totalItems: 48,
    completedItems: 17,
    channels: ['微信公众号', '内网', 'K站生活圈', 'K站视频', '微信视频号', '电视台', '社媒', '宣传栏', '车站海报'],
    phases: [
      {
        id: 'phase-1',
        name: '预热征集',
        startDate: '2025-08-17',
        endDate: '2025-08-31',
        status: 'active',
        items: [
          { id: 'item-1', title: '周年LOGO & 故事会内容征集', channel: '微信公众号', date: '08-17', status: 'published', format: '图文' },
          { id: 'item-2', title: '征集推文 + 二维码', channel: '内网', date: '08-17', status: 'published', format: '图文' },
          { id: 'item-3', title: '投稿作品"抢先看"', channel: '微信公众号', date: '08-20', status: 'published', format: '图文' },
          { id: 'item-4', title: 'LOGO征集结果发布', channel: '微信公众号', date: '08-24', status: 'ready', format: '图文' },
          { id: 'item-5', title: '系列活动预告长图', channel: '微信公众号', date: '08-31', status: 'draft', format: '长图' },
          { id: 'item-6', title: '系列活动预告', channel: '内网', date: '08-31', status: 'draft', format: '图文' },
          { id: 'item-7', title: '征集活动口播', channel: 'K站视频', date: '08-17', status: 'published', format: '口播' },
          { id: 'item-8', title: '路采混剪', channel: '社媒', date: '08-31', status: 'draft', format: '视频' },
        ],
      },
      {
        id: 'phase-2',
        name: '周年活动（庆生）',
        startDate: '2025-09-01',
        endDate: '2025-09-06',
        status: 'upcoming',
        items: [
          { id: 'item-9', title: '大事记 + 员工成长日记', channel: '微信公众号', date: '09-01', status: 'scheduled', format: '图文' },
          { id: 'item-10', title: '庆生&故事会&摊位活动集锦', channel: '微信公众号', date: '09-01', status: 'scheduled', format: '图文' },
          { id: 'item-11', title: '渠道周年企划（共创共答）', channel: 'K站生活圈', date: '09-01', status: 'scheduled', format: '图文' },
          { id: 'item-12', title: '周年路采QA + 口播', channel: 'K站视频', date: '09-01', status: 'scheduled', format: '视频' },
          { id: 'item-13', title: '员工故事详细版（5天）', channel: '微信公众号', date: '09-02~09-06', status: 'scheduled', format: '图文' },
        ],
      },
      {
        id: 'phase-3',
        name: '后续传播',
        startDate: '2025-09-07',
        endDate: '2025-09-30',
        status: 'upcoming',
        items: [
          { id: 'item-14', title: '共创活动宣传', channel: '微信公众号', date: '09-01', status: 'draft', format: '图文' },
          { id: 'item-15', title: '活动维温（双周）', channel: '微信公众号', date: '09-15', status: 'draft', format: '图文' },
        ],
      },
    ],
  },
  {
    id: 'camp-002',
    name: '讲车帝共创活动',
    description: '9-12月讲车帝内容创作大赛全流程推广',
    status: 'active',
    startDate: '2025-09-01',
    endDate: '2025-12-21',
    owner: '熊臣坤',
    progress: 10,
    totalItems: 24,
    completedItems: 2,
    channels: ['微信公众号', '内网', 'K站视频', '微信视频号'],
    phases: [
      {
        id: 'phase-4',
        name: '素材征集',
        startDate: '2025-09-01',
        endDate: '2025-09-15',
        status: 'active',
        items: [
          { id: 'item-16', title: '征集活动上线', channel: '微信公众号', date: '09-01', status: 'ready', format: '图文' },
          { id: 'item-17', title: '征集活动上线', channel: '内网', date: '09-01', status: 'ready', format: '图文' },
        ],
      },
      {
        id: 'phase-5',
        name: '活动维温',
        startDate: '2025-09-15',
        endDate: '2025-12-01',
        status: 'upcoming',
        items: [
          { id: 'item-18', title: '阶段性优质素材展示', channel: '微信公众号', date: '09-30', status: 'draft', format: '图文' },
          { id: 'item-19', title: '创作者专访', channel: 'K站视频', date: '10-08', status: 'draft', format: '视频' },
        ],
      },
      {
        id: 'phase-6',
        name: '总结报道',
        startDate: '2025-12-01',
        endDate: '2025-12-21',
        status: 'upcoming',
        items: [],
      },
    ],
  },
  {
    id: 'camp-003',
    name: '安全生产月宣传',
    description: '9月安全生产主题宣传',
    status: 'planning',
    startDate: '2025-09-01',
    endDate: '2025-09-30',
    owner: '王彬彬',
    progress: 0,
    totalItems: 8,
    completedItems: 0,
    channels: ['内网', '宣传栏'],
    phases: [
      {
        id: 'phase-7',
        name: '安全宣传',
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        status: 'upcoming',
        items: [],
      },
    ],
  },
];

const allChannels = ['微信公众号', '内网', 'K站生活圈', 'K站视频', '微信视频号', '电视台', '社媒', '宣传栏', '车站海报'];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  planning: { bg: '#F0EFEB', text: '#6B6B6B', label: '规划中' },
  active: { bg: '#EEF5F0', text: '#4A7C59', label: '进行中' },
  paused: { bg: '#FDF5EC', text: '#C17B3E', label: '已暂停' },
  completed: { bg: '#F0FDF4', text: '#16A34A', label: '已完成' },
};

const itemStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: '#F0EFEB', text: '#6B6B6B', label: '草稿' },
  ready: { bg: '#FDF5EC', text: '#C17B3E', label: '待发布' },
  scheduled: { bg: '#EFF6FF', text: '#2563EB', label: '已排期' },
  published: { bg: '#F0FDF4', text: '#16A34A', label: '已发布' },
};

const phaseStatusColors: Record<string, string> = {
  upcoming: '#6B6B6B',
  active: '#D4A574',
  completed: '#4A7C59',
};

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(mockCampaigns[0]);
  const [view, setView] = useState<'timeline' | 'gantt'>('timeline');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const handleSelectCampaign = (camp: Campaign) => {
    setSelectedCampaign(camp);
  };

  const filteredItems = (items: CampaignItem[]) => {
    if (channelFilter === 'all') return items;
    return items.filter(item => item.channel === channelFilter);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAF8]">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              活动管理
            </h1>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">自有活动全生命周期 + 跨渠道排期</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F0EFEB] rounded-md p-0.5">
              <button
                onClick={() => setView('timeline')}
                className={`px-2.5 py-1 text-[12px] rounded ${view === 'timeline' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}
              >
                时间线
              </button>
              <button
                onClick={() => setView('gantt')}
                className={`px-2.5 py-1 text-[12px] rounded ${view === 'gantt' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}
              >
                甘特图
              </button>
            </div>
            <button
              onClick={() => showToast('新建活动', 'info')}
              className="px-3 py-1.5 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564] transition-colors"
            >
              新建活动
            </button>
          </div>
        </div>

        {/* Campaign selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {campaigns.map(camp => (
            <button
              key={camp.id}
              onClick={() => handleSelectCampaign(camp)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-md text-[12px] transition-all ${
                selectedCampaign?.id === camp.id
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F0EFEB] text-[#4A4A4A] hover:bg-[#E8E6E1]'
              }`}
            >
              <span className="font-medium">{camp.name}</span>
              <span className={`ml-1.5 text-[10px] ${selectedCampaign?.id === camp.id ? 'text-white/60' : 'text-[#6B6B6B]'}`}>
                {camp.progress}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      {selectedCampaign && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Campaign overview */}
          <div className="w-[280px] border-r border-[#E8E6E1] p-4 overflow-y-auto flex-shrink-0">
            <div className="mb-4">
              <h2 className="text-[16px] font-semibold text-[#1A1A1A] mb-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {selectedCampaign.name}
              </h2>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{selectedCampaign.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white rounded-lg p-2.5 border border-[#E8E6E1]">
                <div className="text-[10px] text-[#6B6B6B] mb-0.5">状态</div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: statusColors[selectedCampaign.status]?.bg, color: statusColors[selectedCampaign.status]?.text }}
                >
                  {statusColors[selectedCampaign.status]?.label}
                </span>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-[#E8E6E1]">
                <div className="text-[10px] text-[#6B6B6B] mb-0.5">负责人</div>
                <div className="text-[12px] font-medium text-[#1A1A1A]">{selectedCampaign.owner}</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-[#E8E6E1]">
                <div className="text-[10px] text-[#6B6B6B] mb-0.5">开始</div>
                <div className="text-[12px] font-medium text-[#1A1A1A]">{selectedCampaign.startDate}</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-[#E8E6E1]">
                <div className="text-[10px] text-[#6B6B6B] mb-0.5">结束</div>
                <div className="text-[12px] font-medium text-[#1A1A1A]">{selectedCampaign.endDate}</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mb-1">
                <span>整体进度</span>
                <span>{selectedCampaign.completedItems}/{selectedCampaign.totalItems} 项</span>
              </div>
              <div className="h-1.5 bg-[#F0EFEB] rounded-full overflow-hidden">
                <div className="h-full bg-[#D4A574] rounded-full transition-all" style={{ width: `${selectedCampaign.progress}%` }} />
              </div>
            </div>

            {/* Channels */}
            <div className="mb-4">
              <div className="text-[11px] font-medium text-[#1A1A1A] mb-2">发布渠道</div>
              <div className="flex flex-wrap gap-1">
                {selectedCampaign.channels.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(channelFilter === ch ? 'all' : ch)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                      channelFilter === ch
                        ? 'bg-[#D4A574] text-white'
                        : 'bg-[#F5F4F0] text-[#6B6B6B] hover:bg-[#E8E6E1]'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              {channelFilter !== 'all' && (
                <button
                  onClick={() => setChannelFilter('all')}
                  className="text-[10px] text-[#D4A574] mt-1 hover:underline"
                >
                  清除筛选
                </button>
              )}
            </div>

            {/* Phases */}
            <div>
              <div className="text-[11px] font-medium text-[#1A1A1A] mb-2">阶段</div>
              <div className="space-y-1.5">
                {selectedCampaign.phases.map(phase => (
                  <div key={phase.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E8E6E1]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: phaseStatusColors[phase.status] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#1A1A1A] truncate">{phase.name}</div>
                      <div className="text-[10px] text-[#6B6B6B]">{phase.startDate} ~ {phase.endDate}</div>
                    </div>
                    <span className="text-[10px] text-[#6B6B6B]">{phase.items.length}项</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Timeline / Gantt */}
          <div className="flex-1 overflow-auto p-4">
            {view === 'timeline' ? (
              <div className="space-y-6">
                {selectedCampaign.phases.map(phase => {
                  const items = filteredItems(phase.items);
                  return (
                    <div key={phase.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: phaseStatusColors[phase.status] }} />
                        <h3 className="text-[14px] font-semibold text-[#1A1A1A]">{phase.name}</h3>
                        <span className="text-[11px] text-[#6B6B6B]">{phase.startDate} ~ {phase.endDate}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          phase.status === 'active' ? 'bg-[#D4A574]/10 text-[#D4A574]' :
                          phase.status === 'completed' ? 'bg-[#4A7C59]/10 text-[#4A7C59]' :
                          'bg-[#F0EFEB] text-[#6B6B6B]'
                        }`}>
                          {phase.status === 'active' ? '进行中' : phase.status === 'completed' ? '已完成' : '待开始'}
                        </span>
                      </div>
                      {items.length === 0 ? (
                        <div className="text-[12px] text-[#6B6B6B] bg-white rounded-lg p-4 border border-[#E8E6E1] text-center">
                          {channelFilter !== 'all' ? '该渠道暂无内容' : '暂无内容项'}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {items.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#E8E6E1] hover:border-[#D4A574]/30 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <div className="w-[60px] text-[12px] text-[#6B6B6B] font-mono flex-shrink-0">{item.date}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-[#1A1A1A] truncate">{item.title}</div>
                              </div>
                              <span className="text-[10px] bg-[#F5F4F0] text-[#6B6B6B] rounded px-1.5 py-0.5 flex-shrink-0">{item.channel}</span>
                              <span className="text-[10px] bg-[#F5F4F0] text-[#6B6B6B] rounded px-1.5 py-0.5 flex-shrink-0">{item.format}</span>
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: itemStatusColors[item.status]?.bg, color: itemStatusColors[item.status]?.text }}
                              >
                                {itemStatusColors[item.status]?.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Gantt-like view */
              <div className="bg-white rounded-lg border border-[#E8E6E1] overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="flex border-b border-[#E8E6E1] bg-[#FAFAF8]">
                      <div className="w-[200px] flex-shrink-0 px-3 py-2 text-[11px] font-medium text-[#6B6B6B] border-r border-[#E8E6E1]">内容项</div>
                      <div className="flex-1 flex">
                        {['8月中', '8月下', '9月上', '9月中', '9月下'].map(period => (
                          <div key={period} className="flex-1 px-2 py-2 text-[11px] text-[#6B6B6B] text-center border-r border-[#E8E6E1] last:border-0">
                            {period}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Rows */}
                    {selectedCampaign.phases.map(phase => (
                      <div key={phase.id}>
                        <div className="flex bg-[#FAFAF8]/50 border-b border-[#E8E6E1]">
                          <div className="w-[200px] flex-shrink-0 px-3 py-2 text-[12px] font-medium text-[#1A1A1A] border-r border-[#E8E6E1]">
                            {phase.name}
                          </div>
                          <div className="flex-1 relative h-8" />
                        </div>
                        {filteredItems(phase.items).map(item => (
                          <div key={item.id} className="flex border-b border-[#E8E6E1] last:border-0 hover:bg-[#FAFAF8]">
                            <div className="w-[200px] flex-shrink-0 px-3 py-2 border-r border-[#E8E6E1]">
                              <div className="text-[12px] text-[#1A1A1A] truncate">{item.title}</div>
                              <div className="text-[10px] text-[#6B6B6B]">{item.channel} · {item.format}</div>
                            </div>
                            <div className="flex-1 flex relative">
                              {['8月中', '8月下', '9月上', '9月中', '9月下'].map((_, idx) => (
                                <div key={idx} className="flex-1 border-r border-[#E8E6E1] last:border-0 relative">
                                  {item.date.includes('08-17') && idx === 0 && (
                                    <div className="absolute inset-y-1 left-1 right-1 bg-[#D4A574]/20 rounded" />
                                  )}
                                  {item.date.includes('08-31') && idx === 1 && (
                                    <div className="absolute inset-y-1 left-1 right-1 bg-[#D4A574]/20 rounded" />
                                  )}
                                  {item.date.includes('09-01') && idx === 2 && (
                                    <div className="absolute inset-y-1 left-1 right-1 bg-[#D4A574]/20 rounded" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
