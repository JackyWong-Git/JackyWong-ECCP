'use client';

import { useState } from 'react';
import { showToast } from '@/components/toast';

interface Scene {
  id: string;
  title: string;
  description: string;
  duration: number;
  notes: string;
  status: 'done' | 'in-progress' | 'todo';
  thumbnail: string;
}

const initialScenes: Scene[] = [
  { id: '1', title: '开场 - 城市天际线', description: '航拍镜头，从城市全景缓慢推进到主角所在的天台', duration: 8, notes: '需要无人机拍摄，黄昏光线', status: 'done', thumbnail: 'city' },
  { id: '2', title: '主角独白', description: '主角站在天台边缘，面对镜头讲述创作理念', duration: 15, notes: '特写镜头，浅景深', status: 'done', thumbnail: 'person' },
  { id: '3', title: '工作场景切换', description: '快速剪辑：打字、画图、讨论、咖啡杯', duration: 5, notes: '节奏感强，配合音乐鼓点', status: 'in-progress', thumbnail: 'desk' },
  { id: '4', title: '数据可视化', description: '展示内容传播数据的增长动画', duration: 10, notes: '使用动态图表，暖色调', status: 'todo', thumbnail: 'data' },
  { id: '5', title: '采访片段', description: '团队成员分享创作心得', duration: 20, notes: '双人对话构图', status: 'todo', thumbnail: 'interview' },
  { id: '6', title: '结尾 - 作品展示', description: '最终作品在屏幕上展开，镜头拉远', duration: 12, notes: '渐隐效果，配字幕', status: 'todo', thumbnail: 'screen' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'done': { label: '已完成', color: '#4A7C59', bg: '#E8F2EB' },
  'in-progress': { label: '进行中', color: '#C17B3E', bg: '#FFF3E0' },
  'todo': { label: '待开始', color: '#6B6B6B', bg: '#F0EDE8' },
};

const thumbnailColors: Record<string, string> = {
  city: '#6B8FA3',
  person: '#D4A574',
  desk: '#C17B3E',
  data: '#4A7C59',
  interview: '#A64D4D',
  screen: '#6B6B6B',
};

export function StoryboardTimeline() {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [selectedSceneId, setSelectedSceneId] = useState<string>('1');
  const [playhead, setPlayhead] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const completedCount = scenes.filter((s) => s.status === 'done').length;
  const progress = Math.round((completedCount / scenes.length) * 100);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simulate playback
      let current = playhead;
      const interval = setInterval(() => {
        current += 0.5;
        if (current >= totalDuration) {
          current = 0;
          setIsPlaying(false);
          clearInterval(interval);
        }
        setPlayhead(current);
      }, 500);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    setPlayhead(Math.round(ratio * totalDuration * 10) / 10);
  };

  // Drag and drop
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const newScenes = [...scenes];
    const [moved] = newScenes.splice(dragIdx, 1);
    newScenes.splice(idx, 0, moved);
    setScenes(newScenes);
    setDragIdx(null);
    setDragOverIdx(null);
    showToast('场景顺序已更新', 'info');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
        <div>
          <h2 className="text-base font-semibold" style={{ fontFamily: "'Noto Serif SC', serif", color: '#1A1A1A' }}>
            内容创作流程纪录片
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs" style={{ color: '#6B6B6B' }}>{scenes.length} 个场景</span>
            <span className="text-xs" style={{ color: '#D4D0C8' }}>|</span>
            <span className="text-xs" style={{ color: '#6B6B6B' }}>总时长 {formatTime(totalDuration)}</span>
            <span className="text-xs" style={{ color: '#D4D0C8' }}>|</span>
            <span className="text-xs font-medium" style={{ color: '#4A7C59' }}>{progress}% 完成</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded text-xs font-medium border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4D0C8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
            onClick={() => showToast('已导出分镜脚本', 'success')}
          >
            导出脚本
          </button>
          <button
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C49564'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D4A574'; }}
            onClick={() => showToast('新场景已添加', 'success')}
          >
            + 添加场景
          </button>
        </div>
      </div>

      {/* Playback controls + Timeline */}
      <div className="border-b" style={{ borderColor: '#E8E6E1' }}>
        {/* Controls */}
        <div className="flex items-center gap-3 px-6 py-2">
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#1A1A1A', color: '#FAFAF8' }}
            onClick={handlePlayToggle}
          >
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
            )}
          </button>
          <span className="text-xs font-mono" style={{ color: '#6B6B6B', minWidth: '48px' }}>
            {formatTime(playhead)} / {formatTime(totalDuration)}
          </span>
          <div className="flex-1" />
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded transition-colors"
              style={{ color: '#6B6B6B' }}
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /></svg>
            </button>
            <span className="text-xs px-1" style={{ color: '#9A9A9A' }}>{Math.round(zoom * 100)}%</span>
            <button
              className="p-1 rounded transition-colors"
              style={{ color: '#6B6B6B' }}
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /><path d="M11 8v6" /></svg>
            </button>
          </div>
        </div>

        {/* Timeline bar */}
        <div className="px-6 pb-3">
          <div
            className="relative h-10 rounded-md overflow-hidden cursor-pointer"
            style={{ backgroundColor: '#F0EDE8' }}
            onClick={handleTimelineClick}
          >
            {/* Scene segments */}
            <div className="absolute inset-0 flex">
              {scenes.map((scene, idx) => {
                const width = (scene.duration / totalDuration) * 100;
                const statusColor = statusConfig[scene.status].color;
                return (
                  <div
                    key={scene.id}
                    className="h-full border-r transition-opacity"
                    style={{
                      width: `${width}%`,
                      backgroundColor: statusColor + '20',
                      borderColor: '#E8E6E1',
                      opacity: dragIdx === idx ? 0.4 : 1,
                      borderLeft: idx === 0 ? 'none' : undefined,
                    }}
                  >
                    <div className="h-full flex items-center px-1 overflow-hidden">
                      <span className="text-xs truncate whitespace-nowrap" style={{ color: statusColor, fontSize: '10px' }}>
                        {scene.title.length > 6 ? scene.title.slice(0, 6) + '...' : scene.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 z-10 transition-all"
              style={{
                left: `${(playhead / totalDuration) * 100}%`,
                backgroundColor: '#D4A574',
                boxShadow: '0 0 4px rgba(212, 165, 116, 0.5)',
              }}
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D4A574' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Scene list */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className={`rounded-lg border p-3 cursor-pointer transition-all duration-150 ${dragOverIdx === idx ? 'border-[#D4A574] border-dashed' : ''}`}
                style={{
                  borderColor: selectedSceneId === scene.id ? '#D4A574' : '#E8E6E1',
                  backgroundColor: selectedSceneId === scene.id ? '#FFFDF9' : '#FFFFFF',
                  opacity: dragIdx === idx ? 0.4 : 1,
                  boxShadow: selectedSceneId === scene.id ? '0 1px 4px rgba(212, 165, 116, 0.1)' : 'none',
                }}
                onClick={() => setSelectedSceneId(scene.id)}
                onMouseEnter={(e) => {
                  if (selectedSceneId !== scene.id) {
                    e.currentTarget.style.borderColor = '#D4D0C8';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSceneId !== scene.id) {
                    e.currentTarget.style.borderColor = '#E8E6E1';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div
                    className="w-16 h-10 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: thumbnailColors[scene.thumbnail] + '15' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={thumbnailColors[scene.thumbnail]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{scene.title}</h4>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-2"
                        style={{ color: statusConfig[scene.status].color, backgroundColor: statusConfig[scene.status].bg }}
                      >
                        {statusConfig[scene.status].label}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: '#6B6B6B', lineHeight: '1.5' }}>{scene.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs flex items-center gap-1" style={{ color: '#9A9A9A' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {scene.duration}s
                      </span>
                      {scene.notes && (
                        <span className="text-xs flex items-center gap-1" style={{ color: '#9A9A9A' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                          有备注
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedScene && (
          <div className="w-72 border-l overflow-auto" style={{ borderColor: '#E8E6E1' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9A9A9A' }}>场景详情</span>
                <span className="text-xs font-mono" style={{ color: '#9A9A9A' }}>#{selectedScene.id}</span>
              </div>

              {/* Preview */}
              <div
                className="w-full aspect-video rounded-md mb-4 flex items-center justify-center"
                style={{ backgroundColor: thumbnailColors[selectedScene.thumbnail] + '10' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={thumbnailColors[selectedScene.thumbnail]} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>

              <h3 className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>{selectedScene.title}</h3>
              <p className="text-xs mb-4" style={{ color: '#6B6B6B', lineHeight: '1.6' }}>{selectedScene.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#6B6B6B' }}>时长</span>
                  <span className="text-xs font-mono font-medium" style={{ color: '#1A1A1A' }}>{selectedScene.duration}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#6B6B6B' }}>状态</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ color: statusConfig[selectedScene.status].color, backgroundColor: statusConfig[selectedScene.status].bg }}
                  >
                    {statusConfig[selectedScene.status].label}
                  </span>
                </div>
                {selectedScene.notes && (
                  <div>
                    <span className="text-xs block mb-1" style={{ color: '#6B6B6B' }}>备注</span>
                    <div className="p-2 rounded text-xs" style={{ backgroundColor: '#F5F3EF', color: '#6B6B6B', lineHeight: '1.6' }}>
                      {selectedScene.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t space-y-1.5" style={{ borderColor: '#E8E6E1' }}>
                <button
                  className="w-full px-3 py-1.5 rounded text-xs font-medium text-left transition-colors flex items-center gap-2"
                  style={{ color: '#6B6B6B' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F3EF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                  编辑场景
                </button>
                <button
                  className="w-full px-3 py-1.5 rounded text-xs font-medium text-left transition-colors flex items-center gap-2"
                  style={{ color: '#6B6B6B' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F3EF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onClick={() => showToast('已复制场景', 'success')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                  复制场景
                </button>
                <button
                  className="w-full px-3 py-1.5 rounded text-xs font-medium text-left transition-colors flex items-center gap-2"
                  style={{ color: '#A64D4D' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  删除场景
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
