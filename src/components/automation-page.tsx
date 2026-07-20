'use client';

import { useState } from 'react';
import { Play, Pause, Plus, Clock, Zap, GitBranch, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Settings, Copy, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { showToast } from '@/components/toast';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'output';
  name: string;
  desc: string;
  status: 'completed' | 'running' | 'pending' | 'error';
  config?: Record<string, string>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  schedule: string;
  lastRun: string;
  status: 'active' | 'paused' | 'draft';
  runCount: number;
}

const workflows: Workflow[] = [
  {
    id: '1',
    name: '每日选题 → 脚本生成',
    description: '自动从热点源抓取选题，生成初稿脚本',
    schedule: '每天 09:00',
    lastRun: '今天 09:00',
    status: 'active',
    runCount: 48,
    steps: [
      { id: 's1', type: 'trigger', name: '定时触发', desc: '每天 09:00', status: 'completed' },
      { id: 's2', type: 'action', name: '抓取热点', desc: '从微博/知乎/头条获取 Top 10 热点', status: 'completed' },
      { id: 's3', type: 'action', name: 'AI 选题分析', desc: '评估热度、匹配度、可行性', status: 'completed' },
      { id: 's4', type: 'condition', name: '选题通过？', desc: '评分 > 80 则继续', status: 'completed' },
      { id: 's5', type: 'action', name: '生成脚本初稿', desc: '基于选题生成 3000 字脚本', status: 'completed' },
      { id: 's6', type: 'output', name: '发送到审核', desc: '推送到飞书文档 + 通知审核人', status: 'completed' },
    ],
  },
  {
    id: '2',
    name: '脚本 → 多渠道适配',
    description: '审核通过后自动适配 6 个渠道的内容格式',
    schedule: '审核通过后触发',
    lastRun: '昨天 14:30',
    status: 'active',
    runCount: 32,
    steps: [
      { id: 's1', type: 'trigger', name: '审核通过', desc: '监听审核状态变更', status: 'completed' },
      { id: 's2', type: 'action', name: '公众号适配', desc: '调整格式、生成封面', status: 'completed' },
      { id: 's3', type: 'action', name: '小红书适配', desc: '缩短文案、添加 emoji', status: 'completed' },
      { id: 's4', type: 'action', name: 'B站适配', desc: '添加时间戳、调整标题', status: 'running' },
      { id: 's5', type: 'action', name: '抖音适配', desc: '精简为短文案', status: 'pending' },
      { id: 's6', type: 'output', name: '发布排期', desc: '按最佳时间排期发布', status: 'pending' },
    ],
  },
  {
    id: '3',
    name: '周报自动生成',
    description: '每周五自动汇总本周数据生成周报',
    schedule: '每周五 17:00',
    lastRun: '上周五',
    status: 'paused',
    runCount: 12,
    steps: [
      { id: 's1', type: 'trigger', name: '定时触发', desc: '每周五 17:00', status: 'completed' },
      { id: 's2', type: 'action', name: '拉取数据', desc: '从各平台拉取本周数据', status: 'completed' },
      { id: 's3', type: 'action', name: '生成报告', desc: 'AI 分析数据趋势，生成周报', status: 'pending' },
      { id: 's4', type: 'output', name: '发送周报', desc: '邮件发送给团队', status: 'pending' },
    ],
  },
];

const templates = [
  { id: 't1', name: '热点追踪 → 快速出稿', desc: '从发现热点到发布只需 2 小时', icon: Zap },
  { id: 't2', name: '一源多渠分发', desc: '一次创作，6 个渠道自动适配', icon: GitBranch },
  { id: 't3', name: '定时排期发布', desc: '按最佳时间自动发布到各平台', icon: Calendar },
  { id: 't4', name: '数据监控 → 预警', desc: '实时监控数据异常并推送预警', icon: AlertCircle },
];

export default function AutomationPage() {
  const [selectedId, setSelectedId] = useState('1');
  const [showTemplates, setShowTemplates] = useState(false);

  const selected = workflows.find(w => w.id === selectedId)!;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Workflow List */}
      <div className="w-80 border-r border-[#E8E6E1] flex flex-col bg-[#FAFAF8]">
        <div className="p-4 border-b border-[#E8E6E1]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif font-semibold text-[#1A1A1A]">自动化</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-8 h-8 rounded-lg border border-[#E8E6E1] flex items-center justify-center hover:bg-[#FFFFFF] transition-colors"
                title="从模板创建"
              >
                <Copy size={14} className="text-[#6B6B6B]" />
              </button>
              <button
                onClick={() => showToast('新建工作流')}
                className="w-8 h-8 rounded-lg bg-[#D4A574] text-white flex items-center justify-center hover:bg-[#C49564] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Templates Dropdown */}
          {showTemplates && (
            <div className="mb-3 p-2 bg-[#FFFFFF] rounded-lg border border-[#E8E6E1] space-y-1">
              {templates.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      showToast(`已应用模板: ${t.name}`);
                      setShowTemplates(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-[#FAFAF8] transition-colors text-left"
                  >
                    <Icon size={14} className="text-[#D4A574]" />
                    <div>
                      <div className="text-xs font-medium text-[#1A1A1A]">{t.name}</div>
                      <div className="text-xs text-[#6B6B6B]">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-xs text-[#6B6B6B]">
            <span>{workflows.filter(w => w.status === 'active').length} 运行中</span>
            <span>{workflows.filter(w => w.status === 'paused').length} 已暂停</span>
            <span>共 {workflows.reduce((sum, w) => sum + w.runCount, 0)} 次执行</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setSelectedId(wf.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedId === wf.id
                  ? 'bg-[#FFFFFF] border border-[#D4A574] shadow-sm'
                  : 'bg-[#FFFFFF] border border-transparent hover:border-[#E8E6E1]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#1A1A1A]">{wf.name}</span>
                <span className={`w-2 h-2 rounded-full ${
                  wf.status === 'active' ? 'bg-emerald-500' :
                  wf.status === 'paused' ? 'bg-amber-500' : 'bg-gray-300'
                }`} />
              </div>
              <div className="text-xs text-[#6B6B6B] mb-2">{wf.description}</div>
              <div className="flex items-center gap-3 text-xs text-[#9A9A9A]">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {wf.schedule}
                </span>
                <span>已运行 {wf.runCount} 次</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Workflow Steps */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E6E1] bg-[#FFFFFF]">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-serif font-semibold text-[#1A1A1A]">{selected.name}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast(selected.status === 'active' ? '已暂停' : '已启动')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selected.status === 'active'
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {selected.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                {selected.status === 'active' ? '暂停' : '启动'}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors">
                <Settings size={14} />
                设置
              </button>
              <button
                onClick={() => showToast('手动执行已触发')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                <Play size={14} />
                手动执行
              </button>
            </div>
          </div>
          <p className="text-sm text-[#6B6B6B]">{selected.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-[#6B6B6B]">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              调度: {selected.schedule}
            </span>
            <span>上次运行: {selected.lastRun}</span>
            <span>累计执行: {selected.runCount} 次</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-0">
              {selected.steps.map((step, i) => (
                <div key={step.id}>
                  {/* Step */}
                  <div className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                    step.status === 'running' ? 'border-[#D4A574] bg-[#FAF5F0]' :
                    step.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' :
                    step.status === 'error' ? 'border-red-200 bg-red-50/30' :
                    'border-[#E8E6E1] bg-[#FFFFFF]'
                  }`}>
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      step.type === 'trigger' ? 'bg-violet-50 text-violet-600' :
                      step.type === 'condition' ? 'bg-amber-50 text-amber-600' :
                      step.type === 'output' ? 'bg-blue-50 text-blue-600' :
                      'bg-[#F5F5F0] text-[#6B6B6B]'
                    }`}>
                      {step.type === 'trigger' ? <Zap size={18} /> :
                       step.type === 'condition' ? <GitBranch size={18} /> :
                       step.type === 'output' ? <ArrowRight size={18} /> :
                       <Settings size={18} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm text-[#1A1A1A]">{step.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          step.type === 'trigger' ? 'bg-violet-50 text-violet-600' :
                          step.type === 'condition' ? 'bg-amber-50 text-amber-600' :
                          step.type === 'output' ? 'bg-blue-50 text-blue-600' :
                          'bg-[#F5F5F0] text-[#6B6B6B]'
                        }`}>
                          {step.type === 'trigger' ? '触发器' :
                           step.type === 'condition' ? '条件' :
                           step.type === 'output' ? '输出' : '动作'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">{step.desc}</p>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center gap-1.5 text-xs ${
                      step.status === 'completed' ? 'text-emerald-600' :
                      step.status === 'running' ? 'text-[#D4A574]' :
                      step.status === 'error' ? 'text-red-500' :
                      'text-[#9A9A9A]'
                    }`}>
                      {step.status === 'completed' && <CheckCircle2 size={14} />}
                      {step.status === 'running' && <div className="w-3 h-3 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />}
                      {step.status === 'error' && <AlertCircle size={14} />}
                      {step.status === 'completed' ? '完成' :
                       step.status === 'running' ? '运行中' :
                       step.status === 'error' ? '失败' : '等待'}
                    </div>
                  </div>

                  {/* Connector */}
                  {i < selected.steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-[#E8E6E1]" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => showToast('添加步骤')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#6B6B6B] border border-dashed border-[#E8E6E1] rounded-lg hover:border-[#D4A574] hover:text-[#D4A574] transition-colors"
              >
                <Plus size={14} />
                添加步骤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Run History */}
      <div className="w-72 border-l border-[#E8E6E1] flex flex-col bg-[#FAFAF8]">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="font-serif font-semibold text-[#1A1A1A]">运行记录</h2>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {[
            { time: '今天 09:00', status: 'success', duration: '2m 34s' },
            { time: '昨天 09:00', status: 'success', duration: '2m 18s' },
            { time: '前天 09:00', status: 'error', duration: '0m 45s' },
            { time: '3 天前 09:00', status: 'success', duration: '2m 51s' },
            { time: '4 天前 09:00', status: 'success', duration: '2m 22s' },
            { time: '5 天前 09:00', status: 'success', duration: '2m 38s' },
            { time: '6 天前 09:00', status: 'success', duration: '2m 15s' },
          ].map((run, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E8E6E1] hover:border-[#D4A574]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#6B6B6B]">{run.time}</span>
                <span className={`flex items-center gap-1 text-xs ${
                  run.status === 'success' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {run.status === 'success' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                  {run.status === 'success' ? '成功' : '失败'}
                </span>
              </div>
              <div className="text-xs text-[#9A9A9A]">耗时 {run.duration}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
