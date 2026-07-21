'use client';

import { useState } from 'react';
import { showToast } from './toast';

// Skill 类型
interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  source: 'feishu' | 'xiaping' | 'custom' | 'builtin';
  status: 'installed' | 'available' | 'update';
  version: string;
  author: string;
  installCount: number;
  rating: number;
  tags: string[];
}

const skills: Skill[] = [
  // 飞书 Skills（已安装）
  { id: '1', name: '飞书文档读取', description: '读取飞书文档内容，支持富文本解析', icon: '📄', category: '文档处理', source: 'feishu', status: 'installed', version: '2.1.0', author: '飞书开放平台', installCount: 1250, rating: 4.8, tags: ['飞书', '文档', '解析'] },
  { id: '2', name: '飞书表格操作', description: '读写飞书多维表格，支持批量操作', icon: '📊', category: '数据处理', source: 'feishu', status: 'installed', version: '1.5.2', author: '飞书开放平台', installCount: 980, rating: 4.7, tags: ['飞书', '表格', '多维表格'] },
  { id: '3', name: '飞书消息推送', description: '向飞书群组/个人发送消息通知', icon: '💬', category: '消息通知', source: 'feishu', status: 'installed', version: '3.0.1', author: '飞书开放平台', installCount: 2100, rating: 4.9, tags: ['飞书', '消息', '通知'] },
  { id: '4', name: '飞书日历管理', description: '创建/查询飞书日历事件', icon: '📅', category: '日程管理', source: 'feishu', status: 'installed', version: '1.2.0', author: '飞书开放平台', installCount: 750, rating: 4.5, tags: ['飞书', '日历', '日程'] },
  { id: '5', name: '飞书审批流', description: '发起/查询飞书审批流程', icon: '✅', category: '流程审批', source: 'feishu', status: 'installed', version: '2.0.0', author: '飞书开放平台', installCount: 620, rating: 4.6, tags: ['飞书', '审批', '流程'] },
  { id: '6', name: '飞书云盘操作', description: '上传/下载飞书云盘文件', icon: '📁', category: '文件管理', source: 'feishu', status: 'installed', version: '1.8.3', author: '飞书开放平台', installCount: 890, rating: 4.7, tags: ['飞书', '云盘', '文件'] },
  // 虾评 Skills
  { id: '7', name: '品牌话术检测', description: '检测内容是否符合品牌话术规范', icon: '🎯', category: '内容审核', source: 'xiaping', status: 'available', version: '1.0.0', author: '虾评市场', installCount: 340, rating: 4.3, tags: ['品牌', '话术', '审核'] },
  { id: '8', name: 'SEO 优化建议', description: '分析内容 SEO 表现并给出优化建议', icon: '🔍', category: '内容优化', source: 'xiaping', status: 'available', version: '2.1.0', author: '虾评市场', installCount: 560, rating: 4.5, tags: ['SEO', '优化', '搜索'] },
  { id: '9', name: '热点追踪', description: '实时追踪行业热点话题', icon: '🔥', category: '数据分析', source: 'xiaping', status: 'available', version: '1.3.0', author: '虾评市场', installCount: 780, rating: 4.6, tags: ['热点', '趋势', '追踪'] },
  { id: '10', name: '封面图生成', description: '根据内容自动生成封面图', icon: '🖼️', category: '内容生成', source: 'xiaping', status: 'available', version: '1.1.0', author: '虾评市场', installCount: 420, rating: 4.2, tags: ['封面', '图片', '生成'] },
  // 自研 Skills
  { id: '11', name: '广丰术语转换', description: '将专业术语转换为员工易懂的表达', icon: '🔄', category: '内容优化', source: 'custom', status: 'available', version: '0.9.0', author: 'ECCP 团队', installCount: 180, rating: 4.4, tags: ['术语', '转换', '广丰'] },
  { id: '12', name: '多渠道适配', description: '一键将内容适配为公众号/小红书/视频号格式', icon: '📱', category: '内容发布', source: 'custom', status: 'update', version: '1.2.0', author: 'ECCP 团队', installCount: 290, rating: 4.5, tags: ['多渠道', '适配', '发布'] },
  // 内置 Skills
  { id: '13', name: '文本摘要', description: '长文本自动摘要提取', icon: '📝', category: '文本处理', source: 'builtin', status: 'installed', version: '1.0.0', author: '系统内置', installCount: 5000, rating: 4.8, tags: ['摘要', '提取', '总结'] },
  { id: '14', name: '关键词提取', description: '自动提取文本关键词', icon: '🏷️', category: '文本处理', source: 'builtin', status: 'installed', version: '1.0.0', author: '系统内置', installCount: 4500, rating: 4.7, tags: ['关键词', '提取', '标签'] },
];

const categories = ['全部', '文档处理', '数据处理', '消息通知', '内容审核', '内容优化', '内容生成', '文本处理', '流程审批', '文件管理', '数据分析', '内容发布', '日程管理'];
const sources = [
  { id: 'all', label: '全部来源', icon: '📋' },
  { id: 'feishu', label: '飞书', icon: '🐦' },
  { id: 'xiaping', label: '虾评市场', icon: '🦐' },
  { id: 'custom', label: '自研', icon: '🔧' },
  { id: 'builtin', label: '内置', icon: '⚙️' },
];

export function SkillMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const filteredSkills = skills.filter(skill => {
    const matchCategory = selectedCategory === '全部' || skill.category === selectedCategory;
    const matchSource = selectedSource === 'all' || skill.source === selectedSource;
    const matchSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSource && matchSearch;
  });

  const installedCount = skills.filter(s => s.status === 'installed').length;
  const updateCount = skills.filter(s => s.status === 'update').length;

  return (
    <div className="flex h-full">
      {/* 左侧筛选 */}
      <div className="w-64 border-r border-[#E8E6E1] flex flex-col">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
            Skill 市场
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            已安装 {installedCount} 个 {updateCount > 0 && `· ${updateCount} 个可更新`}
          </p>
        </div>

        {/* 搜索 */}
        <div className="p-3 border-b border-[#E8E6E1]">
          <input
            type="text"
            placeholder="搜索 Skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E8E6E1] rounded focus:outline-none focus:border-[#D4A574]"
          />
        </div>

        {/* 来源筛选 */}
        <div className="p-3 border-b border-[#E8E6E1]">
          <div className="text-xs text-[#6B6B6B] mb-2">来源</div>
          <div className="space-y-1">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                  selectedSource === source.id
                    ? 'bg-[#D4A574] text-white'
                    : 'text-[#1A1A1A] hover:bg-[#F5F4F0]'
                }`}
              >
                <span>{source.icon}</span>
                <span>{source.label}</span>
                <span className="ml-auto text-xs opacity-60">
                  {skills.filter(s => source.id === 'all' || s.source === source.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-[#6B6B6B] mb-2">分类</div>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#F5F4F0] text-[#1A1A1A] font-medium'
                    : 'text-[#6B6B6B] hover:bg-[#F5F4F0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 中间 Skill 列表 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-[#E8E6E1] flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#1A1A1A]">
            {filteredSkills.length} 个 Skills
          </h3>
          <button
            onClick={() => showToast('开发自定义 Skill 功能即将上线', 'info')}
            className="px-3 py-1.5 text-xs bg-[#1A1A1A] text-white rounded hover:bg-[#2A2A2A] transition-colors"
          >
            + 开发 Skill
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredSkills.map(skill => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`p-4 border rounded cursor-pointer transition-all ${
                  selectedSkill?.id === skill.id
                    ? 'border-[#D4A574] bg-[#FAFAF8]'
                    : 'border-[#E8E6E1] hover:border-[#D4A574]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-[#1A1A1A] truncate">{skill.name}</h4>
                      {skill.status === 'installed' && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[#4A7C59]/10 text-[#4A7C59] rounded">已安装</span>
                      )}
                      {skill.status === 'update' && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[#C17B3E]/10 text-[#C17B3E] rounded">可更新</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">{skill.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#6B6B6B]">
                      <span>⭐ {skill.rating}</span>
                      <span>📥 {skill.installCount}</span>
                      <span className="ml-auto">v{skill.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="w-80 border-l border-[#E8E6E1] flex flex-col">
        {selectedSkill ? (
          <>
            <div className="p-4 border-b border-[#E8E6E1]">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedSkill.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">{selectedSkill.name}</h3>
                  <p className="text-xs text-[#6B6B6B]">v{selectedSkill.version} · {selectedSkill.author}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="text-xs text-[#6B6B6B] mb-1">描述</div>
                <p className="text-sm text-[#1A1A1A]">{selectedSkill.description}</p>
              </div>

              <div>
                <div className="text-xs text-[#6B6B6B] mb-2">标签</div>
                <div className="flex flex-wrap gap-1">
                  {selectedSkill.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-[#F5F4F0] text-[#6B6B6B] text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#6B6B6B] mb-2">统计</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-[#F5F4F0] rounded text-center">
                    <div className="text-lg font-semibold text-[#1A1A1A]">{selectedSkill.installCount}</div>
                    <div className="text-xs text-[#6B6B6B]">安装量</div>
                  </div>
                  <div className="p-2 bg-[#F5F4F0] rounded text-center">
                    <div className="text-lg font-semibold text-[#1A1A1A]">⭐ {selectedSkill.rating}</div>
                    <div className="text-xs text-[#6B6B6B]">评分</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#6B6B6B] mb-2">来源</div>
                <div className="flex items-center gap-2 text-sm">
                  <span>
                    {selectedSkill.source === 'feishu' ? '🐦 飞书开放平台' :
                     selectedSkill.source === 'xiaping' ? '🦐 虾评市场' :
                     selectedSkill.source === 'custom' ? '🔧 ECCP 自研' : '⚙️ 系统内置'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E6E1]">
              {selectedSkill.status === 'installed' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => showToast(`${selectedSkill.name} 配置已打开`, 'info')}
                    className="w-full py-2 text-sm border border-[#E8E6E1] rounded hover:bg-[#F5F4F0] transition-colors"
                  >
                    配置
                  </button>
                  <button
                    onClick={() => showToast(`${selectedSkill.name} 已卸载`, 'success')}
                    className="w-full py-2 text-sm text-[#A64D4D] hover:bg-[#A64D4D]/5 rounded transition-colors"
                  >
                    卸载
                  </button>
                </div>
              ) : selectedSkill.status === 'update' ? (
                <button
                  onClick={() => showToast(`${selectedSkill.name} 更新中...`, 'info')}
                  className="w-full py-2 text-sm bg-[#C17B3E] text-white rounded hover:bg-[#B06A2E] transition-colors"
                >
                  更新到 v{selectedSkill.version}
                </button>
              ) : (
                <button
                  onClick={() => showToast(`${selectedSkill.name} 安装成功`, 'success')}
                  className="w-full py-2 text-sm bg-[#1A1A1A] text-white rounded hover:bg-[#2A2A2A] transition-colors"
                >
                  安装
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">🧩</div>
              <p className="text-sm text-[#6B6B6B]">选择 Skill 查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
