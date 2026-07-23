'use client';

import {
  Bot,
  CheckCircle2,
  Cloud,
  Database,
  Link2,
  Mail,
  MoreHorizontal,
  Plus,
  PlugZap,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  Webhook,
  XCircle,
} from 'lucide-react';
import { type ComponentType, useDeferredValue, useState } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { PlatformDialog } from './platform-dialog';
import { showToast } from './toast';

type ConnectionCategory = 'platform' | 'model' | 'data' | 'tool';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface ExternalConnection {
  id: string;
  name: string;
  description: string;
  category: ConnectionCategory;
  status: ConnectionStatus;
  lastSync?: string;
  config: Record<string, string>;
  agents: string[];
}

const initialConnections: ExternalConnection[] = [
  { id: '1', name: '飞书', description: '文档、表格、消息与审批能力', category: 'platform', status: 'connected', lastSync: '5 分钟前', config: { app_id: 'cli_xxx', scopes: 'docs,sheets,messages' }, agents: ['素材初筛 Agent', '复盘分析 Agent'] },
  { id: '2', name: '虾评平台', description: 'Skill 市场与内容分析能力', category: 'platform', status: 'connected', lastSync: '1 小时前', config: { api_key: '••••••••' }, agents: ['选题推荐 Agent'] },
  { id: '3', name: 'Agent World', description: '统一身份认证与 Agent 路由', category: 'platform', status: 'connected', lastSync: '实时', config: { sso_enabled: 'true' }, agents: [] },
  { id: '4', name: 'DeepSeek', description: 'DeepSeek V4 Pro / Flash 模型服务', category: 'model', status: 'connected', lastSync: '实时', config: { model: 'deepseek-v4-pro', fallback_model: 'deepseek-v4-flash', api_key: '••••••••' }, agents: ['员工故事创作 Agent', '内容审核 Agent'] },
  { id: '5', name: 'Kimi', description: 'Moonshot Kimi 长文本模型', category: 'model', status: 'connected', lastSync: '实时', config: { model: 'kimi-k2', api_key: '••••••••' }, agents: ['素材初筛 Agent'] },
  { id: '6', name: 'OpenAI', description: '生成模型与 Embedding 服务', category: 'model', status: 'disconnected', config: { model: 'gpt-4.1' }, agents: [] },
  { id: '7', name: '飞书知识库', description: '企业知识库文档定时同步', category: 'data', status: 'connected', lastSync: '30 分钟前', config: { space_id: 'spc_xxx', sync_interval: '1h' }, agents: ['员工故事创作 Agent'] },
  { id: '8', name: '飞书多维表格', description: '多维表格的数据读写能力', category: 'data', status: 'connected', lastSync: '10 分钟前', config: { table_id: 'tbl_xxx' }, agents: ['复盘分析 Agent'] },
  { id: '9', name: 'Webhook', description: '接收外部事件并触发工作流', category: 'tool', status: 'connected', lastSync: '12 分钟前', config: { url: 'https://hooks.example.com/eccp' }, agents: [] },
  { id: '10', name: 'SMTP 邮件', description: '发送审核与任务通知邮件', category: 'tool', status: 'disconnected', config: { host: 'smtp.example.com' }, agents: [] },
];

const categoryDefinition: Record<ConnectionCategory, { label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  platform: { label: '平台', icon: Cloud },
  model: { label: 'AI 模型', icon: Bot },
  data: { label: '数据源', icon: Database },
  tool: { label: '工具', icon: Webhook },
};

const statusDefinition: Record<ConnectionStatus, { label: string; color: string; bg: string }> = {
  connected: { label: '已连接', color: '#21865D', bg: '#EAF7F1' },
  disconnected: { label: '未连接', color: '#657682', bg: '#EEF2F5' },
  error: { label: '连接异常', color: '#C44F55', bg: '#FFF0F1' },
};

const emptyForm = { name: '', description: '', category: 'platform' as ConnectionCategory, endpoint: '', credential: '' };

export function ExternalConnections() {
  const [connections, setConnections] = usePersistedState('eccp-connections-v2', initialConnections);
  const [selectedId, setSelectedId] = useState(initialConnections[0].id);
  const [category, setCategory] = useState<'all' | ConnectionCategory>('all');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingConfig, setEditingConfig] = useState<{ key: string; value: string } | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedConnection = connections.find(item => item.id === selectedId) ?? connections[0];

  const filteredConnections = connections.filter(connection => {
    const matchesCategory = category === 'all' || connection.category === category;
    const matchesQuery = !deferredQuery || `${connection.name} ${connection.description}`.toLocaleLowerCase().includes(deferredQuery);
    return matchesCategory && matchesQuery;
  });

  const updateConnection = (id: string, updater: (connection: ExternalConnection) => ExternalConnection) => {
    setConnections(current => current.map(connection => connection.id === id ? updater(connection) : connection));
  };

  const createConnection = () => {
    const name = form.name.trim();
    if (!name) {
      showToast('请填写连接名称', 'error');
      return;
    }
    const config: Record<string, string> = {};
    if (form.endpoint.trim()) config.endpoint = form.endpoint.trim();
    if (form.credential.trim()) config.credential = '••••••••';
    const connection: ExternalConnection = {
      id: `connection-${Date.now()}`,
      name,
      description: form.description.trim() || '自定义企业连接',
      category: form.category,
      status: 'disconnected',
      config,
      agents: [],
    };
    setConnections(current => [...current, connection]);
    setSelectedId(connection.id);
    setCategory('all');
    setForm(emptyForm);
    setShowCreate(false);
    showToast('连接已创建，请完成测试后启用', 'success');
  };

  const toggleConnection = () => {
    const nextStatus: ConnectionStatus = selectedConnection.status === 'connected' ? 'disconnected' : 'connected';
    updateConnection(selectedConnection.id, connection => ({ ...connection, status: nextStatus, lastSync: nextStatus === 'connected' ? '刚刚' : connection.lastSync }));
    showToast(nextStatus === 'connected' ? `${selectedConnection.name} 已连接` : `${selectedConnection.name} 已断开`, 'success');
  };

  const testConnection = () => {
    updateConnection(selectedConnection.id, connection => ({ ...connection, status: 'connected', lastSync: '刚刚' }));
    showToast('连接测试通过，认证与读写权限正常', 'success');
  };

  const syncConnection = () => {
    updateConnection(selectedConnection.id, connection => ({ ...connection, lastSync: '刚刚' }));
    showToast(`已完成 ${selectedConnection.name} 数据同步`, 'success');
  };

  const saveConfig = () => {
    if (!editingConfig || !editingConfig.key.trim()) return;
    updateConnection(selectedConnection.id, connection => ({ ...connection, config: { ...connection.config, [editingConfig.key.trim()]: editingConfig.value.trim() } }));
    setEditingConfig(null);
    showToast('连接配置已保存', 'success');
  };

  const deleteConnection = () => {
    const remaining = connections.filter(connection => connection.id !== selectedConnection.id);
    setConnections(remaining);
    setSelectedId(remaining[0]?.id ?? '');
    showToast(`${selectedConnection.name} 已删除`, 'info');
  };

  const connectedCount = connections.filter(connection => connection.status === 'connected').length;
  const errorCount = connections.filter(connection => connection.status === 'error').length;
  const CategoryIcon = categoryDefinition[selectedConnection.category].icon;
  const selectedStatus = statusDefinition[selectedConnection.status];

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">平台管理</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">连接管理</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">集中管理外部平台、模型、数据源与工具的认证和同步状态。</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]"><Plus className="h-4 w-4" /> 添加连接</button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            { label: '已连接', value: connectedCount, detail: `共 ${connections.length} 个连接`, icon: CheckCircle2, tone: 'bg-[#EAF7F1] text-[#21865D]' },
            { label: '需要处理', value: errorCount + connections.filter(item => item.status === 'disconnected').length, detail: errorCount ? `${errorCount} 个异常` : '均可正常配置', icon: XCircle, tone: 'bg-[#FFF3EB] text-[#C06D2C]' },
            { label: '最近同步', value: '刚刚', detail: '飞书与知识库', icon: RefreshCw, tone: 'bg-[#EEF1FF] text-[#5267E8]' },
          ].map(stat => {
            const Icon = stat.icon;
            return <div key={stat.label} className="surface-card flex items-center gap-4 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span><span><strong className="block text-[20px] font-semibold tracking-[-0.03em] text-[#263640]">{stat.value}</strong><span className="mt-0.5 block text-[10px] text-[#81909B]">{stat.label} · {stat.detail}</span></span></div>;
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
          <section className="surface-card h-fit overflow-hidden">
            <div className="border-b border-[#E8EDF1] p-3">
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 focus-within:border-[#B8C4F5] focus-within:bg-white"><Search className="h-4 w-4 text-[#82919C]" /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索连接" placeholder="搜索连接名称或能力" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#4D5E69] outline-none placeholder:text-[#9AA7B0]" /></label>
              <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto">
                <button type="button" onClick={() => setCategory('all')} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${category === 'all' ? 'bg-[#EEF1FF] text-[#5267E8]' : 'text-[#71818D] hover:bg-[#F2F5F7]'}`}>全部</button>
                {(Object.keys(categoryDefinition) as ConnectionCategory[]).map(categoryId => <button key={categoryId} type="button" onClick={() => setCategory(categoryId)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${category === categoryId ? 'bg-[#EEF1FF] text-[#5267E8]' : 'text-[#71818D] hover:bg-[#F2F5F7]'}`}>{categoryDefinition[categoryId].label}</button>)}
              </div>
            </div>
            <div className="max-h-[600px] space-y-1 overflow-y-auto p-2">
              {filteredConnections.map(connection => {
                const Icon = categoryDefinition[connection.category].icon;
                const active = selectedConnection?.id === connection.id;
                return <button key={connection.id} type="button" aria-pressed={active} onClick={() => setSelectedId(connection.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-[#C9D1FA] bg-[#F0F2FF]' : 'border-transparent hover:bg-[#F5F8FA]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white text-[#5267E8]' : 'bg-[#F0F4F7] text-[#72838F]'}`}><Icon className="h-4 w-4" strokeWidth={1.8} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-[11px] text-[#35454F]">{connection.name}</strong><span className={`h-2 w-2 shrink-0 rounded-full ${connection.status === 'connected' ? 'bg-[#25A76F]' : connection.status === 'error' ? 'bg-[#D95B61]' : 'bg-[#A6B2BA]'}`} /></span><span className="mt-1 block truncate text-[9px] text-[#85949F]">{connection.description}</span></span></button>;
              })}
              {!filteredConnections.length ? <div className="px-4 py-12 text-center text-[10px] text-[#8A99A4]">没有符合条件的连接</div> : null}
            </div>
          </section>

          {selectedConnection ? (
            <section className="surface-card min-w-0 overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#E8EDF1] p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF1FF] text-[#5267E8]"><CategoryIcon className="h-5 w-5" strokeWidth={1.8} /></span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><h3 className="text-[17px] font-semibold text-[#263640]">{selectedConnection.name}</h3><span className="rounded-lg px-2 py-1 text-[9px] font-semibold" style={{ backgroundColor: selectedStatus.bg, color: selectedStatus.color }}>{selectedStatus.label}</span></span><p className="mt-1 text-[10px] leading-5 text-[#7D8D98]">{selectedConnection.description}</p></span></div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={testConnection} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#DDE5EA] px-3 text-[10px] font-semibold text-[#60707D] hover:border-[#BFCBF5] hover:text-[#5267E8]"><ShieldCheck className="h-3.5 w-3.5" />测试连接</button><button type="button" onClick={toggleConnection} className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-semibold ${selectedConnection.status === 'connected' ? 'bg-[#FFF0F1] text-[#C44F55]' : 'bg-[#5267E8] text-white'}`}><PlugZap className="h-3.5 w-3.5" />{selectedConnection.status === 'connected' ? '断开连接' : '连接'}</button></div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)]">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between"><h4 className="text-[11px] font-semibold text-[#4D5E69]">连接配置</h4><button type="button" onClick={() => setEditingConfig({ key: '', value: '' })} className="text-[9px] font-semibold text-[#5267E8]">添加字段</button></div>
                    <div className="mt-2 overflow-hidden rounded-2xl border border-[#E4EAF0]">
                      {Object.entries(selectedConnection.config).map(([key, value]) => <div key={key} className="grid grid-cols-[120px_minmax(0,1fr)_32px] items-center gap-3 border-b border-[#EDF1F4] px-3 py-3 last:border-0"><span className="truncate font-mono text-[9px] text-[#81909B]">{key}</span><span className="truncate font-mono text-[10px] text-[#455660]">{value}</span><button type="button" aria-label={`编辑 ${key}`} onClick={() => setEditingConfig({ key, value })} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8796A1] hover:bg-[#EEF1FF] hover:text-[#5267E8]"><MoreHorizontal className="h-4 w-4" /></button></div>)}
                      {!Object.keys(selectedConnection.config).length ? <div className="px-4 py-8 text-center text-[10px] text-[#8A99A4]">暂无配置字段，请添加认证或地址信息</div> : null}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between"><h4 className="text-[11px] font-semibold text-[#4D5E69]">最近活动</h4>{selectedConnection.status === 'connected' ? <button type="button" onClick={syncConnection} className="flex items-center gap-1 text-[9px] font-semibold text-[#5267E8]"><RefreshCw className="h-3 w-3" />立即同步</button> : null}</div>
                    <div className="mt-2 space-y-2 rounded-2xl bg-[#F7F9FB] p-4">
                      <div className="flex items-start gap-2.5 text-[10px] text-[#60707D]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#25A76F]" /><span><strong className="font-semibold text-[#455660]">权限检测完成</strong><span className="mt-0.5 block text-[9px] text-[#8A99A4]">读取、写入与回调权限均正常</span></span></div>
                      <div className="flex items-start gap-2.5 text-[10px] text-[#60707D]"><RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5267E8]" /><span><strong className="font-semibold text-[#455660]">数据同步</strong><span className="mt-0.5 block text-[9px] text-[#8A99A4]">最后同步：{selectedConnection.lastSync ?? '从未'}</span></span></div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-3">
                  <div className="rounded-2xl bg-[#F7F9FB] p-4"><span className="text-[9px] text-[#8A99A4]">连接类型</span><span className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-[#455660]"><CategoryIcon className="h-3.5 w-3.5 text-[#5267E8]" />{categoryDefinition[selectedConnection.category].label}</span></div>
                  <div className="rounded-2xl bg-[#F7F9FB] p-4"><span className="text-[9px] text-[#8A99A4]">使用此连接的 Agent</span><div className="mt-2 space-y-2">{selectedConnection.agents.length ? selectedConnection.agents.map(agent => <div key={agent} className="flex items-center gap-2 text-[10px] font-medium text-[#52636E]"><Bot className="h-3.5 w-3.5 text-[#687BEA]" />{agent}</div>) : <p className="text-[9px] leading-5 text-[#98A5AE]">暂未被 Agent 使用，可在 Agent 管理中绑定。</p>}</div></div>
                  <button type="button" onClick={deleteConnection} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-semibold text-[#C44F55] hover:bg-[#FFF0F1]"><Trash2 className="h-3.5 w-3.5" />删除连接</button>
                </aside>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <PlatformDialog open={showCreate} onClose={() => setShowCreate(false)} title="添加企业连接" description="连接信息仅保存在当前工作区，创建后可先测试再启用。" footer={<><button type="button" onClick={() => setShowCreate(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D] hover:bg-[#EEF2F5]">取消</button><button type="button" onClick={createConnection} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">创建连接</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">连接名称</span><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="例如：企业内容中台" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">用途说明</span><input value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="说明该连接可提供的能力" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
          <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">连接类型</span><select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value as ConnectionCategory }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-white px-3 text-[11px] outline-none focus:border-[#AEBBF4]">{(Object.keys(categoryDefinition) as ConnectionCategory[]).map(item => <option key={item} value={item}>{categoryDefinition[item].label}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">服务地址</span><input value={form.endpoint} onChange={event => setForm(current => ({ ...current, endpoint: event.target.value }))} placeholder="https://api.example.com" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">访问凭证</span><input type="password" value={form.credential} onChange={event => setForm(current => ({ ...current, credential: event.target.value }))} placeholder="输入 API Key 或访问令牌" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
        </div>
      </PlatformDialog>

      <PlatformDialog open={Boolean(editingConfig)} onClose={() => setEditingConfig(null)} title="编辑连接配置" width="sm" footer={<><button type="button" onClick={() => setEditingConfig(null)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D] hover:bg-[#EEF2F5]">取消</button><button type="button" onClick={saveConfig} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">保存配置</button></>}>
        {editingConfig ? <div className="space-y-4"><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">字段名</span><input value={editingConfig.key} onChange={event => setEditingConfig(current => current ? { ...current, key: event.target.value } : current)} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 font-mono text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">字段值</span><input value={editingConfig.value} onChange={event => setEditingConfig(current => current ? { ...current, value: event.target.value } : current)} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 font-mono text-[11px] outline-none focus:border-[#AEBBF4]" /></label></div> : null}
      </PlatformDialog>
    </div>
  );
}
