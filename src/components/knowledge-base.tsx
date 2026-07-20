'use client';

import { useState } from 'react';

interface Doc {
  id: string;
  title: string;
  type: 'doc' | 'folder';
  children?: Doc[];
  tags?: string[];
  updatedAt?: string;
}

const mockTree: Doc[] = [
  {
    id: '1', title: '内容创作指南', type: 'folder', children: [
      { id: '1-1', title: '选题方法论', type: 'doc', tags: ['方法论', '选题'], updatedAt: '2 小时前' },
      { id: '1-2', title: '写作模板库', type: 'doc', tags: ['模板'], updatedAt: '1 天前' },
      { id: '1-3', title: '排版规范', type: 'doc', tags: ['设计', '规范'], updatedAt: '3 天前' },
    ],
  },
  {
    id: '2', title: '行业研究', type: 'folder', children: [
      { id: '2-1', title: '2025 内容趋势', type: 'doc', tags: ['行业', '趋势'], updatedAt: '5 小时前' },
      { id: '2-2', title: '竞品分析', type: 'doc', tags: ['竞品'], updatedAt: '2 天前' },
      { id: '2-3', title: '用户画像', type: 'doc', tags: ['用户'], updatedAt: '1 周前' },
    ],
  },
  {
    id: '3', title: '素材库', type: 'folder', children: [
      { id: '3-1', title: '常用配图', type: 'doc', tags: ['图片'], updatedAt: '1 天前' },
      { id: '3-2', title: '数据报告', type: 'doc', tags: ['数据'], updatedAt: '4 天前' },
    ],
  },
  { id: '4', title: '会议纪要 - 7月', type: 'doc', tags: ['会议'], updatedAt: '3 小时前' },
  { id: '5', title: '发布排期表', type: 'doc', tags: ['排期', '运营'], updatedAt: '6 小时前' },
];

const tagColors: Record<string, { text: string; bg: string }> = {
  '方法论': { text: '#6B8FA3', bg: '#E8F0F5' },
  '选题': { text: '#D4A574', bg: '#F5EBD9' },
  '模板': { text: '#4A7C59', bg: '#E8F2EB' },
  '设计': { text: '#A64D4D', bg: '#F5E8E8' },
  '规范': { text: '#6B6B6B', bg: '#F0EDE8' },
  '行业': { text: '#6B8FA3', bg: '#E8F0F5' },
  '趋势': { text: '#C17B3E', bg: '#FFF3E0' },
  '竞品': { text: '#A64D4D', bg: '#F5E8E8' },
  '用户': { text: '#4A7C59', bg: '#E8F2EB' },
  '图片': { text: '#D4A574', bg: '#F5EBD9' },
  '数据': { text: '#6B8FA3', bg: '#E8F0F5' },
  '会议': { text: '#6B6B6B', bg: '#F0EDE8' },
  '排期': { text: '#C17B3E', bg: '#FFF3E0' },
  '运营': { text: '#4A7C59', bg: '#E8F2EB' },
};

export function KnowledgeBase() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2']));
  const [selectedDoc, setSelectedDoc] = useState<string | null>('1-1');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const filterDocs = (docs: Doc[]): Doc[] => {
    if (!searchQuery) return docs;
    return docs.reduce<Doc[]>((acc, doc) => {
      if (doc.type === 'folder' && doc.children) {
        const filteredChildren = filterDocs(doc.children);
        if (filteredChildren.length > 0 || doc.title.includes(searchQuery)) {
          acc.push({ ...doc, children: filteredChildren.length > 0 ? filteredChildren : doc.children });
        }
      } else if (doc.title.includes(searchQuery) || doc.tags?.some((t) => t.includes(searchQuery))) {
        acc.push(doc);
      }
      return acc;
    }, []);
  };

  const filteredTree = filterDocs(mockTree);

  return (
    <div className="flex h-full">
      {/* Document tree */}
      <div className="w-64 border-r overflow-auto p-4" style={{ borderColor: '#E8E6E1' }}>
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded text-xs border outline-none transition-colors"
              style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A574'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
            />
          </div>
        </div>

        <div className="space-y-0.5">
          {filteredTree.map((doc) => (
            <TreeNode
              key={doc.id}
              doc={doc}
              depth={0}
              expandedFolders={expandedFolders}
              selectedDoc={selectedDoc}
              onToggleFolder={toggleFolder}
              onSelectDoc={setSelectedDoc}
            />
          ))}
        </div>

        <button
          className="flex items-center gap-1.5 w-full mt-3 px-2 py-1.5 rounded text-xs transition-colors"
          style={{ color: '#6B6B6B' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F3EF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          新建文档
        </button>
      </div>

      {/* Document content area */}
      <div className="flex-1 overflow-auto">
        {selectedDoc === '1-1' ? (
          <div className="max-w-[640px] mx-auto p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#E8F0F5', color: '#6B8FA3' }}>方法论</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F5EBD9', color: '#D4A574' }}>选题</span>
              <span className="text-xs ml-auto" style={{ color: '#9A9A9A' }}>更新于 2 小时前</span>
            </div>
            <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'Noto Serif SC', serif", color: '#1A1A1A' }}>
              选题方法论
            </h1>
            <div className="space-y-4 text-sm" style={{ color: '#1A1A1A', lineHeight: '1.8' }}>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Noto Serif SC', serif" }}>选题评估框架</h2>
              <p>每个选题在进入生产流程前，需要从以下四个维度进行评估：</p>
              <div className="border rounded-lg p-4" style={{ borderColor: '#E8E6E1', backgroundColor: '#F9F8F6' }}>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-medium" style={{ color: '#D4A574' }}>1.</span>
                    <div>
                      <span className="font-medium">时效性</span>
                      <span style={{ color: '#6B6B6B' }}> — 这个话题在当前时间窗口内是否有关注度？</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium" style={{ color: '#D4A574' }}>2.</span>
                    <div>
                      <span className="font-medium">受众匹配</span>
                      <span style={{ color: '#6B6B6B' }}> — 是否契合目标受众的核心需求和兴趣？</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium" style={{ color: '#D4A574' }}>3.</span>
                    <div>
                      <span className="font-medium">差异化</span>
                      <span style={{ color: '#6B6B6B' }}> — 与已有内容相比，是否有新的角度或信息？</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium" style={{ color: '#D4A574' }}>4.</span>
                    <div>
                      <span className="font-medium">可执行性</span>
                      <span style={{ color: '#6B6B6B' }}> — 团队是否有足够的资源和能力完成？</span>
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Noto Serif SC', serif" }}>选题来源</h2>
              <p>好的选题来自多渠道的信息输入：</p>
              <ul className="list-disc pl-5 space-y-1" style={{ color: '#6B6B6B' }}>
                <li>用户反馈和评论区高频问题</li>
                <li>行业报告和数据分析</li>
                <li>竞品内容监控</li>
                <li>团队头脑风暴</li>
                <li>社交媒体热点趋势</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm" style={{ color: '#9A9A9A' }}>选择左侧文档查看内容</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  doc,
  depth,
  expandedFolders,
  selectedDoc,
  onToggleFolder,
  onSelectDoc,
}: {
  doc: Doc;
  depth: number;
  expandedFolders: Set<string>;
  selectedDoc: string | null;
  onToggleFolder: (id: string) => void;
  onSelectDoc: (id: string) => void;
}) {
  const isExpanded = expandedFolders.has(doc.id);
  const isSelected = selectedDoc === doc.id;

  if (doc.type === 'folder') {
    return (
      <div>
        <button
          className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-left transition-colors"
          style={{
            paddingLeft: `${depth * 12 + 8}px`,
            backgroundColor: isSelected ? '#F5F3EF' : 'transparent',
            color: '#1A1A1A',
          }}
          onClick={() => onToggleFolder(doc.id)}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="transition-transform duration-150 flex-shrink-0"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
          <span className="text-sm font-medium truncate">{doc.title}</span>
        </button>
        {isExpanded && doc.children && (
          <div>
            {doc.children.map((child) => (
              <TreeNode
                key={child.id}
                doc={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                selectedDoc={selectedDoc}
                onToggleFolder={onToggleFolder}
                onSelectDoc={onSelectDoc}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-left transition-colors"
      style={{
        paddingLeft: `${depth * 12 + 22}px`,
        backgroundColor: isSelected ? '#F5F3EF' : 'transparent',
        color: isSelected ? '#1A1A1A' : '#6B6B6B',
      }}
      onClick={() => onSelectDoc(doc.id)}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="text-sm truncate">{doc.title}</span>
    </button>
  );
}
