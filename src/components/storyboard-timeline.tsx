'use client';

import { useState } from 'react';

interface Scene {
  id: string;
  title: string;
  description: string;
  duration: string;
  notes: string;
  status: 'todo' | 'in-progress' | 'done';
  color: string;
}

const mockScenes: Scene[] = [
  { id: '1', title: '开场 - 城市日出', description: '航拍城市天际线，日出光线逐渐照亮建筑', duration: '0:00-0:15', notes: '需要无人机素材', status: 'done', color: '#D4A574' },
  { id: '2', title: '主持人出场', description: '主持人在工作室中，面对镜头介绍主题', duration: '0:15-0:45', notes: '双机位拍摄', status: 'done', color: '#6B8FA3' },
  { id: '3', title: '数据展示', description: '动态图表展示行业数据，配合旁白解说', duration: '0:45-1:30', notes: 'Motion Graphics', status: 'in-progress', color: '#4A7C59' },
  { id: '4', title: '专家访谈', description: '与行业专家对话，讨论核心观点', duration: '1:30-3:00', notes: '远程连线', status: 'in-progress', color: '#C17B3E' },
  { id: '5', title: '案例演示', description: '屏幕录制展示实际操作流程', duration: '3:00-4:30', notes: '需要后期配音', status: 'todo', color: '#A64D4D' },
  { id: '6', title: '总结与 CTA', description: '回顾要点，引导观众关注和互动', duration: '4:30-5:00', notes: '配乐渐强', status: 'todo', color: '#6B6B6B' },
];

const statusLabel: Record<string, string> = {
  'todo': '待制作',
  'in-progress': '制作中',
  'done': '已完成',
};

const statusColor: Record<string, { text: string; bg: string }> = {
  'todo': { text: '#6B6B6B', bg: '#F0EDE8' },
  'in-progress': { text: '#C17B3E', bg: '#FFF3E0' },
  'done': { text: '#4A7C59', bg: '#E8F2EB' },
};

export function StoryboardTimeline() {
  const [scenes, setScenes] = useState<Scene[]>(mockScenes);
  const [selectedScene, setSelectedScene] = useState<string | null>('3');
  const [totalDuration] = useState('5:00');

  const selected = scenes.find((s) => s.id === selectedScene);

  const progress = (scenes.filter((s) => s.status === 'done').length / scenes.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E8E6E1' }}>
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif", color: '#1A1A1A' }}>
            2025 年内容创作趋势报告 - 视频分镜
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs" style={{ color: '#6B6B6B' }}>总时长: {totalDuration}</span>
            <span className="text-xs" style={{ color: '#6B6B6B' }}>{scenes.length} 个场景</span>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E6E1' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#4A7C59' }} />
              </div>
              <span className="text-xs" style={{ color: '#4A7C59' }}>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded text-xs font-medium border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}>
            导出 PDF
          </button>
          <button
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
          >
            + 添加场景
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Timeline */}
        <div className="flex-1 overflow-auto p-6">
          {/* Timeline bar */}
          <div className="mb-6 px-2">
            <div className="flex items-center h-8 rounded-md overflow-hidden" style={{ backgroundColor: '#F0EDE8' }}>
              {scenes.map((scene) => {
                const durParts = scene.duration.split('-');
                const startSec = timeToSec(durParts[0]);
                const endSec = timeToSec(durParts[1]);
                const totalSec = 300; // 5 min
                const left = (startSec / totalSec) * 100;
                const width = ((endSec - startSec) / totalSec) * 100;
                return (
                  <div
                    key={scene.id}
                    className="h-full cursor-pointer transition-opacity relative group"
                    style={{
                      marginLeft: scene.id === scenes[0].id ? `${left}%` : '0',
                      width: `${width}%`,
                      backgroundColor: scene.color,
                      opacity: selectedScene === scene.id ? 1 : 0.6,
                    }}
                    onClick={() => setSelectedScene(scene.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = selectedScene === scene.id ? '1' : '0.6'; }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-1">
                      {scene.title.slice(0, 6)}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Time markers */}
            <div className="flex justify-between mt-1 px-1">
              {['0:00', '1:00', '2:00', '3:00', '4:00', '5:00'].map((t) => (
                <span key={t} className="text-xs" style={{ color: '#9A9A9A' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Scene cards */}
          <div className="space-y-3">
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="flex gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-150 animate-fade-in-left"
                style={{
                  borderColor: selectedScene === scene.id ? '#D4A574' : '#E8E6E1',
                  backgroundColor: selectedScene === scene.id ? '#FFFDF9' : '#FFFFFF',
                  animationDelay: `${idx * 50}ms`,
                  boxShadow: selectedScene === scene.id ? '0 2px 8px rgba(212,165,116,0.1)' : 'none',
                }}
                onClick={() => setSelectedScene(scene.id)}
                onMouseEnter={(e) => {
                  if (selectedScene !== scene.id) {
                    e.currentTarget.style.borderColor = '#D4D0C8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedScene !== scene.id) {
                    e.currentTarget.style.borderColor = '#E8E6E1';
                  }
                }}
              >
                {/* Scene number */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ backgroundColor: scene.color + '20', color: scene.color }}
                >
                  {idx + 1}
                </div>

                {/* Scene info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{scene.title}</h3>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{ color: statusColor[scene.status].text, backgroundColor: statusColor[scene.status].bg }}
                    >
                      {statusLabel[scene.status]}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#6B6B6B' }}>{scene.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs flex items-center gap-1" style={{ color: '#9A9A9A' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {scene.duration}
                    </span>
                    {scene.notes && (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#9A9A9A' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                        {scene.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scene color indicator */}
                <div className="w-1 rounded-full self-stretch" style={{ backgroundColor: scene.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 border-l overflow-auto p-4" style={{ borderColor: '#E8E6E1', backgroundColor: '#F9F8F6' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }}>
              场景详情
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6B6B' }}>标题</label>
                <div className="text-sm px-2 py-1.5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
                  {selected.title}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6B6B' }}>描述</label>
                <div className="text-sm px-2 py-1.5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
                  {selected.description}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6B6B' }}>时间范围</label>
                <div className="text-sm px-2 py-1.5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
                  {selected.duration}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6B6B' }}>备注</label>
                <div className="text-sm px-2 py-1.5 rounded border" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
                  {selected.notes || '暂无备注'}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6B6B' }}>状态</label>
                <div className="flex gap-1">
                  {Object.entries(statusLabel).map(([key, label]) => (
                    <button
                      key={key}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: selected.status === key ? statusColor[key].bg : 'transparent',
                        color: selected.status === key ? statusColor[key].text : '#9A9A9A',
                        border: `1px solid ${selected.status === key ? statusColor[key].text + '40' : '#E8E6E1'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Thumbnail placeholder */}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#6B6B6B' }}>分镜草图</label>
                <div
                  className="aspect-video rounded border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' }}
                >
                  <span className="text-xs" style={{ color: '#9A9A9A' }}>拖拽上传草图</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function timeToSec(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}
