'use client';

import { useState } from 'react';
import { Sparkles, FileText, Image, Video, Presentation, BarChart3, ArrowRight, Zap, Clock, Star, ChevronDown } from 'lucide-react';
import { showToast } from '@/components/toast';

// Skills - what you can create
const skills = [
  { id: 'article', icon: FileText, label: '文章', desc: '长文、博客、专栏', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'short-video', icon: Video, label: '短视频', desc: '抖音、小红书、视频号', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'newsletter', icon: FileText, label: 'Newsletter', desc: '邮件通讯、周报', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'social', icon: Sparkles, label: '社交帖子', desc: '微博、Twitter、朋友圈', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'deck', icon: Presentation, label: '演示文稿', desc: 'PPT、Keynote、提案', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'dashboard', icon: BarChart3, label: '数据报告', desc: '分析报告、数据可视化', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
];

// Design Systems - brand contracts
const designSystems = [
  { id: 'editorial', name: '编辑部风格', desc: '专业、深度、权威', tokens: { primary: '#1A1A1A', accent: '#D4A574' }, active: true },
  { id: 'casual', name: '轻松日常', desc: '亲切、活泼、接地气', tokens: { primary: '#2D3748', accent: '#F6AD55' }, active: false },
  { id: 'tech', name: '科技前沿', desc: '未来感、极简、精确', tokens: { primary: '#0F172A', accent: '#3B82F6' }, active: false },
  { id: 'lifestyle', name: '生活方式', desc: '温暖、质感、美学', tokens: { primary: '#44403C', accent: '#A3E635' }, active: false },
];

// Recent projects
const recentProjects = [
  { id: '1', title: '2024 Q4 产品更新报告', skill: '数据报告', time: '2 小时前', status: 'draft' },
  { id: '2', title: 'AI 工具深度评测', skill: '文章', time: '昨天', status: 'published' },
  { id: '3', title: '年终盘点系列 - 短视频', skill: '短视频', time: '3 天前', status: 'review' },
  { id: '4', title: '技术团队周报 #48', skill: 'Newsletter', time: '上周', status: 'published' },
];

export default function HomePage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState('editorial');
  const [brief, setBrief] = useState('');
  const [showSystemPicker, setShowSystemPicker] = useState(false);

  const currentSystem = designSystems.find(s => s.id === selectedSystem)!;

  const handleCreate = () => {
    if (!brief.trim()) {
      showToast('请输入创作简报');
      return;
    }
    showToast(`正在创建: ${brief.slice(0, 30)}...`);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-semibold text-[#1A1A1A] mb-3 tracking-tight">
            开始创作
          </h1>
          <p className="text-[#6B6B6B] text-lg">
            选择技能，应用设计系统，输入你的创意简报
          </p>
        </div>

        {/* Main Composer */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E8E6E1] shadow-sm overflow-hidden mb-8">
          {/* Skill Selection */}
          <div className="p-6 border-b border-[#E8E6E1]">
            <label className="text-sm font-medium text-[#6B6B6B] mb-3 block">选择技能</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {skills.map(skill => {
                const Icon = skill.icon;
                const isSelected = selectedSkill === skill.id;
                return (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#D4A574] bg-[#FAF5F0] shadow-sm'
                        : 'border-[#E8E6E1] hover:border-[#D4A574]/50 hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${skill.color} border`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-medium text-[#1A1A1A]">{skill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Design System Selection */}
          <div className="p-6 border-b border-[#E8E6E1]">
            <label className="text-sm font-medium text-[#6B6B6B] mb-3 block">设计系统</label>
            <div className="relative">
              <button
                onClick={() => setShowSystemPicker(!showSystemPicker)}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-[#E8E6E1] hover:border-[#D4A574]/50 transition-all bg-[#FAFAF8]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md"
                    style={{ backgroundColor: currentSystem.tokens.accent }}
                  />
                  <div className="text-left">
                    <div className="font-medium text-[#1A1A1A]">{currentSystem.name}</div>
                    <div className="text-sm text-[#6B6B6B]">{currentSystem.desc}</div>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-[#6B6B6B] transition-transform ${showSystemPicker ? 'rotate-180' : ''}`} />
              </button>

              {showSystemPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#FFFFFF] rounded-lg border border-[#E8E6E1] shadow-lg z-10 overflow-hidden">
                  {designSystems.map(system => (
                    <button
                      key={system.id}
                      onClick={() => {
                        setSelectedSystem(system.id);
                        setShowSystemPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-[#FAFAF8] transition-colors border-b border-[#E8E6E1] last:border-0 ${
                        selectedSystem === system.id ? 'bg-[#FAF5F0]' : ''
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex-shrink-0"
                        style={{ backgroundColor: system.tokens.accent }}
                      />
                      <div className="text-left flex-1">
                        <div className="font-medium text-[#1A1A1A]">{system.name}</div>
                        <div className="text-sm text-[#6B6B6B]">{system.desc}</div>
                      </div>
                      {selectedSystem === system.id && (
                        <div className="w-2 h-2 rounded-full bg-[#D4A574]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Brief Input */}
          <div className="p-6">
            <label className="text-sm font-medium text-[#6B6B6B] mb-3 block">创作简报</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="描述你想创作的内容...&#10;&#10;例如：写一篇关于 2024 年 AI 工具发展趋势的深度分析文章，目标读者是技术从业者，字数 3000-5000 字。"
              className="w-full h-32 p-4 rounded-lg border border-[#E8E6E1] bg-[#FAFAF8] text-[#1A1A1A] placeholder:text-[#9A9A9A] resize-none focus:outline-none focus:border-[#D4A574] transition-colors"
            />
          </div>

          {/* Action Bar */}
          <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#E8E6E1] flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#D4A574]" />
                预计 30 秒
              </span>
              <span className="flex items-center gap-1.5">
                <Image size={14} />
                含封面图
              </span>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2A2A2A] transition-colors"
            >
              开始创作
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button className="flex items-center gap-3 p-4 rounded-lg border border-[#E8E6E1] hover:border-[#D4A574]/50 hover:bg-[#FFFFFF] transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#FAF5F0] flex items-center justify-center">
              <Clock size={18} className="text-[#D4A574]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-[#1A1A1A]">定时发布</div>
              <div className="text-xs text-[#6B6B6B]">设置自动发布时间</div>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-[#E8E6E1] hover:border-[#D4A574]/50 hover:bg-[#FFFFFF] transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#FAF5F0] flex items-center justify-center">
              <Star size={18} className="text-[#D4A574]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-[#1A1A1A]">从模板创建</div>
              <div className="text-xs text-[#6B6B6B]">使用预设模板</div>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-[#E8E6E1] hover:border-[#D4A574]/50 hover:bg-[#FFFFFF] transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#FAF5F0] flex items-center justify-center">
              <Sparkles size={18} className="text-[#D4A574]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-[#1A1A1A]">AI 灵感</div>
              <div className="text-xs text-[#6B6B6B]">获取创作建议</div>
            </div>
          </button>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-[#1A1A1A]">最近项目</h2>
            <button className="text-sm text-[#D4A574] hover:underline">查看全部</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {recentProjects.map(project => (
              <div
                key={project.id}
                className="p-4 rounded-lg border border-[#E8E6E1] hover:border-[#D4A574]/50 hover:shadow-sm transition-all cursor-pointer bg-[#FFFFFF]"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-[#6B6B6B] px-2 py-0.5 bg-[#F5F5F0] rounded">
                    {project.skill}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    project.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                    project.status === 'review' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {project.status === 'published' ? '已发布' : project.status === 'review' ? '审核中' : '草稿'}
                  </span>
                </div>
                <h3 className="font-medium text-[#1A1A1A] mb-1">{project.title}</h3>
                <p className="text-sm text-[#6B6B6B]">{project.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
