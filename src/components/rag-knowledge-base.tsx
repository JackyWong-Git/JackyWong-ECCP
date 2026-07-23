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
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { type DocumentApiItem, type KnowledgeBaseApiItem, type SearchApiItem } from '@/lib/eccp-api-types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from './toast';

type ApiState = 'loading' | 'ready' | 'unavailable';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const payload = await response.json() as T & { detail?: string; error?: string };
  if (!response.ok) throw new Error(payload.detail || payload.error || '请求失败');
  return payload;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function DocumentIcon({ document }: { document: DocumentApiItem }) {
  if (document.name.toLowerCase().endsWith('.xlsx')) return <FileSpreadsheet className="h-[18px] w-[18px]" strokeWidth={1.7} />;
  return <FileText className="h-[18px] w-[18px]" strokeWidth={1.7} />;
}

const statusLabel = { ready: '可检索', indexing: '索引中', error: '异常' } as const;
const documentStatusLabel = { queued: '排队中', processing: '索引中', processed: '已索引', error: '失败' } as const;

export function RAGKnowledgeBase() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseApiItem[]>([]);
  const [documents, setDocuments] = useState<DocumentApiItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'embedding'>('list');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchApiItem[] | null>(null);
  const [apiState, setApiState] = useState<ApiState>('loading');
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [semanticSearching, setSemanticSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedKB = knowledgeBases.find(item => item.id === selectedId);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const payload = await requestJson<{ items: KnowledgeBaseApiItem[] }>('/api/backend/v1/knowledge-bases', { signal: controller.signal });
        setKnowledgeBases(payload.items);
        setSelectedId(current => current && payload.items.some(item => item.id === current) ? current : payload.items[0]?.id || '');
        setApiState('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setApiState('unavailable');
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDocuments([]);
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      setDocumentsLoading(true);
      try {
        const payload = await requestJson<{ items: DocumentApiItem[] }>(`/api/backend/v1/knowledge-bases/${selectedId}/documents`);
        if (!active) return;
        setDocuments(payload.items);
        setDocumentsLoading(false);
        if (payload.items.some(item => item.status === 'queued' || item.status === 'processing')) {
          timer = setTimeout(load, 2500);
        } else {
          const bases = await requestJson<{ items: KnowledgeBaseApiItem[] }>('/api/backend/v1/knowledge-bases');
          if (active) setKnowledgeBases(bases.items);
        }
      } catch (error) {
        if (!active) return;
        setDocumentsLoading(false);
        showToast((error as Error).message, 'error');
      }
    }
    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [selectedId]);

  const vectorPoints = useMemo(() => Array.from({ length: 56 }, (_, index) => {
    const seeded = (seed: number) => {
      const value = Math.sin(seed) * 10000;
      return value - Math.floor(value);
    };
    return {
      x: 34 + seeded(index * 7 + 1) * 332,
      y: 34 + seeded(index * 13 + 2) * 292,
      color: index < 22 ? '#5267E8' : index < 40 ? '#23A4C2' : '#7357E6',
    };
  }), []);

  const visibleDocuments = documents.filter(document => !deferredQuery || document.name.toLocaleLowerCase().includes(deferredQuery));
  const totalDocuments = knowledgeBases.reduce((sum, item) => sum + item.document_count, 0);
  const totalChunks = knowledgeBases.reduce((sum, item) => sum + item.chunk_count, 0);

  async function refreshKnowledgeBases(preferredId?: string) {
    const payload = await requestJson<{ items: KnowledgeBaseApiItem[] }>('/api/backend/v1/knowledge-bases');
    setKnowledgeBases(payload.items);
    setSelectedId(preferredId || selectedId || payload.items[0]?.id || '');
  }

  async function createKnowledgeBase() {
    if (newName.trim().length < 2) {
      showToast('知识库名称至少需要 2 个字符', 'error');
      return;
    }
    setCreating(true);
    try {
      const created = await requestJson<KnowledgeBaseApiItem>('/api/backend/v1/knowledge-bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
      });
      await refreshKnowledgeBases(created.id);
      setCreateOpen(false);
      setNewName('');
      setNewDescription('');
      showToast('知识库已创建，可以开始上传文件', 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function uploadDocument(file: File) {
    if (!selectedKB) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const document = await requestJson<DocumentApiItem>(`/api/backend/v1/knowledge-bases/${selectedKB.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      setDocuments(current => [document, ...current]);
      await refreshKnowledgeBases(selectedKB.id);
      setViewMode('list');
      showToast('文件已上传，正在提取内容并建立索引', 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function semanticSearch() {
    if (!selectedKB || query.trim().length < 2) {
      showToast('请输入至少 2 个字符再进行语义检索', 'info');
      return;
    }
    setSemanticSearching(true);
    try {
      const payload = await requestJson<{ items: SearchApiItem[] }>(`/api/backend/v1/knowledge-bases/${selectedKB.id}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), top_k: 8 }),
      });
      setSearchResults(payload.items);
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setSemanticSearching(false);
    }
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">内容资产</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">文件与知识库</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">文件进入对象存储，内容经 pgvector 建立索引，并保留可追溯引用。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setCreateOpen(true)} className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE5EA] bg-white px-4 text-[12px] font-semibold text-[#52636E] hover:border-[#BFCBDA]">
              <Plus className="h-4 w-4" /> 新建知识库
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.md,.txt,.csv,.json" onChange={event => event.target.files?.[0] && void uploadDocument(event.target.files[0])} />
            <button type="button" disabled={!selectedKB || uploading} onClick={() => fileInputRef.current?.click()} className="flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)] disabled:cursor-not-allowed disabled:opacity-50">
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? '上传中' : '上传文件'}
            </button>
          </div>
        </div>

        {apiState === 'unavailable' ? (
          <div className="mt-5 rounded-2xl border border-[#F1D4B7] bg-[#FFF8F1] px-5 py-4 text-[11px] text-[#9A612A]">FastAPI 业务服务暂时不可用。请启动 `pnpm dev:api` 后刷新页面。</div>
        ) : null}

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            { label: '知识库', value: knowledgeBases.length, detail: `${knowledgeBases.filter(item => item.status === 'ready').length} 个可检索`, icon: Database },
            { label: '文件总数', value: totalDocuments, detail: '对象存储统一管理', icon: FileArchive },
            { label: '语义分块', value: totalChunks.toLocaleString(), detail: 'pgvector 向量索引', icon: Sparkles },
          ].map(stat => {
            const Icon = stat.icon;
            return <div key={stat.label} className="surface-card flex items-center gap-4 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#5267E8]"><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span><span><span className="block text-[20px] font-semibold tracking-[-0.03em] text-[#263640]">{stat.value}</span><span className="mt-0.5 block text-[10px] text-[#81909B]">{stat.label} · {stat.detail}</span></span></div>;
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_250px]">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-[#E8EDF1] px-4 py-3"><h3 className="text-[12px] font-semibold text-[#35454F]">知识库</h3><p className="mt-1 text-[10px] text-[#8B99A4]">选择空间查看文件与索引状态</p></div>
            <div className="max-h-[570px] space-y-1 overflow-y-auto p-2">
              {apiState === 'loading' ? <div className="flex items-center justify-center gap-2 py-12 text-[10px] text-[#81909B]"><LoaderCircle className="h-4 w-4 animate-spin" />加载知识库</div> : null}
              {apiState === 'ready' && knowledgeBases.length === 0 ? <div className="px-4 py-12 text-center"><BookOpen className="mx-auto h-7 w-7 text-[#B5C0C8]" /><p className="mt-3 text-[11px] font-semibold text-[#667985]">还没有知识库</p><button type="button" onClick={() => setCreateOpen(true)} className="mt-3 text-[10px] font-semibold text-[#5267E8]">创建第一个知识库</button></div> : null}
              {knowledgeBases.map((item, index) => {
                const active = item.id === selectedId;
                return <button key={item.id} type="button" aria-pressed={active} onClick={() => { setSelectedId(item.id); setSearchResults(null); setQuery(''); }} className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? 'border-[#C9D1FA] bg-[#F0F2FF]' : 'border-transparent hover:bg-[#F5F8FA]'}`}><span className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${index % 3 === 0 ? 'bg-[#E9F7FA] text-[#1994B1]' : index % 3 === 1 ? 'bg-[#EEF1FF] text-[#5267E8]' : 'bg-[#F2EEFF] text-[#7357E6]'}`}><BookOpen className="h-4 w-4" strokeWidth={1.8} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-[#33434D]">{item.name}</span><span className={`h-2 w-2 shrink-0 rounded-full ${item.status === 'ready' ? 'bg-[#25A76F]' : item.status === 'indexing' ? 'animate-pulse bg-[#E1A04D]' : 'bg-[#D95B61]'}`} /></span><span className="mt-1 block truncate text-[9px] text-[#85949F]">{item.description || '暂无说明'}</span><span className="mt-2 block text-[9px] text-[#73838E]">{item.document_count} 文件 · {item.chunk_count.toLocaleString()} 分块</span></span></span></button>;
              })}
            </div>
          </section>

          <section className="surface-card min-w-0 overflow-hidden">
            <div className="border-b border-[#E8EDF1] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-[16px] font-semibold text-[#263640]">{selectedKB?.name || '选择知识库'}</h3>{selectedKB ? <span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${selectedKB.status === 'ready' ? 'bg-[#EAF7F1] text-[#21865D]' : 'bg-[#FFF4E6] text-[#B36F27]'}`}>{statusLabel[selectedKB.status]}</span> : null}</div><p className="mt-1 text-[10px] text-[#81909B]">{selectedKB?.description || '创建知识库后即可上传企业资料'}</p></div>
                <div className="flex shrink-0 rounded-xl bg-[#F1F4F7] p-1"><button type="button" onClick={() => setViewMode('list')} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold ${viewMode === 'list' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#7D8D98]'}`}><List className="h-3.5 w-3.5" />文件</button><button type="button" onClick={() => setViewMode('embedding')} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold ${viewMode === 'embedding' ? 'bg-white text-[#5267E8] shadow-sm' : 'text-[#7D8D98]'}`}><Grid3X3 className="h-3.5 w-3.5" />向量</button></div>
              </div>
              <div className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 focus-within:border-[#B8C4F5] focus-within:bg-white"><Search className="h-4 w-4 text-[#82919C]" /><input value={query} onChange={event => { setQuery(event.target.value); setSearchResults(null); }} onKeyDown={event => { if (event.key === 'Enter') void semanticSearch(); }} placeholder="输入问题，回车进行语义检索" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#4D5E69] outline-none placeholder:text-[#9AA7B0]" /><button type="button" disabled={semanticSearching || !selectedKB} onClick={() => void semanticSearch()} className="rounded-lg bg-[#EEF1FF] px-2.5 py-1.5 text-[9px] font-semibold text-[#5267E8] disabled:opacity-50">{semanticSearching ? '检索中' : '语义检索'}</button></div>
            </div>

            {viewMode === 'list' ? (
              <div className="divide-y divide-[#EDF1F4]">
                {searchResults?.map(result => <div key={result.chunk_id} className="px-4 py-4"><div className="flex items-center justify-between gap-3"><span className="truncate text-[10px] font-semibold text-[#5267E8]">{result.document_name} · 分块 {result.ordinal + 1}</span><span className="shrink-0 rounded-lg bg-[#EAF7F1] px-2 py-1 text-[9px] font-semibold text-[#21865D]">相关度 {(result.score * 100).toFixed(0)}%</span></div><p className="mt-2 line-clamp-4 text-[10px] leading-5 text-[#61727E]">{result.content}</p></div>)}
                {searchResults && searchResults.length === 0 ? <div className="px-5 py-16 text-center text-[10px] text-[#85949F]">没有找到相关语义片段，请换一种问法。</div> : null}
                {!searchResults && visibleDocuments.map(document => <button key={document.id} type="button" onClick={() => showToast(document.error_message || `${document.name} 已进入内容资产库`, document.status === 'error' ? 'error' : 'info')} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#FAFBFE]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF1FF] text-[#5267E8]"><DocumentIcon document={document} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#35454F]">{document.name}</span><span className="mt-1 block text-[9px] text-[#85949F]">{formatBytes(document.size_bytes)} · {document.chunk_count} 分块 · {formatDate(document.created_at)}</span></span><span className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-semibold ${document.status === 'processed' ? 'bg-[#EAF7F1] text-[#21865D]' : document.status === 'error' ? 'bg-[#FFF0F0] text-[#C34E55]' : 'bg-[#FFF4E6] text-[#B36F27]'}`}>{documentStatusLabel[document.status]}</span></button>)}
                {!searchResults && !visibleDocuments.length && !documentsLoading ? <div className="flex flex-col items-center px-5 py-16 text-center"><Search className="h-7 w-7 text-[#B5C0C8]" /><p className="mt-3 text-[11px] font-semibold text-[#667985]">{documents.length ? '当前条件下没有文件' : '知识库还是空的'}</p><p className="mt-1 text-[10px] text-[#95A2AC]">{documents.length ? '清除搜索条件后重试' : '上传 PDF、Word、Excel 或文本文件开始索引'}</p></div> : null}
                {documentsLoading && !documents.length ? <div className="flex items-center justify-center gap-2 py-16 text-[10px] text-[#81909B]"><LoaderCircle className="h-4 w-4 animate-spin" />读取文件</div> : null}
              </div>
            ) : (
              <div className="p-4"><div className="relative overflow-hidden rounded-2xl border border-[#E4EAF0] bg-[linear-gradient(145deg,#F7F9FF,#F0F8FA)]"><svg className="h-[360px] w-full" viewBox="0 0 400 360" role="img" aria-label="知识库向量聚类分布图">{Array.from({ length: 10 }, (_, index) => <line key={`h-${index}`} x1="0" y1={index * 40} x2="400" y2={index * 40} stroke="#DDE6ED" strokeWidth="0.6" />)}{Array.from({ length: 10 }, (_, index) => <line key={`v-${index}`} x1={index * 40} y1="0" x2={index * 40} y2="360" stroke="#DDE6ED" strokeWidth="0.6" />)}{vectorPoints.slice(0, Math.min(vectorPoints.length, Math.max(totalChunks, 8))).map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3.3" fill={point.color} opacity="0.72" />)}</svg><span className="absolute bottom-3 left-3 rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 text-[9px] font-medium text-[#667985] shadow-sm">模型：{selectedKB?.embedding_model || '等待配置'}</span></div><p className="mt-3 text-[10px] leading-5 text-[#71818D]">这里展示当前知识库的向量分布概览；正式聚类可继续接入 UMAP 降维任务。</p></div>
            )}
          </section>

          <aside className="surface-card h-fit p-4"><h3 className="text-[12px] font-semibold text-[#35454F]">索引配置</h3><div className="mt-4 space-y-3">{[
            { label: '状态', value: selectedKB ? statusLabel[selectedKB.status] : '未选择' },
            { label: 'Embedding 模型', value: selectedKB?.embedding_model || '未配置' },
            { label: '存储大小', value: formatBytes(selectedKB?.size_bytes || 0) },
            { label: '最后更新', value: selectedKB ? formatDate(selectedKB.updated_at) : '-' },
          ].map(item => <div key={item.label} className="rounded-xl bg-[#F7F9FB] p-3"><span className="block text-[9px] text-[#8A99A4]">{item.label}</span><span className="mt-1 block break-all text-[10px] font-semibold text-[#455660]">{item.value}</span></div>)}</div><div className="mt-5 border-t border-[#E8EDF1] pt-4"><p className="text-[10px] font-semibold text-[#60707D]">RAG 处理流程</p><div className="mt-3 space-y-3">{['对象存储', '智能分块', '向量化', 'pgvector 索引'].map(step => <div key={step} className="flex items-center gap-2 text-[10px] text-[#61727E]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F1] text-[#21865D]"><Check className="h-3 w-3" /></span>{step}</div>)}<div className="flex items-center gap-2 text-[10px] font-semibold text-[#5267E8]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF1FF]"><Search className="h-3 w-3" /></span>语义检索</div></div></div><div className="mt-5 flex items-center gap-2 rounded-xl bg-[#EEF8FA] p-3 text-[9px] leading-5 text-[#4D717B]"><HardDrive className="h-4 w-4 shrink-0 text-[#23A4C2]" />资料原文件与向量索引分离保存，便于权限控制、备份和重新索引。</div></aside>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[460px]"><DialogHeader><DialogTitle>新建知识库</DialogTitle><DialogDescription>按业务主题建立独立检索空间，后续可分别配置权限和召回策略。</DialogDescription></DialogHeader><div className="space-y-4 py-2"><label className="block space-y-2 text-[11px] font-semibold text-[#455660]">知识库名称<Input value={newName} onChange={event => setNewName(event.target.value)} placeholder="例如：企业文化制度与品牌规范" /></label><label className="block space-y-2 text-[11px] font-semibold text-[#455660]">用途说明<Textarea value={newDescription} onChange={event => setNewDescription(event.target.value)} placeholder="说明资料范围和主要使用场景" rows={4} /></label></div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button><Button disabled={creating} onClick={() => void createKnowledgeBase()}>{creating ? <LoaderCircle className="animate-spin" /> : null}创建知识库</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
