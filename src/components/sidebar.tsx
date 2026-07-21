'use client';

import type { ViewType } from '@/app/page';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: ViewType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'coordination',
    label: '内容调度',
    desc: '中台看板',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'submission',
    label: '素材上报',
    desc: '部门入口',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: 'publishing',
    label: '渠道发布',
    desc: '多端适配',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: '素材知识库',
    desc: '资产沉淀',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <line x1="9" y1="7" x2="16" y2="7" />
        <line x1="9" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    id: 'feedback',
    label: '数据回流',
    desc: '效果分析',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col border-r transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-[240px]'}`}
      style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] border-b" style={{ borderColor: '#2A2A2A' }}>
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#D4A574' }}
        >
          <span className="text-white text-xs font-bold">中</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-serif)' }}>内容协同中台</div>
            <div className="text-[10px]" style={{ color: '#6B6B6B' }}>Content Platform v1.0</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 mb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#555' }}>
            工作区
          </div>
        )}
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-2.5 rounded px-2.5 py-2 mb-0.5 text-left transition-all duration-150 group relative ${
                collapsed ? 'justify-center' : ''
              }`}
              style={{
                backgroundColor: isActive ? '#2A2A2A' : 'transparent',
                color: isActive ? '#FFFFFF' : '#999',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#222';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r"
                  style={{ backgroundColor: '#D4A574' }}
                />
              )}
              <span style={{ color: isActive ? '#D4A574' : '#666' }}>{item.icon}</span>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-tight">{item.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: isActive ? '#666' : '#444' }}>{item.desc}</div>
                </div>
              )}
              {!collapsed && (
                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#555' }}>
                  {navItems.indexOf(item) + 1}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      {!collapsed && (
        <div className="px-3 pb-2 space-y-0.5">
          <div className="h-px my-2" style={{ backgroundColor: '#2A2A2A' }} />
          <div className="px-2 mb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#555' }}>
            快捷
          </div>
          <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-colors" style={{ color: '#777' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            最近编辑
          </button>
          <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-colors" style={{ color: '#777' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            收藏夹
          </button>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-3 border-t" style={{ borderColor: '#2A2A2A' }}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs text-white font-medium" style={{ backgroundColor: '#D4A574' }}>总</div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium flex-shrink-0" style={{ backgroundColor: '#D4A574' }}>总</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white font-medium">总括</div>
              <div className="text-[10px]" style={{ color: '#666' }}>体系运营 · 统筹调度</div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded transition-colors"
              style={{ color: '#666' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
