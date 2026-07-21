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

// 入口
const entryNav: NavItem[] = [
  {
    id: 'home',
    label: '首页',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    shortcut: '1',
  },
];

// 内容生产
const contentNav: NavItem[] = [
  {
    id: 'requests',
    label: '部门报送',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    shortcut: '2',
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
      </svg>
    ),
    shortcut: '3',
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
    shortcut: '4',
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
    shortcut: '5',
  },
];

// 编排与引擎
const engineNav: NavItem[] = [
  {
    id: 'workflows',
    label: '工作流',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    shortcut: '6',
  },
  {
    id: 'agents',
    label: 'Agent',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
      </svg>
    ),
    shortcut: '7',
  },
  {
    id: 'skills',
    label: 'Skill',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    shortcut: '8',
  },
];

// 知识与数据
const knowledgeNav: NavItem[] = [
  {
    id: 'knowledge',
    label: '知识库',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    shortcut: '9',
  },
  {
    id: 'analytics',
    label: '数据',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    shortcut: '0',
  },
  {
    id: 'connections',
    label: '集成',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-[#1A1A1A] border-r border-[#2A2A2A] z-50
          transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? 'w-[60px]' : 'w-[200px]'}
          lg:translate-x-0 ${collapsed ? 'lg:translate-x-0' : 'lg:translate-x-0'}
          ${collapsed ? 'translate-x-0' : 'translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-4 border-b border-[#2A2A2A] flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#D4A574] to-[#C17B3E] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          {!collapsed && (
            <span className="ml-2.5 font-serif text-[13px] font-semibold text-white tracking-tight">
              ECCP
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {/* 入口 */}
          <div className="mb-2">
            {!collapsed && (
              <div className="px-4 mb-1">
                <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">入口</span>
              </div>
            )}
            {entryNav.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                onClick={() => onViewChange(item.id)}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* 内容生产 */}
          <div className="mb-2">
            {!collapsed && (
              <div className="px-4 mb-1 mt-3">
                <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">内容</span>
              </div>
            )}
            {contentNav.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                onClick={() => onViewChange(item.id)}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* 编排与引擎 */}
          <div className="mb-2">
            {!collapsed && (
              <div className="px-4 mb-1 mt-3">
                <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">引擎</span>
              </div>
            )}
            {engineNav.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                onClick={() => onViewChange(item.id)}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* 知识与数据 */}
          <div className="mb-2">
            {!collapsed && (
              <div className="px-4 mb-1 mt-3">
                <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">资产</span>
              </div>
            )}
            {knowledgeNav.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                onClick={() => onViewChange(item.id)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#2A2A2A] flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-white hover:bg-[#2A2A2A] transition-colors"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <>
                  <polyline points="9 18 15 12 9 6" />
                </>
              ) : (
                <>
                  <polyline points="15 18 9 12 15 6" />
                </>
              )}
            </svg>
            {!collapsed && <span className="ml-2 text-xs">收起</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function SidebarItem({ item, isActive, onClick, collapsed }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center px-3 py-1.5 mx-2 rounded-md text-[13px] transition-all duration-200
        ${collapsed ? 'justify-center mx-1.5 px-0' : ''}
        ${isActive
          ? 'bg-[#2A2A2A] text-white'
          : 'text-neutral-400 hover:text-white hover:bg-[#2A2A2A]/50'
        }
      `}
      title={collapsed ? item.label : undefined}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-[#D4A574]' : ''}`}>
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="ml-2.5 font-medium">{item.label}</span>
          {item.shortcut && (
            <span className="ml-auto text-[10px] text-neutral-600 font-mono">{item.shortcut}</span>
          )}
        </>
      )}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#D4A574] rounded-r" />
      )}
    </button>
  );
}
