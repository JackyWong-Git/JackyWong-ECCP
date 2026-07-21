'use client';

import { useState } from 'react';

interface ChannelMetric {
  channel: string;
  color: string;
  views: number;
  likes: number;
  shares: number;
  published: number;
  trend: number[];
}

interface TopContent {
  id: string;
  title: string;
  channel: string;
  views: number;
  likes: number;
  shares: number;
  conversion: number;
  publishedAt: string;
}

const mockChannelMetrics: ChannelMetric[] = [
  { channel: 'GTMCfamily', color: '#1A5276', views: 45200, likes: 2800, shares: 680, published: 12, trend: [30, 42, 38, 55, 48, 62, 58] },
  { channel: 'KILAKILA', color: '#8B5CF6', views: 28500, likes: 1900, shares: 420, published: 8, trend: [20, 25, 30, 28, 35, 40, 38] },
  { channel: '公众号', color: '#4A7C59', views: 85000, likes: 4200, shares: 1500, published: 6, trend: [50, 65, 58, 72, 80, 75, 88] },
  { channel: '视频号', color: '#C17B3E', views: 120000, likes: 8500, shares: 3200, published: 10, trend: [60, 80, 95, 88, 110, 125, 130] },
  { channel: '内刊', color: '#A64D4D', views: 5000, likes: 300, shares: 50, published: 2, trend: [8, 10, 12, 10, 15, 12, 14] },
  { channel: '抖音', color: '#1A1A1A', views: 250000, likes: 15000, shares: 5800, published: 15, trend: [100, 150, 180, 200, 220, 280, 300] },
];

const mockTopContents: TopContent[] = [
  { id: '1', title: '新车型上市全纪录', channel: '视频号', views: 52000, likes: 3200, shares: 1200, conversion: 4.2, publishedAt: '2026-07-18' },
  { id: '2', title: '新车型上市宣传', channel: '公众号', views: 38000, likes: 2100, shares: 850, conversion: 3.8, publishedAt: '2026-07-18' },
  { id: '3', title: '技能比武大赛精彩集锦', channel: '抖音', views: 85000, likes: 6500, shares: 2800, conversion: 5.1, publishedAt: '2026-07-15' },
  { id: '4', title: '工匠故事：一线坚守', channel: 'GTMCfamily', views: 18000, likes: 1200, shares: 380, conversion: 2.5, publishedAt: '2026-07-12' },
  { id: '5', title: '客户感谢信访精选', channel: '公众号', views: 22000, likes: 1500, shares: 520, conversion: 3.2, publishedAt: '2026-07-10' },
];

const monthlyData = [
  { month: '4月', materials: 8, published: 6, reused: 4 },
  { month: '5月', materials: 14, published: 11, reused: 9 },
  { month: '6月', materials: 18, published: 15, reused: 14 },
  { month: '7月', materials: 16, published: 12, reused: 12 },
];

export function DataFeedback() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const totalViews = mockChannelMetrics.reduce((s, c) => s + c.views, 0);
  const totalLikes = mockChannelMetrics.reduce((s, c) => s + c.likes, 0);
  const totalShares = mockChannelMetrics.reduce((s, c) => s + c.shares, 0);
  const totalPublished = mockChannelMetrics.reduce((s, c) => s + c.published, 0);

  const maxTrend = Math.max(...mockChannelMetrics.flatMap(c => c.trend));

  return (
    <div className="p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>数据回流</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>渠道数据统一回流，分析效果，优化选题</p>
        </div>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
          {([['7d', '7天'], ['30d', '30天'], ['90d', '90天']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTimeRange(val)}
              className="px-3 py-1.5 text-xs transition-colors"
              style={{ backgroundColor: timeRange === val ? '#1A1A1A' : '#FFF', color: timeRange === val ? '#FFF' : '#6B6B6B' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '总阅读量', value: totalViews, format: (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString(), color: '#D4A574', change: '+23%' },
          { label: '总发布数', value: totalPublished, format: (v: number) => v + '条', color: '#4A7C59', change: '+15%' },
          { label: '总互动量', value: totalLikes + totalShares, format: (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString(), color: '#5A7BA8', change: '+31%' },
          { label: '素材复用率', value: 75, format: (v: number) => v + '%', color: '#8B5CF6', change: '+8%' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-lg border p-4" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>{kpi.label}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.format(kpi.value)}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0FDF4', color: '#4A7C59' }}>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E8E6E1' }}>
          <h3 className="text-xs font-semibold mb-4" style={{ color: '#1A1A1A' }}>月度趋势</h3>
          <div className="flex items-end gap-4 h-32">
            {monthlyData.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: 100 }}>
                  <div className="flex-1 rounded-t transition-all" style={{ backgroundColor: '#D4A574', height: `${(d.materials / 20) * 100}%` }} title={`素材 ${d.materials}`} />
                  <div className="flex-1 rounded-t transition-all" style={{ backgroundColor: '#4A7C59', height: `${(d.published / 20) * 100}%` }} title={`发布 ${d.published}`} />
                  <div className="flex-1 rounded-t transition-all" style={{ backgroundColor: '#5A7BA8', height: `${(d.reused / 20) * 100}%` }} title={`复用 ${d.reused}`} />
                </div>
                <span className="text-[10px]" style={{ color: '#999' }}>{d.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#6B6B6B' }}>
              <div className="w-2 h-2 rounded" style={{ backgroundColor: '#D4A574' }} />素材入库
            </div>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#6B6B6B' }}>
              <div className="w-2 h-2 rounded" style={{ backgroundColor: '#4A7C59' }} />内容发布
            </div>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#6B6B6B' }}>
              <div className="w-2 h-2 rounded" style={{ backgroundColor: '#5A7BA8' }} />素材复用
            </div>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E8E6E1' }}>
          <h3 className="text-xs font-semibold mb-4" style={{ color: '#1A1A1A' }}>渠道分布</h3>
          <div className="space-y-3">
            {mockChannelMetrics.sort((a, b) => b.views - a.views).map(ch => (
              <div key={ch.channel}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                    <span className="text-[11px]" style={{ color: '#1A1A1A' }}>{ch.channel}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#999' }}>{(ch.views / 10000).toFixed(1)}万阅读</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EFEB' }}>
                  <div className="h-full rounded-full transition-all" style={{ backgroundColor: ch.color, width: `${(ch.views / 250000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Trend Lines */}
      <div className="bg-white rounded-lg border p-4 mb-6" style={{ borderColor: '#E8E6E1' }}>
        <h3 className="text-xs font-semibold mb-4" style={{ color: '#1A1A1A' }}>各渠道阅读趋势</h3>
        <div className="grid grid-cols-3 gap-4">
          {mockChannelMetrics.sort((a, b) => b.views - a.views).slice(0, 6).map(ch => (
            <div key={ch.channel} className="p-3 rounded-lg" style={{ backgroundColor: '#FAFAF8' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                  <span className="text-[11px] font-medium" style={{ color: '#1A1A1A' }}>{ch.channel}</span>
                </div>
                <span className="text-[10px]" style={{ color: '#4A7C59' }}>+{Math.round((ch.trend[6] - ch.trend[0]) / ch.trend[0] * 100)}%</span>
              </div>
              <svg viewBox="0 0 100 30" className="w-full h-8">
                <polyline
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="1.5"
                  points={ch.trend.map((v, i) => `${i * (100 / 6)},${30 - (v / maxTrend) * 28}`).join(' ')}
                />
              </svg>
              <div className="text-[10px] mt-1" style={{ color: '#999' }}>{(ch.views / 10000).toFixed(1)}万 总阅读</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Content */}
      <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E8E6E1' }}>
        <h3 className="text-xs font-semibold mb-4" style={{ color: '#1A1A1A' }}>内容排行榜</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>排名</th>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>标题</th>
              <th className="text-left py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>渠道</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>阅读</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>点赞</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>转发</th>
              <th className="text-right py-2 px-3 font-medium" style={{ color: '#6B6B6B' }}>转化率</th>
            </tr>
          </thead>
          <tbody>
            {mockTopContents.map((c, idx) => (
              <tr key={c.id} className="border-b" style={{ borderColor: '#F0EFEB' }}>
                <td className="py-2.5 px-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium" style={{ backgroundColor: idx < 3 ? '#D4A574' : '#F0EFEB', color: idx < 3 ? '#FFF' : '#999' }}>{idx + 1}</span>
                </td>
                <td className="py-2.5 px-3 font-medium" style={{ color: '#1A1A1A' }}>{c.title}</td>
                <td className="py-2.5 px-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: mockChannelMetrics.find(m => m.channel === c.channel)?.color + '15', color: mockChannelMetrics.find(m => m.channel === c.channel)?.color }}>
                    {c.channel}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right" style={{ color: '#1A1A1A' }}>{(c.views / 10000).toFixed(1)}万</td>
                <td className="py-2.5 px-3 text-right" style={{ color: '#6B6B6B' }}>{c.likes.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right" style={{ color: '#6B6B6B' }}>{c.shares.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-medium" style={{ color: '#4A7C59' }}>{c.conversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
