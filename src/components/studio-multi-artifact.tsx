'use client';

import { useState } from 'react';
import { Eye, Smartphone, Monitor, Tablet, Download, Share2, RefreshCw, Check, Copy, ExternalLink } from 'lucide-react';
import { showToast } from '@/components/toast';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ChannelType = 'wechat' | 'xiaohongshu' | 'bilibili' | 'douyin' | 'newsletter' | 'internal';

const channels: { id: ChannelType; name: string; shortName: string }[] = [
  { id: 'wechat', name: '微信公众号', shortName: '公众号' },
  { id: 'xiaohongshu', name: '小红书', shortName: '小红书' },
  { id: 'bilibili', name: 'B站专栏', shortName: 'B站' },
  { id: 'douyin', name: '抖音图文', shortName: '抖音' },
  { id: 'newsletter', name: 'Newsletter', shortName: '邮件' },
  { id: 'internal', name: '内刊', shortName: '内刊' },
];

// Sample content for different channels
const channelContent: Record<ChannelType, { title: string; body: string; cover: string }> = {
  wechat: {
    title: '2024 年度 AI 工具深度盘点：哪些真正改变了我们的工作方式？',
    body: `在过去的一年里，AI 工具经历了从"新奇玩具"到"生产力基础设施"的转变。本文将从实际使用角度，深度评测 10 款最具代表性的 AI 工具。

## 一、文本创作类

### 1. Claude —— 深度思考的最佳伙伴

Claude 在长文本理解和深度分析方面的能力无人能及。当你需要写一篇 5000 字的行业分析报告时，Claude 能够...`,
    cover: '2.35:1 横版封面',
  },
  xiaohongshu: {
    title: 'AI 工具大测评 | 这 10 个神器让我效率翻倍',
    body: `姐妹们！今天来分享我私藏已久的 AI 工具清单

用了整整一年，终于整理出这份最实用的 AI 工具指南

---

1 Claude
深度分析、长文写作的首选
适合：报告、论文、策划案
推荐指数：5/5

2 ChatGPT
万能选手，什么都能聊
适合：头脑风暴、快速问答
推荐指数：4.5/5

...

#AI工具 #效率提升 #职场干货`,
    cover: '3:4 竖版封面',
  },
  bilibili: {
    title: '【深度】2024 AI 工具年终盘点，这 10 个改变了我的工作流',
    body: `视频简介：
一年过去了，AI 工具到底哪些真正好用？本期视频从实际使用角度出发，深度评测 10 款 AI 工具。

时间戳：
00:00 开场
01:23 文本创作类
03:45 图像生成类
05:12 代码辅助类
07:30 总结推荐

正文内容...`,
    cover: '16:9 横版封面',
  },
  douyin: {
    title: 'AI 工具推荐 | 打工人必备',
    body: `10 个 AI 神器，效率提升 10 倍

1. Claude - 写报告
2. Midjourney - 做图
3. Cursor - 写代码

你最常用哪个？评论区告诉我

#AI #效率 #职场`,
    cover: '9:16 竖版封面',
  },
  newsletter: {
    title: 'Weekly Digest: AI Tools That Actually Matter',
    body: `Hi there,

Welcome to this week's digest. Today I'm sharing my top AI tool picks from 2024.

## Top Picks

**Claude** - For deep analysis and long-form writing. When you need to think through complex problems...

**ChatGPT** - The versatile all-rounder. Great for brainstorming...

---

Until next week,
[Your Name]`,
    cover: '1:1 方形封面',
  },
  internal: {
    title: 'AI 工具应用白皮书',
    body: `摘要：本报告系统梳理了 2024 年度主流 AI 工具的应用情况，为团队工具选型提供参考。

一、背景
随着 AI 技术的快速发展...

二、工具评测
2.1 文本创作类
2.2 图像生成类
2.3 代码辅助类

三、建议
基于评测结果，建议团队...

附件：详细评测数据表`,
    cover: 'A4 文档封面',
  },
};

export default function StudioPage() {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('wechat');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const content = channelContent[activeChannel];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('已重新生成');
    }, 1000);
  };

  const handleCopy = () => {
    showToast('已复制到剪贴板');
  };

  const handleExport = () => {
    showToast(`正在导出 ${channels.find(c => c.id === activeChannel)?.name} 版本...`);
  };

  const deviceWidth = device === 'mobile' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-full';

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Channel Selection */}
      <div className="w-64 border-r border-[#E8E6E1] flex flex-col bg-[#FAFAF8]">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="font-serif font-semibold text-[#1A1A1A] mb-1">渠道适配</h2>
          <p className="text-xs text-[#6B6B6B]">一源多渠，实时预览</p>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                activeChannel === channel.id
                  ? 'bg-[#FFFFFF] border border-[#D4A574] shadow-sm'
                  : 'hover:bg-[#FFFFFF] border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                activeChannel === channel.id
                  ? 'bg-[#D4A574] text-white'
                  : 'bg-[#F5F5F0] text-[#6B6B6B]'
              }`}>
                {channel.shortName.slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-medium text-[#1A1A1A]">{channel.name}</div>
              </div>
              {activeChannel === channel.id && (
                <Check size={14} className="ml-auto text-[#D4A574]" />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-[#E8E6E1] space-y-2">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#6B6B6B] border border-[#E8E6E1] rounded-lg hover:bg-[#FFFFFF] transition-colors"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            重新生成
          </button>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            <Download size={14} />
            导出全部
          </button>
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 border-b border-[#E8E6E1] flex items-center justify-between px-4 bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B6B6B]">预览</span>
            <div className="flex items-center gap-1 ml-4 p-1 bg-[#F5F5F0] rounded-lg">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded ${device === 'desktop' ? 'bg-[#FFFFFF] shadow-sm' : ''}`}
              >
                <Monitor size={14} className="text-[#6B6B6B]" />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-1.5 rounded ${device === 'tablet' ? 'bg-[#FFFFFF] shadow-sm' : ''}`}
              >
                <Tablet size={14} className="text-[#6B6B6B]" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded ${device === 'mobile' ? 'bg-[#FFFFFF] shadow-sm' : ''}`}
              >
                <Smartphone size={14} className="text-[#6B6B6B]" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors"
            >
              <Copy size={12} />
              复制
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors">
              <Share2 size={12} />
              分享
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#E8E6E1] rounded-lg hover:bg-[#FAFAF8] transition-colors">
              <ExternalLink size={12} />
              打开
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-[#F5F5F0] p-8 flex justify-center">
          <div className={`${deviceWidth} w-full transition-all duration-300`}>
            <div className="bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E8E6E1] overflow-hidden">
              {/* Cover placeholder */}
              <div className="aspect-[2.35/1] bg-gradient-to-br from-[#FAF5F0] to-[#F5F5F0] flex items-center justify-center border-b border-[#E8E6E1]">
                <div className="text-center">
                  <Eye size={32} className="text-[#D4A574] mx-auto mb-2" />
                  <div className="text-sm text-[#6B6B6B]">{content.cover}</div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h1 className="text-2xl font-serif font-semibold text-[#1A1A1A] mb-6 leading-tight">
                  {content.title}
                </h1>
                <div className="prose prose-sm max-w-none">
                  {content.body.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-serif font-semibold text-[#1A1A1A] mt-6 mb-3">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-lg font-semibold text-[#1A1A1A] mt-4 mb-2">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold text-[#1A1A1A] my-2">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line === '---') {
                      return <hr key={i} className="my-4 border-[#E8E6E1]" />;
                    }
                    if (line.startsWith('- ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                      return <div key={i} className="text-[#4A4A4A] my-1 pl-4">{line}</div>;
                    }
                    if (line.startsWith('#')) {
                      return <p key={i} className="text-[#D4A574] my-1">{line}</p>;
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return <p key={i} className="text-[#4A4A4A] leading-relaxed my-2">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Metadata */}
      <div className="w-72 border-l border-[#E8E6E1] flex flex-col bg-[#FAFAF8]">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="font-serif font-semibold text-[#1A1A1A]">适配信息</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Channel Info */}
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">目标渠道</label>
            <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E8E6E1]">
              <div className="font-medium text-sm text-[#1A1A1A]">{channels.find(c => c.id === activeChannel)?.name}</div>
              <div className="text-xs text-[#6B6B6B] mt-1">
                {activeChannel === 'wechat' && '封面 2.35:1 · 标题≤30字'}
                {activeChannel === 'xiaohongshu' && '封面 3:4 · 标题含 emoji'}
                {activeChannel === 'bilibili' && '封面 16:9 · 含时间戳'}
                {activeChannel === 'douyin' && '封面 9:16 · 短文案'}
                {activeChannel === 'newsletter' && '封面 1:1 · 英文优先'}
                {activeChannel === 'internal' && 'A4 格式 · 正式语气'}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">内容统计</label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">字数</span>
                <span className="text-[#1A1A1A] font-medium">{content.body.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">段落</span>
                <span className="text-[#1A1A1A] font-medium">{content.body.split('\n\n').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">预计阅读</span>
                <span className="text-[#1A1A1A] font-medium">{Math.ceil(content.body.length / 500)} 分钟</span>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">SEO 检查</label>
            <div className="space-y-2">
              {[
                { label: '标题长度', status: 'good', value: '合适' },
                { label: '关键词密度', status: 'good', value: '2.3%' },
                { label: '封面图', status: 'warning', value: '待生成' },
                { label: '摘要', status: 'error', value: '缺失' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#6B6B6B]">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'good' ? 'bg-emerald-500' :
                      item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <span className="text-[#1A1A1A]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-[#E8E6E1]">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-[#E8E6E1] rounded-lg hover:bg-[#FFFFFF] transition-colors"
            >
              <Copy size={14} />
              复制内容
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors">
              <Check size={14} />
              确认适配
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
