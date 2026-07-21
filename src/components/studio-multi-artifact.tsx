'use client';

import { useState } from 'react';
import { showToast } from './toast';

const channels = [
  { id: 'wechat', label: '微信公众号', color: '#07C160', status: 'ready', wordCount: 2800, fit: 95 },
  { id: 'xiaohongshu', label: '小红书', color: '#FF2442', status: 'ready', wordCount: 800, fit: 88 },
  { id: 'bilibili', label: 'B站专栏', color: '#00A1D6', status: 'ready', wordCount: 3200, fit: 92 },
  { id: 'douyin', label: '抖音文案', color: '#161823', status: 'draft', wordCount: 300, fit: 76 },
  { id: 'newsletter', label: 'Newsletter', color: '#D4A574', status: 'ready', wordCount: 2000, fit: 90 },
  { id: 'internal', label: '内刊', color: '#6B6B6B', status: 'draft', wordCount: 4000, fit: 85 },
];

export function StudioMultiArtifact() {
  const [activeChannel, setActiveChannel] = useState('wechat');
  const [sourceScript] = useState(`# 22周年：我们一起走过的故事

广汽丰田迎来22岁生日。22年，不只是数字，是无数个日夜的坚守与创新。

## 从第一辆车到百万信赖

2004年，第一辆凯美瑞下线。那一刻，广汽丰田的故事开始了。

## 员工故事征集

我们邀请了来自不同部门的同事，分享他们与广丰的故事。有老员工的坚守，有新人的成长，有团队的拼搏。

## 展望未来

22岁，正值青春。我们将继续以匠心精神，为每一位用户创造价值。`);

  const activeCh = channels.find(c => c.id === activeChannel)!;

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Left: Source Script */}
      <div className="w-[360px] border-r overflow-auto" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>源脚本</h2>
          <p className="text-[11px] mt-0.5" style={{ color: '#999' }}>编辑一次，适配全渠道</p>
        </div>
        <div className="p-4">
          <div className="text-[13px] leading-[1.8] whitespace-pre-wrap" style={{ color: '#333' }}>
            {sourceScript}
          </div>
        </div>
      </div>

      {/* Middle: Channel Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeCh.color }} />
            <h2 className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>{activeCh.label} 预览</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded" style={{
              backgroundColor: activeCh.fit >= 90 ? '#4A7C5920' : '#C17B3E20',
              color: activeCh.fit >= 90 ? '#4A7C59' : '#C17B3E',
            }}>适配度 {activeCh.fit}%</span>
            <button
              onClick={() => showToast('已发布到' + activeCh.label, 'success')}
              className="px-3 py-1 rounded text-[12px] font-medium"
              style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
            >发布</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#FAFAF8' }}>
          <div className="max-w-[640px] mx-auto bg-white rounded p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="text-[13px] leading-[1.8] whitespace-pre-wrap" style={{ color: '#333' }}>
              {`[${activeCh.label} 适配版本]\n\n`}
              {sourceScript}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Channel List */}
      <div className="w-[240px] border-l overflow-auto" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>渠道列表</h2>
        </div>
        <div className="p-2">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className="w-full p-3 rounded mb-1 text-left transition-all"
              style={{
                backgroundColor: activeChannel === ch.id ? '#F5F0EB' : 'transparent',
                borderLeft: activeChannel === ch.id ? `3px solid ${ch.color}` : '3px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{ch.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                  backgroundColor: ch.status === 'ready' ? '#4A7C5920' : '#C17B3E20',
                  color: ch.status === 'ready' ? '#4A7C59' : '#C17B3E',
                }}>{ch.status === 'ready' ? '就绪' : '草稿'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: '#999' }}>
                <span>{ch.wordCount}字</span>
                <span>·</span>
                <span>适配 {ch.fit}%</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t" style={{ borderColor: '#E8E6E1' }}>
          <button
            onClick={() => showToast('全渠道批量发布已启动', 'success')}
            className="w-full py-2 rounded text-[12px] font-medium"
            style={{ backgroundColor: '#1A1A1A', color: '#D4A574' }}
          >全渠道发布</button>
        </div>
      </div>
    </div>
  );
}
