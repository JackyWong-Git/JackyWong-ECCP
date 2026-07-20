'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { showToast } from '@/components/toast';

interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'quote' | 'code' | 'list' | 'image' | 'divider';
  content: string;
}

const initialBlocks: Block[] = [
  { id: '1', type: 'heading', content: '如何构建高效的内容工作流' },
  { id: '2', type: 'paragraph', content: '在当今快节奏的内容创作环境中，一套高效的工作流不仅能提升产出质量，还能大幅减少团队协作中的摩擦成本。本文将从实际经验出发，分享一套经过验证的内容生产流程。' },
  { id: '3', type: 'heading', content: '第一步：选题池管理' },
  { id: '4', type: 'paragraph', content: '好的内容始于好的选题。我们维护一个动态的选题池，所有团队成员都可以随时提交灵感。选题池每周评审一次，根据时效性、受众匹配度和资源可行性进行优先级排序。' },
  { id: '5', type: 'quote', content: '内容创作的本质不是写得快，而是想得清楚。选题阶段多花 30% 的时间，能让后续写作效率提升 50%。' },
  { id: '6', type: 'heading', content: '第二步：结构化写作' },
  { id: '7', type: 'paragraph', content: '使用块编辑器进行结构化写作，每个段落都是一个独立的"块"。这种方式让内容的组织更加灵活，也方便后续的编辑和重新排列。' },
  { id: '8', type: 'list', content: '先写大纲，确定核心论点\n逐块展开，每块一个核心观点\n最后串联，确保逻辑流畅' },
  { id: '9', type: 'divider', content: '' },
  { id: '10', type: 'paragraph', content: '输入 / 唤起菜单，插入内容块...' },
];

const slashMenuItems = [
  { type: 'heading', label: '标题', desc: '大号段落标题', icon: 'H' },
  { type: 'paragraph', label: '正文', desc: '普通文本段落', icon: 'T' },
  { type: 'quote', label: '引用', desc: '引用文本块', icon: '\u201C' },
  { type: 'code', label: '代码', desc: '代码块', icon: '<>' },
  { type: 'list', label: '列表', desc: '无序列表', icon: '\u2022' },
  { type: 'image', label: '图片', desc: '插入图片', icon: '\u25A3' },
  { type: 'divider', label: '分割线', desc: '水平分割线', icon: '\u2014' },
];

export function BlockEditor() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [showToc, setShowToc] = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const headings = blocks.filter((b) => b.type === 'heading' && b.content);
  const totalChars = blocks.reduce((acc, b) => acc + b.content.length, 0);
  const readTime = Math.max(1, Math.ceil(totalChars / 500));

  const handleBlockClick = (blockId: string) => {
    setActiveBlockId(blockId);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === '/' && blocks.find((b) => b.id === blockId)?.content === '') {
      e.preventDefault();
      setShowSlashMenu(true);
      setSlashFilter('');
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setSlashMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    if (e.key === 'Escape') {
      setShowSlashMenu(false);
    }
    if (e.key === 'Enter' && !showSlashMenu) {
      e.preventDefault();
      const maxId = blocks.reduce((max, b) => Math.max(max, parseInt(b.id) || 0), 0);
      const newBlock: Block = {
        id: (maxId + 1).toString(),
        type: 'paragraph',
        content: '',
      };
      const idx = blocks.findIndex((b) => b.id === blockId);
      const newBlocks = [...blocks];
      newBlocks.splice(idx + 1, 0, newBlock);
      setBlocks(newBlocks);
      setActiveBlockId(newBlock.id);
    }
    if (e.key === 'Backspace' && blocks.find((b) => b.id === blockId)?.content === '' && blocks.length > 1) {
      e.preventDefault();
      const idx = blocks.findIndex((b) => b.id === blockId);
      const newBlocks = blocks.filter((b) => b.id !== blockId);
      setBlocks(newBlocks);
      if (idx > 0) setActiveBlockId(newBlocks[idx - 1].id);
    }
  }, [blocks, showSlashMenu]);

  const handleBlockInput = (blockId: string, content: string) => {
    if (showSlashMenu) {
      const afterSlash = content.slice(1);
      setSlashFilter(afterSlash);
      const filtered = slashMenuItems.filter((item) =>
        item.label.toLowerCase().includes(afterSlash.toLowerCase()) ||
        item.type.includes(afterSlash.toLowerCase())
      );
      if (filtered.length === 0 && afterSlash.length > 0) {
        setShowSlashMenu(false);
      }
    }
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, content } : b)));
  };

  const insertBlock = (type: Block['type']) => {
    const activeIdx = blocks.findIndex((b) => b.id === activeBlockId);
    if (activeIdx === -1) return;
    const newBlocks = [...blocks];
    newBlocks[activeIdx] = { ...newBlocks[activeIdx], type, content: '' };
    setBlocks(newBlocks);
    setShowSlashMenu(false);
    setSlashFilter('');
    showToast(`已插入${slashMenuItems.find((i) => i.type === type)?.label || ''}块`, 'info');
  };

  // Drag and drop
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(dragIdx, 1);
    newBlocks.splice(idx, 0, moved);
    setBlocks(newBlocks);
    setDragIdx(null);
    setDragOverIdx(null);
    showToast('已移动内容块', 'info');
  };

  const filteredMenuItems = slashMenuItems.filter(
    (item) => item.label.includes(slashFilter) || item.type.includes(slashFilter)
  );

  const scrollToHeading = (blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const renderBlock = (block: Block, idx: number) => {
    const baseClasses = 'w-full outline-none block-hover rounded px-1 -mx-1 resize-none overflow-hidden';

    const autoResizeTextarea = (el: HTMLTextAreaElement) => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };
    const autoResizeInput = (el: HTMLInputElement) => {
      // input auto-sizes natively
    };

    const dragHandlers = {
      draggable: true,
      onDragStart: () => handleDragStart(idx),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, idx),
      onDrop: () => handleDrop(idx),
      onDragEnd: () => { setDragIdx(null); setDragOverIdx(null); },
    };

    const blockContent = (() => {
      switch (block.type) {
        case 'heading':
          return (
            <div className="py-1.5" onClick={() => handleBlockClick(block.id)}>
              <input
                ref={autoResizeInput}
                className={`${baseClasses} text-xl font-semibold bg-transparent`}
                style={{ fontFamily: "'Noto Serif SC', serif", color: '#1A1A1A' }}
                value={block.content}
                onChange={(e) => handleBlockInput(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder="标题..."
              />
            </div>
          );
        case 'quote':
          return (
            <div
              className="border-l-3 pl-4 py-2 my-2"
              style={{ borderColor: '#D4A574' }}
              onClick={() => handleBlockClick(block.id)}
            >
              <textarea
                ref={autoResizeTextarea}
                className={`${baseClasses} text-sm italic bg-transparent min-h-[40px]`}
                style={{ color: '#6B6B6B', lineHeight: '1.7' }}
                value={block.content}
                onChange={(e) => { handleBlockInput(block.id, e.target.value); autoResizeTextarea(e.target); }}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder="输入引用..."
              />
            </div>
          );
        case 'code':
          return (
            <div
              className="rounded-md p-3 my-2 font-mono text-sm relative group/code"
              style={{ backgroundColor: '#1A1A1A', color: '#E8E6E1' }}
              onClick={() => handleBlockClick(block.id)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                <button
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ backgroundColor: '#333', color: '#9A9A9A' }}
                  onClick={() => showToast('代码已复制', 'success')}
                >
                  复制
                </button>
              </div>
              <textarea
                ref={autoResizeTextarea}
                className="w-full bg-transparent outline-none font-mono text-sm resize-none"
                style={{ color: '#E8E6E1' }}
                value={block.content}
                onChange={(e) => { handleBlockInput(block.id, e.target.value); autoResizeTextarea(e.target); }}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder="// 输入代码..."
              />
            </div>
          );
        case 'list':
          return (
            <div className="py-1" onClick={() => handleBlockClick(block.id)}>
              <div className="space-y-0.5">
                {block.content.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#D4A574' }} />
                    <span className="text-sm" style={{ color: '#1A1A1A', lineHeight: '1.8' }}>{line}</span>
                  </div>
                ))}
                <textarea
                  ref={autoResizeTextarea}
                  className={`${baseClasses} text-sm bg-transparent min-h-[24px] opacity-0 focus:opacity-100`}
                  style={{ color: '#1A1A1A', lineHeight: '1.8' }}
                  value=""
                  onChange={(e) => {
                    const newContent = block.content ? block.content + '\n' + e.target.value : e.target.value;
                    handleBlockInput(block.id, newContent);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  placeholder="添加列表项..."
                />
              </div>
            </div>
          );
        case 'divider':
          return (
            <div className="py-4" onClick={() => handleBlockClick(block.id)}>
              <hr style={{ borderColor: '#E8E6E1' }} />
            </div>
          );
        case 'image':
          return (
            <div
              className="my-3 rounded-md border-2 border-dashed flex items-center justify-center py-10 cursor-pointer transition-colors"
              style={{ borderColor: '#E8E6E1' }}
              onClick={() => handleBlockClick(block.id)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4A574'; e.currentTarget.style.backgroundColor = '#FFFDF9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div className="text-center">
                <svg className="mx-auto mb-2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="text-xs" style={{ color: '#9A9A9A' }}>点击或拖拽插入图片</span>
              </div>
            </div>
          );
        default: // paragraph
          return (
            <div className="py-1" onClick={() => handleBlockClick(block.id)}>
              <textarea
                ref={autoResizeTextarea}
                className={`${baseClasses} text-sm bg-transparent min-h-[24px]`}
                style={{ color: '#1A1A1A', lineHeight: '1.7' }}
                value={block.content}
                onChange={(e) => { handleBlockInput(block.id, e.target.value); autoResizeTextarea(e.target); }}
                onKeyDown={(e) => handleKeyDown(e, block.id)}
                placeholder="输入 / 唤起菜单..."
              />
            </div>
          );
      }
    })();

    return (
      <div
        key={block.id}
        id={`block-${block.id}`}
        className={`group relative transition-all duration-100 ${dragOverIdx === idx ? 'border-t-2 border-[#D4A574]' : ''}`}
        style={{ opacity: dragIdx === idx ? 0.4 : 1 }}
        {...dragHandlers}
      >
        {/* Block handle + type indicator */}
        <div className="absolute -left-7 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-0.5 rounded cursor-grab"
            style={{ color: '#9A9A9A' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6B6B6B'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9A9A9A'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="6" r="1" />
              <circle cx="15" cy="6" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="9" cy="18" r="1" />
              <circle cx="15" cy="18" r="1" />
            </svg>
          </button>
          <button
            className="p-0.5 rounded"
            style={{ color: '#9A9A9A' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#D4A574'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9A9A9A'; }}
            onClick={(e) => {
              e.stopPropagation();
              const maxId = blocks.reduce((max, b) => Math.max(max, parseInt(b.id) || 0), 0);
              const newBlock: Block = { id: (maxId + 1).toString(), type: 'paragraph', content: '' };
              const newBlocks = [...blocks];
              newBlocks.splice(idx + 1, 0, newBlock);
              setBlocks(newBlocks);
              setActiveBlockId(newBlock.id);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          </button>
        </div>
        {blockContent}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b" style={{ borderColor: '#E8E6E1' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: '#FFF3E0', color: '#C17B3E' }}>审核中</span>
          <span className="text-xs" style={{ color: '#9A9A9A' }}>最后编辑: 2 分钟前</span>
          <span className="text-xs" style={{ color: '#D4D0C8' }}>|</span>
          <span className="text-xs" style={{ color: '#9A9A9A' }}>{totalChars} 字 / {readTime} 分钟阅读</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors"
            style={{ borderColor: showToc ? '#D4A574' : '#E8E6E1', color: showToc ? '#D4A574' : '#6B6B6B', backgroundColor: showToc ? '#FFFDF9' : 'transparent' }}
            onClick={() => setShowToc(!showToc)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="12" y2="6" /><line x1="3" y1="12" x2="16" y2="12" /><line x1="3" y1="18" x2="10" y2="18" /></svg>
            目录
          </button>
          <button className="px-3 py-1.5 rounded text-xs font-medium border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4D0C8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
          >
            预览
          </button>
          <button className="px-3 py-1.5 rounded text-xs font-medium border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4D0C8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; }}
            onClick={() => showToast('已导出为 Markdown', 'success')}
          >
            导出
          </button>
          <button
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: '#4A7C59', color: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3D6B4A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4A7C59'; }}
            onClick={() => showToast('已提交审核', 'success')}
          >
            提交审核
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor content */}
        <div className="flex-1 overflow-auto" ref={editorRef}>
          <div className="max-w-[720px] mx-auto px-8 py-8">
            {/* Blocks */}
            <div className="space-y-0.5 pl-4">
              {blocks.map((block, idx) => renderBlock(block, idx))}
            </div>

            {/* Add block hint at bottom */}
            <div
              className="mt-4 py-3 text-center text-xs cursor-pointer rounded-md transition-colors"
              style={{ color: '#9A9A9A' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F3EF'; e.currentTarget.style.color = '#D4A574'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9A9A9A'; }}
              onClick={() => {
                const maxId = blocks.reduce((max, b) => Math.max(max, parseInt(b.id) || 0), 0);
                const newBlock: Block = { id: (maxId + 1).toString(), type: 'paragraph', content: '' };
                setBlocks([...blocks, newBlock]);
                setActiveBlockId(newBlock.id);
              }}
            >
              点击添加内容块，或输入 / 选择类型
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        {showToc && headings.length > 0 && (
          <div className="w-48 border-l overflow-auto py-4 px-3" style={{ borderColor: '#E8E6E1' }}>
            <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: '#9A9A9A' }}>目录</p>
            <div className="space-y-1">
              {headings.map((h) => (
                <button
                  key={h.id}
                  className="block w-full text-left text-xs py-1 px-2 rounded transition-colors truncate"
                  style={{ color: activeBlockId === h.id ? '#D4A574' : '#6B6B6B' }}
                  onClick={() => scrollToHeading(h.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F3EF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {h.content}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slash menu */}
      {showSlashMenu && (
        <div
          className="fixed z-50 rounded-lg border shadow-lg overflow-hidden animate-slide-up"
          style={{
            top: slashMenuPos.top,
            left: slashMenuPos.left,
            backgroundColor: '#FFFFFF',
            borderColor: '#E8E6E1',
            width: 240,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: '#E8E6E1' }}>
            <span className="text-xs font-medium" style={{ color: '#6B6B6B' }}>插入内容块</span>
          </div>
          <div className="py-1">
            {filteredMenuItems.map((item) => (
              <button
                key={item.type}
                onClick={() => insertBlock(item.type as Block['type'])}
                className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors"
                style={{ color: '#1A1A1A' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F3EF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: '#F0EDE8', color: '#6B6B6B' }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
