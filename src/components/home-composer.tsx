'use client';

import { useState } from 'react';
import { showToast } from './toast';

const skills = [
  { id: 'topic-analysis', label: '选题分析', desc: '从热点/数据中发现选题', icon: '🔍', color: '#D4A574' },
  { id: 'script-gen', label: '脚本生成', desc: 'AI 辅助生成内容脚本', icon: '✍️', color: '#4A7C59' },
  { id: 'channel-adapt', label: '多渠道适配', desc: '一键适配多平台格式', icon: '📱', color: '#5B7FC0' },
  { id: 'data-report', label: '数据报告', desc: '自动生成传播效果报告', icon: '📊', color: '#C17B3E' },
  { id: 'cover-design', label: '封面设计', desc: 'AI 生成渠道封面图', icon: '🎨', color: '#A64D4D' },
  { id: 'auto-publish', label: '自动化发布', desc: '定时多平台同步发布', icon: '🚀', color: '#7B68AE' },
];

const designSystems = [
  { id: 'wechat', label: '微信公众号', color: '#07C160' },
  { id: 'xiaohongshu', label: '小红书', color: '#FF2442' },
  { id: 'bilibili', label: 'B站', color: '#00A1D6' },
  { id: 'douyin', label: '抖音', color: '#161823' },
  { id: 'newsletter', label: 'Newsletter', color: '#D4A574' },
  { id: 'internal', label: '内刊', color: '#6B6B6B' },
];

const recentProjects = [
  { id: '1', title: '22周年传播规划', skill: '多渠道适配', updated: '2小时前', status: '进行中' },
  { id: '2', title: '7月产品亮点解读', skill: '脚本生成', updated: '昨天', status: '已完成' },
  { id: '3', title: '讲车帝大赛宣传', skill: '选题分析', updated: '3天前', status: '进行中' },
];

export function HomeComposer() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedDS, setSelectedDS] = useState<string | null>(null);
  const [brief, setBrief] = useState('');

  const handleRun = () => {
    if (!selectedSkill) { showToast('请先选择一个技能', 'error'); return; }
    if (!brief.trim()) { showToast('请输入创作简报', 'error'); return; }
    showToast('创作任务已启动，正在生成...', 'success');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] p-8">
      <div className="w-full max-w-[720px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold mb-2" style={{ color: '#1A1A1A', fontFamily: 'Noto Serif SC, serif', letterSpacing: '-0.02em' }}>
            今天要创作什么？
          </h1>
          <p className="text-[14px]" style={{ color: '#6B6B6B' }}>
            选择技能，绑定设计系统，输入简报，一键启动创作
          </p>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <label className="text-[12px] font-medium mb-2 block" style={{ color: '#6B6B6B' }}>选择技能</label>
          <div className="grid grid-cols-3 gap-2">
            {skills.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSkill(s.id)}
                className="flex items-center gap-2.5 p-3 rounded border text-left transition-all"
                style={{
                  borderColor: selectedSkill === s.id ? s.color : '#E8E6E1',
                  backgroundColor: selectedSkill === s.id ? `${s.color}08` : '#FFF',
                }}
              >
                <span className="text-[18px]">{s.icon}</span>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{s.label}</div>
                  <div className="text-[11px]" style={{ color: '#999' }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Design System */}
        <div className="mb-6">
          <label className="text-[12px] font-medium mb-2 block" style={{ color: '#6B6B6B' }}>绑定设计系统</label>
          <div className="flex flex-wrap gap-2">
            {designSystems.map(ds => (
              <button
                key={ds.id}
                onClick={() => setSelectedDS(ds.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-all"
                style={{
                  borderColor: selectedDS === ds.id ? ds.color : '#E8E6E1',
                  backgroundColor: selectedDS === ds.id ? `${ds.color}10` : '#FFF',
                  color: selectedDS === ds.id ? ds.color : '#6B6B6B',
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ds.color }} />
                {ds.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brief */}
        <div className="mb-6">
          <label className="text-[12px] font-medium mb-2 block" style={{ color: '#6B6B6B' }}>创作简报</label>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder="描述你要创作的内容，例如：为22周年活动写一篇公众号推文，主题是员工故事征集..."
            className="w-full h-[120px] p-3 rounded border resize-none text-[14px] leading-relaxed focus:outline-none"
            style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF', color: '#1A1A1A' }}
          />
        </div>

        {/* Run */}
        <button
          onClick={handleRun}
          className="w-full py-2.5 rounded text-[14px] font-medium transition-all"
          style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#C99560')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#D4A574')}
        >
          开始创作
        </button>

        {/* Recent */}
        <div className="mt-8">
          <h3 className="text-[12px] font-medium mb-3" style={{ color: '#6B6B6B' }}>最近项目</h3>
          <div className="space-y-2">
            {recentProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded border cursor-pointer transition-all hover:-translate-y-[1px]" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{p.title}</div>
                    <div className="text-[11px]" style={{ color: '#999' }}>{p.skill} · {p.updated}</div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded" style={{
                  backgroundColor: p.status === '进行中' ? '#D4A57420' : '#4A7C5920',
                  color: p.status === '进行中' ? '#C17B3E' : '#4A7C59',
                }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
