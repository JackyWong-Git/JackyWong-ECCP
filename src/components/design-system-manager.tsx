'use client';

import { useState } from 'react';
import { showToast } from './toast';

const systems = [
  { id: 'wechat', label: '微信公众号', color: '#07C160', desc: '长文深度阅读，图文排版精致', tokens: { primary: '#07C160', bg: '#FFFFFF', text: '#333333' }, rules: { titleLen: '≤64字', coverSize: '900×383', tags: '3-5个' } },
  { id: 'xiaohongshu', label: '小红书', color: '#FF2442', desc: '种草笔记风格，图文并茂，生活化表达', tokens: { primary: '#FF2442', bg: '#FFF5F5', text: '#333333' }, rules: { titleLen: '≤20字', coverSize: '1080×1440', tags: '5-10个' } },
  { id: 'bilibili', label: 'B站', color: '#00A1D6', desc: '年轻化表达，弹幕互动，视频优先', tokens: { primary: '#00A1D6', bg: '#F0F8FF', text: '#222222' }, rules: { titleLen: '≤80字', coverSize: '1146×717', tags: '5-8个' } },
  { id: 'douyin', label: '抖音', color: '#161823', desc: '短视频文案，钩子开头，节奏紧凑', tokens: { primary: '#161823', bg: '#FFFFFF', text: '#333333' }, rules: { titleLen: '≤30字', coverSize: '1080×1920', tags: '3-5个' } },
  { id: 'newsletter', label: 'Newsletter', color: '#D4A574', desc: '邮件通讯，专业深度，订阅者关系维护', tokens: { primary: '#D4A574', bg: '#FAFAF8', text: '#1A1A1A' }, rules: { titleLen: '≤50字', coverSize: '600×300', tags: '2-3个' } },
  { id: 'internal', label: '内刊', color: '#6B6B6B', desc: '企业文化，正式严谨，品牌调性统一', tokens: { primary: '#6B6B6B', bg: '#FAFAF8', text: '#1A1A1A' }, rules: { titleLen: '≤30字', coverSize: 'A4竖版', tags: '无' } },
];

export function DesignSystemManager() {
  const [selected, setSelected] = useState('wechat');
  const activeSystem = systems.find(s => s.id === selected)!;

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Left: System List */}
      <div className="w-[280px] border-r overflow-auto" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>设计系统</h2>
          <button
            onClick={() => showToast('新建设计系统', 'info')}
            className="text-[12px] px-2 py-1 rounded"
            style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}
          >+ 新建</button>
        </div>
        <div className="p-2">
          {systems.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className="w-full p-3 rounded mb-1 text-left transition-all"
              style={{
                backgroundColor: selected === s.id ? '#F5F0EB' : 'transparent',
                borderLeft: selected === s.id ? `3px solid ${s.color}` : '3px solid transparent',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{s.label}</span>
              </div>
              <p className="text-[11px] line-clamp-1" style={{ color: '#999' }}>{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: System Detail */}
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-5 h-5 rounded-full" style={{ backgroundColor: activeSystem.color }} />
            <h1 className="text-[22px] font-semibold" style={{ color: '#1A1A1A', fontFamily: 'Noto Serif SC, serif' }}>{activeSystem.label}</h1>
          </div>

          {/* Brand Overview */}
          <div className="mb-6 p-5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#1A1A1A' }}>品牌概述</h3>
            <p className="text-[14px] leading-[1.7]" style={{ color: '#444' }}>{activeSystem.desc}</p>
          </div>

          {/* Visual Tokens */}
          <div className="mb-6 p-5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#1A1A1A' }}>视觉 Token</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(activeSystem.tokens).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: '#FAFAF8' }}>
                  <span className="w-6 h-6 rounded border" style={{ backgroundColor: val, borderColor: '#E8E6E1' }} />
                  <div>
                    <div className="text-[11px] font-medium" style={{ color: '#666' }}>{key}</div>
                    <div className="text-[10px] font-mono" style={{ color: '#999' }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Rules */}
          <div className="mb-6 p-5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#1A1A1A' }}>渠道规范</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(activeSystem.rules).map(([key, val]) => (
                <div key={key} className="p-3 rounded" style={{ backgroundColor: '#FAFAF8' }}>
                  <div className="text-[11px]" style={{ color: '#999' }}>
                    {key === 'titleLen' ? '标题长度' : key === 'coverSize' ? '封面尺寸' : '标签数量'}
                  </div>
                  <div className="text-[14px] font-medium mt-1" style={{ color: '#1A1A1A' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Tone */}
          <div className="p-5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: '#1A1A1A' }}>内容调性</h3>
            <div className="flex flex-wrap gap-2">
              {['专业', '温暖', '创新', '用户至上', '匠心精神'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-[12px]" style={{ backgroundColor: `${activeSystem.color}10`, color: activeSystem.color }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
