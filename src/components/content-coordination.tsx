'use client';

import { useState } from 'react';

type CoordinationStatus = 'inbox' | 'planning' | 'producing' | 'reviewing' | 'scheduled' | 'published';

interface ContentItem {
  id: string;
  title: string;
  source: string;
  assignee: string;
  channels: string[];
  status: CoordinationStatus;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  materialCount: number;
}

const columns: { id: CoordinationStatus; label: string; color: string }[] = [
  { id: 'inbox', label: '待分配', color: '#999' },
  { id: 'planning', label: '策划中', color: '#5A7BA8' },
  { id: 'producing', label: '制作中', color: '#C17B3E' },
  { id: 'reviewing', label: '审核中', color: '#8B5CF6' },
  { id: 'scheduled', label: '已排期', color: '#4A7C59' },
  { id: 'published', label: '已发布', color: '#D4A574' },
];

const teamMembers = [
  { name: '滕紫原', role: '总括', color: '#D4A574' },
  { name: '郭晓鹏', role: '流程架构', color: '#5A7BA8' },
  { name: '王彬彬', role: '技术赋能', color: '#4A7C59' },
  { name: '熊臣坤', role: '内容创意', color: '#C17B3E' },
  { name: '刘俊', role: '现场联结', color: '#8B5CF6' },
];

const channels = ['GTMCfamily', 'KILAKILA', '公众号', '视频号', '内刊', '抖音'];

const mockItems: ContentItem[] = [
  { id: '1', title: '新车型上市全渠道宣传', source: '市场部', assignee: '熊臣坤', channels: ['GTMCfamily', '公众号', '视频号'], status: 'planning', priority: 'high', deadline: '2026-07-25', materialCount: 5 },
  { id: '2', title: '夏季安全生产专题', source: '安全环境部', assignee: '刘俊', channels: ['内刊', 'GTMCfamily'], status: 'producing', priority: 'medium', deadline: '2026-07-22', materialCount: 3 },
  { id: '3', title: '员工技能比武大赛报道', source: '人力资源部', assignee: '熊臣坤', channels: ['公众号', 'KILAKILA', '视频号'], status: 'reviewing', priority: 'medium', deadline: '2026-07-20', materialCount: 8 },
  { id: '4', title: '供应商大会回顾', source: '采购部', assignee: '郭晓鹏', channels: ['GTMCfamily', '内刊'], status: 'scheduled', priority: 'low', deadline: '2026-07-28', materialCount: 4 },
  { id: '5', title: '客户感谢故事', source: '售后服务部', assignee: '刘俊', channels: ['公众号', '视频号'], status: 'producing', priority: 'medium', deadline: '2026-07-23', materialCount: 2 },
  { id: '6', title: '研发幕后纪录片', source: '技术部', assignee: '王彬彬', channels: ['视频号', '抖音', 'KILAKILA'], status: 'inbox', priority: 'high', deadline: '2026-08-01', materialCount: 6 },
  { id: '7', title: '凯美瑞产线首车下线', source: '生产部', assignee: '熊臣坤', channels: ['全渠道'], status: 'published', priority: 'high', deadline: '2026-07-18', materialCount: 10 },
];

export function ContentCoordination() {
  const [items, setItems] = useState<ContentItem[]>(mockItems);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const moveItem = (itemId: string, newStatus: CoordinationStatus) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const priorityConfig = {
    high: { label: 'P0', bg: '#FEF2F2', color: '#A64D4D' },
    medium: { label: 'P1', bg: '#FFFBEB', color: '#C17B3E' },
    low: { label: 'P2', bg: '#F0FDF4', color: '#4A7C59' },
  };

  return (
    <div className="flex h-full">
      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>内容调度看板</h2>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>
              {items.length} 条内容
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
              <button
                onClick={() => setViewMode('kanban')}
                className="px-3 py-1 text-xs transition-colors"
                style={{ backgroundColor: viewMode === 'kanban' ? '#1A1A1A' : '#FFF', color: viewMode === 'kanban' ? '#FFF' : '#6B6B6B' }}
              >
                看板
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="px-3 py-1 text-xs transition-colors"
                style={{ backgroundColor: viewMode === 'table' ? '#1A1A1A' : '#FFF', color: viewMode === 'table' ? '#FFF' : '#6B6B6B' }}
              >
                表格
              </button>
            </div>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-3 h-full min-w-max">
              {columns.map(col => {
                const colItems = items.filter(i => i.status === col.id);
                return (
                  <div key={col.id} className="w-[240px] flex flex-col bg-white/50 rounded-lg" style={{ minWidth: 240 }}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#E8E6E1' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{col.label}</span>
                      <span className="text-[10px] ml-auto" style={{ color: '#999' }}>{colItems.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {colItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="bg-white rounded-lg border p-3 cursor-pointer transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5"
                          style={{ borderColor: selectedItem?.id === item.id ? '#D4A574' : '#E8E6E1' }}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] px-1 py-0.5 rounded font-medium" style={{ backgroundColor: priorityConfig[item.priority].bg, color: priorityConfig[item.priority].color }}>
                              {priorityConfig[item.priority].label}
                            </span>
                            <span className="text-[10px]" style={{ color: '#999' }}>{item.source}</span>
                          </div>
                          <div className="text-xs font-medium mb-2 leading-snug" style={{ color: '#1A1A1A' }}>{item.title}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: teamMembers.find(t => t.name === item.assignee)?.color || '#999' }}>
                                {item.assignee[0]}
                              </div>
                              <span className="text-[10px]" style={{ color: '#999' }}>{item.assignee}</span>
                            </div>
                            <span className="text-[10px]" style={{ color: '#BBB' }}>{item.deadline.slice(5)}</span>
                          </div>
                          {item.channels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.channels.slice(0, 3).map(ch => (
                                <span key={ch} className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}>{ch}</span>
                              ))}
                              {item.channels.length > 3 && <span className="text-[9px]" style={{ color: '#BBB' }}>+{item.channels.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>标题</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>来源</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>负责人</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>状态</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>渠道</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>截止</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="border-b cursor-pointer transition-colors hover:bg-white"
                    style={{ borderColor: '#F0EFEB' }}
                  >
                    <td className="py-2.5 px-3 font-medium" style={{ color: '#1A1A1A' }}>{item.title}</td>
                    <td className="py-2.5 px-3" style={{ color: '#6B6B6B' }}>{item.source}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: teamMembers.find(t => t.name === item.assignee)?.color || '#999' }}>
                          {item.assignee[0]}
                        </div>
                        <span style={{ color: '#1A1A1A' }}>{item.assignee}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: columns.find(c => c.id === item.status)?.color + '20', color: columns.find(c => c.id === item.status)?.color }}>
                        {columns.find(c => c.id === item.status)?.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {item.channels.slice(0, 2).map(ch => (
                          <span key={ch} className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}>{ch}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3" style={{ color: '#6B6B6B' }}>{item.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-[320px] border-l overflow-y-auto bg-white" style={{ borderColor: '#E8E6E1' }}>
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: priorityConfig[selectedItem.priority].bg, color: priorityConfig[selectedItem.priority].color }}>
                {priorityConfig[selectedItem.priority].label}
              </span>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-3.5 h-3.5" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>{selectedItem.title}</h3>
            <p className="text-xs" style={{ color: '#6B6B6B' }}>来源：{selectedItem.source} | 素材 {selectedItem.materialCount} 条</p>
          </div>

          {/* Status Progress */}
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-3" style={{ color: '#1A1A1A' }}>流转状态</div>
            <div className="flex gap-1">
              {columns.map((col, idx) => (
                <button
                  key={col.id}
                  onClick={() => moveItem(selectedItem.id, col.id)}
                  className="flex-1 py-1.5 rounded text-[10px] transition-colors"
                  style={{
                    backgroundColor: col.id === selectedItem.status ? col.color : '#F0EFEB',
                    color: col.id === selectedItem.status ? '#FFF' : '#999',
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>负责人</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: teamMembers.find(t => t.name === selectedItem.assignee)?.color || '#999' }}>
                {selectedItem.assignee[0]}
              </div>
              <div>
                <div className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{selectedItem.assignee}</div>
                <div className="text-[10px]" style={{ color: '#999' }}>{teamMembers.find(t => t.name === selectedItem.assignee)?.role}</div>
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>发布渠道</div>
            <div className="flex flex-wrap gap-1.5">
              {channels.map(ch => (
                <button
                  key={ch}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${selectedItem.channels.includes(ch) ? '' : ''}`}
                  style={{
                    backgroundColor: selectedItem.channels.includes(ch) ? '#D4A574' : '#F0EFEB',
                    color: selectedItem.channels.includes(ch) ? '#FFF' : '#6B6B6B',
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="p-4">
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>截止日期</div>
            <div className="text-sm" style={{ color: '#1A1A1A' }}>{selectedItem.deadline}</div>
          </div>
        </div>
      )}
    </div>
  );
}
