'use client';

import { useState } from 'react';
import { Palette, Plus, Upload, Download, Copy, Trash2, Edit2, Check, X, ChevronRight } from 'lucide-react';
import { showToast } from '@/components/toast';

interface DesignSystem {
  id: string;
  name: string;
  category: string;
  description: string;
  tokens: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  mood: string[];
  active: boolean;
}

const designSystems: DesignSystem[] = [
  {
    id: 'editorial',
    name: '编辑部风格',
    category: '专业媒体',
    description: '专业、深度、权威。适合长篇分析、行业报告、深度报道。',
    tokens: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
      accent: '#D4A574',
      background: '#FAFAF8',
      text: '#1A1A1A',
    },
    typography: { heading: 'Noto Serif SC', body: 'Inter + Noto Sans SC' },
    mood: ['专业', '深度', '权威', '温暖'],
    active: true,
  },
  {
    id: 'casual',
    name: '轻松日常',
    category: '生活社交',
    description: '亲切、活泼、接地气。适合日常分享、生活记录、社交互动。',
    tokens: {
      primary: '#2D3748',
      secondary: '#718096',
      accent: '#F6AD55',
      background: '#FFFAF0',
      text: '#2D3748',
    },
    typography: { heading: 'Noto Sans SC', body: 'Noto Sans SC' },
    mood: ['亲切', '活泼', '温暖', '轻松'],
    active: false,
  },
  {
    id: 'tech',
    name: '科技前沿',
    category: '科技产品',
    description: '未来感、极简、精确。适合技术文章、产品介绍、行业分析。',
    tokens: {
      primary: '#0F172A',
      secondary: '#64748B',
      accent: '#3B82F6',
      background: '#F8FAFC',
      text: '#0F172A',
    },
    typography: { heading: 'Inter', body: 'Inter' },
    mood: ['未来', '极简', '精确', '专业'],
    active: false,
  },
  {
    id: 'lifestyle',
    name: '生活方式',
    category: '美学生活',
    description: '温暖、质感、美学。适合生活方式、美学分享、品牌故事。',
    tokens: {
      primary: '#44403C',
      secondary: '#78716C',
      accent: '#A3E635',
      background: '#FAFAF9',
      text: '#44403C',
    },
    typography: { heading: 'Noto Serif SC', body: 'Noto Sans SC' },
    mood: ['温暖', '质感', '美学', '自然'],
    active: false,
  },
];

const categories = ['全部', '专业媒体', '生活社交', '科技产品', '美学生活'];

export default function DesignSystemPage() {
  const [selectedId, setSelectedId] = useState('editorial');
  const [filter, setFilter] = useState('全部');
  const [showCreate, setShowCreate] = useState(false);

  const selected = designSystems.find(s => s.id === selectedId)!;
  const filtered = filter === '全部' ? designSystems : designSystems.filter(s => s.category === filter);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: System List */}
      <div className="w-80 border-r border-[#E8E6E1] flex flex-col bg-[#FAFAF8]">
        <div className="p-4 border-b border-[#E8E6E1]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-semibold text-[#1A1A1A]">设计系统</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="w-8 h-8 rounded-lg bg-[#D4A574] text-white flex items-center justify-center hover:bg-[#C49564] transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === cat
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-[#F5F5F0] text-[#6B6B6B] hover:bg-[#E8E6E1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {filtered.map(system => (
            <button
              key={system.id}
              onClick={() => setSelectedId(system.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedId === system.id
                  ? 'bg-[#FFFFFF] border border-[#D4A574] shadow-sm'
                  : 'bg-[#FFFFFF] border border-transparent hover:border-[#E8E6E1]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: system.tokens.primary }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: system.tokens.accent }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: system.tokens.background }} />
                </div>
                {system.active && (
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">使用中</span>
                )}
              </div>
              <div className="font-medium text-sm text-[#1A1A1A]">{system.name}</div>
              <div className="text-xs text-[#6B6B6B] mt-0.5">{system.category}</div>
            </button>
          ))}
        </div>

        {/* Import/Export */}
        <div className="p-3 border-t border-[#E8E6E1] flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-[#6B6B6B] border border-[#E8E6E1] rounded-lg hover:bg-[#FFFFFF] transition-colors">
            <Upload size={12} />
            导入
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-[#6B6B6B] border border-[#E8E6E1] rounded-lg hover:bg-[#FFFFFF] transition-colors">
            <Download size={12} />
            导出
          </button>
        </div>
      </div>

      {/* Right: System Detail */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-serif font-semibold text-[#1A1A1A]">{selected.name}</h1>
                {selected.active && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">当前使用</span>
                )}
              </div>
              <p className="text-[#6B6B6B]">{selected.description}</p>
              <div className="flex gap-2 mt-3">
                {selected.mood.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 bg-[#F5F5F0] text-[#6B6B6B] rounded-full">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {!selected.active && (
                <button
                  onClick={() => showToast(`已激活: ${selected.name}`)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors"
                >
                  <Check size={14} />
                  激活
                </button>
              )}
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors">
                <Edit2 size={14} />
                编辑
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors">
                <Copy size={14} />
                复制
              </button>
            </div>
          </div>

          {/* Color Tokens */}
          <section className="mb-8">
            <h2 className="text-lg font-serif font-semibold text-[#1A1A1A] mb-4">色彩 Token</h2>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(selected.tokens).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div
                    className="w-full aspect-square rounded-lg border border-[#E8E6E1] mb-2"
                    style={{ backgroundColor: value }}
                  />
                  <div className="text-xs font-medium text-[#1A1A1A] capitalize">{key}</div>
                  <div className="text-xs text-[#6B6B6B] font-mono">{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="mb-8">
            <h2 className="text-lg font-serif font-semibold text-[#1A1A1A] mb-4">字体排版</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-[#E8E6E1] bg-[#FFFFFF]">
                <div className="text-xs text-[#6B6B6B] mb-2">标题字体</div>
                <div className="text-xl font-serif text-[#1A1A1A] mb-1">{selected.typography.heading}</div>
                <div className="text-sm text-[#6B6B6B]">用于标题、重点文字</div>
              </div>
              <div className="p-4 rounded-lg border border-[#E8E6E1] bg-[#FFFFFF]">
                <div className="text-xs text-[#6B6B6B] mb-2">正文字体</div>
                <div className="text-xl text-[#1A1A1A] mb-1">{selected.typography.body}</div>
                <div className="text-sm text-[#6B6B6B]">用于正文、说明文字</div>
              </div>
            </div>
          </section>

          {/* Preview */}
          <section className="mb-8">
            <h2 className="text-lg font-serif font-semibold text-[#1A1A1A] mb-4">预览效果</h2>
            <div
              className="p-8 rounded-lg border border-[#E8E6E1]"
              style={{ backgroundColor: selected.tokens.background }}
            >
              <h3
                className="text-2xl font-serif font-semibold mb-3"
                style={{ color: selected.tokens.primary, fontFamily: `${selected.typography.heading}, serif` }}
              >
                这是一篇深度分析文章的标题
              </h3>
              <p className="text-base leading-relaxed mb-4" style={{ color: selected.tokens.text }}>
                正文内容展示了设计系统的实际应用效果。这段文字使用了系统定义的正文颜色和字体，
                确保在整个内容创作过程中保持视觉一致性。
              </p>
              <p className="text-sm mb-4" style={{ color: selected.tokens.secondary }}>
                这是辅助说明文字，使用次要颜色，用于补充信息或元数据展示。
              </p>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: selected.tokens.accent }}
              >
                行动按钮
              </button>
            </div>
          </section>

          {/* Channel Adaptation */}
          <section>
            <h2 className="text-lg font-serif font-semibold text-[#1A1A1A] mb-4">渠道适配规则</h2>
            <div className="space-y-3">
              {[
                { channel: '公众号', rules: ['封面比例 2.35:1', '标题≤30字', '正文16px'] },
                { channel: '小红书', rules: ['封面比例 3:4', '标题含 emoji', '正文分段短'] },
                { channel: 'B站', rules: ['标题≤20字', '封面含大字', '简介含时间戳'] },
              ].map(item => (
                <div key={item.channel} className="flex items-center justify-between p-4 rounded-lg border border-[#E8E6E1] bg-[#FFFFFF]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-sm font-medium text-[#6B6B6B]">
                      {item.channel.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[#1A1A1A]">{item.channel}</div>
                      <div className="text-xs text-[#6B6B6B]">{item.rules.join(' · ')}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#6B6B6B]" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
