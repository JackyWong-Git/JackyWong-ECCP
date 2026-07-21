'use client';

import { useState, useMemo } from 'react';
import { showToast } from './toast';

// 知识库类型
interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  icon: string;
  documentCount: number;
  chunkCount: number;
  embeddingModel: string;
  status: 'ready' | 'indexing' | 'error';
  lastUpdated: string;
  size: string;
}

// 文档类型
interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'md' | 'txt' | 'xlsx' | 'url';
  size: string;
  chunks: number;
  status: 'processed' | 'processing' | 'pending' | 'error';
  uploadedAt: string;
  source: string;
}

const knowledgeBases: KnowledgeBase[] = [
  { id: '1', name: '品牌手册', description: '广汽丰田品牌规范、视觉指南、话术标准', icon: '📘', documentCount: 12, chunkCount: 1847, embeddingModel: 'text-embedding-3-small', status: 'ready', lastUpdated: '2 小时前', size: '156 MB' },
  { id: '2', name: '优秀案例库', description: '历史优秀内容案例，按渠道和主题分类', icon: '📗', documentCount: 234, chunkCount: 8932, embeddingModel: 'text-embedding-3-small', status: 'ready', lastUpdated: '1 天前', size: '892 MB' },
  { id: '3', name: '法规知识库', description: '广告法、行业法规、合规要求', icon: '📕', documentCount: 45, chunkCount: 3421, embeddingModel: 'text-embedding-3-large', status: 'ready', lastUpdated: '3 天前', size: '234 MB' },
  { id: '4', name: '部门报送记录', description: '各部门周报、活动报送历史记录', icon: '📙', documentCount: 260, chunkCount: 5678, embeddingModel: 'text-embedding-3-small', status: 'indexing', lastUpdated: '进行中...', size: '445 MB' },
  { id: '5', name: '渠道规范', description: '各发布渠道的内容规范和最佳实践', icon: '📓', documentCount: 28, chunkCount: 1234, embeddingModel: 'text-embedding-3-small', status: 'ready', lastUpdated: '1 周前', size: '89 MB' },
];

const documents: Document[] = [
  { id: '1', name: '广汽丰田品牌手册2026.pdf', type: 'pdf', size: '24.5 MB', chunks: 342, status: 'processed', uploadedAt: '2026-07-15', source: '品牌手册' },
  { id: '2', name: '视觉规范指南v3.docx', type: 'docx', size: '8.2 MB', chunks: 156, status: 'processed', uploadedAt: '2026-07-14', source: '品牌手册' },
  { id: '3', name: '话术标准汇编.md', type: 'md', size: '1.2 MB', chunks: 89, status: 'processed', uploadedAt: '2026-07-13', source: '品牌手册' },
  { id: '4', name: '公众号优秀案例合集.pdf', type: 'pdf', size: '45.6 MB', chunks: 567, status: 'processed', uploadedAt: '2026-07-12', source: '优秀案例库' },
  { id: '5', name: '小红书爆款笔记分析.xlsx', type: 'xlsx', size: '3.4 MB', chunks: 234, status: 'processed', uploadedAt: '2026-07-11', source: '优秀案例库' },
  { id: '6', name: '广告法全文.pdf', type: 'pdf', size: '2.1 MB', chunks: 445, status: 'processed', uploadedAt: '2026-07-10', source: '法规知识库' },
  { id: '7', name: '部门周报汇总-7月.xlsx', type: 'xlsx', size: '12.3 MB', chunks: 890, status: 'processing', uploadedAt: '2026-07-21', source: '部门报送记录' },
];

export function RAGKnowledgeBase() {
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(knowledgeBases[0]);
  const [viewMode, setViewMode] = useState<'list' | 'embedding'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-compute vector points to avoid Math.random() in render
  const vectorPoints = useMemo(() => {
    // Seeded random for consistent rendering
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 50 }).map((_, i) => ({
      x: 50 + seededRandom(i * 7 + 1) * 300,
      y: 50 + seededRandom(i * 13 + 2) * 300,
      color: i < 20 ? '#D4A574' : i < 35 ? '#4A7C59' : '#6B6B6B',
    }));
  }, []);

  const totalDocs = knowledgeBases.reduce((sum, kb) => sum + kb.documentCount, 0);
  const totalChunks = knowledgeBases.reduce((sum, kb) => sum + kb.chunkCount, 0);
  const readyCount = knowledgeBases.filter(kb => kb.status === 'ready').length;

  return (
    <div className="flex h-full">
      {/* 左侧知识库列表 */}
      <div className="w-72 border-r border-[#E8E6E1] flex flex-col">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
            RAG 知识库
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            {knowledgeBases.length} 个知识库 · {totalDocs} 文档 · {totalChunks.toLocaleString()} 分块
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="p-3 border-b border-[#E8E6E1] grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-[#F5F4F0] rounded">
            <div className="text-lg font-semibold text-[#4A7C59]">{readyCount}</div>
            <div className="text-[10px] text-[#6B6B6B]">就绪</div>
          </div>
          <div className="text-center p-2 bg-[#F5F4F0] rounded">
            <div className="text-lg font-semibold text-[#C17B3E]">{knowledgeBases.filter(kb => kb.status === 'indexing').length}</div>
            <div className="text-[10px] text-[#6B6B6B]">索引中</div>
          </div>
          <div className="text-center p-2 bg-[#F5F4F0] rounded">
            <div className="text-lg font-semibold text-[#1A1A1A]">{totalChunks.toLocaleString()}</div>
            <div className="text-[10px] text-[#6B6B6B]">总分块</div>
          </div>
        </div>

        {/* 知识库列表 */}
        <div className="flex-1 overflow-y-auto">
          {knowledgeBases.map(kb => (
            <div
              key={kb.id}
              onClick={() => setSelectedKB(kb)}
              className={`p-3 border-b border-[#E8E6E1] cursor-pointer transition-colors ${
                selectedKB?.id === kb.id ? 'bg-[#F5F4F0]' : 'hover:bg-[#FAFAF8]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{kb.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#1A1A1A] truncate">{kb.name}</h3>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      kb.status === 'ready' ? 'bg-[#4A7C59]' :
                      kb.status === 'indexing' ? 'bg-[#C17B3E] animate-pulse' : 'bg-[#A64D4D]'
                    }`} />
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{kb.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6B6B6B]">
                    <span>{kb.documentCount} 文档</span>
                    <span>·</span>
                    <span>{kb.chunkCount.toLocaleString()} 块</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 新建知识库 */}
        <div className="p-3 border-t border-[#E8E6E1]">
          <button
            onClick={() => showToast('新建知识库功能开发中', 'info')}
            className="w-full py-2 text-sm bg-[#1A1A1A] text-white rounded hover:bg-[#2A2A2A] transition-colors"
          >
            + 新建知识库
          </button>
        </div>
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedKB && (
          <>
            {/* 头部 */}
            <div className="p-4 border-b border-[#E8E6E1]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedKB.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {selectedKB.name}
                    </h2>
                    <p className="text-xs text-[#6B6B6B]">{selectedKB.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      viewMode === 'list' ? 'bg-[#1A1A1A] text-white' : 'border border-[#E8E6E1] hover:bg-[#F5F4F0]'
                    }`}
                  >
                    列表
                  </button>
                  <button
                    onClick={() => setViewMode('embedding')}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      viewMode === 'embedding' ? 'bg-[#1A1A1A] text-white' : 'border border-[#E8E6E1] hover:bg-[#F5F4F0]'
                    }`}
                  >
                    向量空间
                  </button>
                </div>
              </div>

              {/* 搜索 */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="语义搜索知识库..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-[#E8E6E1] rounded focus:outline-none focus:border-[#D4A574]"
                />
                <button
                  onClick={() => showToast('搜索功能开发中', 'info')}
                  className="px-4 py-2 text-sm bg-[#D4A574] text-white rounded hover:bg-[#C49564] transition-colors"
                >
                  搜索
                </button>
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === 'list' ? (
                /* 文档列表 */
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[#1A1A1A]">
                      文档列表 ({documents.filter(d => d.source === selectedKB.name).length})
                    </h3>
                    <button
                      onClick={() => showToast('上传文档功能开发中', 'info')}
                      className="px-3 py-1.5 text-xs border border-[#E8E6E1] rounded hover:bg-[#F5F4F0] transition-colors"
                    >
                      + 上传文档
                    </button>
                  </div>
                  {documents.filter(d => d.source === selectedKB.name).map(doc => (
                    <div key={doc.id} className="p-3 border border-[#E8E6E1] rounded hover:border-[#D4A574]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {doc.type === 'pdf' ? '📄' : doc.type === 'docx' ? '📝' : doc.type === 'xlsx' ? '📊' : '📃'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#1A1A1A] truncate">{doc.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#6B6B6B]">
                            <span>{doc.size}</span>
                            <span>{doc.chunks} 分块</span>
                            <span>{doc.uploadedAt}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          doc.status === 'processed' ? 'bg-[#4A7C59]/10 text-[#4A7C59]' :
                          doc.status === 'processing' ? 'bg-[#C17B3E]/10 text-[#C17B3E]' :
                          'bg-[#6B6B6B]/10 text-[#6B6B6B]'
                        }`}>
                          {doc.status === 'processed' ? '已处理' : doc.status === 'processing' ? '处理中' : '待处理'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 向量空间可视化 */
                <div className="h-full">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#1A1A1A]">向量空间可视化</h3>
                    <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4A574]" /> 品牌</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A7C59]" /> 案例</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6B6B6B]" /> 法规</span>
                    </div>
                  </div>
                  <div className="relative h-[400px] bg-[#F5F4F0] rounded border border-[#E8E6E1] overflow-hidden">
                    {/* 模拟向量空间 */}
                    <svg className="w-full h-full" viewBox="0 0 400 400">
                      {/* 网格 */}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <line key={`h${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="#E8E6E1" strokeWidth="0.5" />
                      ))}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="#E8E6E1" strokeWidth="0.5" />
                      ))}
                      {/* 向量点 */}
                      {vectorPoints.map((point, i) => (
                        <circle key={i} cx={point.x} cy={point.y} r="3" fill={point.color} opacity="0.6" />
                      ))}
                      {/* 聚类圈 */}
                      <ellipse cx="120" cy="150" rx="60" ry="40" fill="none" stroke="#D4A574" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                      <ellipse cx="280" cy="250" rx="70" ry="50" fill="none" stroke="#4A7C59" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                      <ellipse cx="200" cy="320" rx="50" ry="30" fill="none" stroke="#6B6B6B" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                    </svg>
                    <div className="absolute bottom-3 left-3 text-xs text-[#6B6B6B] bg-white/80 px-2 py-1 rounded">
                      Embedding 模型: {selectedKB.embeddingModel}
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-[#F5F4F0] rounded text-xs text-[#6B6B6B]">
                    <p>💡 向量空间展示了文档分块在语义空间中的分布。相近的点表示语义相似的内容。</p>
                    <p className="mt-1">当前知识库共 {selectedKB.chunkCount.toLocaleString()} 个向量，使用 {selectedKB.embeddingModel} 模型编码。</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 右侧详情 */}
      <div className="w-64 border-l border-[#E8E6E1] flex flex-col">
        {selectedKB && (
          <>
            <div className="p-4 border-b border-[#E8E6E1]">
              <h3 className="text-sm font-medium text-[#1A1A1A]">知识库配置</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">状态</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedKB.status === 'ready' ? 'bg-[#4A7C59]' : 'bg-[#C17B3E] animate-pulse'
                  }`} />
                  <span className="text-sm text-[#1A1A1A]">
                    {selectedKB.status === 'ready' ? '就绪' : '索引中'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">Embedding 模型</div>
                <div className="text-sm text-[#1A1A1A] font-mono">{selectedKB.embeddingModel}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">文档数量</div>
                <div className="text-sm text-[#1A1A1A]">{selectedKB.documentCount}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">分块数量</div>
                <div className="text-sm text-[#1A1A1A]">{selectedKB.chunkCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">存储大小</div>
                <div className="text-sm text-[#1A1A1A]">{selectedKB.size}</div>
              </div>
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">最后更新</div>
                <div className="text-sm text-[#1A1A1A]">{selectedKB.lastUpdated}</div>
              </div>

              <div className="pt-4 border-t border-[#E8E6E1]">
                <div className="text-xs text-[#6B6B6B] mb-2">RAG 流程</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#4A7C59] text-white flex items-center justify-center">✓</span>
                    <span>文档导入</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#4A7C59] text-white flex items-center justify-center">✓</span>
                    <span>智能分块</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#4A7C59] text-white flex items-center justify-center">✓</span>
                    <span>向量化 (Embedding)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#4A7C59] text-white flex items-center justify-center">✓</span>
                    <span>索引存储</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#D4A574] text-white flex items-center justify-center">→</span>
                    <span className="font-medium">语义检索</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
