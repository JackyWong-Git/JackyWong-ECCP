'use client';

import { useState } from 'react';

interface Channel {
  id: string;
  name: string;
  type: 'internal' | 'external';
  frequency: string;
  followers: string;
  color: string;
  icon: string;
  pendingCount: number;
  publishedThisMonth: number;
}

interface PublishItem {
  id: string;
  title: string;
  channelId: string;
  date: string;
  time: string;
  status: 'draft' | 'ready' | 'published' | 'failed';
  contentType: string;
  author: string;
  views?: number;
  likes?: number;
}

const channels: Channel[] = [
  { id: 'gtmc', name: 'GTMCfamily', type: 'internal', frequency: '每日', followers: '全员', color: '#5A7BA8', icon: 'G', pendingCount: 3, publishedThisMonth: 24 },
  { id: 'kilakila', name: 'KILAKILA', type: 'internal', frequency: '每周3次', followers: '12.5K', color: '#8B5CF6', icon: 'K', pendingCount: 2, publishedThisMonth: 15 },
  { id: 'wechat', name: '微信公众号', type: 'external', frequency: '每周2次', followers: '85K', color: '#4A7C59', icon: '微', pendingCount: 4, publishedThisMonth: 8 },
  { id: 'video', name: '视频号', type: 'external', frequency: '每周3次', followers: '45K', color: '#C17B3E', icon: '视', pendingCount: 2, publishedThisMonth: 12 },
  { id: 'douyin', name: '抖音', type: 'external', frequency: '每日', followers: '120K', color: '#1A1A1A', icon: '抖', pendingCount: 5, publishedThisMonth: 28 },
  { id: 'newsletter', name: '内刊', type: 'internal', frequency: '每月', followers: '—', color: '#D4A574', icon: '刊', pendingCount: 1, publishedThisMonth: 1 },
];

const publishItems: PublishItem[] = [
  { id: '1', title: '新车型上市全渠道宣传', channelId: 'wechat', date: '2026-07-20', time: '10:00', status: 'ready', contentType: '图文', author: '熊臣坤' },
  { id: '2', title: '夏季安全生产专题', channelId: 'gtmc', date: '2026-07-20', time: '14:00', status: 'draft', contentType: '图文', author: '刘俊' },
  { id: '3', title: '员工技能比武精彩回顾', channelId: 'video', date: '2026-07-20', time: '18:00', status: 'ready', contentType: '视频', author: '熊臣坤' },
  { id: '4', title: '凯美瑞产线首车下线', channelId: 'douyin', date: '2026-07-19', time: '12:00', status: 'published', contentType: '短视频', author: '熊臣坤', views: 15200, likes: 890 },
  { id: '5', title: '客户感谢故事', channelId: 'wechat', date: '2026-07-19', time: '09:00', status: 'published', contentType: '图文', author: '刘俊', views: 8500, likes: 420 },
  { id: '6', title: '供应商大会回顾', channelId: 'kilakila', date: '2026-07-18', time: '15:00', status: 'published', contentType: '图文', author: '郭晓鹏', views: 3200, likes: 180 },
  { id: '7', title: '高温慰问一线员工', channelId: 'gtmc', date: '2026-07-21', time: '10:00', status: 'draft', contentType: '图文', author: '刘俊' },
  { id: '8', title: '研发幕后纪录片', channelId: 'video', date: '2026-07-22', time: '18:00', status: 'draft', contentType: '视频', author: '王彬彬' },
  { id: '9', title: '安全生产月总结', channelId: 'newsletter', date: '2026-07-25', time: '00:00', status: 'draft', contentType: '长文', author: '郭晓鹏' },
  { id: '10', title: '新车型技术解读', channelId: 'douyin', date: '2026-07-21', time: '12:00', status: 'ready', contentType: '短视频', author: '熊臣坤' },
  { id: '11', title: '员工风采展示', channelId: 'kilakila', date: '2026-07-22', time: '15:00', status: 'ready', contentType: '图集', author: '刘俊' },
  { id: '12', title: '品质改善案例分享', channelId: 'gtmc', date: '2026-07-22', time: '14:00', status: 'draft', contentType: '图文', author: '郭晓鹏' },
];

const statusConfig = {
  draft: { label: '草稿', color: '#999', bg: '#F0EFEB' },
  ready: { label: '待发布', color: '#C17B3E', bg: '#FFFBEB' },
  published: { label: '已发布', color: '#4A7C59', bg: '#F0FDF4' },
  failed: { label: '发布失败', color: '#A64D4D', bg: '#FEF2F2' },
};

export function ChannelPublishing() {
  const [view, setView] = useState<'calendar' | 'channels'>('calendar');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PublishItem | null>(null);
  const [currentWeek] = useState(() => {
    const today = new Date('2026-07-20');
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  });

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const filteredItems = selectedChannel ? publishItems.filter(i => i.channelId === selectedChannel) : publishItems;

  const getItemsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredItems.filter(i => i.date === dateStr);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>渠道发布</h2>
            <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
              <button onClick={() => setView('calendar')} className="px-3 py-1 text-xs transition-colors" style={{ backgroundColor: view === 'calendar' ? '#1A1A1A' : '#FFF', color: view === 'calendar' ? '#FFF' : '#6B6B6B' }}>日历</button>
              <button onClick={() => setView('channels')} className="px-3 py-1 text-xs transition-colors" style={{ backgroundColor: view === 'channels' ? '#1A1A1A' : '#FFF', color: view === 'channels' ? '#FFF' : '#6B6B6B' }}>渠道</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedChannel || ''}
              onChange={e => setSelectedChannel(e.target.value || null)}
              className="px-3 py-1.5 rounded border text-xs outline-none bg-white"
              style={{ borderColor: '#E8E6E1' }}
            >
              <option value="">全部渠道</option>
              {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Calendar View */}
          {view === 'calendar' && (
            <div className="p-4">
              {/* Week Header */}
              <div className="text-xs mb-3 flex items-center gap-2" style={{ color: '#6B6B6B' }}>
                <button className="p-1 rounded hover:bg-gray-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span className="font-medium">2026年7月20日 — 7月26日</span>
                <button className="p-1 rounded hover:bg-gray-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button className="ml-2 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>今天</button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {currentWeek.map((date, i) => {
                  const dayItems = getItemsForDay(date);
                  const isToday = date.toISOString().split('T')[0] === '2026-07-20';
                  return (
                    <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: isToday ? '#D4A574' : '#E8E6E1', backgroundColor: isToday ? '#FFFBF5' : '#FFF' }}>
                      <div className="px-2 py-1.5 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1', backgroundColor: isToday ? '#D4A57415' : '#FAFAF8' }}>
                        <span className="text-xs font-medium" style={{ color: isToday ? '#D4A574' : '#6B6B6B' }}>{dayNames[i]}</span>
                        <span className="text-xs" style={{ color: isToday ? '#D4A574' : '#999' }}>{date.getDate()}</span>
                      </div>
                      <div className="p-1.5 space-y-1 min-h-32">
                        {dayItems.map(item => {
                          const ch = channels.find(c => c.id === item.channelId)!;
                          const sc = statusConfig[item.status];
                          return (
                            <div
                              key={item.id}
                              className="px-2 py-1.5 rounded cursor-pointer transition-all hover:shadow-sm"
                              style={{ backgroundColor: ch.color + '10', borderLeft: `2px solid ${ch.color}` }}
                              onClick={() => setSelectedItem(item)}
                            >
                              <div className="text-xs truncate font-medium" style={{ color: '#1A1A1A' }}>{item.title}</div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-xs" style={{ color: '#999' }}>{item.time} · {ch.name}</span>
                                <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                              </div>
                            </div>
                          );
                        })}
                        {dayItems.length === 0 && (
                          <div className="text-xs text-center py-4" style={{ color: '#CCC' }}>无排期</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4">
                {Object.entries(statusConfig).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                    <span className="text-xs" style={{ color: '#6B6B6B' }}>{val.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel View */}
          {view === 'channels' && (
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {channels.map(ch => {
                  const chItems = publishItems.filter(i => i.channelId === ch.id);
                  const published = chItems.filter(i => i.status === 'published');
                  const ready = chItems.filter(i => i.status === 'ready');
                  return (
                    <div key={ch.id} className="bg-white rounded-lg border p-4 transition-all hover:shadow-sm cursor-pointer" style={{ borderColor: selectedChannel === ch.id ? ch.color : '#E8E6E1' }} onClick={() => setSelectedChannel(selectedChannel === ch.id ? null : ch.id)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm text-white font-medium" style={{ backgroundColor: ch.color }}>{ch.icon}</div>
                        <div>
                          <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{ch.name}</h3>
                          <p className="text-xs" style={{ color: '#999' }}>{ch.type === 'internal' ? '内部渠道' : '外部渠道'} · {ch.frequency}</p>
                        </div>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ backgroundColor: ch.color + '15', color: ch.color }}>
                          {ch.type === 'internal' ? '内' : '外'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="py-1.5 rounded" style={{ backgroundColor: '#F0EFEB' }}>
                          <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{ch.pendingCount}</div>
                          <div className="text-xs" style={{ color: '#999' }}>待发布</div>
                        </div>
                        <div className="py-1.5 rounded" style={{ backgroundColor: '#F0FDF4' }}>
                          <div className="text-sm font-semibold" style={{ color: '#4A7C59' }}>{ch.publishedThisMonth}</div>
                          <div className="text-xs" style={{ color: '#999' }}>本月已发</div>
                        </div>
                        <div className="py-1.5 rounded" style={{ backgroundColor: '#FFFBEB' }}>
                          <div className="text-sm font-semibold" style={{ color: '#C17B3E' }}>{ready.length}</div>
                          <div className="text-xs" style={{ color: '#999' }}>待审</div>
                        </div>
                      </div>
                      {ch.followers !== '—' && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: '#E8E6E1', color: '#999' }}>
                          <span>粉丝/受众</span>
                          <span style={{ color: '#1A1A1A' }}>{ch.followers}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Channel Content List */}
              {selectedChannel && (
                <div className="bg-white rounded-lg border" style={{ borderColor: '#E8E6E1' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
                    <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                      {channels.find(c => c.id === selectedChannel)?.name} 发布列表
                    </h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: '#E8E6E1' }}>
                    {publishItems.filter(i => i.channelId === selectedChannel).map(item => {
                      const sc = statusConfig[item.status];
                      return (
                        <div key={item.id} className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedItem(item)}>
                          <div className="text-xs" style={{ color: '#999', minWidth: 80 }}>{item.date} {item.time}</div>
                          <div className="flex-1">
                            <div className="text-sm" style={{ color: '#1A1A1A' }}>{item.title}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#999' }}>{item.contentType} · {item.author}</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                          {item.views && (
                            <div className="text-xs" style={{ color: '#999' }}>
                              {item.views.toLocaleString()} 阅读
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-72 border-l overflow-auto" style={{ borderColor: '#E8E6E1' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>发布详情</h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-4 h-4" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <h4 className="text-base font-medium mb-2" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>{selectedItem.title}</h4>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>渠道</span>
                <span style={{ color: '#1A1A1A' }}>{channels.find(c => c.id === selectedItem.channelId)?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>发布时间</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.date} {selectedItem.time}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>内容类型</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.contentType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>作者</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.author}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>状态</span>
                <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: statusConfig[selectedItem.status].bg, color: statusConfig[selectedItem.status].color }}>{statusConfig[selectedItem.status].label}</span>
              </div>
              {selectedItem.views !== undefined && (
                <>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#999' }}>阅读量</span>
                    <span style={{ color: '#1A1A1A' }}>{selectedItem.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#999' }}>点赞数</span>
                    <span style={{ color: '#1A1A1A' }}>{selectedItem.likes?.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
            {/* Content Preview */}
            <div className="rounded-lg border overflow-hidden mb-4" style={{ borderColor: '#E8E6E1' }}>
              <div className="h-32 flex items-center justify-center" style={{ backgroundColor: '#F5F4F0' }}>
                <span className="text-xs" style={{ color: '#999' }}>内容预览</span>
              </div>
            </div>
            {/* Actions */}
            <div className="space-y-2">
              {selectedItem.status === 'draft' && (
                <button className="w-full py-2 rounded text-xs font-medium text-white" style={{ backgroundColor: '#D4A574' }}>提交审核</button>
              )}
              {selectedItem.status === 'ready' && (
                <button className="w-full py-2 rounded text-xs font-medium text-white" style={{ backgroundColor: '#4A7C59' }}>立即发布</button>
              )}
              <button className="w-full py-2 rounded border text-xs" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}>编辑内容</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
