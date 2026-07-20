'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { showToast } from '@/components/toast';

interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'quote' | 'code' | 'list' | 'image' | 'divider' | 'note';
  content: string;
}

interface ChannelConfig {
  id: string;
  name: string;
  icon: string;
  maxWords: number;
  format: string;
  status: 'idle' | 'adapting' | 'done';
}

const channels: ChannelConfig[] = [
  { id: 'wechat', name: '公众号', icon: '微', maxWords: 5000, format: '长文', status: 'idle' },
  { id: 'xhs', name: '小红书', icon: '红', maxWords: 1000, format: '图文笔记', status: 'idle' },
  { id: 'bilibili', name: 'B站', icon: 'B', maxWords: 3000, format: '视频脚本', status: 'idle' },
  { id: 'douyin', name: '抖音', icon: '抖', maxWords: 500, format: '短视频文案', status: 'idle' },
  { id: 'newsletter', name: 'Newsletter', icon: 'N', maxWords: 3000, format: '邮件通讯', status: 'idle' },
  { id: 'internal', name: '内刊', icon: '刊', maxWords: 8000, format: '深度报告', status: 'idle' },
];

const initialBlocks: Block[] = [
  { id: '1', type: 'heading', content: '如何构建高效的内容工作流' },
  { id: '2', type: 'paragraph', content: '在当今快节奏的内容创作环境中，一套高效的工作流不仅能提升产出质量，还能大幅减少团队协作中的摩擦成本。本文将从实际经验出发，分享一套经过验证的内容生产流程。' },
  { id: '3', type: 'heading', content: '第一步：选题池管理' },
  { id: '4', type: 'paragraph', content: '好的内容始于好的选题。我们维护一个动态的选题池，所有团队成员都可以随时提交灵感。选题池每周评审一次，根据时效性、受众匹配度和资源可行性进行优先级排序。' },
  { id: '5', type: 'quote', content: '内容创作的本质不是写得快，而是想得清楚。选题阶段多花 30% 的时间，能让后续写作效率提升 50%。' },
  { id: '6', type: 'heading', content: '第二步：结构化写作' },
  { id: '7', type: 'paragraph', content: '使用块编辑器进行结构化写作，每个段落都是一个独立的"块"。这种方式让内容的组织更加灵活，也方便后续的编辑和重新排列。' },
  { id: '8', type: 'list', content: '先写大纲，确定核心论点\n逐块展开，每块一个核心观点\n最后串联，确保逻辑流畅' },
  { id: '9', type: 'note', content: '注意：每个渠道的内容适配应该在写作完成后统一进行，避免边写边改导致思路混乱。' },
  { id: '10', type: 'divider', content: '' },
  { id: '11', type: 'paragraph', content: '输入 / 唤起菜单，插入内容块...' },
];

const slashMenuItems = [
  { type: 'heading', label: '标题', desc: '大号段落标题', icon: 'H' },
  { type: 'paragraph', label: '正文', desc: '普通文本段落', icon: 'T' },
  { type: 'quote', label: '引用', desc: '引用文本块', icon: '\u201C' },
  { type: 'code', label: '代码', desc: '代码块', icon: '<>' },
  { type: 'list', label: '列表', desc: '无序列表', icon: '\u2022' },
  { type: 'image', label: '图片', desc: '插入图片', icon: '\u25A3' },
  { type: 'note', label: '备注', desc: '编辑备注', icon: '\u26A0' },
  { type: 'divider', label: '分割线', desc: '水平分割线', icon: '\u2014' },
];

type EditorTab = 'edit' | 'preview' | 'diff';
type RightPanel = 'channels' | 'meta' | 'versions' | 'ai';

export function ScriptEditor() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [channelStates, setChannelStates] = useState(channels);
  const [rightPanel, setRightPanel] = useState<RightPanel>('channels');
  const [editorTab, setEditorTab] = useState<EditorTab>('edit');
  const [showToc, setShowToc] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [versions, setVersions] = useState([
    { id: '1', time: '10 分钟前', author: '陈默', desc: '修改了第三段落' },
    { id: '2', time: '1 小时前', author: '李华', desc: '添加了引用块' },
    { id: '3', time: '昨天', author: '陈默', desc: '初始版本' },
  ]);

  const editorRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLInputElement | HTMLTextAreaElement>>(new Map());
  const idCounter = useRef(0);
  const nextId = () => { idCounter.current += 1; return String(idCounter.current + 1000); };

  const headings = blocks.filter(b => b.type === 'heading' && b.content);
  const totalChars = blocks.reduce((acc, b) => acc + b.content.length, 0);
  const readTime = Math.max(1, Math.ceil(totalChars / 500));

  const autoResize = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const idx = blocks.findIndex(b => b.id === block.id);
      const newBlock: Block = { id: nextId(), type: 'paragraph', content: '' };
      const newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
      setBlocks(newBlocks);
      setTimeout(() => blockRefs.current.get(newBlock.id)?.focus(), 0);
    }
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      const idx = blocks.findIndex(b => b.id === block.id);
      const prevBlock = blocks[idx - 1];
      setBlocks(blocks.filter(b => b.id !== block.id));
      if (prevBlock) setTimeout(() => blockRefs.current.get(prevBlock.id)?.focus(), 0);
    }
    if (e.key === '/') {
      const el = e.target as HTMLElement;
      const rect = el.getBoundingClientRect();
      setSlashMenuPos({ top: rect.bottom + 4, left: rect.left });
      setShowSlashMenu(true);
      setSlashFilter('');
    }
  };

  const insertBlock = (type: Block['type']) => {
    const newBlock: Block = { id: nextId(), type, content: type === 'divider' ? '' : '' };
    const idx = blocks.findIndex(b => b.id === activeBlockId);
    const newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    setBlocks(newBlocks);
    setShowSlashMenu(false);
    setTimeout(() => {
      if (type !== 'divider') blockRefs.current.get(newBlock.id)?.focus();
    }, 0);
    showToast(`已插入${slashMenuItems.find(i => i.type === type)?.label || '内容块'}`, 'success');
  };

  const [channelResults, setChannelResults] = useState<Record<string, string>>({});

  const handleAdaptChannel = async (channelId: string) => {
    setChannelStates(prev => prev.map(c => c.id === channelId ? { ...c, status: 'adapting' } : c));

    const content = blocks.map(b => b.content).filter(Boolean).join('\n\n');
    if (!content.trim()) {
      showToast('编辑器内容为空，无法适配', 'error');
      setChannelStates(prev => prev.map(c => c.id === channelId ? { ...c, status: 'idle' } : c));
      return;
    }

    try {
      const res = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, targetChannel: channelId }),
      });

      if (!res.ok) throw new Error('Adapt request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) result += parsed.text;
                if (parsed.error) throw new Error(parsed.error);
              } catch { /* skip non-JSON lines */ }
            }
          }
        }
      }

      setChannelResults(prev => ({ ...prev, [channelId]: result }));
      setChannelStates(prev => prev.map(c => c.id === channelId ? { ...c, status: 'done' } : c));
      showToast(`${channels.find(c => c.id === channelId)?.name} 适配完成`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '适配失败';
      setChannelStates(prev => prev.map(c => c.id === channelId ? { ...c, status: 'idle' } : c));
      showToast(msg, 'error');
    }
  };

  const handleSaveVersion = () => {
    const newVersion = { id: String(Date.now()), time: '刚刚', author: '陈默', desc: '手动保存' };
    setVersions(prev => [newVersion, ...prev]);
    showToast('版本已保存', 'success');
  };

  const renderBlock = (block: Block) => {
    const commonProps = {
      ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => { if (el) { blockRefs.current.set(block.id, el); autoResize(el); } },
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateBlock(block.id, e.target.value),
      onFocus: () => setActiveBlockId(block.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block),
      className: 'w-full bg-transparent outline-none resize-none',
      style: { fontFamily: "'Noto Sans SC', 'Inter', sans-serif" } as React.CSSProperties,
    };

    switch (block.type) {
      case 'heading':
        return (
          <div className="group relative flex items-start gap-1 py-1" style={{ marginTop: '1.2em' }}>
            <input {...commonProps} type="text" className="text-xl font-semibold bg-transparent outline-none w-full" style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }} />
          </div>
        );
      case 'paragraph':
        return (
          <div className="group relative flex items-start gap-1 py-0.5">
            <textarea {...commonProps} rows={1} className="text-[15px] leading-[1.7] bg-transparent outline-none resize-none w-full" style={{ color: '#333' }} />
          </div>
        );
      case 'quote':
        return (
          <div className="group relative flex items-start gap-1 py-1 pl-4" style={{ borderLeft: '3px solid #D4A574' }}>
            <textarea {...commonProps} rows={1} className="text-[15px] italic leading-[1.7] bg-transparent outline-none resize-none w-full" style={{ color: '#6B6B6B' }} />
          </div>
        );
      case 'code':
        return (
          <div className="group relative py-2 px-4 rounded-md my-2" style={{ backgroundColor: '#1A1A1A' }}>
            <textarea {...commonProps} rows={3} className="text-sm leading-relaxed bg-transparent outline-none resize-none w-full" style={{ color: '#D4A574', fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
        );
      case 'list':
        return (
          <div className="group relative py-1 pl-6">
            <textarea {...commonProps} rows={3} className="text-[15px] leading-[1.7] bg-transparent outline-none resize-none w-full list-disc" style={{ color: '#333' }} />
          </div>
        );
      case 'note':
        return (
          <div className="group relative py-2 px-4 rounded-md my-2 flex items-start gap-2" style={{ backgroundColor: '#FFF3E0', border: '1px solid #E8D5C0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C17B3E" strokeWidth="1.5" className="mt-0.5 flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <textarea {...commonProps} rows={1} className="text-sm leading-relaxed bg-transparent outline-none resize-none w-full" style={{ color: '#8B6914' }} />
          </div>
        );
      case 'image':
        return (
          <div className="group relative py-2 my-2">
            <div className="flex items-center justify-center rounded-md border-2 border-dashed p-8" style={{ borderColor: '#E8E6E1', backgroundColor: '#F8F7F4' }}>
              <div className="text-center">
                <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                <span className="text-sm" style={{ color: '#9A9A9A' }}>点击或拖拽上传图片</span>
              </div>
            </div>
          </div>
        );
      case 'divider':
        return (
          <div className="group relative py-3 my-1">
            <hr style={{ borderColor: '#E8E6E1' }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-2 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-1">
            {(['edit', 'preview', 'diff'] as EditorTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setEditorTab(tab)}
                className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                style={{
                  backgroundColor: editorTab === tab ? '#1A1A1A' : 'transparent',
                  color: editorTab === tab ? '#fff' : '#6B6B6B',
                }}
              >
                {tab === 'edit' ? '编辑' : tab === 'preview' ? '预览' : '对比'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#9A9A9A' }}>{totalChars} 字 / 约 {readTime} 分钟</span>
            <button onClick={() => setShowToc(!showToc)} className="text-xs px-2 py-1 rounded transition-colors" style={{ color: showToc ? '#D4A574' : '#9A9A9A', backgroundColor: showToc ? '#F0EDE8' : 'transparent' }}>
              目录
            </button>
            <button onClick={handleSaveVersion} className="text-xs px-2.5 py-1 rounded-md" style={{ border: '1px solid #E8E6E1', color: '#6B6B6B' }}>
              保存版本
            </button>
            <button
              onClick={() => showToast('已提交审核', 'success')}
              className="text-xs px-3 py-1.5 rounded-md font-medium"
              style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
            >
              提交审核
            </button>
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-8 py-8" ref={editorRef}>
            {/* Title area */}
            <div className="mb-6 pb-4" style={{ borderBottom: '1px solid #E8E6E1' }}>
              <div className="text-xs mb-2" style={{ color: '#9A9A9A' }}>脚本标题</div>
              <input
                type="text"
                defaultValue="如何构建高效的内容工作流"
                className="text-2xl font-semibold bg-transparent outline-none w-full"
                style={{ color: '#1A1A1A', fontFamily: "'Noto Serif SC', serif" }}
              />
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#FFF3E0', color: '#C17B3E' }}>草稿</span>
                <span className="text-xs" style={{ color: '#9A9A9A' }}>最后编辑：10 分钟前</span>
                <span className="text-xs" style={{ color: '#9A9A9A' }}>作者：陈默</span>
              </div>
            </div>

            {/* Blocks */}
            {blocks.map((block) => (
              <div key={block.id} className="relative">
                {renderBlock(block)}
              </div>
            ))}

            {/* Slash menu */}
            {showSlashMenu && (
              <div
                className="fixed z-50 w-56 rounded-lg border py-1 shadow-lg"
                style={{ top: slashMenuPos.top, left: slashMenuPos.left, backgroundColor: '#fff', borderColor: '#E8E6E1' }}
              >
                <div className="px-3 py-1.5 border-b" style={{ borderColor: '#E8E6E1' }}>
                  <input
                    type="text"
                    placeholder="搜索..."
                    value={slashFilter}
                    onChange={(e) => setSlashFilter(e.target.value)}
                    className="w-full text-xs bg-transparent outline-none"
                    style={{ color: '#1A1A1A' }}
                    autoFocus
                  />
                </div>
                {slashMenuItems
                  .filter(item => !slashFilter || item.label.includes(slashFilter))
                  .map(item => (
                    <button
                      key={item.type}
                      onClick={() => insertBlock(item.type as Block['type'])}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors"
                      style={{ color: '#1A1A1A' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8F7F4'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>{item.icon}</span>
                      <div>
                        <div className="text-sm">{item.label}</div>
                        <div className="text-xs" style={{ color: '#9A9A9A' }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-[320px] border-l flex flex-col" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
        {/* Panel tabs */}
        <div className="flex border-b" style={{ borderColor: '#E8E6E1' }}>
          {([
            { id: 'channels' as RightPanel, label: '渠道适配' },
            { id: 'meta' as RightPanel, label: '元数据' },
            { id: 'versions' as RightPanel, label: '版本' },
            { id: 'ai' as RightPanel, label: 'AI' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setRightPanel(tab.id)}
              className="flex-1 py-2.5 text-xs font-medium transition-colors relative"
              style={{ color: rightPanel === tab.id ? '#D4A574' : '#6B6B6B' }}
            >
              {tab.label}
              {rightPanel === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: '#D4A574' }} />}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {rightPanel === 'channels' && (
            <div className="space-y-3">
              <div className="text-xs mb-3" style={{ color: '#9A9A9A' }}>一键适配多渠道输出</div>
              {channelStates.map(ch => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
                  style={{
                    borderColor: selectedChannel === ch.id ? '#D4A574' : '#E8E6E1',
                    backgroundColor: selectedChannel === ch.id ? '#F8F7F4' : '#fff',
                  }}
                  onClick={() => setSelectedChannel(ch.id === selectedChannel ? null : ch.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>
                      {ch.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{ch.name}</div>
                      <div className="text-xs" style={{ color: '#9A9A9A' }}>{ch.format} / {ch.maxWords}字</div>
                    </div>
                  </div>
                  <div>
                    {ch.status === 'idle' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdaptChannel(ch.id); }}
                        className="text-xs px-2.5 py-1 rounded-md font-medium"
                        style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}
                      >
                        适配
                      </button>
                    )}
                    {ch.status === 'adapting' && (
                      <span className="text-xs px-2.5 py-1 rounded-md" style={{ color: '#C17B3E' }}>适配中...</span>
                    )}
                    {ch.status === 'done' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); showToast(`查看${ch.name}版本`, 'info'); }}
                        className="text-xs px-2.5 py-1 rounded-md font-medium"
                        style={{ backgroundColor: '#E8F2EB', color: '#4A7C59' }}
                      >
                        查看
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setChannelStates(prev => prev.map(c => ({ ...c, status: 'idle' })));
                  channels.forEach((ch, i) => {
                    setTimeout(() => handleAdaptChannel(ch.id), i * 500);
                  });
                }}
                className="w-full mt-2 py-2 text-sm font-medium rounded-md"
                style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
              >
                全渠道一键适配
              </button>
            </div>
          )}

          {rightPanel === 'meta' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>分类</label>
                <select className="w-full px-3 py-1.5 text-sm rounded-md border outline-none" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }}>
                  <option>方法论</option>
                  <option>行业洞察</option>
                  <option>教程</option>
                  <option>观点</option>
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>标签</label>
                <div className="flex flex-wrap gap-1.5">
                  {['工作流', '效率', '团队协作'].map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md flex items-center gap-1" style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}>
                      {tag}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>作者</label>
                <div className="flex items-center gap-2 p-2 rounded-md" style={{ backgroundColor: '#F0EDE8' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}>陈</div>
                  <span className="text-sm" style={{ color: '#1A1A1A' }}>陈默</span>
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>SEO 关键词</label>
                <input type="text" defaultValue="内容工作流, 内容创作, 效率提升" className="w-full px-3 py-1.5 text-sm rounded-md border outline-none" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }} />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>摘要</label>
                <textarea defaultValue="从选题到发布，一套经过验证的内容生产流程..." rows={3} className="w-full px-3 py-1.5 text-sm rounded-md border outline-none resize-none" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }} />
              </div>
            </div>
          )}

          {rightPanel === 'versions' && (
            <div className="space-y-2">
              <div className="text-xs mb-3" style={{ color: '#9A9A9A' }}>版本历史</div>
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className="p-3 rounded-md border cursor-pointer transition-colors"
                  style={{ borderColor: i === 0 ? '#D4A574' : '#E8E6E1', backgroundColor: i === 0 ? '#F8F7F4' : '#fff' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{v.time}</span>
                    {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#E8D5C0', color: '#8B6914' }}>当前</span>}
                  </div>
                  <div className="text-xs" style={{ color: '#6B6B6B' }}>{v.desc}</div>
                  <div className="text-xs mt-1" style={{ color: '#9A9A9A' }}>by {v.author}</div>
                </div>
              ))}
            </div>
          )}

          {rightPanel === 'ai' && (
            <div className="space-y-3">
              <div className="text-xs mb-3" style={{ color: '#9A9A9A' }}>AI 辅助工具</div>
              {[
                { label: '续写段落', desc: '基于上下文自动续写', skill: 'continue' },
                { label: '改写润色', desc: '优化表达和语法', skill: 'polish' },
                { label: '生成标题', desc: '基于内容生成多个标题', skill: 'title' },
                { label: '提取摘要', desc: '自动生成文章摘要', skill: 'summary' },
                { label: '翻译', desc: '多语言翻译', skill: 'translate' },
                { label: 'SEO 优化', desc: '优化关键词密度和结构', skill: 'seo' },
              ].map(tool => (
                <button
                  key={tool.label}
                  onClick={async () => {
                    const content = blocks.map(b => b.content).filter(Boolean).join('\n\n');
                    if (!content.trim()) { showToast('编辑器内容为空', 'error'); return; }
                    try {
                      const res = await fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ skill: tool.skill, brief: content }),
                      });
                      if (!res.ok) throw new Error('Request failed');
                      const reader = res.body?.getReader();
                      const decoder = new TextDecoder();
                      let result = '';
                      if (reader) {
                        while (true) {
                          const { done, value } = await reader.read();
                          if (done) break;
                          const text = decoder.decode(value);
                          const lines = text.split('\n');
                          for (const line of lines) {
                            if (line.startsWith('data: ')) {
                              const data = line.slice(6);
                              if (data === '[DONE]') break;
                              try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) result += parsed.text;
                              } catch { /* skip */ }
                            }
                          }
                        }
                      }
                      // Insert result as a new block
                      const newBlock: Block = { id: nextId(), type: 'paragraph', content: result };
                      setBlocks(prev => [...prev, newBlock]);
                      showToast(`${tool.label}完成`, 'success');
                    } catch (err) {
                      showToast(`${tool.label}失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-md border text-left transition-colors"
                  style={{ borderColor: '#E8E6E1', backgroundColor: '#fff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8F7F4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{tool.label}</div>
                    <div className="text-xs" style={{ color: '#9A9A9A' }}>{tool.desc}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
