'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';

interface DocItem {
  id: string;
  type: 'folder' | 'doc';
  name: string;
  tags?: string[];
  wordCount?: number;
  lastModified?: string;
  author?: string;
  children?: DocItem[];
}

const mockTree: DocItem[] = [
  {
    id: '1', type: 'folder', name: '内容策略', children: [
      { id: '1-1', type: 'doc', name: '2025 年度内容规划', tags: ['策略', '规划'], wordCount: 4200, lastModified: '2 小时前', author: '张明' },
      { id: '1-2', type: 'doc', name: '受众画像分析', tags: ['用户研究', '数据'], wordCount: 3100, lastModified: '昨天', author: '李华' },
      { id: '1-3', type: 'doc', name: '竞品内容分析', tags: ['竞品', '策略'], wordCount: 2800, lastModified: '3 天前', author: '王芳' },
    ]
  },
  {
    id: '2', type: 'folder', name: '写作规范', children: [
      { id: '2-1', type: 'doc', name: '品牌语调指南', tags: ['品牌', '规范'], wordCount: 1500, lastModified: '1 周前', author: '张明' },
      { id: '2-2', type: 'doc', name: 'SEO 写作手册', tags: ['SEO', '教程'], wordCount: 3800, lastModified: '2 周前', author: '赵强' },
    ]
  },
  {
    id: '3', type: 'folder', name: '素材库', children: [
      { id: '3-1', type: 'folder', name: '图片素材', children: [] },
      { id: '3-2', type: 'folder', name: '数据报告', children: [
        { id: '3-2-1', type: 'doc', name: 'Q2 内容表现报告', tags: ['数据', '报告'], wordCount: 5600, lastModified: '5 天前', author: '陈静' },
        { id: '3-2-2', type: 'doc', name: '用户增长分析', tags: ['数据', '增长'], wordCount: 2200, lastModified: '1 周前', author: '陈静' },
      ]},
      { id: '3-3', type: 'doc', name: '常用模板合集', tags: ['模板', '效率'], wordCount: 800, lastModified: '1 个月前', author: '李华' },
    ]
  },
  {
    id: '4', type: 'folder', name: '培训资料', children: [
      { id: '4-1', type: 'doc', name: '新人入职指南', tags: ['培训', '入门'], wordCount: 2400, lastModified: '2 周前', author: '张明' },
      { id: '4-2', type: 'doc', name: '内容审核流程', tags: ['流程', '规范'], wordCount: 1200, lastModified: '3 周前', author: '王芳' },
    ]
  },
];

const recentDocs = [
  { name: '2025 年度内容规划', time: '2 小时前', author: '张明' },
  { name: '品牌语调指南', time: '1 周前', author: '张明' },
  { name: 'Q2 内容表现报告', time: '5 天前', author: '陈静' },
];

export function KnowledgeBase() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  const [selectedDocId, setSelectedDocId] = useState<string | null>('1-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(
    new Set(
      mockTree.flatMap((f) =>
        (f.children || []).flatMap((c) =>
          c.type === 'doc' ? (c.tags || []) :
          (c.children || []).filter((gc) => gc.type === 'doc').flatMap((gc) => gc.tags || [])
        )
      )
    )
  );

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const getAllDocs = (items: DocItem[]): DocItem[] => {
    return items.flatMap((item) => {
      if (item.type === 'doc') return [item];
      return item.children ? getAllDocs(item.children) : [];
    });
  };

  const allDocs = getAllDocs(mockTree);

  const filteredDocs = allDocs.filter((doc) => {
    const matchSearch = !searchQuery || doc.name.includes(searchQuery) || (doc.tags || []).some((t) => t.includes(searchQuery));
    const matchTag = !activeTag || (doc.tags || []).includes(activeTag);
    return matchSearch && matchTag;
  });

  const selectedDoc = allDocs.find((d) => d.id === selectedDocId);

  // Find path for breadcrumb
  const findPath = (items: DocItem[], targetId: string, path: string[] = []): string[] | null => {
    for (const item of items) {
      if (item.id === targetId) return [...path, item.name];
      if (item.children) {
        const found = findPath(item.children, targetId, [...path, item.name]);
        if (found) return found;
      }
    }
    return null;
  };
  const breadcrumb = selectedDoc ? findPath(mockTree, selectedDoc.id) : null;

  const renderTreeItem = (item: DocItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isSelected = selectedDocId === item.id;
    const isFolder = item.type === 'folder';

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm"
          style={{
            paddingLeft: `${depth * 16 + 8}px`,
            backgroundColor: isSelected ? '#F0EDE8' : 'transparent',
            color: isSelected ? '#1A1A1A' : '#6B6B6B',
          }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            } else {
              setSelectedDocId(item.id);
            }
          }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F9F8F6'; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {isFolder && (
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          )}
          {isFolder ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, color: '#D4A574' }}>
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}
          <span className="truncate text-xs font-medium">{item.name}</span>
          {isFolder && item.children && (
            <span className="text-xs ml-auto" style={{ color: '#9A9A9A' }}>{item.children.length}</span>
          )}
        </div>
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar - Tree */}
      <div className="w-56 border-r flex flex-col" style={{ borderColor: '#E8E6E1' }}>
        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded text-xs border outline-none transition-colors"
              style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A574'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
            />
          </div>
        </div>

        {/* Tags filter */}
        <div className="px-3 py-2 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              className="px-1.5 py-0.5 rounded text-xs transition-colors"
              style={{ backgroundColor: !activeTag ? '#1A1A1A' : 'transparent', color: !activeTag ? '#FAFAF8' : '#6B6B6B' }}
              onClick={() => setActiveTag(null)}
            >
              全部
            </button>
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                className="px-1.5 py-0.5 rounded text-xs transition-colors"
                style={{ backgroundColor: activeTag === tag ? '#D4A574' : 'transparent', color: activeTag === tag ? '#1A1A1A' : '#6B6B6B' }}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                onMouseEnter={(e) => { if (activeTag !== tag) e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
                onMouseLeave={(e) => { if (activeTag !== tag) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-auto py-2">
          {mockTree.map((item) => renderTreeItem(item))}
        </div>

        {/* Recent */}
        <div className="border-t p-3" style={{ borderColor: '#E8E6E1' }}>
          <p className="text-xs font-medium mb-2" style={{ color: '#9A9A9A' }}>最近访问</p>
          <div className="space-y-1">
            {recentDocs.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-2 py-1 px-1 rounded text-xs cursor-pointer transition-colors"
                style={{ color: '#6B6B6B' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9F8F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span className="truncate flex-1">{doc.name}</span>
                <span className="flex-shrink-0" style={{ color: '#9A9A9A' }}>{doc.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content - Document list / preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb + toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: '#9A9A9A' }}>知识库</span>
            {breadcrumb && breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                <span style={{ color: i === breadcrumb.length - 1 ? '#1A1A1A' : '#6B6B6B', fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded transition-colors" style={{ color: '#6B6B6B' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect width="8" height="4" x="8" y="2" rx="1" /></svg>
            </button>
            <button className="p-1.5 rounded transition-colors" style={{ color: '#6B6B6B' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => showToast('已分享链接', 'success')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {selectedDoc ? (
            <div className="max-w-2xl mx-auto p-6">
              {/* Doc header */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Noto Serif SC', serif", color: '#1A1A1A' }}>
                  {selectedDoc.name}
                </h1>
                <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6B6B' }}>
                  <span>{selectedDoc.author}</span>
                  <span style={{ color: '#D4D0C8' }}>|</span>
                  <span>{selectedDoc.lastModified}</span>
                  <span style={{ color: '#D4D0C8' }}>|</span>
                  <span>{selectedDoc.wordCount?.toLocaleString()} 字</span>
                </div>
                {selectedDoc.tags && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {selectedDoc.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Doc content preview */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9F8F6' }}>
                  <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A', lineHeight: '1.8' }}>
                    本文档详细阐述了 2025 年度的内容策略规划，包括核心目标、关键指标、内容主题矩阵、发布节奏以及团队协作流程。
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>核心目标</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['品牌影响力提升 40%', '月均产出 20+ 篇', '用户增长 30%'].map((goal) => (
                      <div key={goal} className="p-3 rounded-md border" style={{ borderColor: '#E8E6E1' }}>
                        <p className="text-xs font-medium" style={{ color: '#D4A574' }}>{goal}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>内容主题矩阵</h3>
                  <div className="border rounded-md overflow-hidden" style={{ borderColor: '#E8E6E1' }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ backgroundColor: '#F9F8F6' }}>
                          <th className="text-left px-3 py-2 font-medium" style={{ color: '#6B6B6B' }}>主题</th>
                          <th className="text-left px-3 py-2 font-medium" style={{ color: '#6B6B6B' }}>频率</th>
                          <th className="text-left px-3 py-2 font-medium" style={{ color: '#6B6B6B' }}>负责</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['行业洞察', '每周 1 篇', '张明'],
                          ['方法论', '每周 1 篇', '李华'],
                          ['教程', '每周 2 篇', '赵强'],
                          ['观点', '双周 1 篇', '王芳'],
                        ].map(([topic, freq, owner]) => (
                          <tr key={topic} className="border-t" style={{ borderColor: '#E8E6E1' }}>
                            <td className="px-3 py-2" style={{ color: '#1A1A1A' }}>{topic}</td>
                            <td className="px-3 py-2" style={{ color: '#6B6B6B' }}>{freq}</td>
                            <td className="px-3 py-2" style={{ color: '#6B6B6B' }}>{owner}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Version history */}
              <div className="mt-8 pt-4 border-t" style={{ borderColor: '#E8E6E1' }}>
                <p className="text-xs font-medium mb-3" style={{ color: '#9A9A9A' }}>版本历史</p>
                <div className="space-y-2">
                  {[
                    { time: '2 小时前', author: '张明', action: '更新了核心目标部分' },
                    { time: '昨天', author: '李华', action: '添加了内容主题矩阵' },
                    { time: '3 天前', author: '张明', action: '创建了文档' },
                  ].map((v, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B', fontSize: '9px' }}>
                        {v.author[0]}
                      </div>
                      <span style={{ color: '#6B6B6B' }}>{v.author}</span>
                      <span style={{ color: '#1A1A1A' }}>{v.action}</span>
                      <span className="ml-auto" style={{ color: '#9A9A9A' }}>{v.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" strokeWidth="1">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>选择一个文档查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
