'use client';

import { type ViewType } from '@/app/page';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const mainNav: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    shortcut: '1',
  },
  {
    id: 'studio',
    label: 'Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    shortcut: '2',
  },
  {
    id: 'design-system',
    label: 'Design System',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </svg>
    ),
    shortcut: '3',
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    ),
    shortcut: '4',
  },
  {
    id: 'craft',
    label: 'Craft',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    shortcut: '5',
  },
];

const workNav: NavItem[] = [
  {
    id: 'requests',
    label: '需求入口',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    shortcut: '6',
  },
  {
    id: 'campaigns',
    label: '活动管理',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
      </svg>
    ),
    shortcut: '7',
  },
  {
    id: 'topics',
    label: '选题看板',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    shortcut: '8',
  },
  {
    id: 'scripts',
    label: '脚本编辑',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    shortcut: '9',
  },
  {
    id: 'workflows',
    label: '工作流',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    shortcut: '0',
  },
  {
    id: 'analytics',
    label: '数据看板',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col border-r transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
      style={{ borderColor: '#E8E6E1', backgroundColor: '#1A1A1A' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] border-b" style={{ borderColor: '#2A2A2A' }}>
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
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-white truncate">ContentFlow</span>
            <span className="text-[10px] text-[#888] truncate">内容创作平台</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded transition-colors"
          style={{ color: '#888' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {!collapsed && (
          <div className="px-2 mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>
              平台
            </span>
          </div>
        )}
        {mainNav.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-all duration-150 mb-0.5 group relative ${collapsed ? 'justify-center' : ''}`}
              style={{
                backgroundColor: isActive ? '#2A2A2A' : 'transparent',
                color: isActive ? '#D4A574' : '#AAA',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#222';
                  e.currentTarget.style.color = '#DDD';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#AAA';
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r"
                  style={{ backgroundColor: '#D4A574' }}
                />
              )}
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.shortcut && (
                <span className="ml-auto text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#666' }}>
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}

        {/* Work nav */}
        {!collapsed && (
          <div className="px-2 mt-4 mb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>
              工作台
            </span>
          </div>
        )}
        {collapsed && <div className="my-3 mx-2 border-t" style={{ borderColor: '#2A2A2A' }} />}
        {workNav.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-all duration-150 mb-0.5 group relative ${collapsed ? 'justify-center' : ''}`}
              style={{
                backgroundColor: isActive ? '#2A2A2A' : 'transparent',
                color: isActive ? '#D4A574' : '#AAA',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#222';
                  e.currentTarget.style.color = '#DDD';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#AAA';
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r"
                  style={{ backgroundColor: '#D4A574' }}
                />
              )}
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.shortcut && (
                <span className="ml-auto text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#666' }}>
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User */}
      {!collapsed && (
        <div className="p-3 border-t" style={{ borderColor: '#2A2A2A' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
              style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
            >
              滕
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] text-white truncate">滕紫原</span>
              <span className="text-[10px] truncate" style={{ color: '#666' }}>总括</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
