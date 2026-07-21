'use client';

import { useState } from 'react';

interface ChannelContent {
  id: string;
  title: string;
  channel: string;
  status: 'draft' | 'adapting' | 'ready' | 'published';
  adaptedBy: string;
  wordCount: number;
  scheduledAt: string;
  publishedAt?: string;
  metrics?: { views: number; likes: number; shares: number };
}

const channelConfig: Record<string, { color: string; icon: string; desc: string; requirements: string[] }> = {
  'GTMCfamily': { color: '#1A5276', icon: 'G', desc: '企业内部平台', requirements: ['800-1500字', '正式语体', '配图3-5张'] },
  'KILAKILA': { color: '#8B5CF6', icon: 'K', desc: '员工社区', requirements: ['300-800字', '轻松语体', '互动话题'] },
  '公众号': { color: '#4A7C59', icon: '微', desc: '对外公众号', requirements: ['1500-3000字', '品牌语体', '封面图900x383'] },
  '视频号': { color: '#C17B3E', icon: '视', desc: '短视频平台', requirements: ['1-3分钟', '竖屏9:16', '字幕必配'] },
  '内刊': { color: '#A64D4D', icon: '刊', desc: '企业内刊', requirements: ['2000-5000字', '深度报道', '高清配图'] },
  '抖音': { color: '#1A1A1A', icon: '抖', desc: '短视频平台', requirements: ['15-60秒', '竖屏9:16', '前3秒抓眼'] },
};

const mockContents: ChannelContent[] = [
  { id: '1', title: '新车型上市宣传 - 公众号版', channel: '公众号', status: 'published', adaptedBy: '熊臣坤', wordCount: 2200, scheduledAt: '2026-07-18 10:00', publishedAt: '2026-07-18 10:00', metrics: { views: 12500, likes: 380, shares: 95 } },
  { id: '2', title: '新车型上市宣传 - GTMCfamily版', channel: 'GTMCfamily', status: 'published', adaptedBy: '熊臣坤', wordCount: 1200, scheduledAt: '2026-07-18 09:00', publishedAt: '2026-07-18 09:00', metrics: { views: 3200, likes: 150, shares: 42 } },
  { id: '3', title: '技能比武大赛 - 视频号版', channel: '视频号', status: 'ready', adaptedBy: '王彬彬', wordCount: 0, scheduledAt: '2026-07-20 14:00' },
  { id: '4', title: '技能比武大赛 - KILAKILA版', channel: 'KILAKILA', status: 'adapting', adaptedBy: '熊臣坤', wordCount: 450, scheduledAt: '2026-07-21 12:00' },
  { id: '5', title: '夏季安全专题 - 内刊版', channel: '内刊', status: 'adapting', adaptedBy: '刘俊', wordCount: 1800, scheduledAt: '2026-07-25 00:00' },
  { id: '6', title: '客户感谢故事 - 公众号版', channel: '公众号', status: 'draft', adaptedBy: '刘俊', wordCount: 0, scheduledAt: '2026-07-23 10:00' },
  { id: '7', title: '研发幕后 - 抖音版', channel: '抖音', status: 'draft', adaptedBy: '王彬彬', wordCount: 0, scheduledAt: '2026-07-28 18:00' },
  { id: '8', title: '新车型上市宣传 - 视频号版', channel: '视频号', status: 'published', adaptedBy: '王彬彬', wordCount: 0, scheduledAt: '2026-07-19 15:00', publishedAt: '2026-07-19 15:00', metrics: { views: 28000, likes: 1200, shares: 350 } },
];

export function ChannelPublishing() {
  const [contents, setContents] = useState<ChannelContent[]>(mockContents);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ChannelContent | null>(null);

  const filteredContents = selectedChannel
    ? contents.filter(c => c.channel === selectedChannel)
    : contents;

  const statusConfig = {
    draft: { label: '草稿', color: '#999' },
    adapting: { label: '适配中', color: '#C17B3E' },
    ready: { label: '待发布', color: '#4A7C59' },
    published: { label: '已发布', color: '#D4A574' },
  };

  const channelStats = Object.keys(channelConfig).map(ch => ({
    channel: ch,
    total: contents.filter(c => c.channel === ch).length,
    published: contents.filter(c => c.channel === ch && c.status === 'published').length,
  }));

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Channel Filter */}
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: '#E8E6E1' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1A1A1A', fontFamily: 'var(--font-serif)' }}>渠道发布</h2>
          <div className="flex gap-1.5 ml-4">
            <button
              onClick={() => setSelectedChannel(null)}
              className="px-2.5 py-1 rounded text-xs transition-colors"
              style={{ backgroundColor: !selectedChannel ? '#1A1A1A' : '#F0EFEB', color: !selectedChannel ? '#FFF' : '#6B6B6B' }}
            >
              全部
            </button>
            {Object.entries(channelConfig).map(([ch, cfg]) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch === selectedChannel ? null : ch)}
                className="px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1"
                style={{ backgroundColor: selectedChannel === ch ? cfg.color : '#F0EFEB', color: selectedChannel === ch ? '#FFF' : '#6B6B6B' }}
              >
                <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: selectedChannel === ch ? 'rgba(255,255,255,0.3)' : cfg.color + '20', color: selectedChannel === ch ? '#FFF' : cfg.color }}>
                  {cfg.icon}
                </span>
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-auto p-6">
          {/* Channel Stats */}
          {!selectedChannel && (
            <div className="grid grid-cols-6 gap-3 mb-6">
              {channelStats.map(s => {
                const cfg = channelConfig[s.channel];
                return (
                  <div key={s.channel} className="bg-white rounded-lg border p-3" style={{ borderColor: '#E8E6E1' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] text-white font-medium" style={{ backgroundColor: cfg.color }}>{cfg.icon}</div>
                      <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{s.channel}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold" style={{ color: cfg.color }}>{s.published}</span>
                      <span className="text-[10px]" style={{ color: '#999' }}>/ {s.total} 已发布</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Content Cards */}
          <div className="space-y-2">
            {filteredContents.map(content => {
              const cfg = channelConfig[content.channel];
              const sc = statusConfig[content.status];
              return (
                <div
                  key={content.id}
                  onClick={() => setSelectedContent(content)}
                  className="bg-white rounded-lg border p-4 cursor-pointer transition-all duration-150 hover:shadow-sm"
                  style={{ borderColor: selectedContent?.id === content.id ? '#D4A574' : '#E8E6E1' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded flex items-center justify-center text-[11px] text-white font-medium flex-shrink-0" style={{ backgroundColor: cfg.color }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{content.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: sc.color + '15', color: sc.color }}>{sc.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: '#999' }}>
                          <span>{cfg.desc}</span>
                          <span>适配：{content.adaptedBy}</span>
                          {content.wordCount > 0 && <span>{content.wordCount} 字</span>}
                          <span>排期：{content.scheduledAt}</span>
                        </div>
                      </div>
                    </div>
                    {content.metrics && (
                      <div className="flex items-center gap-4 ml-4 text-[11px]" style={{ color: '#6B6B6B' }}>
                        <span>{(content.metrics.views / 1000).toFixed(1)}k 阅读</span>
                        <span>{content.metrics.likes} 赞</span>
                        <span>{content.metrics.shares} 转</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedContent && (
        <div className="w-[300px] border-l overflow-y-auto bg-white" style={{ borderColor: '#E8E6E1' }}>
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: channelConfig[selectedContent.channel].color }}>
                  {channelConfig[selectedContent.channel].icon}
                </div>
                <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{selectedContent.channel}</span>
              </div>
              <button onClick={() => setSelectedContent(null)} className="p-1 rounded hover:bg-gray-100">
                <svg className="w-3.5 h-3.5" style={{ color: '#999' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{selectedContent.title}</h3>
          </div>

          {/* Channel Requirements */}
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>渠道要求</div>
            <div className="space-y-1.5">
              {channelConfig[selectedContent.channel].requirements.map(req => (
                <div key={req} className="flex items-center gap-2 text-[11px]" style={{ color: '#6B6B6B' }}>
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D4A574' }} />
                  {req}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>发布状态</div>
            <div className="flex gap-1">
              {(['draft', 'adapting', 'ready', 'published'] as const).map(s => (
                <button
                  key={s}
                  className="flex-1 py-1.5 rounded text-[10px] transition-colors"
                  style={{
                    backgroundColor: s === selectedContent.status ? statusConfig[s].color : '#F0EFEB',
                    color: s === selectedContent.status ? '#FFF' : '#999',
                  }}
                >
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics */}
          {selectedContent.metrics && (
            <div className="p-4">
              <div className="text-xs font-medium mb-3" style={{ color: '#1A1A1A' }}>发布效果</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAF8' }}>
                  <div className="text-sm font-semibold" style={{ color: '#D4A574' }}>{(selectedContent.metrics.views / 1000).toFixed(1)}k</div>
                  <div className="text-[10px]" style={{ color: '#999' }}>阅读</div>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAF8' }}>
                  <div className="text-sm font-semibold" style={{ color: '#4A7C59' }}>{selectedContent.metrics.likes}</div>
                  <div className="text-[10px]" style={{ color: '#999' }}>点赞</div>
                </div>
                <div className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAF8' }}>
                  <div className="text-sm font-semibold" style={{ color: '#5A7BA8' }}>{selectedContent.metrics.shares}</div>
                  <div className="text-[10px]" style={{ color: '#999' }}>转发</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
