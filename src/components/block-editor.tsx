'use client';

import { useState, useRef, useEffect } from 'react';

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
  { type: 'quote', label: '引用', desc: '引用文本块', icon: '"' },
  { type: 'code', label: '代码', desc: '代码块', icon: '<>' },
  { type: 'list', label: '列表', desc: '无序列表', icon: '•' },
  { type: 'image', label: '图片', desc: '插入图片', icon: '🖼' },
  { type: 'divider', label: '分割线', desc: '水平分割线', icon: '—' },
];

export function BlockEditor() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleBlockClick = (blockId: string) => {
    setActiveBlockId(blockId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
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
  };

  const handleBlockInput = (blockId: string, content: string) => {
    if (showSlashMenu) {
      const afterSlash = content.slice(1);
      setSlashFilter(afterSlash);
      if (!afterSlash) {
        // keep menu open
      } else {
        const filtered = slashMenuItems.filter((item) =>
          item.label.toLowerCase().includes(afterSlash.toLowerCase()) ||
          item.type.includes(afterSlash.toLowerCase())
        );
        if (filtered.length === 0) {
          setShowSlashMenu(false);
        }
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
  };

  const filteredMenuItems = slashMenuItems.filter(
    (item) => item.label.includes(slashFilter) || item.type.includes(slashFilter)
  );

  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;

    const baseClasses = 'w-full outline-none resize-none block-hover rounded px-1 -mx-1';

    switch (block.type) {
      case 'heading':
        return (
          <div className="py-1" onClick={() => handleBlockClick(block.id)}>
            <input
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
              className={`${baseClasses} text-sm italic bg-transparent min-h-[40px]`}
              style={{ color: '#6B6B6B', lineHeight: '1.7' }}
              value={block.content}
              onChange={(e) => handleBlockInput(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder="输入引用..."
            />
          </div>
        );
      case 'code':
        return (
          <div
            className="rounded-md p-3 my-2 font-mono text-sm"
            style={{ backgroundColor: '#1A1A1A', color: '#E8E6E1' }}
            onClick={() => handleBlockClick(block.id)}
          >
            <textarea
              className="w-full bg-transparent outline-none font-mono text-sm resize-none"
              style={{ color: '#E8E6E1' }}
              value={block.content}
              onChange={(e) => handleBlockInput(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder="// 输入代码..."
            />
          </div>
        );
      case 'list':
        return (
          <div className="py-1" onClick={() => handleBlockClick(block.id)}>
            <textarea
              className={`${baseClasses} text-sm bg-transparent min-h-[60px]`}
              style={{ color: '#1A1A1A', lineHeight: '1.8' }}
              value={block.content.split('\n').map((line) => `• ${line}`).join('\n')}
              onChange={(e) => handleBlockInput(block.id, e.target.value.replace(/^• /gm, ''))}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder="列表项..."
            />
          </div>
        );
      case 'divider':
        return (
          <div className="py-3" onClick={() => handleBlockClick(block.id)}>
            <hr style={{ borderColor: '#E8E6E1' }} />
          </div>
        );
      case 'image':
        return (
          <div
            className="my-3 rounded-md border-2 border-dashed flex items-center justify-center py-8 cursor-pointer transition-colors"
            style={{ borderColor: isActive ? '#D4A574' : '#E8E6E1' }}
            onClick={() => handleBlockClick(block.id)}
          >
            <div className="text-center">
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span className="text-xs" style={{ color: '#6B6B6B' }}>点击插入图片</span>
            </div>
          </div>
        );
      default: // paragraph
        return (
          <div className="py-1" onClick={() => handleBlockClick(block.id)}>
            <textarea
              className={`${baseClasses} text-sm bg-transparent min-h-[24px]`}
              style={{ color: '#1A1A1A', lineHeight: '1.7' }}
              value={block.content}
              onChange={(e) => handleBlockInput(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder="输入 / 唤起菜单..."
              rows={1}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#FFF3E0', color: '#C17B3E' }}>审核中</span>
          <span className="text-xs" style={{ color: '#6B6B6B' }}>最后编辑: 2 分钟前</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded text-xs font-medium border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}>
            预览
          </button>
          <button className="px-3 py-1.5 rounded text-xs font-medium border transition-colors" style={{ borderColor: '#E8E6E1', color: '#6B6B6B' }}>
            导出 Markdown
          </button>
          <button
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{ backgroundColor: '#4A7C59', color: '#FFFFFF' }}
          >
            提交审核
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto" ref={editorRef}>
        <div className="max-w-[720px] mx-auto px-6 py-8">
          {/* Word count */}
          <div className="flex items-center gap-4 mb-6 text-xs" style={{ color: '#9A9A9A' }}>
            <span>{blocks.reduce((acc, b) => acc + b.content.length, 0)} 字符</span>
            <span>{blocks.filter((b) => b.content).length} 个块</span>
            <span>预计阅读 {Math.max(1, Math.ceil(blocks.reduce((acc, b) => acc + b.content.length, 0) / 500))} 分钟</span>
          </div>

          {/* Blocks */}
          <div className="space-y-1">
            {blocks.map((block) => (
              <div key={block.id} className="group relative">
                {/* Block handle */}
                <div
                  className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                  style={{ color: '#9A9A9A' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="6" r="1" />
                    <circle cx="15" cy="6" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="9" cy="18" r="1" />
                    <circle cx="15" cy="18" r="1" />
                  </svg>
                </div>
                {renderBlock(block)}
              </div>
            ))}
          </div>
        </div>
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
