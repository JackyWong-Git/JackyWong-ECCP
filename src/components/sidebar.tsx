'use client';

import {
  BarChart3,
  Blocks,
  Bot,
  ChevronLeft,
  ChevronRight,
  FilePenLine,
  Files,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  MessageSquareText,
  PanelLeft,
  PlugZap,
  Puzzle,
  Settings2,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { type ComponentType } from 'react';
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
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: '智能工作',
    items: [
      { id: 'home', label: '工作台', icon: LayoutDashboard },
      { id: 'assistant', label: 'AI 助手', icon: Bot },
      { id: 'studio', label: '智能创作', icon: Sparkles },
    ],
  },
  {
    label: '协同执行',
    items: [
      { id: 'campaigns', label: '项目空间', icon: FolderKanban, badge: '2' },
      { id: 'tasks', label: '任务中心', icon: ListTodo, badge: '3' },
      { id: 'knowledge', label: '文件与知识库', icon: Files },
      { id: 'requests', label: '协作与报送', icon: UsersRound },
    ],
  },
  {
    label: '内容资产',
    items: [
      { id: 'topics', label: '选题中心', icon: Blocks },
      { id: 'scripts', label: '我的作品', icon: FilePenLine },
      { id: 'analytics', label: '数据概览', icon: BarChart3 },
    ],
  },
  {
    label: '平台管理',
    items: [
      { id: 'connections', label: '连接管理', icon: PlugZap },
      { id: 'agents', label: 'Agent 管理', icon: Bot },
      { id: 'skills', label: 'Skill 市场', icon: Puzzle },
      { id: 'workflows', label: '工作流编排', icon: ListTodo },
      { id: 'design-system', label: '系统设置', icon: Settings2 },
    ],
  },
];

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  const handleNavigate = (view: ViewType) => {
    onViewChange(view);
    if (window.innerWidth < 1024) onToggleCollapse();
  };

  return (
    <>
      {!collapsed ? (
        <button
          type="button"
          aria-label="关闭导航"
          className="fixed inset-0 z-40 bg-[#17232D]/25 backdrop-blur-[2px] lg:hidden"
          onClick={onToggleCollapse}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[#E5EBF0] bg-[#F7FAFB] transition-[width,transform] duration-200 ease-out lg:static lg:translate-x-0 ${
          collapsed ? 'w-[76px] -translate-x-full lg:translate-x-0' : 'w-[232px] translate-x-0'
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-[#E5EBF0] ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            aria-label="返回工作台"
            className="flex min-w-0 items-center gap-3 rounded-xl"
          >
            <span className="ai-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[0_8px_18px_rgba(82,103,232,0.22)]">
              <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2} />
            </span>
            {!collapsed ? (
              <span className="min-w-0 text-left">
                <span className="block text-[15px] font-semibold tracking-[-0.02em] text-[#17232D]">ECCP</span>
                <span className="block truncate text-[10px] font-medium tracking-[0.04em] text-[#94A2AE]">AI WORKSPACE</span>
              </span>
            ) : null}
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" aria-label="主导航">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex === 0 ? '' : 'mt-5'}>
              {!collapsed ? (
                <div className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.08em] text-[#9AA8B3]">
                  {group.label}
                </div>
              ) : groupIndex > 0 ? (
                <div className="mx-auto mb-2 h-px w-7 bg-[#E1E8ED]" />
              ) : null}

              <div className="space-y-1">
                {group.items.map(item => {
                  const active = currentView === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.label}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => handleNavigate(item.id)}
                      className={`app-nav-item group relative flex h-10 w-full items-center rounded-xl text-[13px] font-medium transition-colors ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                      } ${
                        active
                          ? 'bg-[#EDEFFF] text-[#4257D2]'
                          : 'text-[#60707D] hover:bg-[#EFF4F7] hover:text-[#273844]'
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#5267E8]' : 'text-[#788894] group-hover:text-[#5267E8]'}`}
                        strokeWidth={1.8}
                      />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      {!collapsed && item.badge ? (
                        <span aria-hidden="true" className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                          active ? 'bg-white text-[#5267E8]' : 'bg-[#E9EEF2] text-[#758692]'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                      {active ? <span className="absolute -left-3 h-5 w-[3px] rounded-r-full bg-[#5267E8]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#E5EBF0] p-3">
          {!collapsed ? (
            <button
              type="button"
              className="mb-2 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#EFF4F7]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE4FF] text-[12px] font-semibold text-[#4357C8]">彬彬</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-[#263640]">彬彬</span>
                <span className="block truncate text-[10px] text-[#8999A5]">企业文化中心</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#9AA8B3]" strokeWidth={1.8} />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? '展开导航' : '收起导航'}
            className={`flex h-9 w-full items-center rounded-xl text-[#7A8A96] transition-colors hover:bg-[#EFF4F7] hover:text-[#5267E8] ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
          >
            {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
            {!collapsed ? <span className="text-[12px] font-medium">收起导航</span> : null}
          </button>
        </div>
      </aside>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="打开导航"
          className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-[#E0E7EC] bg-white text-[#5267E8] shadow-[0_8px_20px_rgba(31,50,68,0.12)] lg:hidden"
        >
          <PanelLeft className="h-5 w-5" strokeWidth={1.8} />
        </button>
      ) : null}
    </>
  );
}
