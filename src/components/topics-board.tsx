'use client';

import { useState, useRef } from 'react';
import { showToast } from '@/components/toast';

type TopicStatus = 'idea' | 'research' | 'approved' | 'in_progress' | 'done';
type ViewMode = 'kanban' | 'table';

interface Topic {
  id: string;
  title: string;
  description: string;
  status: TopicStatus;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  tags: string[];
  source: string;
  createdAt: string;
  estimatedWords: number;
  channel: string;
}

const statusColumns: { id: TopicStatus; label: string; color: string }[] = [
  { id: 'idea', label: '灵感', color: '#6B8FA3' },
  { id: 'research', label: '调研中', color: '#C17B3E' },
  { id: 'approved', label: '已通过', color: '#4A7C59' },
  { id: 'in_progress', label: '制作中', color: '#D4A574' },
  { id: 'done', label: '已完成', color: '#6B6B6B' },
];

const priorityConfig = {
  high: { label: '高', color: '#A64D4D', bg: '#FDE8E8' },
  medium: { label: '中', color: '#C17B3E', bg: '#FFF3E0' },
  low: { label: '低', color: '#6B6B6B', bg: '#F0EDE8' },
};

const mockTopics: Topic[] = [
  { id: '1', title: 'AI 辅助内容创作的未来', description: '探讨 AI 如何改变内容创作流程，从选题到发布的全链路 AI 辅助。', status: 'idea', priority: 'high', assignee: '张明', tags: ['AI', '趋势'], source: '团队脑暴', createdAt: '2025-07-18', estimatedWords: 3000, channel: '公众号' },
  { id: '2', title: '短视频脚本模板合集', description: '整理 10 种常见短视频类型的脚本模板，含开头 Hook、正文结构、结尾 CTA。', status: 'research', priority: 'high', assignee: '李华', tags: ['短视频', '模板'], source: '用户反馈', createdAt: '2025-07-17', estimatedWords: 2500, channel: '视频号' },
  { id: '3', title: '内容团队 OKR 制定指南', description: '如何为内容团队制定可衡量的 OKR，包括阅读量、转化率等指标。', status: 'approved', priority: 'medium', assignee: '王芳', tags: ['管理', 'OKR'], source: '主编提出', createdAt: '2025-07-16', estimatedWords: 2000, channel: '内刊' },
  { id: '4', title: '2025 下半年内容日历', description: '规划下半年重要节点的内容排期，包括节日、行业会议、产品发布等。', status: 'in_progress', priority: 'high', assignee: '赵强', tags: ['规划', '日历'], source: '年度计划', createdAt: '2025-07-15', estimatedWords: 1500, channel: '全渠道' },
  { id: '5', title: '小红书爆款笔记拆解', description: '分析近 3 个月小红书爆款笔记的共同特征，提炼可复用的写作公式。', status: 'research', priority: 'medium', assignee: '陈静', tags: ['小红书', '分析'], source: '竞品分析', createdAt: '2025-07-19', estimatedWords: 2800, channel: '小红书' },
  { id: '6', title: 'SEO 内容优化清单', description: '一份面向搜索引擎的内容优化 checklist，从标题到内链的全方位优化。', status: 'idea', priority: 'low', assignee: '张明', tags: ['SEO', '优化'], source: 'SEO 团队', createdAt: '2025-07-20', estimatedWords: 1800, channel: '官网' },
  { id: '7', title: '播客脚本：对话 AI 创业者', description: '一期播客节目的脚本，邀请 AI 创业公司 CEO 分享行业洞察。', status: 'done', priority: 'medium', assignee: '李华', tags: ['播客', '访谈'], source: '主编提出', createdAt: '2025-07-10', estimatedWords: 4000, channel: '播客' },
  { id: '8', title: '知识付费产品设计思路', description: '如何将现有内容打包成知识付费产品，包括课程、电子书、模板包。', status: 'idea', priority: 'medium', assignee: '王芳', tags: ['知识付费', '产品'], source: '商业讨论', createdAt: '2025-07-19', estimatedWords: 2200, channel: '公众号' },
];

export function TopicsBoard() {
  const [topics, setTopics] = useState<Topic[]>(mockTopics);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragTopic, setDragTopic] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TopicStatus | null>(null);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [discoverSource, setDiscoverSource] = useState<'manual' | 'douyin' | 'weibo' | 'industry'>('manual');
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<Array<{ title: string; heat: string; source: string }>>([]);

  const filtered = topics.filter(t =>
    !searchQuery || t.title.includes(searchQuery) || t.tags.some(tag => tag.includes(searchQuery))
  );

  const getColumnTopics = (status: TopicStatus) => filtered.filter(t => t.status === status);

  const handleDragStart = (topicId: string) => {
    setDragTopic(topicId);
  };

  const handleDragOver = (e: React.DragEvent, status: TopicStatus) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = (status: TopicStatus) => {
    if (dragTopic) {
      setTopics(prev => prev.map(t => t.id === dragTopic ? { ...t, status } : t));
      showToast('选题状态已更新', 'success');
    }
    setDragTopic(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDragTopic(null);
    setDragOverCol(null);
  };

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newTopic: Topic = {
      id: String(Date.now()),
      title: newTopicTitle,
      description: '',
      status: 'idea',
      priority: 'medium',
      assignee: '陈默',
      tags: [],
      source: '手动创建',
      createdAt: new Date().toISOString().split('T')[0],
      estimatedWords: 0,
      channel: '待定',
    };
    setTopics(prev => [newTopic, ...prev]);
    setNewTopicTitle('');
    setShowNewTopic(false);
    showToast('选题已创建', 'success');
  };

  const handleDiscover = async (source: 'douyin' | 'weibo' | 'industry') => {
    setDiscoverLoading(true);
    setDiscoverResults([]);
    try {
      const res = await fetch(`/api/discover?source=${source}`);
      if (!res.ok) throw new Error('Discover request failed');
      const data = await res.json();
      if (data.items) {
        setDiscoverResults(data.items.map((item: { title: string; heat?: string; source?: string }) => ({
          title: item.title,
          heat: item.heat || '热门',
          source: item.source || source,
        })));
      }
      showToast(`已获取${source === 'douyin' ? '抖音' : source === 'weibo' ? '微博' : '行业'}热榜`, 'success');
    } catch (err) {
      showToast(`获取失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleConvertToTopic = (title: string, source: string) => {
    const newTopic: Topic = {
      id: String(Date.now()),
      title,
      description: `从${source}热榜导入的选题`,
      status: 'idea',
      priority: 'medium',
      assignee: '陈默',
      tags: [source],
      source: `${source}热榜`,
      createdAt: new Date().toISOString().split('T')[0],
      estimatedWords: 0,
      channel: '待定',
    };
    setTopics(prev => [newTopic, ...prev]);
    showToast(`已导入选题: ${title}`, 'success');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }}>选题看板</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>从灵感到成品，全流程管理内容选题</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder="搜索选题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm rounded-md border outline-none focus:ring-2"
              style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', '--tw-ring-color': '#D4A574' } as React.CSSProperties}
            />
          </div>
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden" style={{ borderColor: '#E8E6E1' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className="px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: viewMode === 'kanban' ? '#1A1A1A' : '#fff', color: viewMode === 'kanban' ? '#fff' : '#6B6B6B' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" /></svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: viewMode === 'table' ? '#1A1A1A' : '#fff', color: viewMode === 'table' ? '#fff' : '#6B6B6B' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
            </button>
          </div>
          {/* Add button */}
          <button
            onClick={() => setShowNewTopic(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            新建选题
          </button>
        </div>
      </div>

      {/* Discover source tabs */}
      <div className="px-6 py-2 border-b flex items-center gap-2" style={{ borderColor: '#E8E6E1', backgroundColor: '#F8F7F4' }}>
        <span className="text-xs mr-1" style={{ color: '#9A9A9A' }}>发现来源:</span>
        {([
          { id: 'manual' as const, label: '手动创建' },
          { id: 'douyin' as const, label: '抖音热榜' },
          { id: 'weibo' as const, label: '微博热搜' },
          { id: 'industry' as const, label: '行业动态' },
        ]).map(src => (
          <button
            key={src.id}
            onClick={() => {
              setDiscoverSource(src.id);
              if (src.id !== 'manual') handleDiscover(src.id);
            }}
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: discoverSource === src.id ? '#1A1A1A' : 'transparent',
              color: discoverSource === src.id ? '#fff' : '#6B6B6B',
            }}
          >
            {src.label}
          </button>
        ))}
        {discoverLoading && <span className="text-xs ml-2" style={{ color: '#C17B3E' }}>加载中...</span>}
      </div>

      {/* Discover results panel */}
      {discoverSource !== 'manual' && discoverResults.length > 0 && (
        <div className="px-6 py-3 border-b max-h-[200px] overflow-y-auto" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
          <div className="grid grid-cols-2 gap-2">
            {discoverResults.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-md border" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff' }}>
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-sm truncate" style={{ color: '#1A1A1A' }}>{item.title}</div>
                  <div className="text-xs" style={{ color: '#9A9A9A' }}>{item.heat}</div>
                </div>
                <button
                  onClick={() => handleConvertToTopic(item.title, item.source)}
                  className="text-xs px-2 py-1 rounded-md font-medium flex-shrink-0"
                  style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}
                >
                  转为选题
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {showNewTopic && (
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: '#E8E6E1', backgroundColor: '#F8F7F4' }}>
          <input
            type="text"
            placeholder="输入选题标题..."
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            className="flex-1 px-3 py-1.5 text-sm rounded-md border outline-none focus:ring-2"
            style={{ borderColor: '#E8E6E1', '--tw-ring-color': '#D4A574' } as React.CSSProperties}
            autoFocus
          />
          <button onClick={handleAddTopic} className="px-3 py-1.5 text-sm font-medium rounded-md" style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}>创建</button>
          <button onClick={() => setShowNewTopic(false)} className="px-3 py-1.5 text-sm rounded-md" style={{ color: '#6B6B6B' }}>取消</button>
        </div>
      )}

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {statusColumns.map(col => {
              const colTopics = getColumnTopics(col.id);
              return (
                <div
                  key={col.id}
                  className="w-[280px] flex flex-col rounded-lg"
                  style={{ backgroundColor: '#F0EDE8' }}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => handleDrop(col.id)}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: '#E8E6E1' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{col.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E8E6E1', color: '#6B6B6B' }}>{colTopics.length}</span>
                    </div>
                  </div>
                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colTopics.map(topic => (
                      <div
                        key={topic.id}
                        draggable
                        onDragStart={() => handleDragStart(topic.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTopic(topic)}
                        className="p-3 rounded-md cursor-pointer transition-all duration-150 border"
                        style={{
                          backgroundColor: dragTopic === topic.id ? '#E8D5C0' : '#fff',
                          borderColor: dragOverCol === col.id ? '#D4A574' : 'transparent',
                          opacity: dragTopic === topic.id ? 0.7 : 1,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={(e) => {
                          if (dragTopic !== topic.id) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium leading-snug" style={{ color: '#1A1A1A' }}>{topic.title}</h4>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ml-2"
                            style={{ color: priorityConfig[topic.priority].color, backgroundColor: priorityConfig[topic.priority].bg }}
                          >
                            {priorityConfig[topic.priority].label}
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color: '#6B6B6B' }}>{topic.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium" style={{ backgroundColor: '#E8D5C0', color: '#8B6914' }}>
                              {topic.assignee[0]}
                            </div>
                            <span className="text-[11px]" style={{ color: '#9A9A9A' }}>{topic.assignee}</span>
                          </div>
                          <div className="flex gap-1">
                            {topic.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table view */
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>选题</th>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>状态</th>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>优先级</th>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>负责人</th>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>渠道</th>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>标签</th>
                <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#6B6B6B' }}>创建日期</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(topic => (
                <tr
                  key={topic.id}
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: '#E8E6E1' }}
                  onClick={() => setSelectedTopic(topic)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8F7F4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td className="py-2.5 px-3">
                    <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{topic.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9A9A9A' }}>{topic.source}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      color: statusColumns.find(s => s.id === topic.status)?.color,
                      backgroundColor: '#F0EDE8'
                    }}>
                      {statusColumns.find(s => s.id === topic.status)?.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ color: priorityConfig[topic.priority].color, backgroundColor: priorityConfig[topic.priority].bg }}>
                      {priorityConfig[topic.priority].label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium" style={{ backgroundColor: '#E8D5C0', color: '#8B6914' }}>
                        {topic.assignee[0]}
                      </div>
                      <span className="text-sm" style={{ color: '#1A1A1A' }}>{topic.assignee}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-sm" style={{ color: '#6B6B6B' }}>{topic.channel}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      {topic.tags.map(tag => (
                        <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-sm" style={{ color: '#9A9A9A' }}>{topic.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail popup (NocoDB style - no page navigation) */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div
            className="w-[640px] max-h-[80vh] rounded-lg overflow-hidden flex flex-col"
            style={{ backgroundColor: '#FAFAF8', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E8E6E1' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  color: statusColumns.find(s => s.id === selectedTopic.status)?.color,
                  backgroundColor: '#F0EDE8'
                }}>
                  {statusColumns.find(s => s.id === selectedTopic.status)?.label}
                </span>
                <span className="text-xs" style={{ color: '#9A9A9A' }}>{selectedTopic.createdAt}</span>
              </div>
              <button onClick={() => setSelectedTopic(null)} className="p-1 rounded hover:bg-[#E8E6E1] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }}>{selectedTopic.title}</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B6B6B' }}>{selectedTopic.description}</p>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="text-xs mb-1" style={{ color: '#9A9A9A' }}>负责人</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}>{selectedTopic.assignee[0]}</div>
                    <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{selectedTopic.assignee}</span>
                  </div>
                </div>
                <div className="p-3 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="text-xs mb-1" style={{ color: '#9A9A9A' }}>目标渠道</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{selectedTopic.channel}</div>
                </div>
                <div className="p-3 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="text-xs mb-1" style={{ color: '#9A9A9A' }}>预估字数</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{selectedTopic.estimatedWords.toLocaleString()} 字</div>
                </div>
                <div className="p-3 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="text-xs mb-1" style={{ color: '#9A9A9A' }}>来源</div>
                  <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{selectedTopic.source}</div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="text-xs mb-2" style={{ color: '#9A9A9A' }}>标签</div>
                <div className="flex gap-1.5">
                  {selectedTopic.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: '#E8D5C0', color: '#8B6914' }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Status change */}
              <div>
                <div className="text-xs mb-2" style={{ color: '#9A9A9A' }}>推进状态</div>
                <div className="flex gap-1.5">
                  {statusColumns.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setTopics(prev => prev.map(t => t.id === selectedTopic.id ? { ...t, status: s.id } : t));
                        setSelectedTopic({ ...selectedTopic, status: s.id });
                        showToast(`已推进到「${s.label}」`, 'success');
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-md transition-colors"
                      style={{
                        backgroundColor: selectedTopic.status === s.id ? s.color : '#F0EDE8',
                        color: selectedTopic.status === s.id ? '#fff' : '#6B6B6B',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: '#E8E6E1' }}>
              <button
                onClick={() => {
                  showToast('已转为脚本，前往编辑器查看', 'success');
                  setSelectedTopic(null);
                }}
                className="text-sm px-3 py-1.5 rounded-md font-medium"
                style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
              >
                转为脚本
              </button>
              <div className="flex gap-2">
                <button className="text-sm px-3 py-1.5 rounded-md" style={{ color: '#6B6B6B', border: '1px solid #E8E6E1' }}>编辑</button>
                <button
                  onClick={() => {
                    setTopics(prev => prev.filter(t => t.id !== selectedTopic.id));
                    setSelectedTopic(null);
                    showToast('选题已删除', 'info');
                  }}
                  className="text-sm px-3 py-1.5 rounded-md"
                  style={{ color: '#A64D4D' }}
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
