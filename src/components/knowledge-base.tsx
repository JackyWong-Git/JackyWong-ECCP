'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';

interface Doc {
  id: string;
  title: string;
  type: 'pdf' | 'md' | 'docx' | 'url' | 'txt';
  size: string;
  chunks: number;
  status: 'processing' | 'ready' | 'error';
  updatedAt: string;
  tags: string[];
  folder: string;
}

interface Folder {
  id: string;
  name: string;
  count: number;
  expanded: boolean;
}

const mockFolders: Folder[] = [
  { id: 'all', name: '全部文档', count: 12, expanded: true },
  { id: 'content', name: '内容创作', count: 5, expanded: true },
  { id: 'marketing', name: '营销策略', count: 3, expanded: false },
  { id: 'product', name: '产品文档', count: 4, expanded: false },
];

const mockDocs: Doc[] = [
  { id: '1', title: '内容创作方法论合集', type: 'pdf', size: '2.4 MB', chunks: 48, status: 'ready', updatedAt: '2025-07-18', tags: ['方法论', '创作'], folder: 'content' },
  { id: '2', title: '2025 年内容趋势报告', type: 'docx', size: '1.8 MB', chunks: 32, status: 'ready', updatedAt: '2025-07-17', tags: ['趋势', '报告'], folder: 'content' },
  { id: '3', title: '短视频脚本模板库', type: 'md', size: '456 KB', chunks: 24, status: 'ready', updatedAt: '2025-07-16', tags: ['模板', '短视频'], folder: 'content' },
  { id: '4', title: 'SEO 优化指南', type: 'pdf', size: '3.1 MB', chunks: 56, status: 'ready', updatedAt: '2025-07-15', tags: ['SEO', '优化'], folder: 'marketing' },
  { id: '5', title: '品牌调性手册', type: 'pdf', size: '5.2 MB', chunks: 78, status: 'processing', updatedAt: '2025-07-20', tags: ['品牌', '设计'], folder: 'marketing' },
  { id: '6', title: '产品需求文档 v2.0', type: 'docx', size: '890 KB', chunks: 18, status: 'ready', updatedAt: '2025-07-14', tags: ['PRD', '产品'], folder: 'product' },
  { id: '7', title: 'API 接口文档', type: 'md', size: '234 KB', chunks: 12, status: 'ready', updatedAt: '2025-07-13', tags: ['API', '技术'], folder: 'product' },
  { id: '8', title: '竞品分析报告', type: 'pdf', size: '4.5 MB', chunks: 64, status: 'ready', updatedAt: '2025-07-12', tags: ['竞品', '分析'], folder: 'marketing' },
  { id: '9', title: '用户访谈记录', type: 'txt', size: '128 KB', chunks: 8, status: 'ready', updatedAt: '2025-07-11', tags: ['用户', '访谈'], folder: 'product' },
  { id: '10', title: '内容分发渠道对比', type: 'url', size: '-', chunks: 16, status: 'error', updatedAt: '2025-07-10', tags: ['渠道', '分发'], folder: 'content' },
];

const typeIcons: Record<string, { label: string; color: string; bg: string }> = {
  pdf: { label: 'PDF', color: '#A64D4D', bg: '#FDE8E8' },
  md: { label: 'MD', color: '#1A1A1A', bg: '#F0EDE8' },
  docx: { label: 'DOC', color: '#6B8FA3', bg: '#E8F0F5' },
  url: { label: 'URL', color: '#4A7C59', bg: '#E8F2EB' },
  txt: { label: 'TXT', color: '#6B6B6B', bg: '#F0EDE8' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  processing: { label: '处理中', color: '#C17B3E', bg: '#FFF3E0' },
  ready: { label: '就绪', color: '#4A7C59', bg: '#E8F2EB' },
  error: { label: '异常', color: '#A64D4D', bg: '#FDE8E8' },
};

export function KnowledgeBase() {
  const [docs, setDocs] = useState<Doc[]>(mockDocs);
  const [folders, setFolders] = useState<Folder[]>(mockFolders);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showRagPipeline, setShowRagPipeline] = useState(false);

  const filtered = docs.filter(d => {
    const matchFolder = selectedFolder === 'all' || d.folder === selectedFolder;
    const matchSearch = !searchQuery || d.title.includes(searchQuery) || d.tags.some(t => t.includes(searchQuery));
    return matchFolder && matchSearch;
  });

  const toggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded } : f));
  };

  const totalChunks = docs.reduce((acc, d) => acc + d.chunks, 0);
  const readyDocs = docs.filter(d => d.status === 'ready').length;

  return (
    <div className="flex h-full">
      {/* Left sidebar - Folders */}
      <div className="w-[220px] border-r flex flex-col" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>知识库</h3>
            <button onClick={() => setShowUpload(true)} className="p-1 rounded hover:bg-[#E8E6E1] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            </button>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded" style={{ backgroundColor: '#F0EDE8' }}>
              <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{docs.length}</div>
              <div className="text-[10px]" style={{ color: '#9A9A9A' }}>文档</div>
            </div>
            <div className="text-center p-2 rounded" style={{ backgroundColor: '#F0EDE8' }}>
              <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{totalChunks}</div>
              <div className="text-[10px]" style={{ color: '#9A9A9A' }}>分块</div>
            </div>
            <div className="text-center p-2 rounded" style={{ backgroundColor: '#F0EDE8' }}>
              <div className="text-sm font-semibold" style={{ color: '#4A7C59' }}>{readyDocs}</div>
              <div className="text-[10px]" style={{ color: '#9A9A9A' }}>就绪</div>
            </div>
          </div>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto py-2">
          {folders.map(folder => (
            <div key={folder.id}>
              <button
                onClick={() => { setSelectedFolder(folder.id); toggleFolder(folder.id); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left transition-colors"
                style={{
                  backgroundColor: selectedFolder === folder.id ? '#F0EDE8' : 'transparent',
                  color: selectedFolder === folder.id ? '#1A1A1A' : '#6B6B6B',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${folder.expanded ? 'rotate-90' : ''}`}><path d="m9 18 6-6-6-6" /></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                <span className="text-sm flex-1">{folder.name}</span>
                <span className="text-xs" style={{ color: '#9A9A9A' }}>{folder.count}</span>
              </button>
            </div>
          ))}
        </div>

        {/* RAG Pipeline button */}
        <div className="p-3 border-t" style={{ borderColor: '#E8E6E1' }}>
          <button
            onClick={() => setShowRagPipeline(!showRagPipeline)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
            style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M12 1v6" /><path d="M12 17v6" /><path d="m4.22 4.22 4.24 4.24" /><path d="m15.54 15.54 4.24 4.24" /><path d="M1 12h6" /><path d="M17 12h6" /><path d="m4.22 19.78 4.24-4.24" /><path d="m15.54 8.46 4.24-4.24" /></svg>
            RAG 流程
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }}>
              {folders.find(f => f.id === selectedFolder)?.name || '全部文档'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>{filtered.length} 个文档 / {filtered.reduce((a, d) => a + d.chunks, 0)} 个分块</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                placeholder="搜索文档..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-md border outline-none focus:ring-2"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', '--tw-ring-color': '#D4A574' } as React.CSSProperties}
              />
            </div>
            <div className="flex rounded-md border overflow-hidden" style={{ borderColor: '#E8E6E1' }}>
              <button onClick={() => setViewMode('grid')} className="px-2 py-1.5" style={{ backgroundColor: viewMode === 'grid' ? '#1A1A1A' : '#fff', color: viewMode === 'grid' ? '#fff' : '#6B6B6B' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button onClick={() => setViewMode('list')} className="px-2 py-1.5" style={{ backgroundColor: viewMode === 'list' ? '#1A1A1A' : '#fff', color: viewMode === 'list' ? '#fff' : '#6B6B6B' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
              </button>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md"
              style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              上传文档
            </button>
          </div>
        </div>

        {/* RAG Pipeline visualization */}
        {showRagPipeline && (
          <div className="px-6 py-4 border-b" style={{ borderColor: '#E8E6E1', backgroundColor: '#F8F7F4' }}>
            <div className="flex items-center gap-4">
              <div className="text-xs font-medium mb-2" style={{ color: '#6B6B6B' }}>RAG 处理流程</div>
              <div className="flex items-center gap-2 flex-1">
                {[
                  { label: '文档导入', icon: 'D', color: '#6B8FA3' },
                  { label: '文本分块', icon: 'C', color: '#C17B3E' },
                  { label: '向量化', icon: 'V', color: '#D4A574' },
                  { label: '索引存储', icon: 'S', color: '#4A7C59' },
                  { label: '语义检索', icon: 'R', color: '#8B6FA3' },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: step.color + '22', color: step.color }}>
                        {step.icon}
                      </div>
                      <span className="text-[10px] mt-1" style={{ color: '#6B6B6B' }}>{step.label}</span>
                    </div>
                    {i < 4 && (
                      <svg width="20" height="10" viewBox="0 0 20 10" className="flex-shrink-0">
                        <path d="M0 5h16m0 0l-3-3m3 3l-3 3" fill="none" stroke="#D4D0C8" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="p-4 rounded-lg border cursor-pointer transition-all"
                  style={{
                    borderColor: selectedDoc?.id === doc.id ? '#D4A574' : '#E8E6E1',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: typeIcons[doc.type].bg, color: typeIcons[doc.type].color }}>
                      {typeIcons[doc.type].label}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: statusConfig[doc.status].color, backgroundColor: statusConfig[doc.status].bg }}>
                      {statusConfig[doc.status].label}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium mb-1 line-clamp-1" style={{ color: '#1A1A1A' }}>{doc.title}</h4>
                  <p className="text-xs mb-3" style={{ color: '#9A9A9A' }}>{doc.size} / {doc.chunks} 分块</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {doc.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>{tag}</span>
                      ))}
                    </div>
                    <span className="text-[10px]" style={{ color: '#9A9A9A' }}>{doc.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
                  <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>文档</th>
                  <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>类型</th>
                  <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>状态</th>
                  <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>分块</th>
                  <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>标签</th>
                  <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr
                    key={doc.id}
                    className="border-b cursor-pointer transition-colors"
                    style={{ borderColor: '#E8E6E1' }}
                    onClick={() => setSelectedDoc(doc)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8F7F4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: typeIcons[doc.type].bg, color: typeIcons[doc.type].color }}>
                          {typeIcons[doc.type].label}
                        </div>
                        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-sm" style={{ color: '#6B6B6B' }}>{doc.size}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: statusConfig[doc.status].color, backgroundColor: statusConfig[doc.status].bg }}>
                        {statusConfig[doc.status].label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sm" style={{ color: '#6B6B6B' }}>{doc.chunks}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1">{doc.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>{t}</span>)}</div>
                    </td>
                    <td className="py-2.5 px-3 text-sm" style={{ color: '#9A9A9A' }}>{doc.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-[480px] rounded-lg overflow-hidden" style={{ backgroundColor: '#FAFAF8', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
              <h3 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>上传文档到知识库</h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded hover:bg-[#E8E6E1]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center mb-4" style={{ borderColor: '#D4A574', backgroundColor: '#F8F7F4' }}>
                <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>拖拽文件到此处，或点击上传</p>
                <p className="text-xs" style={{ color: '#9A9A9A' }}>支持 PDF、DOCX、MD、TXT、URL</p>
              </div>
              <div className="mb-4">
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>目标文件夹</label>
                <select className="w-full px-3 py-1.5 text-sm rounded-md border outline-none" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }}>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>分段设置</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: '#9A9A9A' }}>分块大小</label>
                    <input type="text" defaultValue="500" className="w-full px-3 py-1.5 text-sm rounded-md border outline-none" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }} />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: '#9A9A9A' }}>重叠大小</label>
                    <input type="text" defaultValue="50" className="w-full px-3 py-1.5 text-sm rounded-md border outline-none" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-3 border-t" style={{ borderColor: '#E8E6E1' }}>
              <button onClick={() => setShowUpload(false)} className="px-4 py-1.5 text-sm rounded-md" style={{ color: '#6B6B6B', border: '1px solid #E8E6E1' }}>取消</button>
              <button
                onClick={() => { setShowUpload(false); showToast('文档上传成功，正在处理...', 'success'); }}
                className="px-4 py-1.5 text-sm font-medium rounded-md"
                style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
              >
                上传并处理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doc detail */}
      {selectedDoc && (
        <div className="w-[300px] border-l flex flex-col" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>文档详情</span>
            <button onClick={() => setSelectedDoc(null)} className="p-1 rounded hover:bg-[#E8E6E1]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: typeIcons[selectedDoc.type].bg, color: typeIcons[selectedDoc.type].color }}>
                {typeIcons[selectedDoc.type].label}
              </div>
              <div>
                <h4 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{selectedDoc.title}</h4>
                <span className="text-xs" style={{ color: '#9A9A9A' }}>{selectedDoc.size} / {selectedDoc.chunks} 分块</span>
              </div>
            </div>
            <div className="p-3 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
              <div className="text-xs mb-1" style={{ color: '#9A9A9A' }}>处理状态</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[selectedDoc.status].color }} />
                <span className="text-sm" style={{ color: statusConfig[selectedDoc.status].color }}>{statusConfig[selectedDoc.status].label}</span>
              </div>
            </div>
            <div>
              <div className="text-xs mb-1.5" style={{ color: '#9A9A9A' }}>标签</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedDoc.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: '#E8D5C0', color: '#8B6914' }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1.5" style={{ color: '#9A9A9A' }}>分块预览</div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-2 rounded text-xs" style={{ backgroundColor: '#fff', border: '1px solid #E8E6E1', color: '#6B6B6B' }}>
                    分块 #{i}: {selectedDoc.title}的相关段落内容预览...
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => showToast('语义搜索功能开发中', 'info')}
                className="flex-1 py-2 text-xs font-medium rounded-md"
                style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
              >
                语义搜索
              </button>
              <button
                onClick={() => { setDocs(prev => prev.filter(d => d.id !== selectedDoc.id)); setSelectedDoc(null); showToast('文档已删除', 'info'); }}
                className="px-3 py-2 text-xs rounded-md"
                style={{ color: '#A64D4D', border: '1px solid #FDE8E8' }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
