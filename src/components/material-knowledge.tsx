'use client';

import { useState } from 'react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  type: '素材' | '模板' | '案例' | '数据';
  tags: string[];
  source: string;
  reuseCount: number;
  aiTags: string[];
  createdAt: string;
  description: string;
  relatedItems: string[];
}

const categories = ['全部', '产品技术', '员工故事', '活动报道', '数据图表', '视觉素材', '文档模板'];

const mockItems: KnowledgeItem[] = [
  { id: '1', title: '新款凯美瑞生产线首车下线照片', category: '活动报道', type: '素材', tags: ['新车', '凯美瑞', '里程碑'], source: '生产部', reuseCount: 8, aiTags: ['生产线', '首车', '仪式', '红色丝带'], createdAt: '2026-07-18', description: '新款凯美瑞生产线首台车下线仪式现场照片，含多角度拍摄', relatedItems: ['2', '5'] },
  { id: '2', title: '员工技能比武大赛精彩瞬间', category: '员工故事', type: '素材', tags: ['技能', '比赛', '员工'], source: '人力资源部', reuseCount: 5, aiTags: ['技能比武', '决赛', '颁奖', '团队精神'], createdAt: '2026-07-17', description: '年度技能比武大赛决赛视频素材，含颁奖环节', relatedItems: ['1'] },
  { id: '3', title: '公众号推文模板 - 活动报道', category: '文档模板', type: '模板', tags: ['模板', '公众号', '活动'], source: '市场部', reuseCount: 15, aiTags: ['推文', '模板', '活动报道', '品牌调性'], createdAt: '2026-06-15', description: '标准活动报道推文模板，含标题、正文、图片排版规范', relatedItems: ['4'] },
  { id: '4', title: '2026上半年内容传播数据报告', category: '数据图表', type: '数据', tags: ['数据', '报告', '传播'], source: '总括', reuseCount: 3, aiTags: ['数据报告', '上半年', '传播效果', '趋势分析'], createdAt: '2026-07-10', description: '2026年上半年内容传播效果数据分析报告', relatedItems: ['3'] },
  { id: '5', title: '客户感谢信访件', category: '员工故事', type: '案例', tags: ['客户', '服务', '口碑'], source: '售后服务部', reuseCount: 4, aiTags: ['客户感谢', '售后服务', '口碑', '温暖故事'], createdAt: '2026-07-16', description: '客户来信感谢售后服务团队的专业服务，可改编为温暖故事', relatedItems: ['2'] },
  { id: '6', title: '夏季安全生产宣传海报', category: '视觉素材', type: '素材', tags: ['安全', '海报', '夏季'], source: '安全环境部', reuseCount: 6, aiTags: ['安全生产', '夏季', '海报', '高温作业'], createdAt: '2026-07-12', description: '夏季高温作业安全须知宣传海报设计稿', relatedItems: ['1'] },
  { id: '7', title: '供应商大会签约仪式照片', category: '活动报道', type: '素材', tags: ['供应商', '合作', '签约'], source: '采购部', reuseCount: 3, aiTags: ['供应商大会', '签约仪式', '合作', '商务'], createdAt: '2026-07-15', description: '2026年度供应商大会签约仪式现场照片', relatedItems: ['4'] },
  { id: '8', title: '短视频脚本模板 - 产品解读', category: '文档模板', type: '模板', tags: ['模板', '短视频', '产品'], source: '技术赋能', reuseCount: 10, aiTags: ['短视频', '脚本', '产品解读', '技术'], createdAt: '2026-06-20', description: '产品技术解读短视频脚本模板，含分镜、旁白、字幕规范', relatedItems: ['3'] },
];

const typeConfig = {
  '素材': { color: '#C17B3E', bg: '#FFFBEB' },
  '模板': { color: '#5A7BA8', bg: '#EFF6FF' },
  '案例': { color: '#8B5CF6', bg: '#F5F3FF' },
  '数据': { color: '#4A7C59', bg: '#F0FDF4' },
};

export function MaterialKnowledge() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = mockItems.filter(item => {
    const matchCategory = selectedCategory === '全部' || item.category === selectedCategory;
    const matchSearch = !searchQuery || item.title.includes(searchQuery) || item.tags.some(t => t.includes(searchQuery)) || item.aiTags.some(t => t.includes(searchQuery));
    return matchCategory && matchSearch;
  });

  const stats = [
    { label: '总素材', value: '156', color: '#D4A574' },
    { label: '本月新增', value: '23', color: '#4A7C59' },
    { label: '复用率', value: '2.8x', color: '#5A7BA8' },
    { label: 'AI标签覆盖', value: '89%', color: '#8B5CF6' },
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>素材知识库</h2>
              <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>内容资产沉淀 · AI赋能 · 复用追踪</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
                <button onClick={() => setViewMode('grid')} className="px-2 py-1 text-xs transition-colors" style={{ backgroundColor: viewMode === 'grid' ? '#1A1A1A' : '#FFF', color: viewMode === 'grid' ? '#FFF' : '#6B6B6B' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button onClick={() => setViewMode('list')} className="px-2 py-1 text-xs transition-colors" style={{ backgroundColor: viewMode === 'list' ? '#1A1A1A' : '#FFF', color: viewMode === 'list' ? '#FFF' : '#6B6B6B' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>
              <button className="px-3 py-1.5 rounded text-xs font-medium text-white" style={{ backgroundColor: '#D4A574' }}>+ 上传素材</button>
            </div>
          </div>
          {/* Search */}
          <div className="relative mb-3">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
              placeholder="搜索素材标题、标签、AI标签..."
            />
          </div>
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors"
                style={{ backgroundColor: selectedCategory === cat ? '#1A1A1A' : '#F0EFEB', color: selectedCategory === cat ? '#FFF' : '#6B6B6B' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-lg border p-3" style={{ borderColor: '#E8E6E1' }}>
                <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>{s.label}</div>
                <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(item => {
                const tc = typeConfig[item.type];
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-sm"
                    style={{ borderColor: selectedItem?.id === item.id ? '#D4A574' : '#E8E6E1' }}
                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  >
                    {/* Preview */}
                    <div className="h-32 flex items-center justify-center" style={{ backgroundColor: '#F5F4F0' }}>
                      <span className="text-xs" style={{ color: '#999' }}>{item.type}预览</span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: tc.bg, color: tc.color }}>{item.type}</span>
                        <h4 className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{item.title}</h4>
                      </div>
                      <p className="text-xs mb-2 line-clamp-2" style={{ color: '#999' }}>{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: '#999' }}>{item.source} · {item.createdAt}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>复用 {item.reuseCount}次</span>
                      </div>
                      {/* AI Tags */}
                      {item.aiTags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {item.aiTags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#8B5CF615', color: '#8B5CF6' }}>AI: {tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#E8E6E1' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
                    <th className="text-left py-2 px-4 text-xs font-medium" style={{ color: '#6B6B6B' }}>标题</th>
                    <th className="text-left py-2 px-4 text-xs font-medium" style={{ color: '#6B6B6B' }}>类型</th>
                    <th className="text-left py-2 px-4 text-xs font-medium" style={{ color: '#6B6B6B' }}>分类</th>
                    <th className="text-left py-2 px-4 text-xs font-medium" style={{ color: '#6B6B6B' }}>来源</th>
                    <th className="text-left py-2 px-4 text-xs font-medium" style={{ color: '#6B6B6B' }}>复用</th>
                    <th className="text-left py-2 px-4 text-xs font-medium" style={{ color: '#6B6B6B' }}>AI标签</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const tc = typeConfig[item.type];
                    return (
                      <tr key={item.id} className="border-b cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#E8E6E1' }} onClick={() => setSelectedItem(item)}>
                        <td className="py-3 px-4 text-sm" style={{ color: '#1A1A1A' }}>{item.title}</td>
                        <td className="py-3 px-4"><span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: tc.bg, color: tc.color }}>{item.type}</span></td>
                        <td className="py-3 px-4 text-xs" style={{ color: '#6B6B6B' }}>{item.category}</td>
                        <td className="py-3 px-4 text-xs" style={{ color: '#6B6B6B' }}>{item.source}</td>
                        <td className="py-3 px-4 text-xs font-medium" style={{ color: '#D4A574' }}>{item.reuseCount}次</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {item.aiTags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#8B5CF615', color: '#8B5CF6' }}>{tag}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-80 border-l overflow-auto" style={{ borderColor: '#E8E6E1' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>素材详情</h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-4 h-4" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Preview */}
            <div className="rounded-lg border overflow-hidden mb-4" style={{ borderColor: '#E8E6E1' }}>
              <div className="h-40 flex items-center justify-center" style={{ backgroundColor: '#F5F4F0' }}>
                <span className="text-xs" style={{ color: '#999' }}>{selectedItem.type}预览</span>
              </div>
            </div>
            <h4 className="text-base font-medium mb-2" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>{selectedItem.title}</h4>
            <p className="text-xs mb-4" style={{ color: '#6B6B6B' }}>{selectedItem.description}</p>
            {/* Meta */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>来源部门</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.source}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>分类</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.category}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>创建时间</span>
                <span style={{ color: '#1A1A1A' }}>{selectedItem.createdAt}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#999' }}>复用次数</span>
                <span className="font-medium" style={{ color: '#D4A574' }}>{selectedItem.reuseCount}次</span>
              </div>
            </div>
            {/* Tags */}
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: '#999' }}>用户标签</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{tag}</span>
                ))}
              </div>
            </div>
            {/* AI Tags */}
            <div className="mb-4">
              <div className="text-xs mb-2 flex items-center gap-1" style={{ color: '#999' }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                AI 识别标签
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.aiTags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#8B5CF615', color: '#8B5CF6' }}>{tag}</span>
                ))}
              </div>
            </div>
            {/* Reuse History */}
            <div className="mb-4">
              <div className="text-xs mb-2" style={{ color: '#999' }}>复用记录</div>
              <div className="space-y-1.5">
                {['公众号推文 · 07-19', '视频号短视频 · 07-18', 'GTMCfamily · 07-17'].slice(0, Math.min(selectedItem.reuseCount, 3)).map((record, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1">
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D4A574' }} />
                    <span style={{ color: '#6B6B6B' }}>{record}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full py-2 rounded text-xs font-medium text-white" style={{ backgroundColor: '#D4A574' }}>使用此素材</button>
              <button className="w-full py-2 rounded border text-xs" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}>下载原文件</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
