'use client';

import { useState } from 'react';
import { showToast } from './toast';

const craftCategories = [
  {
    id: 'title',
    label: '标题规则',
    icon: '📝',
    rules: [
      { id: '1', name: '标题长度限制', desc: '微信公众号标题不超过 64 字符，小红书不超过 20 字', threshold: '64字/20字', enabled: true },
      { id: '2', name: '标题公式', desc: '数字+痛点+解决方案，或疑问句开头提升点击率', threshold: 'CTR≥5%', enabled: true },
      { id: '3', name: '禁用词汇', desc: '避免使用绝对化用语、虚假承诺、敏感词', threshold: '0容忍', enabled: true },
    ],
  },
  {
    id: 'cover',
    label: '封面规范',
    icon: '🖼️',
    rules: [
      { id: '4', name: '封面尺寸', desc: '各平台封面尺寸需符合设计规范', threshold: '按渠道', enabled: true },
      { id: '5', name: '文字覆盖率', desc: '封面文字面积不超过 30%，保持视觉清晰', threshold: '≤30%', enabled: true },
      { id: '6', name: '品牌元素', desc: '封面需包含品牌 Logo 或品牌色元素', threshold: '必须', enabled: false },
    ],
  },
  {
    id: 'seo',
    label: 'SEO 优化',
    icon: '🔍',
    rules: [
      { id: '7', name: '关键词密度', desc: '正文关键词密度控制在 2%-5%', threshold: '2-5%', enabled: true },
      { id: '8', name: '摘要长度', desc: 'SEO 摘要控制在 120-160 字符', threshold: '120-160', enabled: true },
      { id: '9', name: 'H标签层级', desc: '文章标题层级不超过 H3，保持结构清晰', threshold: '≤H3', enabled: true },
    ],
  },
  {
    id: 'layout',
    label: '排版规则',
    icon: '📐',
    rules: [
      { id: '10', name: '段落长度', desc: '每段不超过 5 行，保持阅读节奏', threshold: '≤5行', enabled: true },
      { id: '11', name: '行间距', desc: '正文行间距 1.7-2.0 倍，提升可读性', threshold: '1.7-2.0', enabled: true },
      { id: '12', name: '配图频率', desc: '每 300-500 字配一张图，缓解视觉疲劳', threshold: '300-500字', enabled: true },
    ],
  },
  {
    id: 'publish',
    label: '发布策略',
    icon: '📅',
    rules: [
      { id: '13', name: '最佳发布时间', desc: '工作日 8-9点、12-13点、20-22点 发布效果最佳', threshold: '高峰时段', enabled: true },
      { id: '14', name: '发布频率', desc: '公众号每周 2-3 篇，小红书每天 1-2 篇', threshold: '按渠道', enabled: true },
      { id: '15', name: '跨平台间隔', desc: '同一内容跨平台发布间隔至少 2 小时', threshold: '≥2h', enabled: false },
    ],
  },
];

export function CraftRules() {
  const [activeCategory, setActiveCategory] = useState('title');
  const [rules, setRules] = useState(craftCategories);

  const toggleRule = (catId: string, ruleId: string) => {
    setRules(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        rules: cat.rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r),
      };
    }));
    showToast('规则状态已更新', 'success');
  };

  const activeCat = rules.find(c => c.id === activeCategory)!;
  const totalRules = rules.reduce((s, c) => s + c.rules.length, 0);
  const enabledRules = rules.reduce((s, c) => s + c.rules.filter(r => r.enabled).length, 0);

  return (
    <div className="flex h-[calc(100vh-52px)]">
      {/* Left: Categories */}
      <div className="w-[240px] border-r overflow-auto" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E8E6E1' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>Craft 工艺规则</h2>
          <p className="text-[11px] mt-1" style={{ color: '#999' }}>内容创作最佳实践</p>
        </div>
        <div className="p-2">
          {rules.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="w-full p-3 rounded mb-1 text-left transition-all"
              style={{
                backgroundColor: activeCategory === cat.id ? '#F5F0EB' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{cat.icon}</span>
                <span className="text-[13px] font-medium" style={{ color: '#1A1A1A' }}>{cat.label}</span>
              </div>
              <div className="text-[11px] mt-1 pl-7" style={{ color: '#999' }}>
                {cat.rules.filter(r => r.enabled).length}/{cat.rules.length} 启用
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t" style={{ borderColor: '#E8E6E1' }}>
          <div className="text-[11px]" style={{ color: '#999' }}>总计</div>
          <div className="text-[16px] font-semibold mt-1" style={{ color: '#D4A574' }}>
            {enabledRules}/{totalRules} 规则启用
          </div>
        </div>
      </div>

      {/* Right: Rules */}
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[24px]">{activeCat.icon}</span>
            <h1 className="text-[20px] font-semibold" style={{ color: '#1A1A1A', fontFamily: 'Noto Serif SC, serif' }}>{activeCat.label}</h1>
          </div>

          <div className="space-y-3">
            {activeCat.rules.map(rule => (
              <div key={rule.id} className="p-5 rounded border transition-all" style={{ borderColor: '#E8E6E1', backgroundColor: '#FFF' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>{rule.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{
                        backgroundColor: rule.enabled ? '#4A7C5920' : '#E8E6E1',
                        color: rule.enabled ? '#4A7C59' : '#999',
                      }}>
                        {rule.enabled ? '启用' : '禁用'}
                      </span>
                    </div>
                    <p className="text-[13px] leading-[1.6]" style={{ color: '#666' }}>{rule.desc}</p>
                    <div className="mt-2 text-[11px] font-mono px-2 py-1 rounded inline-block" style={{ backgroundColor: '#F5F0EB', color: '#D4A574' }}>
                      阈值: {rule.threshold}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(activeCat.id, rule.id)}
                    className="ml-4 w-10 h-5 rounded-full relative transition-all"
                    style={{ backgroundColor: rule.enabled ? '#4A7C59' : '#E8E6E1' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: rule.enabled ? '22px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
