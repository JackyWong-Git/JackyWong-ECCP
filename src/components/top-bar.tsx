'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type ViewType } from '@/app/page';

interface TopBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const viewLabels: Record<ViewType, string> = {
  home: 'Home',
  studio: 'Studio',
  'design-system': 'Design System',
  automation: 'Automation',
  craft: 'Craft',
  requests: '部门报送信息',
  campaigns: '活动管理',
  topics: '选题看板',
  scripts: '脚本编辑',
  workflows: '工作流',
  analytics: '数据看板',
  agents: 'Agent 管理',
  skills: 'Skill 市场',
  knowledge: 'RAG 知识库',
  connections: '外部连接',
};

interface CommandItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export function TopBar({ currentView, onViewChange }: TopBarProps) {
  const [showCommand, setShowCommand] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandIdx, setCommandIdx] = useState(0);
  const [notifications, setNotifications] = useState(3);
  const [showNotif, setShowNotif] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'nav-home', label: '前往 Home', desc: '统一创作入口', icon: <IconGrid />,
      action: () => { onViewChange('home'); setShowCommand(false); },
    },
    {
      id: 'nav-studio', label: '前往 Studio', desc: '一源多渠适配', icon: <IconPlus />,
      action: () => { onViewChange('studio'); setShowCommand(false); },
    },
    {
      id: 'nav-requests', label: '前往部门报送信息', desc: '部门报送信息审核分发', icon: <IconPlus />,
      action: () => { onViewChange('requests'); setShowCommand(false); },
    },
    {
      id: 'nav-campaigns', label: '前往活动管理', desc: '活动全生命周期管理', icon: <IconTimeline />,
      action: () => { onViewChange('campaigns'); setShowCommand(false); },
    },
    {
      id: 'nav-topics', label: '前往选题看板', desc: '选题管理', icon: <IconFilm />,
      action: () => { onViewChange('topics'); setShowCommand(false); },
    },
    {
      id: 'nav-analytics', label: '前往数据看板', desc: '数据分析', icon: <IconGrid />,
      action: () => { onViewChange('analytics'); setShowCommand(false); },
    },
    {
      id: 'new-request', label: '提交宣传需求', desc: '部门提交宣传需求', icon: <IconPlus />,
      action: () => { onViewChange('requests'); setShowCommand(false); },
    },
    {
      id: 'new-campaign', label: '新建活动', desc: '创建传播活动', icon: <IconFilm />,
      action: () => { onViewChange('campaigns'); setShowCommand(false); },
    },
  ];

  const filtered = commands.filter(
    (c) => c.label.includes(commandQuery) || c.desc.includes(commandQuery) || c.id.includes(commandQuery)
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowCommand((v) => !v);
      setCommandQuery('');
      setCommandIdx(0);
    }
    if (e.key === 'Escape') {
      setShowCommand(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (showCommand) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCommand]);

  useEffect(() => {
    setCommandIdx(0);
  }, [commandQuery]);

  const handleCommandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCommandIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCommandIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[commandIdx]) {
      filtered[commandIdx].action();
    }
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        setShowCommand(false);
      }
    };
    if (showCommand) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCommand]);

  return (
    <>
      <div
        className="flex items-center justify-between h-[52px] px-6 border-b flex-shrink-0"
        style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
      >
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#9A9A9A' }}>ContentFlow</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" strokeWidth="1.5"><path d="m9 18 6-6-6-6" /></svg>
          <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{viewLabels[currentView]}</span>
        </div>

        {/* Center: command palette trigger */}
        <button
          onClick={() => { setShowCommand(true); setCommandQuery(''); setCommandIdx(0); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs transition-all"
          style={{ borderColor: '#E8E6E1', color: '#9A9A9A', backgroundColor: '#FFFFFF' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4D0C8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <span>搜索或执行命令...</span>
          <kbd className="px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: '#E8E6E1', backgroundColor: '#F5F3EF', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
            ⌘K
          </kbd>
        </button>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-1.5 rounded-md transition-colors"
              style={{ color: '#6B6B6B' }}
              onClick={() => setShowNotif(!showNotif)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-medium" style={{ backgroundColor: '#A64D4D', color: '#FFFFFF', fontSize: '9px' }}>
                  {notifications}
                </span>
              )}
            </button>
            {showNotif && (
              <div
                className="absolute right-0 top-full mt-1 w-72 rounded-lg border shadow-lg z-50 overflow-hidden"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E6E1', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              >
                <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>通知</span>
                  <button className="text-xs" style={{ color: '#D4A574' }} onClick={() => setNotifications(0)}>全部已读</button>
                </div>
                {[
                  { title: '文章审核通过', desc: '「2025 年内容创作趋势报告」已通过审核', time: '5 分钟前' },
                  { title: '新评论', desc: '李华 在「如何构建高效的内容工作流」中留言', time: '1 小时前' },
                  { title: '排期提醒', desc: '「深度长文的排版美学」明天发布', time: '3 小时前' },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="px-3 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors"
                    style={{ borderColor: '#F0EDE8' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFAF8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>{n.desc}</p>
                    <p className="text-xs mt-1" style={{ color: '#9A9A9A' }}>{n.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <button
            className="p-1.5 rounded-md transition-colors"
            style={{ color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>

          {/* User avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
          >
            Z
          </div>
        </div>
      </div>

      {/* Command Palette Modal */}
      {showCommand && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" style={{ backgroundColor: 'rgba(26,26,26,0.4)' }}>
          <div
            ref={commandRef}
            className="w-full max-w-lg rounded-lg border shadow-xl overflow-hidden animate-slide-up"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E6E1', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <div className="flex items-center gap-2 px-4 border-b" style={{ borderColor: '#E8E6E1' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="输入命令或搜索..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={handleCommandKeyDown}
                className="flex-1 py-3 text-sm bg-transparent outline-none"
                style={{ color: '#1A1A1A' }}
              />
              <kbd className="px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: '#E8E6E1', backgroundColor: '#F5F3EF', color: '#9A9A9A', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>
                ESC
              </kbd>
            </div>
            <div className="max-h-64 overflow-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: '#9A9A9A' }}>
                  没有找到匹配的命令
                </div>
              ) : (
                filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor: idx === commandIdx ? '#F5F3EF' : 'transparent',
                      color: '#1A1A1A',
                    }}
                  >
                    <span style={{ color: '#6B6B6B' }}>{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs truncate" style={{ color: '#9A9A9A' }}>{item.desc}</p>
                    </div>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: '#E8E6E1', color: '#9A9A9A', fontSize: '10px' }}>
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t flex items-center gap-4 text-xs" style={{ borderColor: '#E8E6E1', color: '#9A9A9A' }}>
              <span className="flex items-center gap-1"><kbd className="px-1 rounded border" style={{ borderColor: '#E8E6E1', fontSize: '10px' }}>↑↓</kbd> 导航</span>
              <span className="flex items-center gap-1"><kbd className="px-1 rounded border" style={{ borderColor: '#E8E6E1', fontSize: '10px' }}>↵</kbd> 执行</span>
              <span className="flex items-center gap-1"><kbd className="px-1 rounded border" style={{ borderColor: '#E8E6E1', fontSize: '10px' }}>esc</kbd> 关闭</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Small icon components for commands
function IconGrid() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}
function IconEdit() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>;
}
function IconTimeline() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /></svg>;
}
function IconBook() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
}
function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
}
function IconFilm() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>;
}
