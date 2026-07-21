'use client';

import { useState } from 'react';
import { showToast } from './toast';

// Agent 配置类型
interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'review' | 'analysis' | 'automation';
  status: 'active' | 'inactive' | 'draft';
  model: string;
  prompt: string;
  tools: string[];
  knowledgeBases: string[];
  lastRun?: string;
  runCount: number;
  successRate: number;
}

const agents: AgentConfig[] = [
  {
    id: '1',
    name: '员工故事创作 Agent',
    description: '根据员工提供的素材，自动生成符合品牌调性的故事稿件，支持多种文体风格',
    icon: '✍️',
    category: 'content',
    status: 'active',
    model: 'DeepSeek-V3',
    prompt: '你是广汽丰田的内容创作专家，擅长将员工素材转化为生动的故事...',
    tools: ['品牌话术库', '文风检测', 'SEO优化'],
    knowledgeBases: ['品牌手册', '优秀案例库', '话术规范'],
    lastRun: '2 小时前',
    runCount: 156,
    successRate: 94,
  },
  {
    id: '2',
    name: '素材初筛 Agent',
    description: '自动审核部门报送的素材，判断质量、相关性和可用性，给出初筛意见',
    icon: '🔍',
    category: 'review',
    status: 'active',
    model: 'Kimi-K2',
    prompt: '你是素材审核专家，负责评估报送素材的质量、时效性和传播价值...',
    tools: ['质量评分', '重复检测', '标签提取'],
    knowledgeBases: ['素材标准', '历史报送记录'],
    lastRun: '30 分钟前',
    runCount: 892,
    successRate: 98,
  },
  {
    id: '3',
    name: '内容审核 Agent',
    description: '对生成的内容进行合规性检查，确保符合品牌规范和法律法规要求',
    icon: '🛡️',
    category: 'review',
    status: 'active',
    model: 'DeepSeek-V3',
    prompt: '你是内容合规审核专家，负责检查内容是否符合品牌规范和法规要求...',
    tools: ['敏感词检测', '品牌规范校验', '法规合规检查'],
    knowledgeBases: ['品牌规范手册', '法规知识库', '历史违规案例'],
    lastRun: '1 小时前',
    runCount: 423,
    successRate: 99,
  },
  {
    id: '4',
    name: '选题推荐 Agent',
    description: '基于热点趋势、历史数据和部门动态，智能推荐选题方向',
    icon: '💡',
    category: 'analysis',
    status: 'active',
    model: 'DeepSeek-R1',
    prompt: '你是选题策划专家，擅长发现热点、分析趋势，推荐有传播价值的选题...',
    tools: ['热点追踪', '数据分析', '趋势预测'],
    knowledgeBases: ['行业热点库', '历史选题库', '部门动态'],
    lastRun: '4 小时前',
    runCount: 67,
    successRate: 88,
  },
  {
    id: '5',
    name: '复盘分析 Agent',
    description: '对已发布内容进行效果分析，生成复盘报告和优化建议',
    icon: '📊',
    category: 'analysis',
    status: 'inactive',
    model: 'Kimi-K2',
    prompt: '你是数据分析专家，擅长分析内容传播效果，提供优化建议...',
    tools: ['数据采集', '效果分析', '报告生成'],
    knowledgeBases: ['历史数据', '行业基准'],
    lastRun: '3 天前',
    runCount: 34,
    successRate: 91,
  },
  {
    id: '6',
    name: '多渠道适配 Agent',
    description: '将同一内容自动适配为不同渠道的格式和风格（公众号/小红书/视频号等）',
    icon: '🔄',
    category: 'automation',
    status: 'draft',
    model: 'DeepSeek-V3',
    prompt: '你是多渠道内容适配专家，能将内容转换为不同平台的最佳格式...',
    tools: ['格式转换', '字数控制', '标签生成'],
    knowledgeBases: ['渠道规范', '优秀案例'],
    runCount: 0,
    successRate: 0,
  },
];

const categories = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: 'content', label: '内容创作', icon: '✍️' },
  { id: 'review', label: '审核检测', icon: '🛡️' },
  { id: 'analysis', label: '分析推荐', icon: '📊' },
  { id: 'automation', label: '自动化', icon: '🔄' },
];

export function AgentManagement() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const filteredAgents = selectedCategory === 'all'
    ? agents
    : agents.filter(a => a.category === selectedCategory);

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalRuns = agents.reduce((sum, a) => sum + a.runCount, 0);

  return (
    <div className="flex h-full">
      {/* 左侧 Agent 列表 */}
      <div className="w-80 border-r border-[#E8E6E1] flex flex-col">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            Agent 管理
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            {activeCount} 个活跃 / 共 {agents.length} 个
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="p-3 border-b border-[#E8E6E1] flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#D4A574] text-white'
                  : 'text-[#6B6B6B] hover:bg-[#F5F4F0]'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Agent 列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              onClick={() => { setSelectedAgent(agent); setShowConfigPanel(true); }}
              className={`p-4 border-b border-[#E8E6E1] cursor-pointer transition-colors ${
                selectedAgent?.id === agent.id ? 'bg-[#F5F4F0]' : 'hover:bg-[#FAFAF8]'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#1A1A1A] truncate">
                      {agent.name}
                    </h3>
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-[#4A7C59]' :
                      agent.status === 'inactive' ? 'bg-[#C17B3E]' : 'bg-[#6B6B6B]'
                    }`} />
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                    {agent.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#6B6B6B]">
                    <span>🤖 {agent.model}</span>
                    <span>▶ {agent.runCount}次</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 新建 Agent 按钮 */}
        <div className="p-3 border-t border-[#E8E6E1]">
          <button
            onClick={() => showToast('新建 Agent 功能开发中', 'info')}
            className="w-full py-2 px-4 bg-[#1A1A1A] text-white text-sm rounded hover:bg-[#2A2A2A] transition-colors"
          >
            + 新建 Agent
          </button>
        </div>
      </div>

      {/* 右侧配置面板 */}
      <div className="flex-1 flex flex-col">
        {showConfigPanel && selectedAgent ? (
          <>
            {/* 头部 */}
            <div className="p-6 border-b border-[#E8E6E1]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedAgent.icon}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {selectedAgent.name}
                    </h2>
                    <p className="text-sm text-[#6B6B6B] mt-1">{selectedAgent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      showToast(`${selectedAgent.name} 已启动`, 'success');
                    }}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      selectedAgent.status === 'active'
                        ? 'bg-[#4A7C59] text-white hover:bg-[#3A6C49]'
                        : 'bg-[#1A1A1A] text-white hover:bg-[#2A2A2A]'
                    }`}
                  >
                    {selectedAgent.status === 'active' ? '● 运行中' : '○ 启动'}
                  </button>
                  <button
                    onClick={() => showToast('测试对话功能开发中', 'info')}
                    className="px-4 py-2 text-sm border border-[#E8E6E1] rounded hover:bg-[#F5F4F0] transition-colors"
                  >
                    测试
                  </button>
                </div>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="p-3 bg-[#F5F4F0] rounded">
                  <div className="text-xs text-[#6B6B6B]">运行次数</div>
                  <div className="text-xl font-semibold text-[#1A1A1A] mt-1">{selectedAgent.runCount}</div>
                </div>
                <div className="p-3 bg-[#F5F4F0] rounded">
                  <div className="text-xs text-[#6B6B6B]">成功率</div>
                  <div className="text-xl font-semibold text-[#4A7C59] mt-1">{selectedAgent.successRate}%</div>
                </div>
                <div className="p-3 bg-[#F5F4F0] rounded">
                  <div className="text-xs text-[#6B6B6B]">模型</div>
                  <div className="text-sm font-medium text-[#1A1A1A] mt-1">{selectedAgent.model}</div>
                </div>
                <div className="p-3 bg-[#F5F4F0] rounded">
                  <div className="text-xs text-[#6B6B6B]">上次运行</div>
                  <div className="text-sm font-medium text-[#1A1A1A] mt-1">{selectedAgent.lastRun || '从未'}</div>
                </div>
              </div>
            </div>

            {/* 配置区域 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  System Prompt
                </label>
                <textarea
                  defaultValue={selectedAgent.prompt}
                  rows={6}
                  className="w-full px-3 py-2 border border-[#E8E6E1] rounded text-sm resize-none focus:outline-none focus:border-[#D4A574]"
                />
              </div>

              {/* 工具配置 */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  工具 / Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tools.map(tool => (
                    <span
                      key={tool}
                      className="px-3 py-1 bg-[#F5F4F0] text-[#1A1A1A] text-xs rounded-full"
                    >
                      🔧 {tool}
                    </span>
                  ))}
                  <button
                    onClick={() => showToast('添加工具功能开发中', 'info')}
                    className="px-3 py-1 border border-dashed border-[#E8E6E1] text-[#6B6B6B] text-xs rounded-full hover:border-[#D4A574] hover:text-[#D4A574] transition-colors"
                  >
                    + 添加
                  </button>
                </div>
              </div>

              {/* 知识库绑定 */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  绑定知识库
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.knowledgeBases.map(kb => (
                    <span
                      key={kb}
                      className="px-3 py-1 bg-[#E8D5C0]/30 text-[#8B6B4D] text-xs rounded-full"
                    >
                      📚 {kb}
                    </span>
                  ))}
                  <button
                    onClick={() => showToast('绑定知识库功能开发中', 'info')}
                    className="px-3 py-1 border border-dashed border-[#E8E6E1] text-[#6B6B6B] text-xs rounded-full hover:border-[#D4A574] hover:text-[#D4A574] transition-colors"
                  >
                    + 绑定
                  </button>
                </div>
              </div>

              {/* 运行日志 */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  最近运行日志
                </label>
                <div className="border border-[#E8E6E1] rounded overflow-hidden">
                  <div className="p-3 bg-[#F5F4F0] text-xs text-[#6B6B6B] font-mono">
                    <div>[2026-07-21 09:30:12] ✅ 素材初筛完成，处理 23 条报送</div>
                    <div>[2026-07-21 09:15:45] ✅ 内容审核通过，无违规项</div>
                    <div>[2026-07-21 08:42:33] ⚠️ 故事创作超时，已自动重试</div>
                    <div>[2026-07-21 08:30:00] ✅ 选题推荐完成，生成 5 个选题</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">🤖</div>
              <h3 className="text-lg font-medium text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
                Agent 管理中心
              </h3>
              <p className="text-sm text-[#6B6B6B] mt-2 max-w-md">
                选择左侧 Agent 查看配置，或新建 Agent 来扩展平台能力
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
