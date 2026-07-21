'use client';

import { useState } from 'react';
import { showToast } from './toast';

const automations = [
  { id: '1', name: '每日选题汇总', trigger: '定时', schedule: '每天 9:00', status: 'active', runs: 156, success: 98, lastRun: '今天 09:00' },
  { id: '2', name: '新需求自动分配', trigger: 'Webhook', schedule: '实时触发', status: 'active', runs: 42, success: 100, lastRun: '2小时前' },
  { id: '3', name: '周报自动生成', trigger: '定时', schedule: '每周五 17:00', status: 'active', runs: 24, success: 96, lastRun: '昨天 17:00' },
  { id: '4', name: '活动发布同步', trigger: '内容发布', schedule: '发布后触发', status: 'paused', runs: 8, success: 88, lastRun: '3天前' },
  { id: '5', name: '数据异常告警', trigger: 'Webhook', schedule: '实时监控', status: 'active', runs: 312, success: 99, lastRun: '30分钟前' },
];

const triggers = [
  { id: 'cron', label: '定时触发', icon: '⏰', desc: '按 Cron 表达式定时执行' },
  { id: 'webhook', label: 'Webhook', icon: '🔗', desc: '外部事件触发' },
  { id: 'publish', label: '内容发布', icon: '📤', desc: '内容发布后触发' },
  { id: 'manual', label: '手动触发', icon: '👆', desc: '手动点击执行' },
];

export function AutomationPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold" style={{ color: '#1A1A1A', fontFamily: 'Noto Serif SC, serif' }}>Automation</h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B6B6B' }}>编排重复性工作流程，让内容生产自动化</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded text-[13px] font-medium"
          style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
        >+ 新建自动化</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '活跃流程', value: automations.filter(a => a.status === 'active').length, color: '#4A7C59' },
          { label: '总运行次数', value: automations.reduce((s, a) => s + a.runs, 0), color: '#5B7FC0' },
          { label: '平均成功率', value: `${Math.round(automations.reduce((s, a) => s + a.success, 0) / automations.length)}%`, color: '#D4A574' },
          { label: '本月节省时间', value: '48h', color: '#7B68AE' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
            <div className="text-[11px] mb-1" style={{ color: '#999' }}>{stat.label}</div>
            <div className="text-[22px] font-semibold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Create Panel */}
      {showCreate && (
        <div className="mb-6 p-5 rounded border" style={{ borderColor: '#D4A574', backgroundColor: '#FFF' }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: '#1A1A1A' }}>选择触发器</h3>
          <div className="grid grid-cols-4 gap-3">
            {triggers.map(t => (
              <button
                key={t.id}
                onClick={() => { showToast(`已选择「${t.label}」触发器`, 'info'); setShowCreate(false); }}
                className="p-4 rounded border text-left transition-all hover:-translate-y-[1px]"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}
              >
                <span className="text-[20px]">{t.icon}</span>
                <div className="text-[13px] font-medium mt-2" style={{ color: '#1A1A1A' }}>{t.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#999' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {automations.map(a => (
          <div key={a.id} className="flex items-center justify-between p-4 rounded border transition-all hover:-translate-y-[1px]" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.status === 'active' ? '#4A7C59' : '#C17B3E' }} />
              <div>
                <div className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{a.name}</div>
                <div className="text-[11px]" style={{ color: '#999' }}>
                  {a.trigger} · {a.schedule}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[12px] font-medium" style={{ color: '#1A1A1A' }}>{a.runs} 次</div>
                <div className="text-[10px]" style={{ color: '#999' }}>成功率 {a.success}%</div>
              </div>
              <div className="text-right">
                <div className="text-[11px]" style={{ color: '#999' }}>上次运行</div>
                <div className="text-[12px]" style={{ color: '#666' }}>{a.lastRun}</div>
              </div>
              <button
                onClick={() => showToast(a.status === 'active' ? '已暂停' : '已激活', 'info')}
                className="px-3 py-1 rounded text-[11px]"
                style={{ backgroundColor: a.status === 'active' ? '#F5F0EB' : '#4A7C5920', color: a.status === 'active' ? '#C17B3E' : '#4A7C59' }}
              >
                {a.status === 'active' ? '暂停' : '激活'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
