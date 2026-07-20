'use client';

import { useState, useRef } from 'react';
import { showToast } from '@/components/toast';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'llm' | 'knowledge' | 'condition' | 'transform' | 'output' | 'http' | 'code';
  label: string;
  desc: string;
  x: number;
  y: number;
  config: Record<string, string>;
}

interface Connection {
  from: string;
  to: string;
}

const nodeTypeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  trigger: { label: '触发器', color: '#6B8FA3', bg: '#E8F0F5', icon: 'T' },
  llm: { label: 'LLM', color: '#D4A574', bg: '#F8F0E6', icon: 'AI' },
  knowledge: { label: '知识库', color: '#4A7C59', bg: '#E8F2EB', icon: 'K' },
  condition: { label: '条件', color: '#C17B3E', bg: '#FFF3E0', icon: '?' },
  transform: { label: '转换', color: '#8B6FA3', bg: '#F0E8F5', icon: 'T' },
  output: { label: '输出', color: '#6B6B6B', bg: '#F0EDE8', icon: 'O' },
  http: { label: 'HTTP', color: '#A64D4D', bg: '#FDE8E8', icon: 'H' },
  code: { label: '代码', color: '#1A1A1A', bg: '#F0EDE8', icon: '{}' },
};

const initialNodes: WorkflowNode[] = [
  { id: '1', type: 'trigger', label: '选题输入', desc: '接收选题信息', x: 80, y: 120, config: { input: '选题标题, 关键词' } },
  { id: '2', type: 'knowledge', label: '知识库检索', desc: '检索相关资料', x: 320, y: 120, config: { kb: '内容创作知识库', topK: '5' } },
  { id: '3', type: 'llm', label: '大纲生成', desc: '基于选题和资料生成大纲', x: 560, y: 80, config: { model: 'GPT-4', prompt: '根据以下资料生成文章大纲...' } },
  { id: '4', type: 'llm', label: '内容生成', desc: '根据大纲生成正文', x: 560, y: 220, config: { model: 'GPT-4', prompt: '根据大纲逐段生成内容...' } },
  { id: '5', type: 'condition', label: '渠道判断', desc: '根据目标渠道分流', x: 800, y: 150, config: { field: 'channel', values: '公众号, 小红书, B站' } },
  { id: '6', type: 'transform', label: '格式适配', desc: '适配渠道格式要求', x: 1040, y: 80, config: { format: 'Markdown → 公众号排版' } },
  { id: '7', type: 'output', label: '发布输出', desc: '输出最终内容', x: 1280, y: 150, config: { target: '内容管理库' } },
];

const initialConnections: Connection[] = [
  { from: '1', to: '2' },
  { from: '2', to: '3' },
  { from: '2', to: '4' },
  { from: '3', to: '5' },
  { from: '4', to: '5' },
  { from: '5', to: '6' },
  { from: '6', to: '7' },
];

const templateNodes = [
  { type: 'trigger', label: '触发器', desc: '工作流入口' },
  { type: 'llm', label: 'LLM 调用', desc: '大语言模型处理' },
  { type: 'knowledge', label: '知识库', desc: 'RAG 检索增强' },
  { type: 'condition', label: '条件分支', desc: '逻辑判断' },
  { type: 'transform', label: '数据转换', desc: '格式转换' },
  { type: 'output', label: '输出', desc: '结果输出' },
  { type: 'http', label: 'HTTP 请求', desc: '外部 API' },
  { type: 'code', label: '代码执行', desc: '自定义逻辑' },
];

export function WorkflowBuilder() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showTemplates, setShowTemplates] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const nextId = () => { idCounter.current += 1; return String(idCounter.current + 1000); };
  const nodeCount = useRef(nodes.length);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragging(nodeId);
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } : n));
    }
    if (connecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    if (connecting) {
      setConnecting(null);
    }
  };

  const handlePortClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!connecting) {
      setConnecting(nodeId);
    } else if (connecting !== nodeId) {
      const exists = connections.some(c => c.from === connecting && c.to === nodeId);
      if (!exists) {
        setConnections(prev => [...prev, { from: connecting, to: nodeId }]);
        showToast('节点已连接', 'success');
      }
      setConnecting(null);
    }
  };

  const addNode = (type: WorkflowNode['type']) => {
    nodeCount.current += 1;
    const newNode: WorkflowNode = {
      id: nextId(),
      type,
      label: nodeTypeConfig[type].label,
      desc: '新节点',
      x: 200 + (nodeCount.current % 5) * 80,
      y: 100 + (nodeCount.current % 3) * 80,
      config: {},
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
    showToast(`已添加${nodeTypeConfig[type].label}节点`, 'success');
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    showToast('节点已删除', 'info');
  };

  const getConnectionPath = (from: WorkflowNode, to: WorkflowNode) => {
    const fromX = from.x + 180;
    const fromY = from.y + 35;
    const toX = to.x;
    const toY = to.y + 35;
    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  return (
    <div className="flex h-full">
      {/* Left panel - Node templates */}
      {showTemplates && (
        <div className="w-[200px] border-r flex flex-col" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#E8E6E1' }}>
            <h3 className="text-sm font-medium" style={{ color: '#1A1A1A' }}>节点模板</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9A9A9A' }}>拖拽到画布添加</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {templateNodes.map(t => (
              <button
                key={t.type}
                onClick={() => addNode(t.type as WorkflowNode['type'])}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-md text-left transition-all border"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#fff' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = nodeTypeConfig[t.type].color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E6E1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: nodeTypeConfig[t.type].bg, color: nodeTypeConfig[t.type].color }}>
                  {nodeTypeConfig[t.type].icon}
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{t.label}</div>
                  <div className="text-[10px]" style={{ color: '#9A9A9A' }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{ backgroundColor: '#F8F7F4', backgroundImage: 'radial-gradient(circle, #E8E6E1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => { setSelectedNode(null); setConnecting(null); }}
      >
        {/* Toolbar */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <button onClick={() => setShowTemplates(!showTemplates)} className="px-3 py-1.5 text-xs font-medium rounded-md border" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#6B6B6B' }}>
            {showTemplates ? '隐藏' : '显示'}模板
          </button>
          <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: '#E8E6E1' }}>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="px-2 py-1.5 text-xs" style={{ backgroundColor: '#fff', color: '#6B6B6B' }}>-</button>
            <span className="px-2 py-1.5 text-xs border-x" style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="px-2 py-1.5 text-xs" style={{ backgroundColor: '#fff', color: '#6B6B6B' }}>+</button>
          </div>
          <button
            onClick={() => showToast('工作流已保存', 'success')}
            className="px-3 py-1.5 text-xs font-medium rounded-md"
            style={{ backgroundColor: '#D4A574', color: '#1A1A1A' }}
          >
            保存工作流
          </button>
          <button
            onClick={() => showToast('工作流开始运行...', 'info')}
            className="px-3 py-1.5 text-xs font-medium rounded-md"
            style={{ backgroundColor: '#1A1A1A', color: '#fff' }}
          >
            试运行
          </button>
        </div>

        {/* Workflow name */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-3 py-1.5 rounded-md text-xs" style={{ backgroundColor: '#fff', border: '1px solid #E8E6E1', color: '#6B6B6B' }}>
            选题 → 脚本 → 渠道适配 工作流
          </div>
        </div>

        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
          {connections.map((conn, i) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return (
              <g key={i}>
                <path
                  d={getConnectionPath(fromNode, toNode)}
                  fill="none"
                  stroke="#D4A574"
                  strokeWidth="2"
                  strokeDasharray="none"
                  opacity="0.6"
                />
                {/* Arrow */}
                <circle
                  cx={toNode.x}
                  cy={toNode.y + 35}
                  r="3"
                  fill="#D4A574"
                  opacity="0.8"
                />
              </g>
            );
          })}
          {/* Connecting line */}
          {connecting && (() => {
            const fromNode = nodes.find(n => n.id === connecting);
            if (!fromNode) return null;
            return (
              <line
                x1={fromNode.x + 180}
                y1={fromNode.y + 35}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#D4A574"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const config = nodeTypeConfig[node.type];
          const isSelected = selectedNode === node.id;
          return (
            <div
              key={node.id}
              className="absolute cursor-grab select-none"
              style={{
                left: node.x,
                top: node.y,
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
                zIndex: dragging === node.id ? 50 : isSelected ? 40 : 10,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <div
                className="w-[180px] rounded-lg border overflow-hidden transition-shadow"
                style={{
                  borderColor: isSelected ? config.color : '#E8E6E1',
                  backgroundColor: '#fff',
                  boxShadow: isSelected ? `0 0 0 2px ${config.color}33` : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#E8E6E1', backgroundColor: config.bg }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: config.color, color: '#fff' }}>
                    {config.icon}
                  </div>
                  <span className="text-xs font-medium flex-1" style={{ color: '#1A1A1A' }}>{node.label}</span>
                  {node.id !== '1' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#FDE8E8] transition-all"
                      style={{ opacity: isSelected ? 1 : 0 }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A64D4D" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                  )}
                </div>
                {/* Body */}
                <div className="px-3 py-2">
                  <p className="text-[11px] leading-relaxed" style={{ color: '#6B6B6B' }}>{node.desc}</p>
                  {Object.keys(node.config).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(node.config).slice(0, 2).map(([k, v]) => (
                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0EDE8', color: '#9A9A9A' }}>
                          {k}: {v.length > 12 ? v.slice(0, 12) + '...' : v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Ports */}
                <div className="flex justify-between px-3 pb-2">
                  {node.type !== 'trigger' && (
                    <div
                      className="w-3 h-3 rounded-full border-2 cursor-crosshair"
                      style={{ borderColor: config.color, backgroundColor: '#fff' }}
                      onClick={(e) => handlePortClick(e, node.id)}
                    />
                  )}
                  <div className="flex-1" />
                  {node.type !== 'output' && (
                    <div
                      className="w-3 h-3 rounded-full cursor-crosshair"
                      style={{ backgroundColor: config.color }}
                      onClick={(e) => handlePortClick(e, node.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel - Node config */}
      {selectedNodeData && (
        <div className="w-[280px] border-l flex flex-col" style={{ borderColor: '#E8E6E1', backgroundColor: '#FAFAF8' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E8E6E1' }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: nodeTypeConfig[selectedNodeData.type].color, color: '#fff' }}>
                {nodeTypeConfig[selectedNodeData.type].icon}
              </div>
              <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>节点配置</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-[#E8E6E1]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>节点名称</label>
              <input
                type="text"
                value={selectedNodeData.label}
                onChange={(e) => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                className="w-full px-3 py-1.5 text-sm rounded-md border outline-none"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>描述</label>
              <textarea
                value={selectedNodeData.desc}
                onChange={(e) => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, desc: e.target.value } : n))}
                rows={2}
                className="w-full px-3 py-1.5 text-sm rounded-md border outline-none resize-none"
                style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>类型</label>
              <div className="px-3 py-1.5 text-sm rounded-md" style={{ backgroundColor: nodeTypeConfig[selectedNodeData.type].bg, color: nodeTypeConfig[selectedNodeData.type].color }}>
                {nodeTypeConfig[selectedNodeData.type].label}
              </div>
            </div>
            {/* Config fields */}
            {Object.entries(selectedNodeData.config).map(([key, value]) => (
              <div key={key}>
                <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, config: { ...n.config, [key]: e.target.value } } : n))}
                  className="w-full px-3 py-1.5 text-sm rounded-md border outline-none"
                  style={{ borderColor: '#E8E6E1', backgroundColor: '#fff', color: '#1A1A1A' }}
                />
              </div>
            ))}
            {/* Connections */}
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#9A9A9A' }}>连接</label>
              <div className="space-y-1">
                {connections.filter(c => c.to === selectedNode).map(c => {
                  const from = nodes.find(n => n.id === c.from);
                  return from ? (
                    <div key={c.from} className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      来自: {from.label}
                    </div>
                  ) : null;
                })}
                {connections.filter(c => c.from === selectedNode).map(c => {
                  const to = nodes.find(n => n.id === c.to);
                  return to ? (
                    <div key={c.to} className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      到: {to.label}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
