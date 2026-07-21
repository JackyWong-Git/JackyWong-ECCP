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
  progress: number;
  description: string;
}

const columns: { id: CoordinationStatus; label: string; color: string; icon: string }[] = [
  { id: 'inbox', label: '待分配', color: '#999', icon: '○' },
  { id: 'planning', label: '策划中', color: '#5A7BA8', icon: '◎' },
  { id: 'producing', label: '制作中', color: '#C17B3E', icon: '◐' },
  { id: 'reviewing', label: '审核中', color: '#8B5CF6', icon: '◑' },
  { id: 'scheduled', label: '已排期', color: '#4A7C59', icon: '●' },
  { id: 'published', label: '已发布', color: '#D4A574', icon: '✓' },
];

const teamMembers = [
  { name: '滕紫原', role: '总括', color: '#D4A574', initials: '滕' },
  { name: '郭晓鹏', role: '流程架构', color: '#5A7BA8', initials: '郭' },
  { name: '王彬彬', role: '技术赋能', color: '#4A7C59', initials: '王' },
  { name: '熊臣坤', role: '内容创意', color: '#C17B3E', initials: '熊' },
  { name: '刘俊', role: '现场联结', color: '#8B5CF6', initials: '刘' },
];

const channels = ['GTMCfamily', 'KILAKILA', '公众号', '视频号', '内刊', '抖音'];

const mockItems: ContentItem[] = [
  { id: '1', title: '新车型上市全渠道宣传', source: '市场部', assignee: '熊臣坤', channels: ['GTMCfamily', '公众号', '视频号'], status: 'planning', priority: 'high', deadline: '2026-07-25', materialCount: 5, progress: 30, description: '配合新车型上市节点，全渠道同步宣传' },
  { id: '2', title: '夏季安全生产专题', source: '安全环境部', assignee: '刘俊', channels: ['内刊', 'GTMCfamily'], status: 'producing', priority: 'medium', deadline: '2026-07-22', materialCount: 3, progress: 60, description: '夏季高温作业安全须知宣传' },
  { id: '3', title: '员工技能比武大赛报道', source: '人力资源部', assignee: '熊臣坤', channels: ['公众号', 'KILAKILA', '视频号'], status: 'reviewing', priority: 'medium', deadline: '2026-07-20', materialCount: 8, progress: 85, description: '年度技能比武大赛决赛报道' },
  { id: '4', title: '供应商大会回顾', source: '采购部', assignee: '郭晓鹏', channels: ['GTMCfamily', '内刊'], status: 'scheduled', priority: 'low', deadline: '2026-07-28', materialCount: 4, progress: 95, description: '2026年度供应商大会回顾报道' },
  { id: '5', title: '客户感谢故事', source: '售后服务部', assignee: '刘俊', channels: ['公众号', '视频号'], status: 'producing', priority: 'medium', deadline: '2026-07-23', materialCount: 2, progress: 45, description: '客户感谢信访件改编的温暖故事' },
  { id: '6', title: '研发幕后纪录片', source: '技术部', assignee: '王彬彬', channels: ['视频号', '抖音', 'KILAKILA'], status: 'inbox', priority: 'high', deadline: '2026-08-01', materialCount: 6, progress: 0, description: '研发团队加班加点的纪录片' },
  { id: '7', title: '凯美瑞产线首车下线', source: '生产部', assignee: '熊臣坤', channels: ['全渠道'], status: 'published', priority: 'high', deadline: '2026-07-18', materialCount: 10, progress: 100, description: '新款凯美瑞生产线首台车下线仪式' },
  { id: '8', title: '高温慰问一线员工', source: '总务部', assignee: '刘俊', channels: ['GTMCfamily', '公众号'], status: 'inbox', priority: 'medium', deadline: '2026-07-30', materialCount: 3, progress: 0, description: '公司领导高温慰问一线员工活动' },
];

const priorityConfig = {
  high: { label: 'P0', bg: '#FEF2F2', color: '#A64D4D' },
  medium: { label: 'P1', bg: '#FFFBEB', color: '#C17B3E' },
  low: { label: 'P2', bg: '#F0FDF4', color: '#4A7C59' },
};

export function ContentCoordination() {
  const [items, setItems] = useState<ContentItem[]>(mockItems);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<ContentItem | null>(null);

  const moveItem = (itemId: string, newStatus: CoordinationStatus) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
    if (selectedItem?.id === itemId) {
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const assignItem = (itemId: string, assignee: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, assignee, status: i.status === 'inbox' ? 'planning' : i.status } : i));
    setAssignModal(null);
  };

  const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date('2026-07-20').getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>内容调度看板</h2>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>
              {items.length} 条内容
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Team Avatars */}
            <div className="flex -space-x-1.5">
              {teamMembers.map(m => (
                <div key={m.name} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white font-medium border-2 border-white" style={{ backgroundColor: m.color }} title={`${m.name} · ${m.role}`}>
                  {m.initials}
                </div>
              ))}
            </div>
            <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
              <button onClick={() => setViewMode('kanban')} className="px-3 py-1 text-xs transition-colors" style={{ backgroundColor: viewMode === 'kanban' ? '#1A1A1A' : '#FFF', color: viewMode === 'kanban' ? '#FFF' : '#6B6B6B' }}>看板</button>
              <button onClick={() => setViewMode('table')} className="px-3 py-1 text-xs transition-colors" style={{ backgroundColor: viewMode === 'table' ? '#1A1A1A' : '#FFF', color: viewMode === 'table' ? '#FFF' : '#6B6B6B' }}>表格</button>
            </div>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-3 h-full" style={{ minWidth: columns.length * 220 }}>
              {columns.map(col => {
                const colItems = items.filter(i => i.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="w-52 flex-shrink-0 flex flex-col rounded-lg"
                    style={{ backgroundColor: '#F5F4F0' }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (draggedItem) { moveItem(draggedItem, col.id); setDraggedItem(null); } }}
                  >
                    {/* Column Header */}
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: col.color }}>{col.icon}</span>
                        <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{col.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E8E6E1', color: '#6B6B6B' }}>{colItems.length}</span>
                      </div>
                    </div>
                    {/* Cards */}
                    <div className="flex-1 overflow-auto px-2 pb-2 space-y-2">
                      {colItems.map(item => {
                        const pc = priorityConfig[item.priority];
                        const daysLeft = getDaysLeft(item.deadline);
                        const member = teamMembers.find(m => m.name === item.assignee);
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggedItem(item.id)}
                            onDragEnd={() => setDraggedItem(null)}
                            className="bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
                            style={{ borderColor: selectedItem?.id === item.id ? '#D4A574' : '#E8E6E1', opacity: draggedItem === item.id ? 0.5 : 1 }}
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs px-1 py-0.5 rounded font-medium" style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label}</span>
                              <span className="text-xs truncate flex-1" style={{ color: '#1A1A1A' }}>{item.title}</span>
                            </div>
                            <p className="text-xs mb-2 line-clamp-2" style={{ color: '#999' }}>{item.description}</p>
                            {/* Progress Bar */}
                            {item.progress > 0 && item.progress < 100 && (
                              <div className="mb-2">
                                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E6E1' }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${item.progress}%`, backgroundColor: col.color }} />
                                </div>
                                <div className="text-right text-xs mt-0.5" style={{ color: '#999' }}>{item.progress}%</div>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {member && (
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: member.color }} title={member.name}>
                                    {member.initials}
                                  </div>
                                )}
                                <span className="text-xs" style={{ color: '#999' }}>{item.channels.length}渠道</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {daysLeft <= 2 && daysLeft > 0 && (
                                  <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#FEF2F2', color: '#A64D4D' }}>{daysLeft}天</span>
                                )}
                                {daysLeft <= 0 && item.status !== 'published' && (
                                  <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#FEF2F2', color: '#A64D4D' }}>逾期</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {col.id === 'inbox' && (
                        <button className="w-full py-2 rounded border border-dashed text-xs transition-colors" style={{ borderColor: '#E8E6E1', color: '#999' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#D4A574'} onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E6E1'}>
                          + 添加任务
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="flex-1 overflow-auto p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>标题</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>来源</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>负责人</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>渠道</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>优先级</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>进度</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>截止日</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const pc = priorityConfig[item.priority];
                  const col = columns.find(c => c.id === item.status)!;
                  const member = teamMembers.find(m => m.name === item.assignee);
                  return (
                    <tr key={item.id} className="border-b cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#E8E6E1' }} onClick={() => setSelectedItem(item)}>
                      <td className="py-3 text-sm" style={{ color: '#1A1A1A' }}>{item.title}</td>
                      <td className="py-3 text-xs" style={{ color: '#6B6B6B' }}>{item.source}</td>
                      <td className="py-3">
                        {member && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: member.color }}>{member.initials}</div>
                            <span className="text-xs" style={{ color: '#6B6B6B' }}>{member.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1 flex-wrap">
                          {item.channels.slice(0, 3).map(ch => (
                            <span key={ch} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{ch}</span>
                          ))}
                          {item.channels.length > 3 && <span className="text-xs" style={{ color: '#999' }}>+{item.channels.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3"><span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label}</span></td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E6E1' }}>
                            <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: col.color }} />
                          </div>
                          <span className="text-xs" style={{ color: '#999' }}>{item.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs" style={{ color: '#6B6B6B' }}>{item.deadline}</td>
                      <td className="py-3"><span className="text-xs px-1.5 py-0.5 rounded" style={{ color: col.color }}>{col.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-80 border-l overflow-auto" style={{ borderColor: '#E8E6E1' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>任务详情</h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-4 h-4" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <h4 className="text-base font-medium mb-2" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>{selectedItem.title}</h4>
            <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>{selectedItem.description}</p>

            {/* Meta Info */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>来源部门</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.source}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>负责人</span>
                <div className="flex items-center gap-1.5">
                  {teamMembers.filter(m => m.name === selectedItem.assignee).map(m => (
                    <div key={m.name} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                  ))}
                  <span style={{ color: '#1A1A1A' }}>{selectedItem.assignee}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>截止日期</span>
                <span style={{ color: getDaysLeft(selectedItem.deadline) <= 2 ? '#A64D4D' : '#1A1A1A' }}>{selectedItem.deadline} ({getDaysLeft(selectedItem.deadline)}天)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>素材数量</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.materialCount} 个</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>优先级</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: priorityConfig[selectedItem.priority].bg, color: priorityConfig[selectedItem.priority].color }}>{priorityConfig[selectedItem.priority].label}</span>
              </div>
            </div>

            {/* Channels */}
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: '#999' }}>发布渠道</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.channels.map(ch => (
                  <span key={ch} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{ch}</span>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: '#999' }}>完成进度</div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E6E1' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${selectedItem.progress}%`, backgroundColor: columns.find(c => c.id === selectedItem.status)?.color }} />
              </div>
              <div className="text-right text-xs mt-1" style={{ color: '#999' }}>{selectedItem.progress}%</div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setAssignModal(selectedItem)}
                className="w-full py-2 rounded border text-xs transition-colors"
                style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#D4A574'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E6E1'}
              >
                分配负责人
              </button>
              <div className="flex gap-2">
                {columns.filter(c => c.id !== selectedItem.status).slice(0, 3).map(col => (
                  <button
                    key={col.id}
                    onClick={() => moveItem(selectedItem.id, col.id)}
                    className="flex-1 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: col.color + '15', color: col.color }}
                  >
                    → {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-lg shadow-lg p-5 w-72" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A' }}>分配负责人</h3>
            <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>{assignModal.title}</p>
            <div className="space-y-2">
              {teamMembers.map(m => (
                <button
                  key={m.name}
                  onClick={() => assignItem(assignModal.id, m.name)}
                  className="w-full flex items-center gap-3 p-2 rounded transition-colors hover:bg-gray-50"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                  <div className="text-left">
                    <div className="text-sm" style={{ color: '#1A1A1A' }}>{m.name}</div>
                    <div className="text-xs" style={{ color: '#999' }}>{m.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
