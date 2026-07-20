'use client';

import { useState } from 'react';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface MetricCard {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
}

interface ContentPerformance {
  title: string;
  channel: string;
  views: number;
  likes: number;
  shares: number;
  conversion: number;
}

const metrics: MetricCard[] = [
  { label: '总阅读量', value: '128.4K', change: 12.5, sparkline: [30, 45, 35, 55, 48, 62, 58, 72, 68, 85, 78, 92] },
  { label: '发布内容', value: '47', change: 8.3, sparkline: [20, 25, 22, 30, 28, 35, 32, 38, 42, 40, 45, 47] },
  { label: '平均转化', value: '3.2%', change: -2.1, sparkline: [4.2, 3.8, 4.0, 3.5, 3.6, 3.2, 3.4, 3.0, 3.3, 3.1, 3.2, 3.2] },
  { label: '活跃作者', value: '12', change: 0, sparkline: [10, 11, 10, 12, 11, 12, 12, 11, 12, 12, 12, 12] },
];

const topContent: ContentPerformance[] = [
  { title: 'AI 辅助内容创作的未来', channel: '公众号', views: 15200, likes: 890, shares: 234, conversion: 4.2 },
  { title: '短视频脚本模板合集', channel: '小红书', views: 12800, likes: 1200, shares: 456, conversion: 5.1 },
  { title: '2025 年内容趋势报告', channel: '公众号', views: 9800, likes: 560, shares: 189, conversion: 3.8 },
  { title: '知识库搭建实战指南', channel: 'B站', views: 8500, likes: 420, shares: 156, conversion: 2.9 },
  { title: 'SEO 优化清单', channel: '官网', views: 7200, likes: 280, shares: 98, conversion: 6.2 },
];

const channelData = [
  { name: '公众号', content: 18, views: 45000, color: '#4A7C59' },
  { name: '小红书', content: 12, views: 32000, color: '#A64D4D' },
  { name: 'B站', content: 8, views: 28000, color: '#6B8FA3' },
  { name: '抖音', content: 15, views: 52000, color: '#D4A574' },
  { name: 'Newsletter', content: 6, views: 8000, color: '#8B6FA3' },
  { name: '内刊', content: 3, views: 2000, color: '#6B6B6B' },
];

const weeklyData = [
  { day: '周一', published: 3, views: 4200 },
  { day: '周二', published: 5, views: 5800 },
  { day: '周三', published: 2, views: 3100 },
  { day: '周四', published: 7, views: 8200 },
  { day: '周五', published: 4, views: 6500 },
  { day: '周六', published: 1, views: 2800 },
  { day: '周日', published: 2, views: 3400 },
];

function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

function BarChart({ data, maxVal }: { data: number[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all"
          style={{
            height: `${(v / maxVal) * 100}%`,
            backgroundColor: '#D4A574',
            opacity: 0.6 + (v / maxVal) * 0.4,
          }}
        />
      ))}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const totalViews = channelData.reduce((a, c) => a + c.views, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }}>数据看板</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6B6B' }}>内容表现与运营数据概览</p>
        </div>
        <div className="flex items-center gap-2">
          {([
            { id: '7d' as TimeRange, label: '7天' },
            { id: '30d' as TimeRange, label: '30天' },
            { id: '90d' as TimeRange, label: '90天' },
            { id: 'all' as TimeRange, label: '全部' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                backgroundColor: timeRange === t.id ? '#1A1A1A' : 'transparent',
                color: timeRange === t.id ? '#fff' : '#6B6B6B',
                border: timeRange === t.id ? 'none' : '1px solid #E8E6E1',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="p-4 rounded-lg border" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#9A9A9A' }}>{m.label}</span>
              <span className="text-xs font-medium" style={{ color: m.change > 0 ? '#4A7C59' : m.change < 0 ? '#A64D4D' : '#6B6B6B' }}>
                {m.change > 0 ? '+' : ''}{m.change}%
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold" style={{ color: '#1A1A1A' }}>{m.value}</span>
              <Sparkline data={m.sparkline} color={m.change >= 0 ? '#4A7C59' : '#A64D4D'} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Weekly activity */}
        <div className="col-span-2 p-5 rounded-lg border" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>本周发布趋势</h3>
            <span className="text-xs" style={{ color: '#9A9A9A' }}>共发布 {weeklyData.reduce((a, d) => a + d.published, 0)} 篇</span>
          </div>
          <div className="flex items-end gap-3 h-32">
            {weeklyData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100px' }}>
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${(d.views / 8200) * 100}%`,
                        backgroundColor: '#D4A574',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px]" style={{ color: '#9A9A9A' }}>{d.day}</span>
                <span className="text-[10px] font-medium" style={{ color: '#6B6B6B' }}>{d.published}篇</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel distribution */}
        <div className="p-5 rounded-lg border" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: '#1A1A1A' }}>渠道分布</h3>
          <div className="space-y-3">
            {channelData.map(ch => (
              <div key={ch.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                    <span className="text-xs" style={{ color: '#1A1A1A' }}>{ch.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#9A9A9A' }}>{((ch.views / totalViews) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(ch.views / totalViews) * 100}%`, backgroundColor: ch.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top content */}
      <div className="p-5 rounded-lg border" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>内容排行</h3>
          <button className="text-xs" style={{ color: '#D4A574' }}>查看全部</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
              <th className="text-left text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>内容</th>
              <th className="text-left text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>渠道</th>
              <th className="text-right text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>阅读</th>
              <th className="text-right text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>点赞</th>
              <th className="text-right text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>分享</th>
              <th className="text-right text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>转化率</th>
              <th className="text-right text-xs font-medium py-2" style={{ color: '#6B6B6B' }}>趋势</th>
            </tr>
          </thead>
          <tbody>
            {topContent.map((c, i) => (
              <tr key={i} className="border-b" style={{ borderColor: '#E8E6E1' }}>
                <td className="py-3">
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{c.title}</span>
                </td>
                <td className="py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>{c.channel}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm" style={{ color: '#1A1A1A' }}>{(c.views / 1000).toFixed(1)}K</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm" style={{ color: '#4A7C59' }}>{c.likes}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm" style={{ color: '#6B8FA3' }}>{c.shares}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-medium" style={{ color: c.conversion > 4 ? '#4A7C59' : '#C17B3E' }}>{c.conversion}%</span>
                </td>
                <td className="py-3 text-right">
                  <Sparkline data={[3, 5, 4, 7, 6, 8, 7, 9, 8, 10, 9, 11].map(v => v + Math.random() * 3)} color="#D4A574" width={60} height={20} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
