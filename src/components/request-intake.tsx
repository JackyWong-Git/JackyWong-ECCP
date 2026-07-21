'use client';

import { useState, useRef } from 'react';
import { showToast } from './toast';

// --- Types: 对齐实际报送数据格式 ---
interface Submission {
  id: string;
  department: string;       // 部门
  date: string;             // 发生日期
  eventType: string;        // 事件类型: 部/科级活动 | 会议 | 其他
  description: string;      // 事件描述（过程与结果）
  theme: string;            // 事件主题/名称
  location: string;         // 地点
  vpAttend: boolean;        // 是否有VP出席
  promoMethod: string[];    // 期望宣传方式: 内刊简讯 | GTMCfamily | 电视台 | ...
  // 内部审核字段
  status: 'pending' | 'selected' | 'in_progress' | 'published' | 'rejected';
  assignee?: string;        // 负责人
  selectedChannels: string[]; // 实际选定渠道
  notes: string;            // 备注
}

// --- 真实报送数据样本（来自 Excel 导出）---
const realSubmissions: Submission[] = [
  {
    id: 'sub-001',
    department: '总经理办公室',
    date: '2026-05-09',
    eventType: '部/科级活动',
    description: '5月9日，总经办工会举行母亲节慰问活动。',
    theme: '总经办母亲节慰问',
    location: 'AD大办公室',
    vpAttend: false,
    promoMethod: ['内刊简讯'],
    status: 'published',
    assignee: '滕紫原',
    selectedChannels: ['内网'],
    notes: '已发布内刊第234期',
  },
  {
    id: 'sub-002',
    department: '品质保证部',
    date: '2026-06-01',
    eventType: '部/科级活动',
    description: '部门工会面向对象员工开展"小小广汽人"六一儿童节活动，为对象儿童准备了精美的礼物。',
    theme: '"小小广汽人"品保部工会分会六一儿童节活动',
    location: 'SO-210',
    vpAttend: false,
    promoMethod: ['GTMCfamily'],
    status: 'published',
    assignee: '熊臣坤',
    selectedChannels: ['K站生活圈'],
    notes: '已发布GTMCfamily 6月刊',
  },
  {
    id: 'sub-003',
    department: '品质保证部',
    date: '2026-06-05',
    eventType: '会议',
    description: '品保部作为品质管理体系事务局组织了公司质量管理体系的内部审查，并于6月5日召开末次会议，会上由事务局对内审结果进行说明，最后由管理者代表和泉副总经理点评。',
    theme: '2026年广汽丰田质量管理体系内部审查末次会议',
    location: 'SO-203',
    vpAttend: true,
    promoMethod: ['内刊简讯'],
    status: 'in_progress',
    assignee: '滕紫原',
    selectedChannels: ['内网', 'K站生活圈'],
    notes: 'VP出席，需重点报道',
  },
  {
    id: 'sub-004',
    department: '总装二部',
    date: '2026-04-10',
    eventType: '部/科级活动',
    description: '为表彰25年度工作业务上有突出成绩的员工，科内予以晋升积极。科长对于大家的工作进行了肯定，并希望能在今后的工作中继续发挥领头羊精神。',
    theme: '总装二部技术2科晋升晋级表彰',
    location: '3线',
    vpAttend: false,
    promoMethod: ['GTMCfamily', '内刊简讯'],
    status: 'selected',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-005',
    department: '涂装成型二部',
    date: '2026-07-13',
    eventType: '部/科级活动',
    description: '为提升密封胶技能水平，通过技能比赛提升员工的品质意识及作业技能/加强员工之间的品质、技能等方面交流，提升涂装成型部整体品质效果!',
    theme: '涂装成型二部密封胶技能大赛提升活动',
    location: '密封胶训练场',
    vpAttend: false,
    promoMethod: ['GTMCfamily'],
    status: 'pending',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-006',
    department: '总装二部',
    date: '2026-04-28',
    eventType: '会议',
    description: '为确保机内作业安全，进行实地确认',
    theme: '4L 总装摩擦线机内区域观察',
    location: '4线',
    vpAttend: false,
    promoMethod: ['GTMCfamily', '内刊简讯'],
    status: 'pending',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-007',
    department: '总装二部',
    date: '2026-04-28',
    eventType: '部/科级活动',
    description: '丰富员工业余活动，提升团队合作意识',
    theme: '总装3科拔河比赛',
    location: '3线',
    vpAttend: false,
    promoMethod: ['GTMCfamily', '内刊简讯'],
    status: 'pending',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-008',
    department: '人事总务部',
    date: '2026-06-05',
    eventType: '部/科级活动',
    description: '6月是安全月，人事总务部召集了部门全员在办公区开展了安全月启动会，宣读了两位总经理的寄语，并发布了活动内容。',
    theme: '安全月启动会',
    location: '人事总务部办公区',
    vpAttend: false,
    promoMethod: ['内刊简讯'],
    status: 'pending',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-009',
    department: '研究开发本部',
    date: '2026-04-20',
    eventType: '其他',
    description: '五大高校领导赴 GTMC 工厂参观，先后考察总装、焊装等生产线与智能制造车间，深入了解精益生产与品质管控体系。双方围绕产教融合、人才培养、技术创新等议题座谈交流。',
    theme: '五大高校领导参观GTMC工厂',
    location: '五线工厂',
    vpAttend: false,
    promoMethod: ['内刊简讯'],
    status: 'selected',
    selectedChannels: [],
    notes: '校企合作重要素材',
  },
  {
    id: 'sub-010',
    department: '研究开发本部',
    date: '2026-05-09',
    eventType: '部/科级活动',
    description: '在人工智能技术飞速发展的背景下，为支撑部门数字化转型战略，技术开发部面向部门骨干精心策划了「AI 场景创新工作坊」。',
    theme: 'AI 赋能创新 智启企业未来 —— 技术开发部 AI 场景创新工作坊',
    location: '新RD-101',
    vpAttend: false,
    promoMethod: ['内刊简讯'],
    status: 'pending',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-011',
    department: '品质保证部',
    date: '2026-04-10',
    eventType: '部/科级活动',
    description: '面向工会组织的铂智7新媒体短视频大赛，为了确保短视频传播效果，助力铂智7大卖，品质保证部计划在赛前开展技能培训。',
    theme: '铂智7新媒体短视频竞赛_部门培训',
    location: '生产办公楼',
    vpAttend: false,
    promoMethod: ['GTMCfamily'],
    status: 'pending',
    selectedChannels: [],
    notes: '',
  },
  {
    id: 'sub-012',
    department: '财务部',
    date: '2026-04-15',
    eventType: '会议',
    description: '由国家税务总局广东省税务局货物和劳务税处王星处长带队，省、市、区三级税务局联合调研组赴广汽丰田汽车有限公司开展专题调研。',
    theme: '广东省税务局联合调研组赴广汽丰田专题调研',
    location: '四线生产车间',
    vpAttend: true,
    promoMethod: ['内刊简讯'],
    status: 'pending',
    selectedChannels: [],
    notes: 'VP陪同，高规格调研',
  },
];

// --- 配置 ---
const departments = [
  '总经理办公室', '品质保证部', '总装二部', '涂装成型二部',
  '人事总务部', '研究开发本部', '财务部', '销售部',
  '总务部', '质量管理部', '环境设施管理部',
];

const eventTypes = [
  { value: '部/科级活动', label: '部/科级活动', color: '#D4A574' },
  { value: '会议', label: '会议', color: '#4A7C59' },
  { value: '其他', label: '其他', color: '#6B6B6B' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待审核', color: '#6B6B6B', bg: '#F0EFEB' },
  selected: { label: '已选中', color: '#C17B3E', bg: '#FDF5EC' },
  in_progress: { label: '制作中', color: '#2563EB', bg: '#EFF6FF' },
  published: { label: '已发布', color: '#16A34A', bg: '#F0FDF4' },
  rejected: { label: '不采用', color: '#A64D4D', bg: '#FEF2F2' },
};

const channels = ['微信公众号', '内网', 'K站生活圈', 'K站视频', '微信视频号', '电视台', '社媒', '宣传栏', '车站海报'];

export function RequestIntake() {
  const [submissions, setSubmissions] = useState(realSubmissions);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = submissions
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .filter(s => deptFilter === 'all' || s.department === deptFilter)
    .filter(s => !searchQuery || s.theme.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    selected: submissions.filter(s => s.status === 'selected').length,
    inProgress: submissions.filter(s => s.status === 'in_progress').length,
    published: submissions.filter(s => s.status === 'published').length,
    vpCount: submissions.filter(s => s.vpAttend).length,
  };

  const handleStatusChange = (id: string, newStatus: Submission['status']) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    if (selectedSub?.id === id) {
      setSelectedSub(prev => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`状态已更新为「${statusConfig[newStatus].label}」`, 'success');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast(`正在导入「${file.name}」...`, 'info');
      // Simulate import
      setTimeout(() => {
        showToast('导入成功！新增 12 条报送记录', 'success');
        setShowImportModal(false);
      }, 1500);
    }
  };

  const columns = [
    { key: 'pending', label: '待审核' },
    { key: 'selected', label: '已选中' },
    { key: 'in_progress', label: '制作中' },
    { key: 'published', label: '已发布' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#FAFAF8]">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              信息报送
            </h1>
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">部门每周报送 → 审核筛选 → 渠道分发</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F0EFEB] rounded-md p-0.5">
              <button onClick={() => setView('board')} className={`px-2.5 py-1 text-[12px] rounded ${view === 'board' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>
                看板
              </button>
              <button onClick={() => setView('list')} className={`px-2.5 py-1 text-[12px] rounded ${view === 'list' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>
                列表
              </button>
            </div>
            <button
              onClick={handleImport}
              className="px-3 py-1.5 border border-[#E8E6E1] text-[#1A1A1A] text-[13px] rounded-md hover:bg-[#F5F4F0] flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              导入 Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-3">
          {[
            { label: '总报送', count: stats.total, color: '#1A1A1A' },
            { label: '待审核', count: stats.pending, color: '#6B6B6B' },
            { label: '已选中', count: stats.selected, color: '#C17B3E' },
            { label: '制作中', count: stats.inProgress, color: '#2563EB' },
            { label: '已发布', count: stats.published, color: '#16A34A' },
            { label: 'VP出席', count: stats.vpCount, color: '#A64D4D' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[12px] text-[#6B6B6B]">{s.label}</span>
              <span className="text-[13px] font-medium text-[#1A1A1A]">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[280px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder="搜索主题/描述..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white border border-[#E8E6E1] rounded-md focus:outline-none focus:border-[#D4A574]"
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 text-[13px] bg-white border border-[#E8E6E1] rounded-md focus:outline-none focus:border-[#D4A574]"
          >
            <option value="all">全部部门</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex bg-[#F0EFEB] rounded-md p-0.5">
            <button onClick={() => setStatusFilter('all')} className={`px-2 py-1 text-[11px] rounded ${statusFilter === 'all' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>全部</button>
            <button onClick={() => setStatusFilter('pending')} className={`px-2 py-1 text-[11px] rounded ${statusFilter === 'pending' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>待审核</button>
            <button onClick={() => setStatusFilter('selected')} className={`px-2 py-1 text-[11px] rounded ${statusFilter === 'selected' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>已选中</button>
            <button onClick={() => setStatusFilter('in_progress')} className={`px-2 py-1 text-[11px] rounded ${statusFilter === 'in_progress' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>制作中</button>
            <button onClick={() => setStatusFilter('published')} className={`px-2 py-1 text-[11px] rounded ${statusFilter === 'published' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'}`}>已发布</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'board' ? (
          <div className="h-full flex gap-3 p-4 overflow-x-auto">
            {columns.map(col => {
              const colItems = filtered.filter(s => s.status === col.key);
              return (
                <div key={col.key} className="flex-shrink-0 w-[300px] flex flex-col">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[col.key]?.color }} />
                      <span className="text-[13px] font-medium text-[#1A1A1A]">{col.label}</span>
                      <span className="text-[11px] text-[#6B6B6B] bg-[#F0EFEB] rounded-full px-1.5 py-0.5">{colItems.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {colItems.map(sub => (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSub(sub)}
                        className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-[#E8E6E1] hover:border-[#D4A574]/30"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: eventTypes.find(t => t.value === sub.eventType)?.color + '18',
                              color: eventTypes.find(t => t.value === sub.eventType)?.color,
                            }}
                          >
                            {sub.eventType}
                          </span>
                          {sub.vpAttend && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#A64D4D]/10 text-[#A64D4D]">VP出席</span>
                          )}
                        </div>
                        <h3 className="text-[13px] font-medium text-[#1A1A1A] mb-1.5 line-clamp-2">{sub.theme}</h3>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mb-2">
                          <span>{sub.department}</span>
                          <span>·</span>
                          <span>{sub.date}</span>
                          <span>·</span>
                          <span>{sub.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {sub.promoMethod.map(m => (
                            <span key={m} className="text-[10px] bg-[#F5F4F0] text-[#6B6B6B] rounded px-1.5 py-0.5">{m}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#6B6B6B] line-clamp-1 flex-1 mr-2">{sub.description}</span>
                        </div>
                        {sub.status === 'pending' && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-[#F0EFEB]">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(sub.id, 'selected'); }}
                              className="flex-1 px-2 py-1 bg-[#4A7C59]/10 text-[#4A7C59] rounded text-[11px] hover:bg-[#4A7C59]/20"
                            >
                              选中
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(sub.id, 'rejected'); }}
                              className="flex-1 px-2 py-1 bg-[#A64D4D]/10 text-[#A64D4D] rounded text-[11px] hover:bg-[#A64D4D]/20"
                            >
                              不采用
                            </button>
                          </div>
                        )}
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
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">事件主题</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">类型</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">部门</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">日期</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">期望宣传</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">状态</th>
                    <th className="text-left px-4 py-2.5 text-[12px] font-medium text-[#6B6B6B]">负责人</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className="border-b border-[#E8E6E1] last:border-0 cursor-pointer hover:bg-[#FAFAF8]"
                    >
                      <td className="px-4 py-3 text-[13px] text-[#1A1A1A] font-medium max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                          {sub.vpAttend && <span className="text-[9px] px-1 py-0.5 rounded bg-[#A64D4D]/10 text-[#A64D4D] shrink-0">VP</span>}
                          <span className="line-clamp-1">{sub.theme}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: eventTypes.find(t => t.value === sub.eventType)?.color + '18', color: eventTypes.find(t => t.value === sub.eventType)?.color }}>
                          {sub.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B]">{sub.department}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B]">{sub.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sub.promoMethod.map(m => (
                            <span key={m} className="text-[10px] bg-[#F5F4F0] text-[#6B6B6B] rounded px-1.5 py-0.5">{m}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: statusConfig[sub.status]?.bg, color: statusConfig[sub.status]?.color }}>
                          {statusConfig[sub.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6B6B6B]">{sub.assignee || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedSub(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative w-[520px] bg-white h-full overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-1 rounded" style={{ backgroundColor: eventTypes.find(t => t.value === selectedSub.eventType)?.color + '18', color: eventTypes.find(t => t.value === selectedSub.eventType)?.color }}>
                    {selectedSub.eventType}
                  </span>
                  {selectedSub.vpAttend && (
                    <span className="text-[11px] px-2 py-1 rounded bg-[#A64D4D]/10 text-[#A64D4D]">VP出席</span>
                  )}
                </div>
                <button onClick={() => setSelectedSub(null)} className="text-[#6B6B6B] hover:text-[#1A1A1A]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <h2 className="text-[20px] font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {selectedSub.theme}
              </h2>

              <div className="flex items-center gap-3 text-[13px] text-[#6B6B6B] mb-4">
                <span>{selectedSub.department}</span>
                <span>·</span>
                <span>{selectedSub.date}</span>
                <span>·</span>
                <span>{selectedSub.location}</span>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#FAFAF8] rounded-lg p-3">
                  <div className="text-[11px] text-[#6B6B6B] mb-1">事件类型</div>
                  <div className="text-[13px] font-medium text-[#1A1A1A]">{selectedSub.eventType}</div>
                </div>
                <div className="bg-[#FAFAF8] rounded-lg p-3">
                  <div className="text-[11px] text-[#6B6B6B] mb-1">审核状态</div>
                  <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ backgroundColor: statusConfig[selectedSub.status]?.bg, color: statusConfig[selectedSub.status]?.color }}>
                    {statusConfig[selectedSub.status]?.label}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-5">
                <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">事件描述</div>
                <p className="text-[13px] text-[#4A4A4A] leading-relaxed bg-[#FAFAF8] rounded-lg p-3">{selectedSub.description}</p>
              </div>

              {/* Expected Promotion */}
              <div className="mb-5">
                <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">期望宣传方式</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSub.promoMethod.map(m => (
                    <span key={m} className="text-[12px] bg-[#F5F4F0] text-[#4A4A4A] rounded px-2 py-1">{m}</span>
                  ))}
                </div>
              </div>

              {/* Selected Channels */}
              {selectedSub.selectedChannels.length > 0 && (
                <div className="mb-5">
                  <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">实际分发渠道</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSub.selectedChannels.map(ch => (
                      <span key={ch} className="text-[12px] bg-[#D4A574]/10 text-[#D4A574] rounded px-2 py-1">{ch}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSub.notes && (
                <div className="mb-5">
                  <div className="text-[12px] font-medium text-[#1A1A1A] mb-2">备注</div>
                  <p className="text-[13px] text-[#4A4A4A]">{selectedSub.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-[#E8E6E1]">
                {selectedSub.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedSub.id, 'selected')}
                      className="flex-1 py-2 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564]"
                    >
                      选中
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedSub.id, 'rejected')}
                      className="flex-1 py-2 border border-[#E8E6E1] text-[#6B6B6B] text-[13px] rounded-md hover:bg-[#FAFAF8]"
                    >
                      不采用
                    </button>
                  </>
                )}
                {selectedSub.status === 'selected' && (
                  <button
                    onClick={() => handleStatusChange(selectedSub.id, 'in_progress')}
                    className="flex-1 py-2 bg-[#D4A574] text-white text-[13px] rounded-md hover:bg-[#C49564]"
                  >
                    开始制作
                  </button>
                )}
                {selectedSub.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(selectedSub.id, 'published')}
                    className="flex-1 py-2 bg-[#4A7C59] text-white text-[13px] rounded-md hover:bg-[#3A6C49]"
                  >
                    标记已发布
                  </button>
                )}
                {selectedSub.status === 'published' && (
                  <div className="flex-1 py-2 text-center text-[13px] text-[#4A7C59] bg-[#4A7C59]/10 rounded-md">
                    已完成发布
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
