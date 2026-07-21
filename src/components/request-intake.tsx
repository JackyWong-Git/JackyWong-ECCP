'use client';

import { useState } from 'react';
import { showToast } from './toast';

// --- Types ---
interface PromotionRequest {
  id: string;
  title: string;
  department: string;
  requester: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'reviewing' | 'accepted' | 'in_progress' | 'done' | 'rejected';
  type: 'event' | 'daily' | 'campaign' | 'urgent_notice';
  channels: string[];
  deadline: string;
  description: string;
  attachments: number;
  createdAt: string;
  assignee?: string;
}

// --- Mock Data ---
const mockRequests: PromotionRequest[] = [
  {
    id: 'req-001',
    title: '22周年故事会活动宣传',
    department: '总务部',
    requester: '蔡雯欣',
    priority: 'urgent',
    status: 'in_progress',
    type: 'event',
    channels: ['微信公众号', '内网', 'K站视频', '社媒'],
    deadline: '2025-09-01',
    description: '22周年故事会活动全流程宣传，包含预热征集、活动报道、后续传播三个阶段',
    attachments: 3,
    createdAt: '2025-08-10',
    assignee: '滕紫原',
  },
  {
    id: 'req-002',
    title: '新品车型上市传播',
    department: '销售部',
    requester: '李明',
    priority: 'high',
    status: 'reviewing',
    type: 'campaign',
    channels: ['微信公众号', 'K站生活圈', '微信视频号', '社媒'],
    deadline: '2025-09-15',
    description: '新款车型上市宣传，需要图文+视频+社媒联动',
    attachments: 2,
    createdAt: '2025-08-18',
  },
  {
    id: 'req-003',
    title: '员工安全意识月度宣传',
    department: '生产部',
    requester: '王强',
    priority: 'normal',
    status: 'pending',
    type: 'daily',
    channels: ['内网', '宣传栏'],
    deadline: '2025-09-30',
    description: '9月安全生产月宣传物料，需要海报+内网图文',
    attachments: 1,
    createdAt: '2025-08-20',
  },
  {
    id: 'req-004',
    title: '讲车帝共创活动推广',
    department: '内容中台',
    requester: '熊臣坤',
    priority: 'high',
    status: 'accepted',
    type: 'campaign',
    channels: ['微信公众号', '内网', 'K站视频', '微信视频号', '社媒'],
    deadline: '2025-12-21',
    description: '讲车帝共创活动全流程推广，9-12月持续运营',
    attachments: 5,
    createdAt: '2025-08-15',
    assignee: '熊臣坤',
  },
  {
    id: 'req-005',
    title: '高温关怀通知',
    department: '人力资源部',
    requester: '张丽',
    priority: 'urgent',
    status: 'done',
    type: 'urgent_notice',
    channels: ['内网', '微信公众号'],
    deadline: '2025-08-20',
    description: '高温天气关怀通知+防暑降温措施宣传',
    attachments: 0,
    createdAt: '2025-08-16',
    assignee: '郭晓鹏',
  },
  {
    id: 'req-006',
    title: '新员工入职培训宣传',
    department: '人力资源部',
    requester: '陈芳',
    priority: 'normal',
    status: 'pending',
    type: 'daily',
    channels: ['内网', '宣传栏'],
    deadline: '2025-10-15',
    description: '秋季新员工入职培训系列宣传',
    attachments: 1,
    createdAt: '2025-08-22',
  },
];

const channels = ['微信公众号', '内网', 'K站生活圈', 'K站视频', '微信视频号', '电视台', '社媒', '宣传栏', '车站海报'];
const departments = ['总务部', '销售部', '生产部', '人力资源部', ' content中台', '研发部', '品质部', '管理部'];
const requestTypes = [
  { value: 'event', label: '活动宣传', color: '#D4A574' },
  { value: 'campaign', label: '专题策划', color: '#4A7C59' },
  { value: 'daily', label: '日常宣传', color: '#6B6B6B' },
  { value: 'urgent_notice', label: '紧急通知', color: '#A64D4D' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待评审', color: '#6B6B6B', bg: '#F0EFEB' },
  reviewing: { label: '评审中', color: '#C17B3E', bg: '#FDF5EC' },
  accepted: { label: '已接单', color: '#4A7C59', bg: '#EEF5F0' },
  in_progress: { label: '制作中', color: '#2563EB', bg: '#EFF6FF' },
  done: { label: '已完成', color: '#16A34A', bg: '#F0FDF4' },
  rejected: { label: '已退回', color: '#A64D4D', bg: '#FEF2F2' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: '#A64D4D' },
  high: { label: '高', color: '#C17B3E' },
  normal: { label: '普通', color: '#6B6B6B' },
  low: { label: '低', color: '#9CA3AF' },
};

export function RequestIntake() {
  const [requests, setRequests] = useState(mockRequests);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PromotionRequest | null>(null);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const columns = [
    { key: 'pending', label: '待评审' },
    { key: 'reviewing', label: '评审中' },
    { key: 'accepted', label: '已接单' },
    { key: 'in_progress', label: '制作中' },
    { key: 'done', label: '已完成' },
  ];

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' as const, assignee: '滕紫原' } : r));
    showToast('已接单', 'success');
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));
    showToast('已退回', 'info');
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAF8]">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              需求入口
            </h1>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">部门宣传需求统一受理、评审、排期</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F0EFEB] rounded-md p-0.5">
              <button
                onClick={() => setView('board')}
                className={`px-2.5 py-1 text-[12px] rounded ${view === 'board' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}
              >
                看板
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-2.5 py-1 text-[12px] rounded ${view === 'list' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}
              >
                列表
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564] transition-colors"
            >
              提交需求
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {[
            { label: '待评审', count: requests.filter(r => r.status === 'pending').length, color: '#6B6B6B' },
            { label: '制作中', count: requests.filter(r => r.status === 'in_progress').length, color: '#2563EB' },
            { label: '本月完成', count: requests.filter(r => r.status === 'done').length, color: '#16A34A' },
            { label: '平均响应', value: '1.2天', color: '#D4A574' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[12px] text-[#6B6B6B]">{s.label}</span>
              <span className="text-[13px] font-medium text-[#1A1A1A]">
                {'value' in s ? s.value : s.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'board' ? (
          <div className="h-full flex gap-3 p-4 overflow-x-auto">
            {columns.map(col => {
              const colRequests = filtered.filter(r => r.status === col.key);
              return (
                <div key={col.key} className="flex-shrink-0 w-[280px] flex flex-col">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[col.key]?.color }} />
                      <span className="text-[13px] font-medium text-[#1A1A1A]">{col.label}</span>
                      <span className="text-[11px] text-[#6B6B6B] bg-[#F0EFEB] rounded-full px-1.5 py-0.5">{colRequests.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {colRequests.map(req => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedReq(req)}
                        className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-[#E8E6E1] hover:border-[#D4A574]/30"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: requestTypes.find(t => t.value === req.type)?.color + '18',
                              color: requestTypes.find(t => t.value === req.type)?.color,
                            }}
                          >
                            {requestTypes.find(t => t.value === req.type)?.label}
                          </span>
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: priorityConfig[req.priority]?.color }}
                          >
                            {priorityConfig[req.priority]?.label}
                          </span>
                        </div>
                        <h3 className="text-[13px] font-medium text-[#1A1A1A] mb-1.5 line-clamp-2">{req.title}</h3>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mb-2">
                          <span>{req.department}</span>
                          <span>·</span>
                          <span>{req.requester}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {req.channels.slice(0, 3).map(ch => (
                            <span key={ch} className="text-[10px] bg-[#F5F4F0] text-[#6B6B6B] rounded px-1.5 py-0.5">{ch}</span>
                          ))}
                          {req.channels.length > 3 && (
                            <span className="text-[10px] text-[#6B6B6B]">+{req.channels.length - 3}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#6B6B6B]">
                          <span>截止 {req.deadline}</span>
                          {req.status === 'pending' && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAccept(req.id); }}
                                className="px-2 py-0.5 bg-[#4A7C59]/10 text-[#4A7C59] rounded text-[10px] hover:bg-[#4A7C59]/20"
                              >
                                接单
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReject(req.id); }}
                                className="px-2 py-0.5 bg-[#A64D4D]/10 text-[#A64D4D] rounded text-[10px] hover:bg-[#A64D4D]/20"
                              >
                                退回
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-white rounded-lg border border-[#E8E6E1] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E6E1] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">需求名称</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">类型</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">需求部门</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">优先级</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">状态</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">截止日期</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className="border-b border-[#E8E6E1] last:border-0 cursor-pointer hover:bg-[#FAFAF8]"
                    >
                      <td className="px-4 py-3 text-[13px] text-[#1A1A1A] font-medium">{req.title}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: requestTypes.find(t => t.value === req.type)?.color + '18',
                            color: requestTypes.find(t => t.value === req.type)?.color,
                          }}
                        >
                          {requestTypes.find(t => t.value === req.type)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B]">{req.department}</td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-medium" style={{ color: priorityConfig[req.priority]?.color }}>
                          {priorityConfig[req.priority]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: statusConfig[req.status]?.bg, color: statusConfig[req.status]?.color }}
                        >
                          {statusConfig[req.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B]">{req.deadline}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B]">{req.assignee || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedReq(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-[480px] bg-white h-full overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[11px] px-2 py-1 rounded"
                  style={{
                    backgroundColor: requestTypes.find(t => t.value === selectedReq.type)?.color + '18',
                    color: requestTypes.find(t => t.value === selectedReq.type)?.color,
                  }}
                >
                  {requestTypes.find(t => t.value === selectedReq.type)?.label}
                </span>
                <button onClick={() => setSelectedReq(null)} className="text-[#6B6B6B] hover:text-[#1A1A1A]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <h2 className="text-[20px] font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {selectedReq.title}
              </h2>
              <div className="flex items-center gap-3 text-[13px] text-[#6B6B6B] mb-4">
                <span>{selectedReq.department}</span>
                <span>·</span>
                <span>{selectedReq.requester}</span>
                <span>·</span>
                <span>提交于 {selectedReq.createdAt}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#FAFAF8] rounded-lg p-3">
                  <div className="text-[11px] text-[#6B6B6B] mb-1">优先级</div>
                  <div className="text-[13px] font-medium" style={{ color: priorityConfig[selectedReq.priority]?.color }}>
                    {priorityConfig[selectedReq.priority]?.label}
                  </div>
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3">
                  <div className="text-[11px] text-[#6B6B6B] mb-1">截止日期</div>
                  <div className="text-[13px] font-medium text-[#1A1A1A]">{selectedReq.deadline}</div>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">需求描述</div>
                <p className="text-[13px] text-[#4A4A4A] leading-relaxed">{selectedReq.description}</p>
              </div>

              <div className="mb-5">
                <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">发布渠道</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReq.channels.map(ch => (
                    <span key={ch} className="text-[12px] bg-[#F5F4F0] text-[#4A4A4A] rounded px-2 py-1">{ch}</span>
                  ))}
                </div>
              </div>

              {selectedReq.attachments > 0 && (
                <div className="mb-5">
                  <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">附件</div>
                  <div className="flex items-center gap-2 text-[13px] text-[#D4A574]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                    {selectedReq.attachments} 个附件
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-[#E8E6E1]">
                {selectedReq.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { handleAccept(selectedReq.id); setSelectedReq(null); }}
                      className="flex-1 py-2 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564]"
                    >
                      接单
                    </button>
                    <button
                      onClick={() => { handleReject(selectedReq.id); setSelectedReq(null); }}
                      className="flex-1 py-2 border border-[#E8E6E1] text-[#6B6B6B] text-[13px] rounded-md hover:bg-[#FAFAF8]"
                    >
                      退回
                    </button>
                  </>
                )}
                {selectedReq.status === 'accepted' && (
                  <button
                    onClick={() => {
                      setRequests(prev => prev.map(r => r.id === selectedReq.id ? { ...r, status: 'in_progress' as const } : r));
                      showToast('已开始制作', 'success');
                      setSelectedReq(null);
                    }}
                    className="flex-1 py-2 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564]"
                  >
                    开始制作
                  </button>
                )}
                {selectedReq.status === 'in_progress' && (
                  <button
                    onClick={() => {
                      setRequests(prev => prev.map(r => r.id === selectedReq.id ? { ...r, status: 'done' as const } : r));
                      showToast('已完成', 'success');
                      setSelectedReq(null);
                    }}
                    className="flex-1 py-2 bg-[#4A7C59] text-white text-[13px] rounded-md hover:bg-[#3D6B4A]"
                  >
                    标记完成
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-[560px] bg-white rounded-xl shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-[18px] font-semibold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                提交宣传需求
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-[#6B6B6B] mb-1 block">需求标题</label>
                  <input className="w-full px-3 py-2 border border-[#E8E6E1] rounded-md text-[13px] focus:outline-none focus:border-[#D4A574]" placeholder="输入需求标题" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] text-[#6B6B6B] mb-1 block">需求部门</label>
                    <select className="w-full px-3 py-2 border border-[#E8E6E1] rounded-md text-[13px] focus:outline-none focus:border-[#D4A574]">
                      {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#6B6B6B] mb-1 block">需求类型</label>
                    <select className="w-full px-3 py-2 border border-[#E8E6E1] rounded-md text-[13px] focus:outline-none focus:border-[#D4A574]">
                      {requestTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] text-[#6B6B6B] mb-1 block">优先级</label>
                    <select className="w-full px-3 py-2 border border-[#E8E6E1] rounded-md text-[13px] focus:outline-none focus:border-[#D4A574]">
                      <option value="normal">普通</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] text-[#6B6B6B] mb-1 block">截止日期</label>
                    <input type="date" className="w-full px-3 py-2 border border-[#E8E6E1] rounded-md text-[13px] focus:outline-none focus:border-[#D4A574]" />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] text-[#6B6B6B] mb-1 block">需要发布的渠道</label>
                  <div className="flex flex-wrap gap-2">
                    {channels.map(ch => (
                      <label key={ch} className="flex items-center gap-1.5 text-[12px] text-[#4A4A4A] cursor-pointer">
                        <input type="checkbox" className="rounded border-[#E8E6E1] text-[#D4A574] focus:ring-[#D4A574]" />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[12px] text-[#6B6B6B] mb-1 block">需求描述</label>
                  <textarea rows={4} className="w-full px-3 py-2 border border-[#E8E6E1] rounded-md text-[13px] focus:outline-none focus:border-[#D4A574] resize-none" placeholder="描述宣传需求的具体内容、目标、要求..." />
                </div>
                <div>
                  <label className="text-[12px] text-[#6B6B6B] mb-1 block">附件</label>
                  <div className="border-2 border-dashed border-[#E8E6E1] rounded-lg p-6 text-center cursor-pointer hover:border-[#D4A574] transition-colors">
                    <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                    <p className="text-[12px] text-[#6B6B6B]">拖拽文件到此处，或点击上传</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">支持 PDF、Word、Excel、图片，单文件不超过 20MB</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => { setShowForm(false); showToast('需求已提交', 'success'); }}
                  className="flex-1 py-2 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564]"
                >
                  提交需求
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-[#E8E6E1] text-[#6B6B6B] text-[13px] rounded-md hover:bg-[#FAFAF8]"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
