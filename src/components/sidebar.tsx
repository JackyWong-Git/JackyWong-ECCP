'use client';

import { type ViewType } from '@/app/page';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: ViewType; label: string; shortcut: string; icon: React.ReactNode }[] = [
  {
    id: 'topics',
    label: '选题看板',
    shortcut: '1',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'scripts',
    label: '脚本编辑器',
    shortcut: '2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
    ),
  },
  {
    id: 'workflows',
    label: '工作流编排',
    shortcut: '3',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M9 6h6" />
        <path d="M6 9v6" />
        <path d="M18 9v6" />
        <path d="M9 18h6" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: '知识库',
    shortcut: '4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M12 6v7" />
        <path d="M8 9h8" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: '数据看板',
    shortcut: '5',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-8" />
      </svg>
    ),
  },
];

const quickLinks = [
  { label: '最近编辑', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
  { label: '收藏夹', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg> },
  { label: '回收站', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg> },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full border-r transition-all duration-200"
      style={{
        width: collapsed ? 60 : 240,
        backgroundColor: '#1A1A1A',
        borderColor: '#2A2A2A',
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-[52px] px-4 border-b" style={{ borderColor: '#2A2A2A' }}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#D4A574' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight" style={{ color: '#E8E6E1', fontFamily: "'Noto Serif SC', serif" }}>
              ContentFlow
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-auto">
        {!collapsed && (
          <div className="px-2.5 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#4A4A4A' }}>工作区</span>
          </div>
        )}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="group flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left transition-all duration-150 relative"
                style={{
                  backgroundColor: isActive ? '#2A2A2A' : 'transparent',
                  color: isActive ? '#D4A574' : '#9A9A9A',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#252525'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ backgroundColor: '#D4A574' }} />
                )}
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 rounded" style={{ color: '#6B6B6B', backgroundColor: '#333' }}>
                      {item.shortcut}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Links */}
        {!collapsed && (
          <>
            <div className="px-2.5 mt-6 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#4A4A4A' }}>快捷方式</span>
            </div>
            <div className="space-y-0.5">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-1.5 text-left transition-colors duration-150"
                  style={{ color: '#6B6B6B' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#252525'; e.currentTarget.style.color = '#9A9A9A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B6B6B'; }}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span className="text-sm">{link.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t px-3 py-3" style={{ borderColor: '#2A2A2A' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium" style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}>
            陈
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#E8E6E1' }}>陈默</div>
              <div className="text-xs truncate" style={{ color: '#6B6B6B' }}>内容主编</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onToggleCollapse} className="p-1 rounded transition-colors" style={{ color: '#6B6B6B' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#D4A574'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B6B'; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 17l-5-5 5-5" /><path d="M18 17l-5-5 5-5" /></svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
