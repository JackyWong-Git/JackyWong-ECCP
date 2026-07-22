'use client';

import {
  BookOpen,
  Check,
  Database,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Grid3X3,
  HardDrive,
  List,
  Plus,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { showToast } from './toast';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  embeddingModel: string;
  status: 'ready' | 'indexing' | 'error';
  lastUpdated: string;
  size: string;
}

interface DocumentItem {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'md' | 'txt' | 'xlsx' | 'url';
  size: string;
  chunks: number;
  status: 'processed' | 'processing' | 'pending' | 'error';
  uploadedAt: string;
  source: string;
}

const initialKnowledgeBases: KnowledgeBase[] = [
  { id: '1', name: '品牌手册', description: '品牌规范、视觉指南与标准话术', documentCount: 12, chunkCount: 1847, embeddingModel: 'text-embedding-3-small', status: 'ready', lastUpdated: '2 小时前', size: '156 MB' },
  { id: '2', name: '优秀案例库', description: '按渠道和主题沉淀的历史优秀案例', documentCount: 234, chunkCount: 8932, embeddingModel: 'text-embedding-3-small', status: 'ready', lastUpdated: '1 天前', size: '892 MB' },
  { id: '3', name: '法规知识库', description: '广告法、行业法规与合规要求', documentCount: 45, chunkCount: 3421, embeddingModel: 'text-embedding-3-large', status: 'ready', lastUpdated: '3 天前', size: '234 MB' },
  { id: '4', name: '部门报送记录', description: '各部门周报、活动报送与历史记录', documentCount: 260, chunkCount: 5678, embeddingModel: 'text-embedding-3-small', status: 'indexing', lastUpdated: '正在更新', size: '445 MB' },
  { id: '5', name: '渠道规范', description: '各发布渠道的内容规范和最佳实践', documentCount: 28, chunkCount: 1234, embeddingModel: 'text-embedding-3-small', status: 'ready', lastUpdated: '1 周前', size: '89 MB' },
];

const initialDocuments: DocumentItem[] = [
  { id: '1', name: '广汽丰田品牌手册2026.pdf', type: 'pdf', size: '24.5 MB', chunks: 342, status: 'processed', uploadedAt: '2026-07-15', source: '品牌手册' },
  { id: '2', name: '视觉规范指南v3.docx', type: 'docx', size: '8.2 MB', chunks: 156, status: 'processed', uploadedAt: '2026-07-14', source: '品牌手册' },
  { id: '3', name: '话术标准汇编.md', type: 'md', size: '1.2 MB', chunks: 89, status: 'processed', uploadedAt: '2026-07-13', source: '品牌手册' },
  { id: '4', name: '公众号优秀案例合集.pdf', type: 'pdf', size: '45.6 MB', chunks: 567, status: 'processed', uploadedAt: '2026-07-12', source: '优秀案例库' },
  { id: '5', name: '小红书爆款笔记分析.xlsx', type: 'xlsx', size: '3.4 MB', chunks: 234, status: 'processed', uploadedAt: '2026-07-11', source: '优秀案例库' },
  { id: '6', name: '广告法全文.pdf', type: 'pdf', size: '2.1 MB', chunks: 445, status: 'processed', uploadedAt: '2026-07-10', source: '法规知识库' },
  { id: '7', name: '部门周报汇总-7月.xlsx', type: 'xlsx', size: '12.3 MB', chunks: 890, status: 'processing', uploadedAt: '2026-07-21', source: '部门报送记录' },
];

const statusLabel = { ready: '可检索', indexing: '索引中', error: '异常' } as const;

function DocumentIcon({ type }: { type: DocumentItem['type'] }) {
  if (type === 'xlsx') return <FileSpreadsheet className="h-[18px] w-[18px]" strokeWidth={1.7} />;
  if (type === 'url') return <BookOpen className="h-[18px] w-[18px]" strokeWidth={1.7} />;
  return <FileText className="h-[18px] w-[18px]" strokeWidth={1.7} />;
}

export function RAGKnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState(initialKnowledgeBases);
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedId, setSelectedId] = useState(initialKnowledgeBases[0].id);
  const [viewMode, setViewMode] = useState<'list' | 'embedding'>('list');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedKB = knowledgeBases.find(item => item.id === selectedId) ?? knowledgeBases[0];

  const vectorPoints = useMemo(() => {
    const seededRandom = (seed: number) => {
      const value = Math.sin(seed) * 10000;
      return value - Math.floor(value);
    };
    return Array.from({ length: 56 }, (_, index) => ({
      x: 34 + seededRandom(index * 7 + 1) * 332,
      y: 34 + seededRandom(index * 13 + 2) * 292,
      color: index < 22 ? '#5267E8' : index < 40 ? '#23A4C2' : '#7357E6',
    }));
  }, []);

  const visibleDocuments = documents.filter(document => {
    const inKnowledgeBase = document.source === selectedKB.name;
    const matchesQuery = !deferredQuery || `${document.name} ${document.type}`.toLocaleLowerCase().includes(deferredQuery);
    return inKnowledgeBase && matchesQuery;
  });

  const totalDocuments = knowledgeBases.reduce((sum, item) => sum + item.documentCount, 0);
  const totalChunks = knowledgeBases.reduce((sum, item) => sum + item.chunkCount, 0);

  const createKnowledgeBase = () => {
    const next: KnowledgeBase = {
      id: `kb-${Date.now()}`,
      name: `新知识库 ${knowledgeBases.length + 1}`,
      description: '等待上传文件并配置检索策略',
      documentCount: 0,
      chunkCount: 0,
      embeddingModel: 'text-embedding-3-small',
      status: 'ready',
      lastUpdated: '刚刚',
      size: '0 MB',
    };
    setKnowledgeBases(current => [...current, next]);
    setSelectedId(next.id);
    showToast('知识库已创建，可以开始上传文件', 'success');
  };

  const uploadDocument = () => {
    const document: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: '待上传文件.pdf',
      type: 'pdf',
      size: '0 MB',
      chunks: 0,
      status: 'pending',
      uploadedAt: '刚刚',
      source: selectedKB.name,
    };
    setDocuments(current => [document, ...current]);
    setKnowledgeBases(current => current.map(item => item.id === selectedKB.id ? { ...item, documentCount: item.documentCount + 1, lastUpdated: '刚刚' } : item));
    setViewMode('list');
    showToast('已建立上传任务，请选择本地文件', 'success');
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">内容资产</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">文件与知识库</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">统一管理企业资料，并让 AI 的每次回答都有可靠依据。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={createKnowledgeBase} className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE5EA] bg-white px-4 text-[12px] font-semibold text-[#52636E] hover:border-[#BFCBDA]">
              <Plus className="h-4 w-4" /> 新建知识库
            </button>
            <button type="button" onClick={uploadDocument} className="flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]">
              <Upload className="h-4 w-4" /> 上传文件
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            { label: '知识库', value: knowledgeBases.length, detail: `${knowledgeBases.filter(item => item.status === 'ready').length} 个可检索`, icon: Database },
            { label: '文件总数', value: totalDocuments, detail: '跨项目统一管理', icon: FileArchive },
            { label: '语义分块', value: totalChunks.toLocaleString(), detail: '持续自动索引', icon: Sparkles },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="surface-card flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#5267E8]"><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
                <span><span className="block text-[20px] font-semibold tracking-[-0.03em] text-[#263640]">{stat.value}</span><span className="mt-0.5 block text-[10px] text-[#81909B]">{stat.label} · {stat.detail}</span></span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_250px]">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-[#E8EDF1] px-4 py-3">
              <h3 className="text-[12px] font-semibold text-[#35454F]">知识库</h3>
              <p className="mt-1 text-[10px] text-[#8B99A4]">选择一个空间查看文件与配置</p>
            </div>
            <div className="max-h-[570px] space-y-1 overflow-y-auto p-2">
              {knowledgeBases.map((item, index) => {
                const active = item.id === selectedKB.id;
                return (
                  <button key={item.id} type="button" aria-pressed={active} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? 'border-[#C9D1FA] bg-[#F0F2FF]' : 'border-transparent hover:bg-[#F5F8FA]'}`}>
                    <span className="flex items-start gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${index % 3 === 0 ? 'bg-[#E9F7FA] text-[#1994B1]' : index % 3 === 1 ? 'bg-[#EEF1FF] text-[#5267E8]' : 'bg-[#F2EEFF] text-[#7357E6]'}`}><BookOpen className="h-4 w-4" strokeWidth={1.8} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-[#33434D]">{item.name}</span><span className={`h-2 w-2 shrink-0 rounded-full ${item.status === 'ready' ? 'bg-[#25A76F]' : item.status === 'indexing' ? 'animate-pulse bg-[#E1A04D]' : 'bg-[#D95B61]'}`} /></span>
                        <span className="mt-1 block truncate text-[9px] text-[#85949F]">{item.description}</span>
                        <span className="mt-2 block text-[9px] text-[#73838E]">{item.documentCount} 文件 · {item.chunkCount.toLocaleString()} 分块</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="surface-card min-w-0 overflow-hidden">
            <div className="border-b border-[#E8EDF1] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h3 className="truncate text-[16px] font-semibold text-[#263640]">{selectedKB.name}</h3><span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${selectedKB.status === 'ready' ? 'bg-[#EAF7F1] text-[#21865D]' : 'bg-[#FFF4E6] text-[#B36F27]'}`}>{statusLabel[selectedKB.status]}</span></div>
                  <p className="mt-1 text-[10px] text-[#81909B]">{selectedKB.description}</p>
                </div>
                <div className="flex shrink-0 rounded-xl bg-[#F1F4F7] p-1">
                  <button type="button" aria-label="文件列表" onClick={() => setViewMode('list')} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold ${viewMode === 'list' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#7D8D98]'}`}><List className="h-3.5 w-3.5" />文件</button>
                  <button type="button" aria-label="向量空间" onClick={() => setViewMode('embedding')} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold ${viewMode === 'embedding' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#7D8D98]'}`}><Grid3X3 className="h-3.5 w-3.5" />向量</button>
                </div>
              </div>
              <label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 focus-within:border-[#B8C4F5] focus-within:bg-white">
                <Search className="h-4 w-4 text-[#82919C]" />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="在当前知识库中搜索文件或语义片段" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#4D5E69] outline-none placeholder:text-[#9AA7B0]" />
              </label>
            </div>

            {viewMode === 'list' ? (
              <div className="divide-y divide-[#EDF1F4]">
                {visibleDocuments.map(document => (
                  <button key={document.id} type="button" onClick={() => showToast(`已打开 ${document.name}`, 'info')} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#FAFBFE]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#5267E8]"><DocumentIcon type={document.type} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#35454F]">{document.name}</span><span className="mt-1 block text-[9px] text-[#85949F]">{document.size} · {document.chunks} 分块 · {document.uploadedAt}</span></span>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-semibold ${document.status === 'processed' ? 'bg-[#EAF7F1] text-[#21865D]' : document.status === 'processing' ? 'bg-[#FFF4E6] text-[#B36F27]' : 'bg-[#EEF2F5] text-[#657682]'}`}>{document.status === 'processed' ? '已索引' : document.status === 'processing' ? '处理中' : '待上传'}</span>
                  </button>
                ))}
                {!visibleDocuments.length ? <div className="flex flex-col items-center px-5 py-16 text-center"><Search className="h-7 w-7 text-[#B5C0C8]" /><p className="mt-3 text-[11px] font-semibold text-[#667985]">当前条件下没有文件</p><p className="mt-1 text-[10px] text-[#95A2AC]">清除搜索，或上传一个新文件</p></div> : null}
              </div>
            ) : (
              <div className="p-4">
                <div className="relative overflow-hidden rounded-2xl border border-[#E4EAF0] bg-[linear-gradient(145deg,#F7F9FF,#F0F8FA)]">
                  <svg className="h-[360px] w-full" viewBox="0 0 400 360" role="img" aria-label="知识库向量聚类分布图">
                    {Array.from({ length: 10 }, (_, index) => <line key={`h-${index}`} x1="0" y1={index * 40} x2="400" y2={index * 40} stroke="#DDE6ED" strokeWidth="0.6" />)}
                    {Array.from({ length: 10 }, (_, index) => <line key={`v-${index}`} x1={index * 40} y1="0" x2={index * 40} y2="360" stroke="#DDE6ED" strokeWidth="0.6" />)}
                    {vectorPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3.3" fill={point.color} opacity="0.72" />)}
                    <ellipse cx="115" cy="130" rx="64" ry="44" fill="none" stroke="#5267E8" strokeDasharray="5" opacity="0.45" />
                    <ellipse cx="285" cy="225" rx="72" ry="52" fill="none" stroke="#23A4C2" strokeDasharray="5" opacity="0.45" />
                  </svg>
                  <span className="absolute bottom-3 left-3 rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 text-[9px] font-medium text-[#667985] shadow-sm">模型：{selectedKB.embeddingModel}</span>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-[#71818D]">距离越近的点代表内容语义越相似，可用于检查资料聚类、重复内容与检索覆盖。</p>
              </div>
            )}
          </section>

          <aside className="surface-card h-fit p-4">
            <h3 className="text-[12px] font-semibold text-[#35454F]">索引配置</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: '状态', value: statusLabel[selectedKB.status] },
                { label: 'Embedding 模型', value: selectedKB.embeddingModel },
                { label: '存储大小', value: selectedKB.size },
                { label: '最后更新', value: selectedKB.lastUpdated },
              ].map(item => <div key={item.label} className="rounded-xl bg-[#F7F9FB] p-3"><span className="block text-[9px] text-[#8A99A4]">{item.label}</span><span className="mt-1 block break-all text-[10px] font-semibold text-[#455660]">{item.value}</span></div>)}
            </div>
            <div className="mt-5 border-t border-[#E8EDF1] pt-4">
              <p className="text-[10px] font-semibold text-[#60707D]">RAG 处理流程</p>
              <div className="mt-3 space-y-3">
                {['文档导入', '智能分块', '向量化', '索引存储'].map(step => <div key={step} className="flex items-center gap-2 text-[10px] text-[#61727E]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F1] text-[#21865D]"><Check className="h-3 w-3" /></span>{step}</div>)}
                <div className="flex items-center gap-2 text-[10px] font-semibold text-[#5267E8]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF1FF]"><Search className="h-3 w-3" /></span>语义检索</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#EEF8FA] p-3 text-[9px] leading-5 text-[#4D717B]"><HardDrive className="h-4 w-4 shrink-0 text-[#23A4C2]" />资料保留在企业工作区，调用时自动记录引用来源。</div>
          </aside>
        </div>
      </div>
    </div>
  );
}
