'use client';

import { useState } from 'react';

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
}

const departments = [
  '生产部', '品质部', '销售部', '售后服务部', '市场部',
  '人力资源部', '总务部', '采购部', '技术部', '财务部',
  '安全环境部', '整车物流部', '发动机部', '车身部', '涂装部',
];

const mockMaterials: Material[] = [
  { id: '1', title: '新款凯美瑞生产线首台车下线', department: '生产部', type: 'image', description: '记录首台车下线仪式，含现场照片5张、视频1段', tags: ['新车', '生产', '里程碑'], status: 'accepted', submittedAt: '2026-07-18', submitter: '张伟' },
  { id: '2', title: '员工技能比武大赛精彩瞬间', department: '人力资源部', type: 'video', description: '年度技能比武大赛决赛视频素材，含颁奖环节', tags: ['员工', '活动', '技能'], status: 'reviewed', submittedAt: '2026-07-17', submitter: '李芳' },
  { id: '3', title: '夏季安全生产注意事项', department: '安全环境部', type: 'document', description: '夏季高温作业安全须知文档，可用于内部宣传', tags: ['安全', '宣传', '季节性'], status: 'pending', submittedAt: '2026-07-19', submitter: '王磊' },
  { id: '4', title: '客户感谢信访件', department: '售后服务部', type: 'text', description: '客户来信感谢售后服务团队的专业服务', tags: ['客户', '服务', '口碑'], status: 'accepted', submittedAt: '2026-07-16', submitter: '陈静' },
  { id: '5', title: '供应商大会现场报道', department: '采购部', type: 'image', description: '2026年度供应商大会现场照片，含签约仪式', tags: ['供应商', '合作', '大会'], status: 'reviewed', submittedAt: '2026-07-15', submitter: '刘洋' },
  { id: '6', title: '新车型研发幕后故事', department: '技术部', type: 'video', description: '研发团队加班加点的纪录片素材', tags: ['研发', '技术', '幕后'], status: 'pending', submittedAt: '2026-07-19', submitter: '赵明' },
];

export function MaterialSubmission() {
  const [showForm, setShowForm] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Material[]>([]);
  const [formData, setFormData] = useState({
    title: '', department: departments[0], type: 'image' as Material['type'],
    description: '', tags: '',
  });

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
    };
    setMySubmissions(prev => [newMaterial, ...prev]);
    setFormData({ title: '', department: departments[0], type: 'image', description: '', tags: '' });
    setShowForm(false);
  };

  const allSubmissions = [...mySubmissions, ...mockMaterials];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>素材上报</h1>
        <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>各部门窗口统一上报入口，一次采集、多渠道复用</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '本月提交', value: '16', unit: '条', color: '#D4A574' },
          { label: '已采纳', value: '8', unit: '条', color: '#4A7C59' },
          { label: '待审核', value: '5', unit: '条', color: '#C17B3E' },
          { label: '复用次数', value: '12', unit: '次', color: '#5A7BA8' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-4 border" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>{s.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs" style={{ color: '#999' }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#D4A574', color: '#FFF' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C49564'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#D4A574'}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          上报新素材
        </button>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-5 mb-6" style={{ borderColor: '#E8E6E1' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>素材上报表</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B6B6B' }}>素材标题 *</label>
              <input
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded border text-sm outline-none transition-colors"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
                placeholder="简要描述素材内容"
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B6B6B' }}>所属部门 *</label>
              <select
                value={formData.department}
                onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                className="w-full px-3 py-2 rounded border text-sm outline-none"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B6B6B' }}>素材类型</label>
              <div className="flex gap-2">
                {(['image', 'video', 'text', 'document'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFormData(p => ({ ...p, type: t }))}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: formData.type === t ? '#D4A574' : '#F0EFEB',
                      color: formData.type === t ? '#FFF' : '#6B6B6B',
                    }}
                  >
                    {{ image: '图片', video: '视频', text: '文字', document: '文档' }[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B6B6B' }}>标签（逗号分隔）</label>
              <input
                value={formData.tags}
                onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                className="w-full px-3 py-2 rounded border text-sm outline-none"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
                placeholder="如：活动, 宣传, 季节性"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs mb-1.5" style={{ color: '#6B6B6B' }}>素材描述 *</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded border text-sm outline-none resize-none"
              style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
              rows={3}
              placeholder="详细描述素材内容、使用场景、拍摄时间等"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded text-sm" style={{ color: '#6B6B6B' }}>取消</button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#D4A574' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C49564'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#D4A574'}
            >
              提交上报
            </button>
          </div>
        </div>
      )}

      {/* Submission List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>上报记录</h3>
        {allSubmissions.map(m => (
          <div key={m.id} className="bg-white rounded-lg border p-4 transition-all duration-150 hover:shadow-sm" style={{ borderColor: '#E8E6E1' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{m.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    m.status === 'accepted' ? 'bg-green-50 text-green-700' :
                    m.status === 'reviewed' ? 'bg-blue-50 text-blue-700' :
                    m.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {{ pending: '待审核', reviewed: '已审核', accepted: '已采纳', rejected: '已退回' }[m.status]}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: '#6B6B6B' }}>{m.description}</p>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: '#999' }}>
                  <span>{m.department}</span>
                  <span>{m.submitter}</span>
                  <span>{m.submittedAt}</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB' }}>
                    {{ image: '图片', video: '视频', text: '文字', document: '文档' }[m.type]}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 ml-4">
                {m.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
