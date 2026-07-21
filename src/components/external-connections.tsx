'use client';

import { useState } from 'react';
import { showToast } from './toast';

// 外部连接类型
interface ExternalConnection {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'platform' | 'model' | 'data' | 'tool';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config: Record<string, string>;
}

const connections: ExternalConnection[] = [
  // 平台连接
  { id: '1', name: '飞书', description: '文档、表格、消息、审批', icon: '🐦', category: 'platform', status: 'connected', lastSync: '5 分钟前', config: { app_id: 'cli_xxx', scopes: 'docs,sheets,messages' } },
  { id: '2', name: '虾评平台', description: 'Skill 市场、数据分析', icon: '🦐', category: 'platform', status: 'connected', lastSync: '1 小时前', config: { api_key: '***' } },
  { id: '3', name: 'Agent World', description: '统一身份认证', icon: '🌐', category: 'platform', status: 'connected', lastSync: '实时', config: { sso_enabled: 'true' } },
  // AI 模型
  { id: '4', name: 'DeepSeek', description: 'DeepSeek-V3 / R1 系列', icon: '🤖', category: 'model', status: 'connected', lastSync: '实时', config: { model: 'deepseek-chat', api_key: '***' } },
  { id: '5', name: 'Kimi', description: 'Moonshot Kimi-K2', icon: '🌙', category: 'model', status: 'connected', lastSync: '实时', config: { model: 'kimi-k2', api_key: '***' } },
  { id: '6', name: 'OpenAI', description: 'GPT-4o / Embedding', icon: '🧠', category: 'model', status: 'disconnected', config: { model: 'gpt-4o' } },
  // 数据源
  { id: '7', name: '飞书知识库', description: '企业知识库文档同步', icon: '📚', category: 'data', status: 'connected', lastSync: '30 分钟前', config: { space_id: 'xxx', sync_interval: '1h' } },
  { id: '8', name: '飞书多维表格', description: '数据表读写', icon: '📊', category: 'data', status: 'connected', lastSync: '10 分钟前', config: { table_id: 'xxx' } },
  // 工具
  { id: '9', name: 'Webhook', description: '外部事件触发', icon: '🔗', category: 'tool', status: 'connected', config: { url: 'https://...' } },
  { id: '10', name: 'SMTP 邮件', description: '邮件通知发送', icon: '📧', category: 'tool', status: 'disconnected', config: {} },
];

const categories = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: 'platform', label: '平台', icon: '🌐' },
  { id: 'model', label: 'AI 模型', icon: '🤖' },
  { id: 'data', label: '数据源', icon: '📊' },
  { id: 'tool', label: '工具', icon: '🔧' },
];

export function ExternalConnections() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConnection, setSelectedConnection] = useState<ExternalConnection | null>(null);

  const filteredConnections = selectedCategory === 'all'
    ? connections
    : connections.filter(c => c.category === selectedCategory);

  const connectedCount = connections.filter(c => c.status === 'connected').length;

  return (
    <div className="flex h-full">
      {/* 左侧连接列表 */}
      <div className="w-72 border-r border-[#E8E6E1] flex flex-col">
        <div className="p-4 border-b border-[#E8E6E1]">
          <h2 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
            外部连接
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            {connectedCount}/{connections.length} 已连接
          </p>
        </div>

        {/* 分类 */}
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

        {/* 连接列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredConnections.map(conn => (
            <div
              key={conn.id}
              onClick={() => setSelectedConnection(conn)}
              className={`p-3 border-b border-[#E8E6E1] cursor-pointer transition-colors ${
                selectedConnection?.id === conn.id ? 'bg-[#F5F4F0]' : 'hover:bg-[#FAFAF8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{conn.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#1A1A1A]">{conn.name}</h3>
                    <span className={`w-2 h-2 rounded-full ${
                      conn.status === 'connected' ? 'bg-[#4A7C59]' :
                      conn.status === 'error' ? 'bg-[#A64D4D]' : 'bg-[#6B6B6B]'
                    }`} />
                  </div>
                  <p className="text-xs text-[#6B6B6B] truncate">{conn.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 添加连接 */}
        <div className="p-3 border-t border-[#E8E6E1]">
          <button
            onClick={() => showToast('添加新连接功能开发中', 'info')}
            className="w-full py-2 text-sm bg-[#1A1A1A] text-white rounded hover:bg-[#2A2A2A] transition-colors"
          >
            + 添加连接
          </button>
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            <div className="p-6 border-b border-[#E8E6E1]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedConnection.icon}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {selectedConnection.name}
                    </h2>
                    <p className="text-sm text-[#6B6B6B] mt-1">{selectedConnection.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConnection.status === 'connected' ? (
                    <>
                      <span className="px-3 py-1 text-xs bg-[#4A7C59]/10 text-[#4A7C59] rounded-full">
                        ● 已连接
                      </span>
                      <button
                        onClick={() => showToast(`${selectedConnection.name} 已断开`, 'success')}
                        className="px-3 py-1.5 text-xs border border-[#E8E6E1] rounded hover:bg-[#F5F4F0] transition-colors"
                      >
                        断开
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => showToast(`${selectedConnection.name} 连接中...`, 'info')}
                      className="px-4 py-2 text-sm bg-[#1A1A1A] text-white rounded hover:bg-[#2A2A2A] transition-colors"
                    >
                      连接
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 连接状态 */}
              <div>
                <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">连接状态</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#F5F4F0] rounded">
                    <div className="text-xs text-[#6B6B6B]">状态</div>
                    <div className="text-sm font-medium text-[#1A1A1A] mt-1">
                      {selectedConnection.status === 'connected' ? '✅ 正常' : '⚪ 未连接'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#F5F4F0] rounded">
                    <div className="text-xs text-[#6B6B6B]">最后同步</div>
                    <div className="text-sm font-medium text-[#1A1A1A] mt-1">
                      {selectedConnection.lastSync || '从未'}
                    </div>
                  </div>
                  <div className="p-3 bg-[#F5F4F0] rounded">
                    <div className="text-xs text-[#6B6B6B]">类别</div>
                    <div className="text-sm font-medium text-[#1A1A1A] mt-1">
                      {selectedConnection.category === 'platform' ? '平台' :
                       selectedConnection.category === 'model' ? 'AI 模型' :
                       selectedConnection.category === 'data' ? '数据源' : '工具'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 配置信息 */}
              <div>
                <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">配置信息</h3>
                <div className="border border-[#E8E6E1] rounded overflow-hidden">
                  {Object.entries(selectedConnection.config).map(([key, value]) => (
                    <div key={key} className="flex items-center p-3 border-b border-[#E8E6E1] last:border-b-0">
                      <span className="text-xs text-[#6B6B6B] w-32 font-mono">{key}</span>
                      <span className="text-sm text-[#1A1A1A] font-mono flex-1">{value}</span>
                      <button className="text-xs text-[#D4A574] hover:underline">编辑</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 使用此连接的 Agents */}
              {selectedConnection.status === 'connected' && (
                <div>
                  <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">使用此连接的 Agents</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedConnection.category === 'model' ? (
                      <>
                        <span className="px-3 py-1 bg-[#F5F4F0] text-sm rounded">✍️ 员工故事创作 Agent</span>
                        <span className="px-3 py-1 bg-[#F5F4F0] text-sm rounded">🛡️ 内容审核 Agent</span>
                      </>
                    ) : selectedConnection.category === 'platform' && selectedConnection.name === '飞书' ? (
                      <>
                        <span className="px-3 py-1 bg-[#F5F4F0] text-sm rounded">🔍 素材初筛 Agent</span>
                        <span className="px-3 py-1 bg-[#F5F4F0] text-sm rounded">📊 复盘分析 Agent</span>
                      </>
                    ) : (
                      <span className="text-sm text-[#6B6B6B]">暂无 Agent 使用此连接</span>
                    )}
                  </div>
                </div>
              )}

              {/* 日志 */}
              {selectedConnection.status === 'connected' && (
                <div>
                  <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">最近活动</h3>
                  <div className="border border-[#E8E6E1] rounded p-3 bg-[#F5F4F0] text-xs font-mono text-[#6B6B6B] space-y-1">
                    <div>[{selectedConnection.lastSync || '刚刚'}] ✅ 同步成功</div>
                    <div>[2026-07-21 08:30] ✅ 心跳检测正常</div>
                    <div>[2026-07-21 07:00] ✅ 数据同步完成</div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-30">🔗</div>
              <h3 className="text-lg font-medium text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>
                外部连接管理
              </h3>
              <p className="text-sm text-[#6B6B6B] mt-2 max-w-md">
                选择左侧连接查看详情，管理飞书、AI 模型、数据源等外部集成
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
