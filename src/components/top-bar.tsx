'use client';

import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CircleHelp,
  FilePenLine,
  Megaphone,
  LayoutDashboard,
  ListTodo,
  PlugZap,
  Puzzle,
  Search,
  Sparkles,
} from 'lucide-react';
import { type ComponentType, useDeferredValue, useEffect, useRef, useState } from 'react';
import { canAccessView, type ViewType } from '@/lib/access-control';
import { useAuth } from '@/components/auth-guard';
import { showToast } from './toast';

interface TopBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const viewLabels: Record<ViewType, string> = {
  home: '工作台',
  assistant: 'AI 助手',
  tasks: '任务中心',
  studio: '智能创作',
  'design-system': '系统设置',
  automation: '自动化',
  craft: '内容规范',
  requests: '协作与报送',
  campaigns: '活动宣传',
  topics: '选题中心',
  scripts: '我的作品',
  workflows: '工作流编排',
  analytics: '数据概览',
  agents: 'Agent 管理',
  skills: 'Skill 能力中心',
  knowledge: '文件与知识库',
  connections: '连接管理',
};

interface CommandDefinition {
  id: string;
  label: string;
  description: string;
  view: ViewType;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

const commandDefinitions: CommandDefinition[] = [
  { id: 'workspace', label: '前往工作台', description: '开始新的 AI 工作任务', view: 'home', icon: LayoutDashboard },
  { id: 'assistant', label: '打开 AI 助手', description: '查知识、分析内容或继续对话', view: 'assistant', icon: Bot },
  { id: 'create', label: '开始智能创作', description: '文案、图片、视频和演示文稿', view: 'studio', icon: Sparkles },
  { id: 'project', label: '查看活动宣传', description: '跟进活动节奏、内容物料和发布成果', view: 'campaigns', icon: Megaphone },
  { id: 'tasks', label: '查看任务中心', description: '处理今日任务与待确认事项', view: 'tasks', icon: ListTodo },
  { id: 'works', label: '打开我的作品', description: '查看草稿、待确认与已发布内容', view: 'scripts', icon: FilePenLine },
  { id: 'analytics', label: '查看数据概览', description: '了解内容表现与工作效率', view: 'analytics', icon: BarChart3 },
  { id: 'connections', label: '管理外部连接', description: '配置平台、模型、数据源和工具', view: 'connections', icon: PlugZap },
  { id: 'agents', label: '管理 Agent', description: '配置角色、模型、Skill 与知识库', view: 'agents', icon: Bot },
  { id: 'skills', label: '打开 Skill 能力中心', description: '发现、检查并绑定 Agent 可调用的能力', view: 'skills', icon: Puzzle },
];

const notifications = [
  { title: '会议纪要待确认', detail: '“7 月内容例会”已生成 4 个行动项', time: '5 分钟前' },
  { title: '活动节点临近', detail: '22 周年文化传播活动将在本周五到期', time: '28 分钟前' },
  { title: 'AI 任务已完成', detail: '员工故事初稿已生成，可继续编辑', time: '1 小时前' },
];

export function TopBar({ currentView, onViewChange }: TopBarProps) {
  const { user } = useAuth();
  const [showCommand, setShowCommand] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const commandPanelRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commandDefinitions.filter(command => {
    if (!canAccessView(user.permissions, command.view)) return false;
    if (!deferredQuery) return true;
    return `${command.label} ${command.description}`.toLocaleLowerCase().includes(deferredQuery);
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setShowCommand(open => !open);
        setShowNotifications(false);
      }
      if (event.key === 'Escape') {
        setShowCommand(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showCommand) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 30);
    return () => window.clearTimeout(focusTimer);
  }, [showCommand]);

  useEffect(() => {
    if (!showCommand && !showNotifications) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showCommand && commandPanelRef.current && !commandPanelRef.current.contains(target)) setShowCommand(false);
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(target)) setShowNotifications(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showCommand, showNotifications]);

  const openCommand = () => {
    setQuery('');
    setShowCommand(true);
    setShowNotifications(false);
  };

  const runCommand = (command: CommandDefinition) => {
    onViewChange(command.view);
    setShowCommand(false);
    setQuery('');
  };

  return (
    <>
      <header className="relative z-30 flex h-16 shrink-0 items-center border-b border-[#E5EBF0] bg-white/95 px-4 backdrop-blur-sm sm:px-6">
        <div className="ml-12 flex min-w-0 items-center gap-2 lg:ml-0">
          <span className="hidden text-[12px] font-medium text-[#9AA8B3] sm:inline">ECCP</span>
          <span className="hidden text-[#C2CCD3] sm:inline">/</span>
          <h1 className="truncate text-[14px] font-semibold text-[#263640]">{viewLabels[currentView]}</h1>
        </div>

        <button
          type="button"
          onClick={openCommand}
          className="absolute left-1/2 hidden h-10 w-[min(38vw,460px)] -translate-x-1/2 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F7F9FC] px-3 text-left text-[12px] text-[#8B9AA6] transition-colors hover:border-[#C8D4DD] hover:bg-white lg:flex"
        >
          <Search className="h-4 w-4" strokeWidth={1.8} />
          <span className="flex-1">搜索对话、文件、活动和任务</span>
          <kbd className="rounded-md border border-[#DDE5EA] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#84939E]">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {currentView !== 'home' ? (
            <button
              type="button"
              aria-label="前往工作台发起 AI 任务"
              onClick={() => onViewChange('home')}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-3.5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.22)] transition-colors hover:bg-[#465BD8]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">AI 发起任务</span>
            </button>
          ) : null}

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              aria-label="通知"
              aria-expanded={showNotifications}
              onClick={() => {
                setShowNotifications(open => !open);
                setShowCommand(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#687985] transition-colors hover:bg-[#F1F5F8] hover:text-[#5267E8]"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#DC5A60]" />
            </button>

            {showNotifications ? (
              <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#E2E9EE] bg-white shadow-[0_18px_50px_rgba(31,50,68,0.16)]">
                <div className="flex items-center justify-between border-b border-[#EDF1F4] px-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold text-[#21313C]">消息中心</div>
                    <div className="mt-0.5 text-[10px] text-[#8A99A4]">3 项需要关注</div>
                  </div>
                  <button type="button" onClick={() => showToast('所有消息已标记为已读', 'success')} className="text-[11px] font-medium text-[#5267E8]">全部已读</button>
                </div>
                <div className="p-2">
                  {notifications.map(notification => (
                    <button key={notification.title} type="button" className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#F6F8FC]">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#5267E8]" />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold text-[#2B3A44]">{notification.title}</span>
                          <span className="mt-1 block text-[11px] leading-5 text-[#6F808C]">{notification.detail}</span>
                          <span className="mt-1 block text-[10px] text-[#A0ADB7]">{notification.time}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="帮助"
            onClick={() => showToast('帮助中心正在整理，常见问题可先询问 AI 助手', 'info')}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#687985] transition-colors hover:bg-[#F1F5F8] hover:text-[#5267E8] sm:flex"
          >
            <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>

          <button type="button" className="ml-1 flex items-center gap-1.5 rounded-xl p-1 transition-colors hover:bg-[#F1F5F8]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE4FF] text-[11px] font-semibold text-[#4256C5]">{user.displayName.slice(-1)}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#83929D] sm:block" />
          </button>
        </div>
      </header>

      {showCommand ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#17232D]/24 px-4 pt-[12vh] backdrop-blur-[3px]">
          <div ref={commandPanelRef} className="animate-slide-up w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#DEE6EC] bg-white shadow-[0_24px_70px_rgba(31,50,68,0.22)]">
            <div className="flex h-14 items-center gap-3 border-b border-[#E9EEF2] px-4">
              <Search className="h-[18px] w-[18px] text-[#71818D]" strokeWidth={1.8} />
              <input
                ref={searchInputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="搜索功能或开始新的工作"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#263640] outline-none placeholder:text-[#9BA8B2]"
              />
              <kbd className="rounded-md border border-[#DCE4EA] bg-[#F7F9FB] px-1.5 py-0.5 text-[10px] text-[#8796A1]">ESC</kbd>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {filteredCommands.length ? (
                filteredCommands.map(command => {
                  const Icon = command.icon;
                  return (
                    <button key={command.id} type="button" onClick={() => runCommand(command)} className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#F3F6FC]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E3E9F5] bg-[#F5F7FF] text-[#5267E8]">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-[#2A3943]">{command.label}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#7C8C97]">{command.description}</span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center text-[13px] text-[#8796A1]">没有找到匹配内容，换个关键词试试</div>
              )}
            </div>
            <div className="border-t border-[#E9EEF2] bg-[#F9FBFC] px-4 py-2.5 text-[10px] text-[#8998A3]">
              输入关键词搜索 · 点击结果快速跳转
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
