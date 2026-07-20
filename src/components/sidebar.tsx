'use client';

import { type ViewType } from '@/app/page';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: '内容管理',
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
    id: 'editor',
    label: '块编辑器',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
    ),
  },
  {
    id: 'storyboard',
    label: '分镜时间轴',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M8 3H3v5" />
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
        <path d="m15 9 6-6" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: '知识库',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M12 6v7" />
        <path d="M8 9h8" />
      </svg>
    ),
  },
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
      {/* Logo area */}
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
      <nav className="flex-1 py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left transition-all duration-150"
                style={{
                  backgroundColor: isActive ? '#2A2A2A' : 'transparent',
                  color: isActive ? '#D4A574' : '#9A9A9A',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#252525';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-3 border-t" style={{ borderColor: '#2A2A2A' }}>
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left transition-all duration-150"
          style={{ color: '#6B6B6B' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#9A9A9A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6B6B6B'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m14 9 3 3-3 3" />
          </svg>
          {!collapsed && <span className="text-sm">收起侧栏</span>}
        </button>
      </div>
    </aside>
  );
}
