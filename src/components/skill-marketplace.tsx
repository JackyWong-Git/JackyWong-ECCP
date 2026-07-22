'use client';

import {
  Blocks,
  Bot,
  Check,
  Cloud,
  Code2,
  Database,
  Download,
  FileText,
  Filter,
  MessageSquareText,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  Wrench,
  Zap,
} from 'lucide-react';
import { type ComponentType, useDeferredValue, useState } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { PlatformDialog } from './platform-dialog';
import { showToast } from './toast';

type SkillSource = 'feishu' | 'xiaping' | 'custom' | 'builtin';
type SkillStatus = 'installed' | 'available' | 'update';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  source: SkillSource;
  status: SkillStatus;
  version: string;
  author: string;
  installCount: number;
  rating: number;
  tags: string[];
  enabled?: boolean;
}

const initialSkills: Skill[] = [
  { id: '1', name: '飞书文档读取', description: '读取飞书文档内容，支持富文本、附件和引用解析。', category: '文档处理', source: 'feishu', status: 'installed', version: '2.1.0', author: '飞书开放平台', installCount: 1250, rating: 4.8, tags: ['飞书', '文档', '解析'], enabled: true },
  { id: '2', name: '飞书表格操作', description: '读写飞书多维表格，并支持批量更新和筛选。', category: '数据处理', source: 'feishu', status: 'installed', version: '1.5.2', author: '飞书开放平台', installCount: 980, rating: 4.7, tags: ['飞书', '表格', '多维表格'], enabled: true },
  { id: '3', name: '飞书消息推送', description: '向飞书群组或个人发送任务与审核通知。', category: '消息通知', source: 'feishu', status: 'installed', version: '3.0.1', author: '飞书开放平台', installCount: 2100, rating: 4.9, tags: ['飞书', '消息', '通知'], enabled: true },
  { id: '4', name: '飞书日历管理', description: '创建、查询和更新团队日历事件。', category: '日程管理', source: 'feishu', status: 'installed', version: '1.2.0', author: '飞书开放平台', installCount: 750, rating: 4.5, tags: ['飞书', '日历', '日程'], enabled: false },
  { id: '5', name: '飞书审批流', description: '发起和查询飞书审批流程，回写审批状态。', category: '流程审批', source: 'feishu', status: 'installed', version: '2.0.0', author: '飞书开放平台', installCount: 620, rating: 4.6, tags: ['飞书', '审批', '流程'], enabled: true },
  { id: '6', name: '飞书云盘操作', description: '上传、下载并整理飞书云盘文件。', category: '文件管理', source: 'feishu', status: 'installed', version: '1.8.3', author: '飞书开放平台', installCount: 890, rating: 4.7, tags: ['飞书', '云盘', '文件'], enabled: true },
  { id: '7', name: '品牌话术检测', description: '检测内容是否符合品牌标准话术与禁用表达。', category: '内容审核', source: 'xiaping', status: 'available', version: '1.0.0', author: '虾评市场', installCount: 340, rating: 4.3, tags: ['品牌', '话术', '审核'] },
  { id: '8', name: 'SEO 优化建议', description: '分析内容搜索表现并给出标题与结构优化建议。', category: '内容优化', source: 'xiaping', status: 'available', version: '2.1.0', author: '虾评市场', installCount: 560, rating: 4.5, tags: ['SEO', '优化', '搜索'] },
  { id: '9', name: '热点追踪', description: '追踪行业热点，并返回来源、时间和热度趋势。', category: '数据分析', source: 'xiaping', status: 'available', version: '1.3.0', author: '虾评市场', installCount: 780, rating: 4.6, tags: ['热点', '趋势', '追踪'] },
  { id: '10', name: '封面图生成', description: '根据内容主题生成适合不同渠道的封面图。', category: '内容生成', source: 'xiaping', status: 'available', version: '1.1.0', author: '虾评市场', installCount: 420, rating: 4.2, tags: ['封面', '图片', '生成'] },
  { id: '11', name: '广丰术语转换', description: '将专业术语转换为员工更易理解的表达。', category: '内容优化', source: 'custom', status: 'available', version: '0.9.0', author: 'ECCP 团队', installCount: 180, rating: 4.4, tags: ['术语', '转换', '广丰'] },
  { id: '12', name: '多渠道适配', description: '将内容适配为公众号、小红书和视频号格式。', category: '内容发布', source: 'custom', status: 'update', version: '1.3.0', author: 'ECCP 团队', installCount: 290, rating: 4.5, tags: ['多渠道', '适配', '发布'], enabled: true },
  { id: '13', name: '文本摘要', description: '对长文本进行结构化摘要和重点提取。', category: '文本处理', source: 'builtin', status: 'installed', version: '1.0.0', author: '系统内置', installCount: 5000, rating: 4.8, tags: ['摘要', '提取', '总结'], enabled: true },
  { id: '14', name: '关键词提取', description: '自动提取关键词，并生成可复用标签。', category: '文本处理', source: 'builtin', status: 'installed', version: '1.0.0', author: '系统内置', installCount: 4500, rating: 4.7, tags: ['关键词', '提取', '标签'], enabled: true },
];

const sourceDefinition: Record<SkillSource, { label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; tone: string }> = {
  feishu: { label: '飞书', icon: Cloud, tone: 'bg-[#E9F7FA] text-[#1994B1]' },
  xiaping: { label: '虾评市场', icon: PackageCheck, tone: 'bg-[#FFF4E6] text-[#B36F27]' },
  custom: { label: 'ECCP 自研', icon: Code2, tone: 'bg-[#F2EEFF] text-[#7357E6]' },
  builtin: { label: '系统内置', icon: Blocks, tone: 'bg-[#EEF1FF] text-[#5267E8]' },
};

const categoryIcon: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  文档处理: FileText,
  数据处理: Database,
  消息通知: MessageSquareText,
  内容审核: ShieldCheck,
  内容优化: Wrench,
  内容生成: Zap,
  文本处理: FileText,
  流程审批: Check,
  文件管理: UploadCloud,
  数据分析: Database,
  内容发布: UploadCloud,
  日程管理: Cloud,
};

const emptyCreateForm = { name: '', description: '', category: '内容优化', endpoint: '', tags: '' };

export function SkillMarketplace() {
  const [skills, setSkills] = usePersistedState('eccp-skills-v1', initialSkills);
  const [selectedId, setSelectedId] = useState(initialSkills[0].id);
  const [source, setSource] = useState<'all' | SkillSource>('all');
  const [category, setCategory] = useState('全部');
  const [status, setStatus] = useState<'all' | 'installed' | 'available' | 'update'>('all');
  const [query, setQuery] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [configEndpoint, setConfigEndpoint] = useState('https://api.example.com/skill');
  const [configTimeout, setConfigTimeout] = useState('30');
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedSkill = skills.find(skill => skill.id === selectedId) ?? skills[0];
  const categories = ['全部', ...Array.from(new Set(skills.map(skill => skill.category)))];

  const filteredSkills = skills.filter(skill => {
    const matchesSource = source === 'all' || skill.source === source;
    const matchesCategory = category === '全部' || skill.category === category;
    const matchesStatus = status === 'all' || skill.status === status;
    const matchesQuery = !deferredQuery || `${skill.name} ${skill.description} ${skill.tags.join(' ')}`.toLocaleLowerCase().includes(deferredQuery);
    return matchesSource && matchesCategory && matchesStatus && matchesQuery;
  });

  const updateSkill = (id: string, updater: (skill: Skill) => Skill) => setSkills(current => current.map(skill => skill.id === id ? updater(skill) : skill));

  const installSkill = () => {
    updateSkill(selectedSkill.id, skill => ({ ...skill, status: 'installed', enabled: true, installCount: skill.installCount + 1 }));
    showToast(`${selectedSkill.name} 已安装并启用`, 'success');
  };

  const uninstallSkill = () => {
    updateSkill(selectedSkill.id, skill => ({ ...skill, status: 'available', enabled: false }));
    showToast(`${selectedSkill.name} 已卸载`, 'info');
  };

  const updateInstalledSkill = () => {
    updateSkill(selectedSkill.id, skill => ({ ...skill, status: 'installed', enabled: true }));
    showToast(`${selectedSkill.name} 已更新到 ${selectedSkill.version}`, 'success');
  };

  const toggleEnabled = () => {
    updateSkill(selectedSkill.id, skill => ({ ...skill, enabled: !skill.enabled }));
  };

  const createSkill = () => {
    if (!createForm.name.trim()) {
      showToast('请填写 Skill 名称', 'error');
      return;
    }
    const skill: Skill = {
      id: `skill-${Date.now()}`,
      name: createForm.name.trim(),
      description: createForm.description.trim() || '自定义企业 Skill',
      category: createForm.category,
      source: 'custom',
      status: 'available',
      version: '0.1.0',
      author: 'ECCP 团队',
      installCount: 0,
      rating: 0,
      tags: createForm.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean),
    };
    setSkills(current => [skill, ...current]);
    setSelectedId(skill.id);
    setSource('all');
    setCategory('全部');
    setStatus('all');
    setCreateForm(emptyCreateForm);
    setShowCreate(false);
    showToast('自定义 Skill 已创建，可检查后安装', 'success');
  };

  const saveConfig = () => {
    setShowConfig(false);
    showToast(`${selectedSkill.name} 配置已保存`, 'success');
  };

  const installedCount = skills.filter(skill => skill.status === 'installed' || skill.status === 'update').length;
  const updateCount = skills.filter(skill => skill.status === 'update').length;
  const enabledCount = skills.filter(skill => skill.enabled).length;
  const SourceIcon = sourceDefinition[selectedSkill.source].icon;
  const SkillIcon = categoryIcon[selectedSkill.category] ?? Zap;

  return (
    <div className="min-h-full overflow-x-hidden bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#5267E8]">平台管理</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">Skill 市场</h2>
            <p className="mt-2 text-[12px] text-[#71818D]">安装外部能力或创建企业 Skill，让 Agent 直接调用业务工具。</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.20)]"><Plus className="h-4 w-4" /> 创建 Skill</button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            { label: '已安装', value: installedCount, detail: `${enabledCount} 个已启用`, icon: PackageCheck, tone: 'bg-[#EAF7F1] text-[#21865D]' },
            { label: '可更新', value: updateCount, detail: updateCount ? '建议及时更新' : '当前已是最新', icon: RefreshCw, tone: 'bg-[#FFF4E6] text-[#B36F27]' },
            { label: '市场能力', value: skills.length, detail: '4 个来源', icon: Blocks, tone: 'bg-[#EEF1FF] text-[#5267E8]' },
          ].map(stat => { const Icon = stat.icon; return <div key={stat.label} className="surface-card flex items-center gap-4 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span><span><strong className="block text-[20px] font-semibold tracking-[-0.03em] text-[#263640]">{stat.value}</strong><span className="mt-0.5 block text-[10px] text-[#81909B]">{stat.label} · {stat.detail}</span></span></div>; })}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#E1E8ED] bg-white p-3 shadow-[0_8px_24px_rgba(35,54,72,0.04)] xl:flex-row xl:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E1E8ED] bg-[#F8FAFC] px-3 focus-within:border-[#B8C4F5] focus-within:bg-white xl:max-w-[360px]"><Search className="h-4 w-4 text-[#82919C]" /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索 Skill" placeholder="搜索名称、能力或标签" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#4D5E69] outline-none placeholder:text-[#9AA7B0]" /></label>
          <div className="no-scrollbar flex gap-1 overflow-x-auto"><span className="flex items-center px-2 text-[9px] font-semibold text-[#8A99A4]"><Filter className="mr-1 h-3 w-3" />来源</span><button type="button" onClick={() => setSource('all')} className={`shrink-0 rounded-lg px-2.5 py-2 text-[9px] font-semibold ${source === 'all' ? 'bg-[#EEF1FF] text-[#5267E8]' : 'text-[#71818D] hover:bg-[#F2F5F7]'}`}>全部</button>{(Object.keys(sourceDefinition) as SkillSource[]).map(sourceId => <button key={sourceId} type="button" onClick={() => setSource(sourceId)} className={`shrink-0 rounded-lg px-2.5 py-2 text-[9px] font-semibold ${source === sourceId ? 'bg-[#EEF1FF] text-[#5267E8]' : 'text-[#71818D] hover:bg-[#F2F5F7]'}`}>{sourceDefinition[sourceId].label}</button>)}</div>
          <select aria-label="Skill 分类" value={category} onChange={event => setCategory(event.target.value)} className="h-10 rounded-xl border border-[#E1E8ED] bg-white px-3 text-[10px] text-[#60707D] outline-none focus:border-[#AEBBF4]">{categories.map(item => <option key={item}>{item}</option>)}</select>
          <select aria-label="安装状态" value={status} onChange={event => setStatus(event.target.value as typeof status)} className="h-10 rounded-xl border border-[#E1E8ED] bg-white px-3 text-[10px] text-[#60707D] outline-none focus:border-[#AEBBF4]"><option value="all">全部状态</option><option value="installed">已安装</option><option value="available">未安装</option><option value="update">可更新</option></select>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold text-[#60707D]">找到 {filteredSkills.length} 个 Skill</p>{query || source !== 'all' || category !== '全部' || status !== 'all' ? <button type="button" onClick={() => { setQuery(''); setSource('all'); setCategory('全部'); setStatus('all'); }} className="text-[9px] font-semibold text-[#5267E8]">清除筛选</button> : null}</div>
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredSkills.map(skill => {
                const active = selectedSkill.id === skill.id;
                const Icon = categoryIcon[skill.category] ?? Zap;
                const definition = sourceDefinition[skill.source];
                return <button key={skill.id} type="button" aria-pressed={active} onClick={() => setSelectedId(skill.id)} className={`min-w-0 rounded-2xl border bg-white p-4 text-left shadow-[0_6px_20px_rgba(35,54,72,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(35,54,72,0.07)] ${active ? 'border-[#BFC9F7] ring-2 ring-[#E8EBFF]' : 'border-[#E1E8ED] hover:border-[#C9D3F8]'}`}><span className="flex items-start justify-between gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${definition.tone}`}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span><span className={`rounded-lg px-2 py-1 text-[8px] font-semibold ${skill.status === 'installed' ? 'bg-[#EAF7F1] text-[#21865D]' : skill.status === 'update' ? 'bg-[#FFF4E6] text-[#B36F27]' : 'bg-[#EEF2F5] text-[#657682]'}`}>{skill.status === 'installed' ? '已安装' : skill.status === 'update' ? '可更新' : '可安装'}</span></span><strong className="mt-3 block truncate text-[12px] text-[#35454F]">{skill.name}</strong><span className="mt-1 block min-h-10 text-[9px] leading-5 text-[#7D8D98]">{skill.description}</span><span className="mt-3 flex items-center justify-between text-[9px] text-[#8A99A4]"><span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#D99A38]" />{skill.rating || '新'}</span><span>{definition.label} · v{skill.version}</span></span></button>;
              })}
            </div>
            {!filteredSkills.length ? <div className="surface-card py-16 text-center text-[11px] text-[#8A99A4]">没有符合条件的 Skill，试试清除筛选。</div> : null}
          </section>

          <aside className="surface-card h-fit overflow-hidden xl:sticky xl:top-4">
            <div className="border-b border-[#E8EDF1] p-4"><div className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${sourceDefinition[selectedSkill.source].tone}`}><SkillIcon className="h-5 w-5" strokeWidth={1.8} /></span><span className="min-w-0"><h3 className="text-[14px] font-semibold text-[#35454F]">{selectedSkill.name}</h3><p className="mt-1 flex items-center gap-1.5 text-[9px] text-[#8A99A4]"><SourceIcon className="h-3 w-3" />{sourceDefinition[selectedSkill.source].label} · v{selectedSkill.version}</p></span></div></div>
            <div className="space-y-4 p-4"><p className="text-[10px] leading-5 text-[#667985]">{selectedSkill.description}</p><div className="flex flex-wrap gap-1.5">{selectedSkill.tags.map(tag => <span key={tag} className="rounded-lg bg-[#F1F4F7] px-2 py-1 text-[8px] font-medium text-[#71818D]">{tag}</span>)}</div><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#F7F9FB] p-3"><span className="block text-[9px] text-[#8A99A4]">安装量</span><strong className="mt-1 block text-[14px] text-[#35454F]">{selectedSkill.installCount.toLocaleString()}</strong></div><div className="rounded-xl bg-[#F7F9FB] p-3"><span className="block text-[9px] text-[#8A99A4]">评分</span><strong className="mt-1 flex items-center gap-1 text-[14px] text-[#35454F]"><Star className="h-3.5 w-3.5 text-[#D99A38]" />{selectedSkill.rating || '新'}</strong></div></div>{selectedSkill.status === 'installed' ? <label className="flex items-center justify-between rounded-xl border border-[#E4EAF0] p-3"><span><span className="block text-[10px] font-semibold text-[#52636E]">启用 Skill</span><span className="mt-0.5 block text-[8px] text-[#98A5AE]">允许 Agent 在任务中调用</span></span><button type="button" role="switch" aria-checked={Boolean(selectedSkill.enabled)} onClick={toggleEnabled} className={`relative h-5 w-9 rounded-full ${selectedSkill.enabled ? 'bg-[#5267E8]' : 'bg-[#CFD8DE]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${selectedSkill.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></button></label> : null}</div>
            <div className="border-t border-[#E8EDF1] p-4">{selectedSkill.status === 'installed' ? <div className="space-y-2"><button type="button" onClick={() => setShowConfig(true)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-[10px] font-semibold text-white"><Settings2 className="h-3.5 w-3.5" />配置 Skill</button><button type="button" onClick={uninstallSkill} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl text-[9px] font-semibold text-[#C44F55] hover:bg-[#FFF0F1]"><Trash2 className="h-3.5 w-3.5" />卸载</button></div> : selectedSkill.status === 'update' ? <button type="button" onClick={updateInstalledSkill} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#B36F27] text-[10px] font-semibold text-white"><RefreshCw className="h-3.5 w-3.5" />更新到 v{selectedSkill.version}</button> : <button type="button" onClick={installSkill} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-[10px] font-semibold text-white"><Download className="h-3.5 w-3.5" />安装 Skill</button>}</div>
          </aside>
        </div>
      </div>

      <PlatformDialog open={showConfig} onClose={() => setShowConfig(false)} title={`配置 ${selectedSkill.name}`} description="配置仅影响当前工作区中的调用方式。" width="sm" footer={<><button type="button" onClick={() => setShowConfig(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D] hover:bg-[#EEF2F5]">取消</button><button type="button" onClick={saveConfig} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">保存配置</button></>}><div className="space-y-4"><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">服务地址</span><input value={configEndpoint} onChange={event => setConfigEndpoint(event.target.value)} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">超时时间（秒）</span><input type="number" value={configTimeout} onChange={event => setConfigTimeout(event.target.value)} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><div className="rounded-xl bg-[#F7F9FB] p-3 text-[9px] leading-5 text-[#71818D]">保存后将自动进行一次权限和连通性检查。</div></div></PlatformDialog>

      <PlatformDialog open={showCreate} onClose={() => setShowCreate(false)} title="创建企业 Skill" description="定义一个可被 Agent 调用的内部业务能力。" footer={<><button type="button" onClick={() => setShowCreate(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D] hover:bg-[#EEF2F5]">取消</button><button type="button" onClick={createSkill} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">创建 Skill</button></>}><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">Skill 名称</span><input value={createForm.name} onChange={event => setCreateForm(current => ({ ...current, name: event.target.value }))} placeholder="例如：员工采访素材解析" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">能力说明</span><input value={createForm.description} onChange={event => setCreateForm(current => ({ ...current, description: event.target.value }))} placeholder="说明输入、处理和输出内容" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">分类</span><select value={createForm.category} onChange={event => setCreateForm(current => ({ ...current, category: event.target.value }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] bg-white px-3 text-[11px] outline-none focus:border-[#AEBBF4]">{categories.filter(item => item !== '全部').map(item => <option key={item}>{item}</option>)}</select></label><label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">调用地址</span><input value={createForm.endpoint} onChange={event => setCreateForm(current => ({ ...current, endpoint: event.target.value }))} placeholder="https://api.example.com" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">标签</span><input value={createForm.tags} onChange={event => setCreateForm(current => ({ ...current, tags: event.target.value }))} placeholder="素材, 采访, 解析" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label></div></PlatformDialog>
    </div>
  );
}
