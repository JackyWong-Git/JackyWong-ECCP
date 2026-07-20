'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle2, AlertCircle, XCircle, ChevronRight, Filter, Search } from 'lucide-react';

interface CraftRule {
  id: string;
  category: string;
  title: string;
  description: string;
  level: 'must' | 'should' | 'avoid';
  examples?: { good?: string; bad?: string };
  channels?: string[];
}

const categories = ['全部', '标题', '正文', '封面', 'SEO', '排版', '互动'];

const craftRules: CraftRule[] = [
  // Title rules
  {
    id: 'title-length',
    category: '标题',
    title: '标题长度控制',
    description: '标题应控制在 30 字以内，确保在各平台完整展示不被截断。',
    level: 'must',
    examples: {
      good: '2024 AI 工具深度盘点：10 款改变工作方式的神器',
      bad: '2024年度最值得关注的十款人工智能工具深度评测报告：哪些真正改变了我们的工作方式和效率提升',
    },
    channels: ['公众号', '小红书', 'B站'],
  },
  {
    id: 'title-hook',
    category: '标题',
    title: '标题钩子设计',
    description: '标题应包含数字、疑问或悬念，激发点击欲望。',
    level: 'should',
    examples: {
      good: '用了这 5 个 AI 工具后，我的效率提升了 300%',
      bad: '关于 AI 工具的一些使用心得和体会',
    },
  },
  {
    id: 'title-emoji',
    category: '标题',
    title: '小红书标题含 emoji',
    description: '小红书平台标题应包含 1-3 个 emoji，增加视觉吸引力。',
    level: 'should',
    examples: {
      good: 'AI 工具大测评 | 这 10 个神器让我效率翻倍',
      bad: 'AI 工具大测评：这 10 个神器让我效率翻倍',
    },
    channels: ['小红书'],
  },

  // Content rules
  {
    id: 'para-length',
    category: '正文',
    title: '段落长度控制',
    description: '每段不超过 4 行（约 100 字），保持阅读节奏。长段落应拆分。',
    level: 'must',
  },
  {
    id: 'subhead-frequency',
    category: '正文',
    title: '小标题频率',
    description: '每 300-500 字设置一个小标题，帮助读者快速扫描内容结构。',
    level: 'should',
  },
  {
    id: 'first-person',
    category: '正文',
    title: '第一人称叙事',
    description: '使用"我"的视角叙述，增加亲切感和可信度。避免过多"我们"。',
    level: 'should',
    examples: {
      good: '我在过去半年里深度使用了 20+ 款 AI 工具...',
      bad: '我们在过去半年里深度使用了 20+ 款 AI 工具...',
    },
  },

  // Cover rules
  {
    id: 'cover-ratio',
    category: '封面',
    title: '封面比例规范',
    description: '不同平台要求不同封面比例，需按平台规范生成。',
    level: 'must',
    channels: ['公众号', '小红书', 'B站', '抖音'],
  },
  {
    id: 'cover-text',
    category: '封面',
    title: '封面文字精简',
    description: '封面上的文字不超过 10 个字，字号要大，确保手机屏幕可读。',
    level: 'should',
  },
  {
    id: 'cover-contrast',
    category: '封面',
    title: '封面高对比度',
    description: '封面文字与背景需有足够对比度，避免浅底浅字或深底深字。',
    level: 'must',
  },

  // SEO rules
  {
    id: 'keyword-density',
    category: 'SEO',
    title: '关键词密度',
    description: '核心关键词密度控制在 2-3%，自然融入不堆砌。',
    level: 'should',
  },
  {
    id: 'meta-description',
    category: 'SEO',
    title: 'Meta 描述',
    description: '必须填写 150 字以内的 meta 描述，包含核心关键词。',
    level: 'must',
  },

  // Typography rules
  {
    id: 'font-size',
    category: '排版',
    title: '正文字号',
    description: '公众号正文 16px，行高 1.75 倍；其他平台按规范调整。',
    level: 'must',
    channels: ['公众号'],
  },
  {
    id: 'color-limit',
    category: '排版',
    title: '颜色数量限制',
    description: '单篇内容颜色不超过 3 种（含文字颜色），保持视觉统一。',
    level: 'should',
  },

  // Engagement rules
  {
    id: 'cta-ending',
    category: '互动',
    title: '结尾 CTA',
    description: '文章结尾应有明确的行动号召（关注、评论、转发）。',
    level: 'should',
    examples: {
      good: '觉得有用的话，点个赞让更多人看到吧',
      bad: '（无结尾引导）',
    },
  },
  {
    id: 'question-engagement',
    category: '互动',
    title: '提问式互动',
    description: '在文末设置一个开放性问题，引导读者评论。',
    level: 'should',
    examples: {
      good: '你最常用哪款 AI 工具？评论区聊聊',
      bad: '（无互动引导）',
    },
  },
];

export default function CraftPage() {
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [selectedRule, setSelectedRule] = useState<CraftRule | null>(null);

  const filtered = craftRules.filter(rule => {
    const matchCategory = filter === '全部' || rule.category === filter;
    const matchSearch = !search || rule.title.includes(search) || rule.description.includes(search);
    return matchCategory && matchSearch;
  });

  const stats = {
    must: craftRules.filter(r => r.level === 'must').length,
    should: craftRules.filter(r => r.level === 'should').length,
    avoid: craftRules.filter(r => r.level === 'avoid').length,
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Rule List */}
      <div className="w-96 border-r border-[#E8E6E1] flex flex-col bg-[#FAFAF8]">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E6E1]">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-[#D4A574]" />
            <h2 className="font-serif font-semibold text-[#1A1A1A]">Craft 工艺规则</h2>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[#6B6B6B]">必须 {stats.must}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[#6B6B6B]">建议 {stats.should}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-[#6B6B6B]">避免 {stats.avoid}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索规则..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E8E6E1] bg-[#FFFFFF] focus:outline-none focus:border-[#D4A574]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-1 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
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

        {/* Rule List */}
        <div className="flex-1 overflow-auto">
          {filtered.map(rule => (
            <button
              key={rule.id}
              onClick={() => setSelectedRule(rule)}
              className={`w-full text-left p-4 border-b border-[#E8E6E1] transition-colors ${
                selectedRule?.id === rule.id ? 'bg-[#FFFFFF]' : 'hover:bg-[#FFFFFF]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${
                  rule.level === 'must' ? 'text-red-500' :
                  rule.level === 'should' ? 'text-amber-500' : 'text-gray-400'
                }`}>
                  {rule.level === 'must' ? <XCircle size={16} /> :
                   rule.level === 'should' ? <AlertCircle size={16} /> :
                   <AlertCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#1A1A1A]">{rule.title}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-[#F5F5F0] text-[#6B6B6B] rounded">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] line-clamp-2">{rule.description}</p>
                  {rule.channels && (
                    <div className="flex gap-1 mt-1.5">
                      {rule.channels.map(ch => (
                        <span key={ch} className="text-xs px-1.5 py-0.5 bg-[#FAF5F0] text-[#D4A574] rounded">
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Rule Detail */}
      <div className="flex-1 overflow-auto bg-[#FFFFFF]">
        {selectedRule ? (
          <div className="max-w-2xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedRule.level === 'must' ? 'bg-red-50 text-red-500' :
                selectedRule.level === 'should' ? 'bg-amber-50 text-amber-500' :
                'bg-gray-50 text-gray-400'
              }`}>
                {selectedRule.level === 'must' ? <XCircle size={20} /> :
                 selectedRule.level === 'should' ? <AlertCircle size={20} /> :
                 <AlertCircle size={20} />}
              </div>
              <div>
                <h1 className="text-xl font-serif font-semibold text-[#1A1A1A]">{selectedRule.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-[#F5F5F0] text-[#6B6B6B] rounded-full">
                    {selectedRule.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedRule.level === 'must' ? 'bg-red-50 text-red-700' :
                    selectedRule.level === 'should' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {selectedRule.level === 'must' ? '必须遵守' : selectedRule.level === 'should' ? '建议遵守' : '避免'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <section className="mb-8">
              <h2 className="text-sm font-medium text-[#6B6B6B] mb-2">规则说明</h2>
              <p className="text-[#1A1A1A] leading-relaxed">{selectedRule.description}</p>
            </section>

            {/* Examples */}
            {selectedRule.examples && (
              <section className="mb-8">
                <h2 className="text-sm font-medium text-[#6B6B6B] mb-3">示例对比</h2>
                <div className="space-y-3">
                  {selectedRule.examples.good && (
                    <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">推荐</span>
                      </div>
                      <p className="text-sm text-[#1A1A1A]">{selectedRule.examples.good}</p>
                    </div>
                  )}
                  {selectedRule.examples.bad && (
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <XCircle size={14} className="text-red-500" />
                        <span className="text-xs font-medium text-red-700">避免</span>
                      </div>
                      <p className="text-sm text-[#1A1A1A]">{selectedRule.examples.bad}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Applicable Channels */}
            {selectedRule.channels && (
              <section className="mb-8">
                <h2 className="text-sm font-medium text-[#6B6B6B] mb-3">适用渠道</h2>
                <div className="flex gap-2">
                  {selectedRule.channels.map(ch => (
                    <span key={ch} className="px-3 py-1.5 text-sm bg-[#FAF5F0] text-[#D4A574] rounded-lg border border-[#E8D5C0]">
                      {ch}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Related Rules */}
            <section>
              <h2 className="text-sm font-medium text-[#6B6B6B] mb-3">相关规则</h2>
              <div className="space-y-2">
                {craftRules
                  .filter(r => r.category === selectedRule.category && r.id !== selectedRule.id)
                  .slice(0, 3)
                  .map(rule => (
                    <button
                      key={rule.id}
                      onClick={() => setSelectedRule(rule)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-[#E8E6E1] hover:border-[#D4A574]/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          rule.level === 'must' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        <span className="text-sm text-[#1A1A1A]">{rule.title}</span>
                      </div>
                      <ChevronRight size={14} className="text-[#6B6B6B]" />
                    </button>
                  ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BookOpen size={48} className="text-[#E8E6E1] mx-auto mb-4" />
              <p className="text-[#6B6B6B]">选择左侧规则查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
