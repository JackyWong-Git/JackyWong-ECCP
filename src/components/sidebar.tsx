'use client';

import {
  Home,
  Layers,
  Palette,
  Zap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
} from 'lucide-react';

export type ViewType = 'home' | 'studio' | 'design-system' | 'automation' | 'craft';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: ViewType; label: string; icon: typeof Home; shortcut: string }[] = [
  { id: 'home', label: 'Home', icon: Home, shortcut: '1' },
  { id: 'studio', label: 'Studio', icon: Layers, shortcut: '2' },
  { id: 'design-system', label: 'Design System', icon: Palette, shortcut: '3' },
  { id: 'automation', label: 'Automation', icon: Zap, shortcut: '4' },
  { id: 'craft', label: 'Craft', icon: BookOpen, shortcut: '5' },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div
      className={`flex flex-col border-r transition-all duration-200 ${
        collapsed ? 'w-[60px]' : 'w-[240px]'
      }`}
      style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
    >
      {/* Logo */}
      <div className="h-[52px] flex items-center px-4 border-b" style={{ borderColor: '#2A2A2A' }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#D4A574' }}>
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-white font-serif text-lg tracking-tight">ContentFlow</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md flex items-center justify-center mx-auto" style={{ backgroundColor: '#D4A574' }}>
            <span className="text-white text-xs font-bold">C</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && (
          <div className="px-3 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6B6B' }}>
              工作区
            </span>
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg transition-all group relative ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={isActive ? { backgroundColor: 'rgba(212, 165, 116, 0.15)' } : {}}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ backgroundColor: '#D4A574' }}
                />
              )}
              <Icon size={18} style={isActive ? { color: '#D4A574' } : {}} />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  <span
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#2A2A2A', color: '#6B6B6B' }}
                  >
                    {item.shortcut}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-2 pb-3 space-y-0.5">
        {!collapsed && (
          <div className="px-3 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6B6B' }}>
              系统
            </span>
          </div>
        )}
        <button
          className={`w-full flex items-center gap-3 rounded-lg transition-colors text-gray-400 hover:text-white ${
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
          title={collapsed ? '设置' : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span className="text-sm font-medium">设置</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 rounded-lg transition-colors text-gray-400 hover:text-white px-3 py-2.5"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">收起</span>
            </>
          )}
        </button>

        {/* User */}
        {!collapsed && (
          <div className="mt-3 pt-3 mx-2 border-t flex items-center gap-3" style={{ borderColor: '#2A2A2A' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}>
              ZL
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium truncate">张亮</div>
              <div className="text-xs truncate" style={{ color: '#6B6B6B' }}>主编</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
