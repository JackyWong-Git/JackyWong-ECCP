'use client';

import { useState } from 'react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  type: '素材' | '文案' | '图片' | '视频' | '模板';
  reuseCount: number;
  createdAt: string;
  aiReady: boolean;
  content: string;
}

const categories = ['品牌宣传', '产品资讯', '员工故事', '安全环保', '技术创新', '客户声音', '活动报道'];

const mockItems: KnowledgeItem[] = [
  { id: '1', title: '凯美瑞2026款产品亮点汇总', category: '产品资讯', tags: ['凯美瑞', '新车', '产品力'], source: '市场部', type: '文案', reuseCount: 8, createdAt: '2026-06-15', aiReady: true, content: '全新凯美瑞搭载2.5L动态力发动机，最大功率209马力...' },
  { id: '2', title: '广汽丰田社会责任报告素材', category: '品牌宣传', tags: ['CSR', '社会责任', '环保'], source: '总务部', type: '素材', reuseCount: 5, createdAt: '2026-06-20', aiReady: true, content: '2026年度社会责任报告核心数据与亮点...' },
  { id: '3', title: '生产线安全操作规范图解', category: '安全环保', tags: ['安全', '规范', '图解'], source: '安全环境部', type: '图片', reuseCount: 12, createdAt: '2026-05-10', aiReady: false, content: '车间安全操作标准流程图，含12个关键节点...' },
  { id: '4', title: '优秀员工故事集 - 匠心篇', category: '员工故事', tags: ['员工', '匠心', '人物'], source: '人力资源部', type: '文案', reuseCount: 6, createdAt: '2026-07-01', aiReady: true, content: '记录一线工匠的坚守与创新，3位代表性员工故事...' },
  { id: '5', title: '新能源技术科普动画', category: '技术创新', tags: ['新能源', '混动', '科普'], source: '技术部', type: '视频', reuseCount: 4, createdAt: '2026-06-28', aiReady: false, content: '3分钟动画解析丰田混动技术原理...' },
  { id: '6', title: '公众号爆款标题模板库', category: '品牌宣传', tags: ['模板', '标题', '公众号'], source: '内容中台', type: '模板', reuseCount: 25, createdAt: '2026-04-15', aiReady: true, content: '50+经过验证的高打开率标题公式...' },
  { id: '7', title: '客户感谢信合集', category: '客户声音', tags: ['客户', '感谢', '口碑'], source: '售后服务部', type: '文案', reuseCount: 3, createdAt: '2026-07-10', aiReady: true, content: '近3个月客户感谢信访件精选，涵盖服务质量、技术能力等维度...' },
  { id: '8', title: '年度活动视觉模板', category: '活动报道', tags: ['模板', '视觉', '活动'], source: '内容中台', type: '模板', reuseCount: 18, createdAt: '2026-03-20', aiReady: false, content: '年会、运动会、技能比武等活动海报模板...' },
];

export function MaterialKnowledge() {
  const [items] = useState<KnowledgeItem[]>(mockItems);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = items.filter(item => {
    const matchCategory = !selectedCategory || item.category === selectedCategory;
    const matchSearch = !searchQuery || item.title.includes(searchQuery) || item.tags.some(t => t.includes(searchQuery));
    return matchCategory && matchSearch;
  });

  const typeConfig: Record<string, { color: string; icon: string }> = {
    '素材': { color: '#5A7BA8', icon: '素' },
    '文案': { color: '#4A7C59', icon: '文' },
    '图片': { color: '#C17B3E', icon: '图' },
    '视频': { color: '#8B5CF6', icon: '视' },
    '模板': { color: '#D4A574', icon: '模' },
  };

  const totalReuse = items.reduce((sum, i) => sum + i.reuseCount, 0);
  const aiReadyCount = items.filter(i => i.aiReady).length;

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>素材知识库</h2>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{items.length} 条资产</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded border text-xs outline-none w-48"
                  style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
                  placeholder="搜索素材..."
                />
              </div>
              <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
                <button onClick={() => setViewMode('grid')} className="px-2 py-1 text-xs" style={{ backgroundColor: viewMode === 'grid' ? '#1A1A1A' : '#FFF', color: viewMode === 'grid' ? '#FFF' : '#6B6B6B' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button onClick={() => setViewMode('list')} className="px-2 py-1 text-xs" style={{ backgroundColor: viewMode === 'list' ? '#1A1A1A' : '#FFF', color: viewMode === 'list' ? '#FFF' : '#6B6B6B' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="bg-white rounded border px-3 py-2" style={{ borderColor: '#E8E6E1' }}>
              <div className="text-[10px]" style={{ color: '#999' }}>总素材</div>
              <div className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{items.length}</div>
            </div>
            <div className="bg-white rounded border px-3 py-2" style={{ borderColor: '#E8E6E1' }}>
              <div className="text-[10px]" style={{ color: '#999' }}>总复用</div>
              <div className="text-lg font-semibold" style={{ color: '#D4A574' }}>{totalReuse}次</div>
            </div>
            <div className="bg-white rounded border px-3 py-2" style={{ borderColor: '#E8E6E1' }}>
              <div className="text-[10px]" style={{ color: '#999' }}>AI就绪</div>
              <div className="text-lg font-semibold" style={{ color: '#4A7C59' }}>{aiReadyCount}/{items.length}</div>
            </div>
            <div className="bg-white rounded border px-3 py-2" style={{ borderColor: '#E8E6E1' }}>
              <div className="text-[10px]" style={{ color: '#999' }}>分类</div>
              <div className="text-lg font-semibold" style={{ color: '#5A7BA8' }}>{categories.length}</div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-2.5 py-1 rounded text-xs transition-colors"
              style={{ backgroundColor: !selectedCategory ? '#1A1A1A' : '#F0EFEB', color: !selectedCategory ? '#FFF' : '#6B6B6B' }}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className="px-2.5 py-1 rounded text-xs transition-colors"
                style={{ backgroundColor: selectedCategory === cat ? '#D4A574' : '#F0EFEB', color: selectedCategory === cat ? '#FFF' : '#6B6B6B' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map(item => {
                const tc = typeConfig[item.type];
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-lg border p-4 cursor-pointer transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5"
                    style={{ borderColor: selectedItem?.id === item.id ? '#D4A574' : '#E8E6E1' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: tc.color }}>{tc.icon}</div>
                      <span className="text-[10px]" style={{ color: '#999' }}>{item.category}</span>
                      {item.aiReady && (
                        <span className="ml-auto text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: '#F0FDF4', color: '#4A7C59' }}>AI</span>
                      )}
                    </div>
                    <div className="text-xs font-medium mb-2 leading-snug" style={{ color: '#1A1A1A' }}>{item.title}</div>
                    <p className="text-[10px] mb-3 line-clamp-2" style={{ color: '#999' }}>{item.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {item.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}>{t}</span>
                        ))}
                      </div>
                      <span className="text-[10px]" style={{ color: '#BBB' }}>复用 {item.reuseCount}次</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>标题</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>类型</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>分类</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>来源</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>复用</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>AI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="border-b cursor-pointer transition-colors hover:bg-white"
                    style={{ borderColor: '#F0EFEB' }}
                  >
                    <td className="py-2.5 px-3 font-medium" style={{ color: '#1A1A1A' }}>{item.title}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ backgroundColor: typeConfig[item.type].color }}>{item.type}</span>
                    </td>
                    <td className="py-2.5 px-3" style={{ color: '#6B6B6B' }}>{item.category}</td>
                    <td className="py-2.5 px-3" style={{ color: '#6B6B6B' }}>{item.source}</td>
                    <td className="py-2.5 px-3 font-medium" style={{ color: '#D4A574' }}>{item.reuseCount}次</td>
                    <td className="py-2.5 px-3">
                      {item.aiReady ? <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0FDF4', color: '#4A7C59' }}>就绪</span> : <span className="text-[10px]" style={{ color: '#BBB' }}>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-[300px] border-l overflow-y-auto bg-white" style={{ borderColor: '#E8E6E1' }}>
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: typeConfig[selectedItem.type].color }}>{typeConfig[selectedItem.type].icon}</div>
                <span className="text-[10px]" style={{ color: '#999' }}>{selectedItem.type}</span>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-3.5 h-3.5" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{selectedItem.title}</h3>
          </div>

          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>内容摘要</div>
            <p className="text-xs leading-relaxed" style={{ color: '#6B6B6B' }}>{selectedItem.content}</p>
          </div>

          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>标签</div>
            <div className="flex flex-wrap gap-1.5">
              {selectedItem.tags.map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded" style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}>{t}</span>
              ))}
            </div>
          </div>

          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>元数据</div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span style={{ color: '#999' }}>分类</span><span style={{ color: '#1A1A1A' }}>{selectedItem.category}</span></div>
              <div className="flex justify-between"><span style={{ color: '#999' }}>来源</span><span style={{ color: '#1A1A1A' }}>{selectedItem.source}</span></div>
              <div className="flex justify-between"><span style={{ color: '#999' }}>创建时间</span><span style={{ color: '#1A1A1A' }}>{selectedItem.createdAt}</span></div>
              <div className="flex justify-between"><span style={{ color: '#999' }}>复用次数</span><span className="font-medium" style={{ color: '#D4A574' }}>{selectedItem.reuseCount}次</span></div>
              <div className="flex justify-between"><span style={{ color: '#999' }}>AI就绪</span><span>{selectedItem.aiReady ? '是' : '否'}</span></div>
            </div>
          </div>

          {/* AI Actions */}
          {selectedItem.aiReady && (
            <div className="p-4">
              <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>AI 赋能</div>
              <div className="space-y-1.5">
                <button className="w-full text-left px-3 py-2 rounded text-xs transition-colors" style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EDE8E2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F5F0EB'}>
                  基于此素材生成公众号文章
                </button>
                <button className="w-full text-left px-3 py-2 rounded text-xs transition-colors" style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EDE8E2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F5F0EB'}>
                  生成短视频脚本
                </button>
                <button className="w-full text-left px-3 py-2 rounded text-xs transition-colors" style={{ backgroundColor: '#F5F0EB', color: '#6B6B6B' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EDE8E2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F5F0EB'}>
                  多渠道内容适配
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
