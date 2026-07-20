'use client';

import { useState } from 'react';

type ContentView = 'list' | 'kanban' | 'calendar';

interface Article {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author: string;
  date: string;
  category: string;
  excerpt: string;
}

const mockArticles: Article[] = [
  { id: '1', title: '2025 年内容创作趋势报告', status: 'published', author: '张明', date: '2025-07-18', category: '行业洞察', excerpt: '深度解析内容创作领域的五大趋势变化...' },
  { id: '2', title: '如何构建高效的内容工作流', status: 'review', author: '李华', date: '2025-07-19', category: '方法论', excerpt: '从选题到发布，一套经过验证的内容生产流程...' },
  { id: '3', title: 'AI 辅助写作的边界与伦理', status: 'draft', author: '王芳', date: '2025-07-20', category: '观点', excerpt: '当 AI 成为写作助手，创作者的角色如何演变...' },
  { id: '4', title: '视频脚本写作的 10 个技巧', status: 'scheduled', author: '赵强', date: '2025-07-21', category: '教程', excerpt: '从开头 Hook 到结尾 CTA，视频脚本的核心要素...' },
  { id: '5', title: '知识库搭建实战指南', status: 'draft', author: '陈静', date: '2025-07-20', category: '教程', excerpt: '如何从零开始搭建团队知识库，提升协作效率...' },
  { id: '6', title: '内容分发渠道对比分析', status: 'review', author: '张明', date: '2025-07-22', category: '行业洞察', excerpt: '微信公众号、小红书、B站、抖音的内容适配策略...' },
  { id: '7', title: '深度长文的排版美学', status: 'scheduled', author: '李华', date: '2025-07-23', category: '设计', excerpt: '字体、间距、配图：让长文阅读成为享受...' },
  { id: '8', title: '从 0 到 1 的内容团队搭建', status: 'draft', author: '王芳', date: '2025-07-24', category: '管理', excerpt: '内容团队的组织架构、角色分工与协作模式...' },
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

  const filtered = mockArticles.filter(
    (a) => a.title.includes(searchQuery) || a.author.includes(searchQuery) || a.category.includes(searchQuery)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
        >
          + 新建内容
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="搜索标题、作者、分类..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md text-sm border outline-none transition-all"
            style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A574'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
          {([
            { id: 'list' as ContentView, label: '列表', icon: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></> },
            { id: 'kanban' as ContentView, label: '看板', icon: <><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="12" rx="1" /></> },
            { id: 'calendar' as ContentView, label: '日历', icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
          ]).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150"
              style={{
                backgroundColor: view === v.id ? '#FFFFFF' : 'transparent',
                color: view === v.id ? '#1A1A1A' : '#6B6B6B',
                boxShadow: view === v.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{v.icon}</svg>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === 'list' && <ListView articles={filtered} />}
      {view === 'kanban' && <KanbanView articles={mockArticles} />}
      {view === 'calendar' && <CalendarView articles={mockArticles} />}
    </div>
  );
}

function ListView({ articles }: { articles: Article[] }) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-4 py-2.5 border-b text-xs font-medium" style={{ borderColor: '#E8E6E1', backgroundColor: '#F9F8F6', color: '#6B6B6B' }}>
        <span>标题</span>
        <span>状态</span>
        <span>作者</span>
        <span>分类</span>
        <span>日期</span>
      </div>
      {/* Table body */}
      {articles.map((article) => (
        <div
          key={article.id}
          className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors duration-150"
          style={{ borderColor: '#F0EDE8' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{article.title}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#6B6B6B' }}>{article.excerpt}</p>
          </div>
          <div className="flex items-center">
            <span
              className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
              style={{ color: statusConfig[article.status].color, backgroundColor: statusConfig[article.status].bg }}
            >
              {statusConfig[article.status].label}
            </span>
          </div>
          <span className="text-sm flex items-center" style={{ color: '#6B6B6B' }}>{article.author}</span>
          <span className="text-sm flex items-center" style={{ color: '#6B6B6B' }}>{article.category}</span>
          <span className="text-xs flex items-center" style={{ color: '#6B6B6B' }}>{article.date.slice(5)}</span>
        </div>
      ))}
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
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.id} className="rounded-lg p-3" style={{ backgroundColor: '#F5F3EF' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: columnColors[col.id] }} />
            <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>{col.label}</span>
            <span className="text-xs" style={{ color: '#9A9A9A' }}>{col.items.length}</span>
          </div>
          <div className="space-y-2">
            {col.items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-md border cursor-pointer transition-all duration-150"
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
                <p className="text-xs line-clamp-2" style={{ color: '#6B6B6B' }}>{item.excerpt}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: '#9A9A9A' }}>{item.author}</span>
                  <span className="text-xs" style={{ color: '#9A9A9A' }}>{item.date.slice(5)}</span>
                </div>
              </div>
            ))}
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
        <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>2025 年 7 月</h3>
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
        {/* Offset for July 2025 starting on Tuesday */}
        {Array.from({ length: 1 }, () => (
          <div key="empty-0" className="min-h-[80px] border-b border-r p-1" style={{ borderColor: '#F0EDE8' }} />
        ))}
        {days.map((day) => (
          <div
            key={day}
            className="min-h-[80px] border-b border-r p-1.5 transition-colors"
            style={{ borderColor: '#F0EDE8' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="text-xs font-medium" style={{ color: day === 20 ? '#D4A574' : '#1A1A1A' }}>{day}</span>
            <div className="mt-1 space-y-0.5">
              {(articlesByDay[day] || []).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1 px-1 py-0.5 rounded text-xs truncate cursor-pointer"
                  style={{ backgroundColor: statusConfig[a.status].bg, color: statusConfig[a.status].color }}
                >
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: statusDot[a.status] }} />
                  <span className="truncate">{a.title.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
