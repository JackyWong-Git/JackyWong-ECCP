'use client';

import { useState } from 'react';

interface ChannelData {
  name: string;
  color: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  conversion: number;
  trend: number[];
}

interface ContentRank {
  id: string;
  title: string;
  channel: string;
  channelColor: string;
  views: number;
  likes: number;
  shares: number;
  conversion: number;
  trend: 'up' | 'down' | 'flat';
}

const channelData: ChannelData[] = [
  { name: 'GTMCfamily', color: '#5A7BA8', views: 45200, likes: 2340, shares: 890, comments: 456, conversion: 12.5, trend: [30, 45, 38, 52, 48, 65, 58] },
  { name: 'KILAKILA', color: '#8B5CF6', views: 28500, likes: 1890, shares: 567, comments: 234, conversion: 8.3, trend: [20, 25, 30, 28, 35, 40, 38] },
  { name: '微信公众号', color: '#4A7C59', views: 85000, likes: 5670, shares: 2340, comments: 890, conversion: 18.2, trend: [60, 75, 68, 82, 90, 85, 95] },
  { name: '视频号', color: '#C17B3E', views: 120000, likes: 8900, shares: 3450, comments: 1230, conversion: 15.6, trend: [80, 95, 110, 105, 120, 135, 140] },
  { name: '抖音', color: '#1A1A1A', views: 250000, likes: 18500, shares: 5670, comments: 2340, conversion: 22.4, trend: [150, 180, 200, 220, 240, 260, 280] },
  { name: '内刊', color: '#D4A574', views: 5000, likes: 340, shares: 120, comments: 45, conversion: 5.2, trend: [40, 38, 42, 45, 43, 48, 50] },
];

const contentRank: ContentRank[] = [
  { id: '1', title: '新款凯美瑞上市全解读', channel: '抖音', channelColor: '#1A1A1A', views: 85000, likes: 6200, shares: 2340, conversion: 28.5, trend: 'up' },
  { id: '2', title: '员工技能比武大赛精彩回顾', channel: '视频号', channelColor: '#C17B3E', views: 62000, likes: 4500, shares: 1890, conversion: 22.3, trend: 'up' },
  { id: '3', title: '客户感谢的温暖故事', channel: '微信公众号', channelColor: '#4A7C59', views: 45000, likes: 3200, shares: 1560, conversion: 18.7, trend: 'flat' },
  { id: '4', title: '夏季安全生产须知', channel: 'GTMCfamily', channelColor: '#5A7BA8', views: 38000, likes: 2100, shares: 890, conversion: 15.2, trend: 'down' },
  { id: '5', title: '研发幕后纪录片', channel: '抖音', channelColor: '#1A1A1A', views: 35000, likes: 2800, shares: 1230, conversion: 19.8, trend: 'up' },
  { id: '6', title: '供应商大会签约仪式', channel: 'KILAKILA', channelColor: '#8B5CF6', views: 28000, likes: 1890, shares: 670, conversion: 12.4, trend: 'flat' },
  { id: '7', title: '高温慰问一线员工', channel: '微信公众号', channelColor: '#4A7C59', views: 25000, likes: 1650, shares: 780, conversion: 14.5, trend: 'up' },
  { id: '8', title: '品质改善案例分享', channel: 'GTMCfamily', channelColor: '#5A7BA8', views: 22000, likes: 1340, shares: 560, conversion: 11.2, trend: 'down' },
];

const topicSuggestions = [
  { title: '新能源车型技术解读', reason: '近期新能源话题热度上升45%，建议结合公司新车型制作技术解读内容', potential: 'high', channels: ['抖音', '视频号', '公众号'] },
  { title: '一线员工的一天', reason: '员工故事类内容互动率高出平均32%，可持续产出系列内容', potential: 'high', channels: ['视频号', 'KILAKILA'] },
  { title: '品质改善成果展示', reason: '品质相关内容在内部渠道传播效果好，建议配合数据可视化', potential: 'medium', channels: ['GTMCfamily', '内刊'] },
  { title: '客户口碑故事', reason: '客户感谢类内容情感共鸣强，适合外部渠道传播', potential: 'medium', channels: ['公众号', '视频号'] },
];

export function DataFeedback() {
  const [timeRange, setTimeRange] = useState('7d');
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'shares' | 'conversion'>('views');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const totalViews = channelData.reduce((sum, ch) => sum + ch.views, 0);
  const totalLikes = channelData.reduce((sum, ch) => sum + ch.likes, 0);
  const totalShares = channelData.reduce((sum, ch) => sum + ch.shares, 0);
  const avgConversion = channelData.reduce((sum, ch) => sum + ch.conversion, 0) / channelData.length;

  const kpis = [
    { label: '总阅读量', value: totalViews.toLocaleString(), change: '+12.5%', color: '#5A7BA8' },
    { label: '总互动量', value: (totalLikes + totalShares).toLocaleString(), change: '+8.3%', color: '#4A7C59' },
    { label: '素材复用率', value: '2.8x', change: '+0.3x', color: '#D4A574' },
    { label: '平均转化率', value: avgConversion.toFixed(1) + '%', change: '+2.1%', color: '#8B5CF6' },
  ];

  const sortedRank = [...contentRank].sort((a, b) => b[sortBy] - a[sortBy]);

  const potentialConfig = {
    high: { label: '高潜力', color: '#4A7C59', bg: '#F0FDF4' },
    medium: { label: '中潜力', color: '#C17B3E', bg: '#FFFBEB' },
    low: { label: '低潜力', color: '#999', bg: '#F0EFEB' },
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-3 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: '#E8E6E1' }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>数据回流分析</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6B6B6B' }}>效果追踪 · 选题优化 · 数据闭环</p>
        </div>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: '#E8E6E1' }}>
          {[{ id: '7d', label: '7天' }, { id: '30d', label: '30天' }, { id: '90d', label: '90天' }].map(t => (
            <button key={t.id} onClick={() => setTimeRange(t.id)} className="px-3 py-1 text-xs transition-colors" style={{ backgroundColor: timeRange === t.id ? '#1A1A1A' : '#FFF', color: timeRange === t.id ? '#FFF' : '#6B6B6B' }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-lg border p-4" style={{ borderColor: '#E8E6E1' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#6B6B6B' }}>{kpi.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0FDF4', color: '#4A7C59' }}>{kpi.change}</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
              {/* Mini Trend */}
              <div className="mt-2 h-8 flex items-end gap-0.5">
                {[40, 55, 48, 62, 58, 72, 68].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${v}%`, backgroundColor: kpi.color + '30' }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Channel Comparison */}
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>渠道对比</h3>
            <div className="flex gap-2">
              {(['views', 'likes', 'shares', 'conversion'] as const).map(key => (
                <button key={key} onClick={() => setSortBy(key)} className="text-xs px-2 py-1 rounded transition-colors" style={{ backgroundColor: sortBy === key ? '#1A1A1A' : '#F0EFEB', color: sortBy === key ? '#FFF' : '#6B6B6B' }}>
                  {{ views: '阅读', likes: '点赞', shares: '分享', conversion: '转化' }[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {channelData.map(ch => {
              const value = sortBy === 'views' ? ch.views : sortBy === 'likes' ? ch.likes : sortBy === 'shares' ? ch.shares : ch.conversion;
              const maxValue = sortBy === 'conversion' ? 25 : 300000;
              const percentage = (value / maxValue) * 100;
              return (
                <div key={ch.name} className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedChannel(selectedChannel === ch.name ? null : ch.name)}>
                  <div className="w-20 text-xs font-medium" style={{ color: '#1A1A1A' }}>{ch.name}</div>
                  <div className="flex-1 h-6 rounded overflow-hidden" style={{ backgroundColor: '#F0EFEB' }}>
                    <div className="h-full rounded flex items-center px-2 transition-all" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: ch.color }}>
                      <span className="text-xs text-white font-medium">
                        {sortBy === 'conversion' ? value.toFixed(1) + '%' : value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-xs" style={{ color: ch.trend[ch.trend.length - 1] > ch.trend[0] ? '#4A7C59' : '#A64D4D' }}>
                      {ch.trend[ch.trend.length - 1] > ch.trend[0] ? '↑' : '↓'} {Math.abs(((ch.trend[ch.trend.length - 1] - ch.trend[0]) / ch.trend[0]) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Rank */}
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: '#E8E6E1' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: '#1A1A1A' }}>内容排行榜</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E8E6E1' }}>
                <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>排名</th>
                <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>标题</th>
                <th className="text-left py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>渠道</th>
                <th className="text-right py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>阅读</th>
                <th className="text-right py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>点赞</th>
                <th className="text-right py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>分享</th>
                <th className="text-right py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>转化率</th>
                <th className="text-center py-2 text-xs font-medium" style={{ color: '#6B6B6B' }}>趋势</th>
              </tr>
            </thead>
            <tbody>
              {sortedRank.map((item, i) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#E8E6E1' }}>
                  <td className="py-3">
                    <span className="text-sm font-semibold" style={{ color: i < 3 ? '#D4A574' : '#999' }}>#{i + 1}</span>
                  </td>
                  <td className="py-3 text-sm" style={{ color: '#1A1A1A' }}>{item.title}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: item.channelColor + '15', color: item.channelColor }}>{item.channel}</span>
                  </td>
                  <td className="py-3 text-right text-xs" style={{ color: '#6B6B6B' }}>{item.views.toLocaleString()}</td>
                  <td className="py-3 text-right text-xs" style={{ color: '#6B6B6B' }}>{item.likes.toLocaleString()}</td>
                  <td className="py-3 text-right text-xs" style={{ color: '#6B6B6B' }}>{item.shares.toLocaleString()}</td>
                  <td className="py-3 text-right text-xs font-medium" style={{ color: '#4A7C59' }}>{item.conversion}%</td>
                  <td className="py-3 text-center">
                    <span className="text-xs" style={{ color: item.trend === 'up' ? '#4A7C59' : item.trend === 'down' ? '#A64D4D' : '#999' }}>
                      {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Topic Suggestions */}
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>选题建议</h3>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#8B5CF615', color: '#8B5CF6' }}>AI 推荐</span>
          </div>
          <div className="space-y-3">
            {topicSuggestions.map((topic, i) => {
              const pc = potentialConfig[topic.potential as keyof typeof potentialConfig];
              return (
                <div key={i} className="p-4 rounded-lg border transition-all hover:shadow-sm" style={{ borderColor: '#E8E6E1' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{topic.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label}</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>{topic.reason}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#999' }}>推荐渠道：</span>
                    {topic.channels.map(ch => (
                      <span key={ch} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#F0EFEB', color: '#6B6B6B' }}>{ch}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROI Analysis */}
        <div className="bg-white rounded-lg border p-5" style={{ borderColor: '#E8E6E1' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: '#1A1A1A' }}>投入产出分析</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F4F0' }}>
              <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>内容生产效率</div>
              <div className="text-xl font-semibold" style={{ color: '#4A7C59' }}>+28%</div>
              <div className="text-xs mt-1" style={{ color: '#999' }}>较上月提升</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F4F0' }}>
              <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>素材复用价值</div>
              <div className="text-xl font-semibold" style={{ color: '#D4A574' }}>¥45K</div>
              <div className="text-xs mt-1" style={{ color: '#999' }}>节省制作成本</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F4F0' }}>
              <div className="text-xs mb-1" style={{ color: '#6B6B6B' }}>跨渠道协同</div>
              <div className="text-xl font-semibold" style={{ color: '#5A7BA8' }}>4.2次</div>
              <div className="text-xs mt-1" style={{ color: '#999' }}>平均每条内容</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
