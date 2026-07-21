'use client';

import { useState, useRef } from 'react';

interface Material {
  id: string;
  title: string;
  department: string;
  type: 'text' | 'image' | 'video' | 'document';
  description: string;
  tags: string[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  submittedAt: string;
  submitter: string;
  fileSize?: string;
  statusHistory: { status: string; date: string; by: string }[];
}

const departments = [
  { name: '生产部', contact: '张工', ext: '8001' },
  { name: '品质部', contact: '李工', ext: '8002' },
  { name: '销售部', contact: '王经理', ext: '8003' },
  { name: '售后服务部', contact: '陈主管', ext: '8004' },
  { name: '市场部', contact: '赵总监', ext: '8005' },
  { name: '人力资源部', contact: '刘经理', ext: '8006' },
  { name: '总务部', contact: '周主管', ext: '8007' },
  { name: '采购部', contact: '吴经理', ext: '8008' },
  { name: '技术部', contact: '郑工', ext: '8009' },
  { name: '财务部', contact: '孙主管', ext: '8010' },
  { name: '安全环境部', contact: '马工', ext: '8011' },
  { name: '整车物流部', contact: '黄主管', ext: '8012' },
  { name: '发动机部', contact: '林工', ext: '8013' },
  { name: '车身部', contact: '何工', ext: '8014' },
  { name: '涂装部', contact: '罗工', ext: '8015' },
];

const mockMaterials: Material[] = [
  { id: '1', title: '新款凯美瑞生产线首台车下线', department: '生产部', type: 'image', description: '记录首台车下线仪式，含现场照片5张、视频1段', tags: ['新车', '生产', '里程碑'], status: 'accepted', submittedAt: '2026-07-18', submitter: '张伟', fileSize: '128MB', statusHistory: [{ status: '已提交', date: '07-18 09:30', by: '张伟' }, { status: '已审核', date: '07-18 14:00', by: '郭晓鹏' }, { status: '已采纳', date: '07-19 10:00', by: '滕紫原' }] },
  { id: '2', title: '员工技能比武大赛精彩瞬间', department: '人力资源部', type: 'video', description: '年度技能比武大赛决赛视频素材，含颁奖环节', tags: ['员工', '活动', '技能'], status: 'reviewed', submittedAt: '2026-07-17', submitter: '李芳', fileSize: '2.1GB', statusHistory: [{ status: '已提交', date: '07-17 16:00', by: '李芳' }, { status: '已审核', date: '07-18 11:00', by: '郭晓鹏' }] },
  { id: '3', title: '夏季安全生产注意事项', department: '安全环境部', type: 'document', description: '夏季高温作业安全须知文档，可用于内部宣传', tags: ['安全', '宣传', '季节性'], status: 'pending', submittedAt: '2026-07-19', submitter: '王磊', fileSize: '5.2MB', statusHistory: [{ status: '已提交', date: '07-19 08:45', by: '王磊' }] },
  { id: '4', title: '客户感谢信访件', department: '售后服务部', type: 'text', description: '客户来信感谢售后服务团队的专业服务', tags: ['客户', '服务', '口碑'], status: 'accepted', submittedAt: '2026-07-16', submitter: '陈静', statusHistory: [{ status: '已提交', date: '07-16 10:00', by: '陈静' }, { status: '已审核', date: '07-16 15:00', by: '熊臣坤' }, { status: '已采纳', date: '07-17 09:00', by: '滕紫原' }] },
  { id: '5', title: '供应商大会现场报道', department: '采购部', type: 'image', description: '2026年度供应商大会现场照片，含签约仪式', tags: ['供应商', '合作', '大会'], status: 'reviewed', submittedAt: '2026-07-15', submitter: '刘洋', fileSize: '256MB', statusHistory: [{ status: '已提交', date: '07-15 17:00', by: '刘洋' }, { status: '已审核', date: '07-16 10:00', by: '郭晓鹏' }] },
  { id: '6', title: '新车型研发幕后故事', department: '技术部', type: 'video', description: '研发团队加班加点的纪录片素材', tags: ['研发', '技术', '幕后'], status: 'pending', submittedAt: '2026-07-19', submitter: '赵明', fileSize: '4.5GB', statusHistory: [{ status: '已提交', date: '07-19 11:30', by: '赵明' }] },
];

const typeConfig = {
  text: { label: '文字', color: '#5A7BA8', icon: '文' },
  image: { label: '图片', color: '#C17B3E', icon: '图' },
  video: { label: '视频', color: '#8B5CF6', icon: '视' },
  document: { label: '文档', color: '#4A7C59', icon: '档' },
};

const statusConfig = {
  pending: { label: '待审核', color: '#C17B3E', bg: '#FFFBEB' },
  reviewed: { label: '已审核', color: '#5A7BA8', bg: '#EFF6FF' },
  accepted: { label: '已采纳', color: '#4A7C59', bg: '#F0FDF4' },
  rejected: { label: '已退回', color: '#A64D4D', bg: '#FEF2F2' },
};

export function MaterialSubmission() {
  const [showForm, setShowForm] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'reviewed' | 'accepted' | 'rejected' | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '', department: departments[0].name, type: 'image' as Material['type'],
    description: '', tags: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!formData.title || !formData.description) return;
    const newMaterial: Material = {
      id: String(Date.now()),
      title: formData.title,
      department: formData.department,
      type: formData.type,
      description: formData.description,
      tags: formData.tags.split(/[,，、]/).filter(Boolean),
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      submitter: '当前用户',
      fileSize: uploadedFiles.length > 0 ? `${uploadedFiles.length}个文件` : undefined,
      statusHistory: [{ status: '已提交', date: '刚刚', by: '当前用户' }],
    };
    setMySubmissions(prev => [newMaterial, ...prev]);
    setFormData({ title: '', department: departments[0].name, type: 'image', description: '', tags: '' });
    setUploadedFiles([]);
    setShowForm(false);
  };

  const allSubmissions = [...mySubmissions, ...mockMaterials];
  const filtered = filterStatus ? allSubmissions.filter(m => m.status === filterStatus) : allSubmissions;
  const currentDept = departments.find(d => d.name === formData.department);

  const stats = [
    { label: '本月提交', value: allSubmissions.length, color: '#D4A574' },
    { label: '已采纳', value: allSubmissions.filter(m => m.status === 'accepted').length, color: '#4A7C59' },
    { label: '待审核', value: allSubmissions.filter(m => m.status === 'pending').length, color: '#C17B3E' },
    { label: '复用次数', value: '12', color: '#5A7BA8' },
  ];

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>素材上报</h1>
              <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>各部门窗口统一上报入口，一次采集、多渠道复用</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{ backgroundColor: showForm ? '#F0EFEB' : '#D4A574', color: showForm ? '#6B6B6B' : '#FFF' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              {showForm ? '取消' : '上报新素材'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E8E6E1' }}>
                <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>{s.label}</div>
                <div className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Submission Form */}
          {showForm && (
            <div className="bg-white rounded-lg border p-6 mb-6" style={{ borderColor: '#E8E6E1' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>新建素材上报</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#6B6B6B' }}>素材标题 *</label>
                  <input
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded border text-sm outline-none focus:ring-1"
                    style={{ borderColor: '#E8E6E1', '--tw-ring-color': '#D4A574' } as React.CSSProperties}
                    placeholder="请输入素材标题"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#6B6B6B' }}>上报部门 *</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 rounded border text-sm outline-none bg-white"
                    style={{ borderColor: '#E8E6E1' }}
                  >
                    {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#6B6B6B' }}>素材类型</label>
                  <div className="flex gap-2">
                    {(['text', 'image', 'video', 'document'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                        className="flex-1 py-2 rounded border text-xs transition-all"
                        style={{
                          borderColor: formData.type === t ? typeConfig[t].color : '#E8E6E1',
                          backgroundColor: formData.type === t ? typeConfig[t].color + '10' : '#FFF',
                          color: formData.type === t ? typeConfig[t].color : '#6B6B6B',
                        }}
                      >
                        {typeConfig[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#6B6B6B' }}>标签（逗号分隔）</label>
                  <input
                    value={formData.tags}
                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 rounded border text-sm outline-none"
                    style={{ borderColor: '#E8E6E1' }}
                    placeholder="如：新车, 活动, 里程碑"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: '#6B6B6B' }}>素材描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded border text-sm outline-none resize-none h-20"
                  style={{ borderColor: '#E8E6E1' }}
                  placeholder="请描述素材内容、用途、拍摄时间等关键信息"
                />
              </div>
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors cursor-pointer"
                style={{ borderColor: dragOver ? '#D4A574' : '#E8E6E1', backgroundColor: dragOver ? '#D4A57410' : '#FAFAF8' }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); setUploadedFiles(prev => [...prev, '拖入的文件']); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" className="hidden" multiple onChange={() => setUploadedFiles(prev => [...prev, '选择的文件'])} />
                <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-xs" style={{ color: '#6B6B6B' }}>拖拽文件到此处，或点击选择文件</p>
                <p className="text-xs mt-1" style={{ color: '#999' }}>图片≤20MB / 视频≤2GB / 文档≤50MB</p>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {uploadedFiles.map((f, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{f} {i + 1}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowForm(false); setUploadedFiles([]); }} className="px-4 py-2 rounded text-sm" style={{ color: '#6B6B6B' }}>取消</button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: formData.title && formData.description ? '#D4A574' : '#CCC', cursor: formData.title && formData.description ? 'pointer' : 'not-allowed' }}
                >
                  提交上报
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            {([null, 'pending', 'reviewed', 'accepted', 'rejected'] as const).map(s => (
              <button
                key={s || 'all'}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor: filterStatus === s ? '#1A1A1A' : '#F0EFEB',
                  color: filterStatus === s ? '#FFF' : '#6B6B6B',
                }}
              >
                {s ? statusConfig[s].label : '全部'} ({s ? allSubmissions.filter(m => m.status === s).length : allSubmissions.length})
              </button>
            ))}
          </div>

          {/* Material List */}
          <div className="space-y-2">
            {filtered.map(m => {
              const tc = typeConfig[m.type];
              const sc = statusConfig[m.status];
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm"
                  style={{ borderColor: selectedMaterial?.id === m.id ? '#D4A574' : '#E8E6E1' }}
                  onClick={() => setSelectedMaterial(selectedMaterial?.id === m.id ? null : m)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-xs text-white font-medium shrink-0" style={{ backgroundColor: tc.color }}>{tc.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{m.title}</h4>
                        <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: '#999' }}>
                        <span>{m.department}</span>
                        <span>·</span>
                        <span>{m.submitter}</span>
                        <span>·</span>
                        <span>{m.submittedAt}</span>
                        {m.fileSize && <><span>·</span><span>{m.fileSize}</span></>}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {m.tags.map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Status Timeline (expanded) */}
                  {selectedMaterial?.id === m.id && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E8E6E1' }}>
                      <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>{m.description}</p>
                      <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>状态流转</div>
                      <div className="flex items-center gap-2">
                        {m.statusHistory.map((h, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === m.statusHistory.length - 1 ? '#D4A574' : '#E8E6E1' }} />
                              {i < m.statusHistory.length - 1 && <div className="w-12 h-px" style={{ backgroundColor: '#E8E6E1' }} />}
                            </div>
                            <div>
                              <div className="text-xs" style={{ color: '#1A1A1A' }}>{h.status}</div>
                              <div className="text-xs" style={{ color: '#999' }}>{h.date} · {h.by}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Department Contacts */}
      <div className="w-64 border-l overflow-auto" style={{ borderColor: '#E8E6E1' }}>
        <div className="p-4">
          <h3 className="text-xs font-semibold mb-3" style={{ color: '#1A1A1A' }}>部门接口人</h3>
          <div className="space-y-2">
            {departments.map(d => (
              <div key={d.name} className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-gray-50 cursor-pointer" style={{ color: '#6B6B6B' }}>
                <span>{d.name}</span>
                <span style={{ color: '#999' }}>{d.contact} · {d.ext}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E8E6E1' }}>
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#1A1A1A' }}>素材规范</h3>
            <div className="space-y-2 text-xs" style={{ color: '#6B6B6B' }}>
              <div className="flex justify-between"><span>图片</span><span style={{ color: '#999' }}>JPG/PNG ≤20MB</span></div>
              <div className="flex justify-between"><span>视频</span><span style={{ color: '#999' }}>MP4 ≤2GB</span></div>
              <div className="flex justify-between"><span>文档</span><span style={{ color: '#999' }}>PDF/DOC ≤50MB</span></div>
              <div className="flex justify-between"><span>分辨率</span><span style={{ color: '#999' }}>≥1920×1080</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
