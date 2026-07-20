'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';

type ContentView = 'list' | 'kanban' | 'calendar';
type StatusFilter = 'all' | 'draft' | 'review' | 'scheduled' | 'published';

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author: string;
  date: string;
  category: string;
  excerpt: string;
  wordCount: number;
}

const mockArticles: Article[] = [
  { id: '1', title: '2025 年内容创作趋势报告', status: 'published', author: '张明', date: '2025-07-18', category: '行业洞察', excerpt: '深度解析内容创作领域的五大趋势变化...', wordCount: 3200 },
  { id: '2', title: '如何构建高效的内容工作流', status: 'review', author: '李华', date: '2025-07-19', category: '方法论', excerpt: '从选题到发布，一套经过验证的内容生产流程...', wordCount: 2800 },
  { id: '3', title: 'AI 辅助写作的边界与伦理', status: 'draft', author: '王芳', date: '2025-07-20', category: '观点', excerpt: '当 AI 成为写作助手，创作者的角色如何演变...', wordCount: 1500 },
  { id: '4', title: '视频脚本写作的 10 个技巧', status: 'scheduled', author: '赵强', date: '2025-07-21', category: '教程', excerpt: '从开头 Hook 到结尾 CTA，视频脚本的核心要素...', wordCount: 2100 },
  { id: '5', title: '知识库搭建实战指南', status: 'draft', author: '陈静', date: '2025-07-20', category: '教程', excerpt: '如何从零开始搭建团队知识库，提升协作效率...', wordCount: 1800 },
  { id: '6', title: '内容分发渠道对比分析', status: 'review', author: '张明', date: '2025-07-22', category: '行业洞察', excerpt: '微信公众号、小红书、B站、抖音的内容适配策略...', wordCount: 2600 },
  { id: '7', title: '深度长文的排版美学', status: 'scheduled', author: '李华', date: '2025-07-23', category: '设计', excerpt: '字体、间距、配图：让长文阅读成为享受...', wordCount: 1900 },
  { id: '8', title: '从 0 到 1 的内容团队搭建', status: 'draft', author: '王芳', date: '2025-07-24', category: '管理', excerpt: '内容团队的组织架构、角色分工与协作模式...', wordCount: 900 },
  { id: '9', title: '短视频文案的黄金结构', status: 'published', author: '赵强', date: '2025-07-15', category: '教程', excerpt: '3 秒抓住注意力：短视频文案的核心框架...', wordCount: 1600 },
  { id: '10', title: '内容运营的 data-driven 方法论', status: 'review', author: '陈静', date: '2025-07-25', category: '方法论', excerpt: '用数据驱动内容决策，提升 ROI 的实践指南...', wordCount: 2200 },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#6B6B6B', bg: '#F0EDE8' },
  review: { label: '审核中', color: '#C17B3E', bg: '#FFF3E0' },
  scheduled: { label: '已排期', color: '#6B8FA3', bg: '#E8F0F5' },
  published: { label: '已发布', color: '#4A7C59', bg: '#E8F2EB' },
};

export function ContentDashboard() {
  const [view, setView] = useState<ContentView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = mockArticles.filter((a) => {
    const matchSearch = !searchQuery || a.title.includes(searchQuery) || a.author.includes(searchQuery) || a.category.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: mockArticles.length,
    draft: mockArticles.filter((a) => a.status === 'draft').length,
    review: mockArticles.filter((a) => a.status === 'review').length,
    published: mockArticles.filter((a) => a.status === 'published').length,
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif", color: '#1A1A1A' }}>
            内容管理
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>管理你的所有内容，从选题到发布</p>
        </div>
        <button
          className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-150"
          style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C49564'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D4A574'; }}
          onClick={() => showToast('新文章已创建', 'success')}
        >
          + 新建内容
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: '全部内容', value: stats.total, color: '#1A1A1A', bg: '#FFFFFF', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg> },
          { label: '草稿', value: stats.draft, color: '#6B6B6B', bg: '#FFFFFF', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg> },
          { label: '审核中', value: stats.review, color: '#C17B3E', bg: '#FFFFFF', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
          { label: '已发布', value: stats.published, color: '#4A7C59', bg: '#FFFFFF', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6 9 17l-5-5" /></svg> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border p-3.5 transition-all duration-150 cursor-pointer"
            style={{ borderColor: '#E8E6E1', backgroundColor: stat.bg }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>{stat.label}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-semibold" style={{ color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-md text-sm border outline-none transition-all w-52"
              style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A574'; e.currentTarget.style.width = '280px'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; e.currentTarget.style.width = '208px'; }}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-0.5">
            {([
              { id: 'all' as StatusFilter, label: '全部' },
              { id: 'draft' as StatusFilter, label: '草稿' },
              { id: 'review' as StatusFilter, label: '审核中' },
              { id: 'scheduled' as StatusFilter, label: '已排期' },
              { id: 'published' as StatusFilter, label: '已发布' },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className="px-2.5 py-1 rounded text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: statusFilter === f.id ? '#1A1A1A' : 'transparent',
                  color: statusFilter === f.id ? '#FAFAF8' : '#6B6B6B',
                }}
                onMouseEnter={(e) => { if (statusFilter !== f.id) e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
                onMouseLeave={(e) => { if (statusFilter !== f.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1 mr-2 animate-slide-up">
              <span className="text-xs" style={{ color: '#6B6B6B' }}>已选 {selectedIds.size} 项</span>
              <button
                className="px-2 py-1 rounded text-xs border transition-colors"
                style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}
                onClick={() => { showToast(`已批量移动 ${selectedIds.size} 篇文章`, 'success'); setSelectedIds(new Set()); }}
              >
                移动
              </button>
              <button
                className="px-2 py-1 rounded text-xs border transition-colors"
                style={{ borderColor: '#E8E6E1', color: '#A64D4D' }}
                onClick={() => { showToast(`已删除 ${selectedIds.size} 篇文章`, 'error'); setSelectedIds(new Set()); }}
              >
                删除
              </button>
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
            {([
              { id: 'list' as ContentView, label: '列表', icon: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></> },
              { id: 'kanban' as ContentView, label: '看板', icon: <><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="12" rx="1" /></> },
              { id: 'calendar' as ContentView, label: '日历', icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
            ]).map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: view === v.id ? '#FFFFFF' : 'transparent',
                  color: view === v.id ? '#1A1A1A' : '#6B6B6B',
                  boxShadow: view === v.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{v.icon}</svg>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'list' && <ListView articles={filtered} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} />}
      {view === 'kanban' && <KanbanView articles={mockArticles} />}
      {view === 'calendar' && <CalendarView articles={mockArticles} />}
    </div>
  );
}

function ListView({
  articles,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  articles: Article[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}>
      {/* Table header */}
      <div className="grid grid-cols-[32px_1fr_90px_80px_90px_70px_60px] gap-3 px-4 py-2 border-b text-xs font-medium" style={{ borderColor: '#E8E6E1', backgroundColor: '#F9F8F6', color: '#6B6B6B' }}>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedIds.size > 0 && selectedIds.size === articles.length}
            onChange={onToggleSelectAll}
            className="w-3.5 h-3.5 rounded border cursor-pointer accent-[#D4A574]"
            style={{ borderColor: '#D4D0C8' }}
          />
        </div>
        <span>标题</span>
        <span>状态</span>
        <span>作者</span>
        <span>分类</span>
        <span>字数</span>
        <span>操作</span>
      </div>
      {/* Table body */}
      {articles.map((article) => {
        const isSelected = selectedIds.has(article.id);
        return (
          <div
            key={article.id}
            className="group grid grid-cols-[32px_1fr_90px_80px_90px_70px_60px] gap-3 px-4 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors duration-100"
            style={{
              borderColor: '#F0EDE8',
              backgroundColor: isSelected ? '#FFFDF9' : 'transparent',
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(article.id)}
                className="w-3.5 h-3.5 rounded border cursor-pointer accent-[#D4A574]"
                style={{ borderColor: '#D4D0C8' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{article.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: '#9A9A9A' }}>{article.excerpt}</p>
            </div>
            <div className="flex items-center">
              <span
                className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ color: statusConfig[article.status].color, backgroundColor: statusConfig[article.status].bg }}
              >
                {statusConfig[article.status].label}
              </span>
            </div>
            <span className="text-xs flex items-center" style={{ color: '#6B6B6B' }}>{article.author}</span>
            <span className="text-xs flex items-center" style={{ color: '#6B6B6B' }}>{article.category}</span>
            <span className="text-xs flex items-center" style={{ color: '#9A9A9A', fontFamily: "'JetBrains Mono', monospace" }}>{article.wordCount.toLocaleString()}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1 rounded transition-colors"
                style={{ color: '#6B6B6B' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                onClick={(e) => { e.stopPropagation(); showToast('已复制链接', 'info'); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
              </button>
              <button
                className="p-1 rounded transition-colors"
                style={{ color: '#6B6B6B' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                onClick={(e) => { e.stopPropagation(); showToast('文章已复制', 'success'); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect width="8" height="4" x="8" y="2" rx="1" /></svg>
              </button>
            </div>
          </div>
        );
      })}
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t text-xs" style={{ borderColor: '#E8E6E1', backgroundColor: '#F9F8F6', color: '#6B6B6B' }}>
        <span>共 {articles.length} 篇文章</span>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 rounded border transition-colors" style={{ borderColor: '#E8E6E1' }}>上一页</button>
          <button className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#1A1A1A', color: '#FAFAF8' }}>1</button>
          <button className="px-2 py-1 rounded border transition-colors" style={{ borderColor: '#E8E6E1' }}>2</button>
          <button className="px-2 py-1 rounded border transition-colors" style={{ borderColor: '#E8E6E1' }}>下一页</button>
        </div>
      </div>
    </div>
  );
}

function KanbanView({ articles }: { articles: Article[] }) {
  const columns = [
    { id: 'draft', label: '草稿', items: articles.filter((a) => a.status === 'draft') },
    { id: 'review', label: '审核中', items: articles.filter((a) => a.status === 'review') },
    { id: 'scheduled', label: '已排期', items: articles.filter((a) => a.status === 'scheduled') },
    { id: 'published', label: '已发布', items: articles.filter((a) => a.status === 'published') },
  ];

  const columnColors: Record<string, string> = {
    draft: '#6B6B6B',
    review: '#C17B3E',
    scheduled: '#6B8FA3',
    published: '#4A7C59',
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {columns.map((col) => (
        <div key={col.id} className="rounded-lg p-3" style={{ backgroundColor: '#F5F3EF' }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: columnColors[col.id] }} />
              <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>{col.label}</span>
            </div>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#E8E6E1', color: '#6B6B6B' }}>{col.items.length}</span>
          </div>
          <div className="space-y-2">
            {col.items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-md border cursor-pointer transition-all duration-150 group"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E6E1' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>{item.title}</p>
                <p className="text-xs line-clamp-2 mb-2" style={{ color: '#6B6B6B' }}>{item.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B', fontSize: '8px' }}>
                      {item.author[0]}
                    </div>
                    <span className="text-xs" style={{ color: '#9A9A9A' }}>{item.author}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#9A9A9A', fontFamily: "'JetBrains Mono', monospace" }}>{item.wordCount >= 1000 ? `${(item.wordCount / 1000).toFixed(1)}k` : item.wordCount}</span>
                </div>
              </div>
            ))}
            {/* Add card button */}
            <button
              className="w-full py-2 rounded-md border border-dashed text-xs font-medium transition-colors flex items-center justify-center gap-1"
              style={{ borderColor: '#D4D0C8', color: '#9A9A9A' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4A574'; e.currentTarget.style.color = '#D4A574'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D4D0C8'; e.currentTarget.style.color = '#9A9A9A'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
              添加
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ articles }: { articles: Article[] }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const articlesByDay: Record<number, Article[]> = {};
  articles.forEach((a) => {
    const day = parseInt(a.date.split('-')[2]);
    if (!articlesByDay[day]) articlesByDay[day] = [];
    articlesByDay[day].push(a);
  });

  const statusDot: Record<string, string> = {
    draft: '#6B6B6B',
    review: '#C17B3E',
    scheduled: '#6B8FA3',
    published: '#4A7C59',
  };

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
        <div className="flex items-center gap-3">
          <button className="p-1 rounded transition-colors" style={{ color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>2025 年 7 月</h3>
          <button className="p-1 rounded transition-colors" style={{ color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 18 6-6-6-6" /></svg>
          </button>
          <button className="px-2 py-0.5 rounded text-xs border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4A574'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
          >
            今天
          </button>
        </div>
        <div className="flex items-center gap-3">
          {Object.entries(statusDot).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs" style={{ color: '#6B6B6B' }}>{statusConfig[key].label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium border-b" style={{ color: '#6B6B6B', borderColor: '#E8E6E1' }}>
            {d}
          </div>
        ))}
        {/* July 2025 starts on Tuesday (offset 1) */}
        <div key="empty-0" className="min-h-[88px] border-b border-r p-1" style={{ borderColor: '#F0EDE8' }} />
        {days.map((day) => {
          const isToday = day === 20;
          return (
            <div
              key={day}
              className="min-h-[88px] border-b border-r p-1.5 transition-colors"
              style={{ borderColor: '#F0EDE8' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: isToday ? '#D4A574' : 'transparent',
                  color: isToday ? '#FFFFFF' : '#1A1A1A',
                }}
              >
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {(articlesByDay[day] || []).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate cursor-pointer transition-colors"
                    style={{ backgroundColor: statusConfig[a.status].bg, color: statusConfig[a.status].color }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: statusDot[a.status] }} />
                    <span className="truncate">{a.title.length > 6 ? a.title.slice(0, 6) + '...' : a.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
