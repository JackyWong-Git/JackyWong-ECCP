'use client';

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  ExternalLink,
  GitBranch,
  Github,
  History,
  Image as ImageIcon,
  LoaderCircle,
  PackageCheck,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unplug,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { PlatformDialog } from './platform-dialog';
import { showToast } from './toast';

type SkillStatus = 'available' | 'installed' | 'update';
type RiskLevel = 'low' | 'medium' | 'high';
type WorkspaceTab = 'connected' | 'discover' | 'updates';

interface SkillRelease {
  id: string;
  version: string;
  commit_sha: string;
  checksum: string;
  discovered_at: string;
}

interface SkillBinding {
  id: string;
  business_key: string;
  business_name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

interface SkillInstallation {
  id: string;
  release_id: string;
  version: string;
  status: string;
  enabled: boolean;
  preflight_status: string;
  preflight_result: Record<string, unknown>;
  installed_by_name: string;
  installed_at: string;
  updated_at: string;
}

interface SkillItem {
  id: string;
  source_id: string;
  source_name: string;
  repository_url: string;
  git_ref: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  author: string;
  skill_path: string;
  homepage: string;
  risk_level: RiskLevel;
  risk_findings: Array<{ code: string; title: string; detail: string; severity: string }>;
  capabilities: string[];
  required_env: string[];
  required_bins: string[];
  suggested_businesses: string[];
  deprecated_by: string;
  latest_version: string;
  latest_commit_sha: string;
  status: SkillStatus;
  update_available: boolean;
  installation: SkillInstallation | null;
  bindings: SkillBinding[];
  releases: SkillRelease[];
  created_at: string;
  updated_at: string;
}

interface AuditItem {
  id: string;
  skill_id: string | null;
  skill_name: string;
  action: string;
  status: string;
  detail: string;
  actor_name: string;
  created_at: string;
}

interface PreflightResult {
  status: 'passed' | 'warning' | 'failed';
  checks: Array<{ key: string; label: string; status: 'passed' | 'warning' | 'failed'; detail: string }>;
  risk_level: RiskLevel;
  ready_for_install: boolean;
}

const businesses = [
  { key: 'xiaohongshu', name: '小红书图文', short: '小红书', icon: ImageIcon, tone: 'bg-[#FFF0ED] text-[#C45245]' },
  { key: 'wechat', name: '微信公众号', short: '公众号', icon: Send, tone: 'bg-[#E9F7F1] text-[#238560]' },
  { key: 'website', name: '官网内容', short: '官网', icon: Radio, tone: 'bg-[#EAF4FA] text-[#26779F]' },
  { key: 'video', name: '视频号内容', short: '视频号', icon: Activity, tone: 'bg-[#FFF4DF] text-[#A86B20]' },
  { key: 'general', name: '通用内容协同', short: '通用', icon: Workflow, tone: 'bg-[#EEF0FA] text-[#5668B8]' },
] as const;

const recommendedSources = [
  {
    title: '小红书图卡生成',
    detail: '12 种视觉风格、8 种信息布局，可用于小红书与公众号配图。',
    url: 'https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-xhs-images',
    icon: ImageIcon,
    tone: 'from-[#FFE7E2] to-[#FFF5E9] text-[#B94E42]',
  },
  {
    title: '微信公众号发布',
    detail: '支持文章与多图贴图发布，接入时需检查 Chrome 或 API 凭据。',
    url: 'https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-post-to-wechat',
    icon: Send,
    tone: 'from-[#DDF5EA] to-[#EAF8F5] text-[#247C60]',
  },
  {
    title: '扫描 Baoyu Skills',
    detail: '扫描整个仓库的 SKILL.md，批量发现适合其他业务的新能力。',
    url: 'https://github.com/JimLiu/baoyu-skills',
    icon: Boxes,
    tone: 'from-[#E7ECFF] to-[#E8F8FA] text-[#5267B8]',
  },
];

const actionLabels: Record<string, string> = {
  discovered: '发现版本',
  preflight: '安全预检',
  installed: '安装接入',
  updated: '版本更新',
  rolled_back: '版本回退',
  uninstalled: '卸载能力',
  bindings_updated: '业务绑定',
  installation_updated: '启停配置',
  update_checked: '检查更新',
};

const riskDefinition = {
  low: { label: '低风险', tone: 'bg-[#EAF7F1] text-[#237B5C]', icon: ShieldCheck },
  medium: { label: '中风险', tone: 'bg-[#FFF5E5] text-[#A56621]', icon: CircleAlert },
  high: { label: '高风险', tone: 'bg-[#FFF0F0] text-[#B84D54]', icon: ShieldAlert },
};

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/v1/${path}`, {
    ...options,
    headers: options?.body ? { 'Content-Type': 'application/json', ...options.headers } : options?.headers,
    cache: 'no-store',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || '请求失败，请稍后重试');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function skillDisplayName(skill: SkillItem) {
  if (skill.name === 'baoyu-xhs-images') return '小红书图卡生成';
  if (skill.name === 'baoyu-post-to-wechat') return '微信公众号发布';
  return skill.name;
}

export function SkillMarketplace() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('connected');
  const [query, setQuery] = useState('');
  const [discoverUrl, setDiscoverUrl] = useState(recommendedSources[0].url);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [busy, setBusy] = useState('loading');
  const [error, setError] = useState('');
  const [showUninstall, setShowUninstall] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const selectedSkill = skills.find(skill => skill.id === selectedId) ?? skills[0];

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiRequest<{ items: SkillItem[] }>('skills'),
      apiRequest<AuditItem[]>('skill-audit-logs?limit=60'),
    ]).then(([skillResponse, auditResponse]) => {
      if (cancelled) return;
      setSkills(skillResponse.items);
      setAudits(auditResponse);
      if (skillResponse.items[0]) {
        setSelectedId(skillResponse.items[0].id);
        setSelectedBusinesses(
          skillResponse.items[0].bindings.length
            ? skillResponse.items[0].bindings.map(binding => binding.business_key)
            : skillResponse.items[0].suggested_businesses,
        );
      }
    }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : '能力数据加载失败');
    }).finally(() => {
      if (!cancelled) setBusy('');
    });
    return () => { cancelled = true; };
  }, []);

  const refreshData = async (preferredId?: string) => {
    const [skillResponse, auditResponse] = await Promise.all([
      apiRequest<{ items: SkillItem[] }>('skills'),
      apiRequest<AuditItem[]>('skill-audit-logs?limit=60'),
    ]);
    setSkills(skillResponse.items);
    setAudits(auditResponse);
    const next = skillResponse.items.find(item => item.id === (preferredId || selectedId)) ?? skillResponse.items[0];
    if (next) {
      setSelectedId(next.id);
      setSelectedBusinesses(next.bindings.length ? next.bindings.map(binding => binding.business_key) : next.suggested_businesses);
    }
  };

  const selectSkill = (skill: SkillItem) => {
    setSelectedId(skill.id);
    setSelectedBusinesses(skill.bindings.length ? skill.bindings.map(binding => binding.business_key) : skill.suggested_businesses);
    setAcceptedRisk(false);
    setPreflight(null);
  };

  const runAction = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    setError('');
    try {
      await action();
      showToast(success, 'success');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '操作失败';
      setError(message);
      showToast(message, 'error');
    } finally {
      setBusy('');
    }
  };

  const discover = () => runAction('discover', async () => {
    const response = await apiRequest<{ items: SkillItem[]; discovered: number; new_releases: number }>('skills/discover', {
      method: 'POST',
      body: JSON.stringify({ url: discoverUrl }),
    });
    await refreshData(response.items[0]?.id);
    if (response.items[0]) selectSkill(response.items[0]);
  }, '来源扫描完成，候选 Skill 已进入审核目录');

  const runPreflight = () => {
    if (!selectedSkill) return;
    return runAction('preflight', async () => {
      const result = await apiRequest<PreflightResult>(`skills/${selectedSkill.id}/preflight`, { method: 'POST' });
      setPreflight(result);
      await refreshData(selectedSkill.id);
    }, '预检完成');
  };

  const bindingPayload = selectedBusinesses.map(key => {
    const business = businesses.find(item => item.key === key);
    return { business_key: key, business_name: business?.name || key, enabled: true, config: {} };
  });

  const install = () => {
    if (!selectedSkill) return;
    return runAction('install', async () => {
      await apiRequest(`skills/${selectedSkill.id}/install`, {
        method: 'POST',
        body: JSON.stringify({ accept_risk: acceptedRisk, bindings: bindingPayload, config: {} }),
      });
      await refreshData(selectedSkill.id);
      setActiveTab('connected');
    }, `${skillDisplayName(selectedSkill)} 已接入业务`);
  };

  const saveBindings = () => {
    if (!selectedSkill) return;
    return runAction('bindings', async () => {
      await apiRequest(`skills/${selectedSkill.id}/bindings`, {
        method: 'PUT',
        body: JSON.stringify({ bindings: bindingPayload }),
      });
      await refreshData(selectedSkill.id);
    }, '业务绑定已更新');
  };

  const toggleEnabled = () => {
    if (!selectedSkill?.installation) return;
    return runAction('toggle', async () => {
      await apiRequest(`skills/${selectedSkill.id}/installation`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !selectedSkill.installation?.enabled }),
      });
      await refreshData(selectedSkill.id);
    }, selectedSkill.installation.enabled ? 'Skill 已停用' : 'Skill 已启用');
  };

  const uninstall = () => {
    if (!selectedSkill) return;
    return runAction('uninstall', async () => {
      await apiRequest(`skills/${selectedSkill.id}/installation`, { method: 'DELETE' });
      setShowUninstall(false);
      await refreshData(selectedSkill.id);
    }, `${skillDisplayName(selectedSkill)} 已卸载并解除业务绑定`);
  };

  const checkUpdate = () => {
    if (!selectedSkill) return;
    return runAction('check-update', async () => {
      await apiRequest(`skills/${selectedSkill.id}/update-check`, { method: 'POST' });
      await refreshData(selectedSkill.id);
    }, '已与 GitHub 上游版本完成比对');
  };

  const updateSkill = () => {
    if (!selectedSkill) return;
    return runAction('update', async () => {
      await apiRequest(`skills/${selectedSkill.id}/update`, {
        method: 'POST',
        body: JSON.stringify({ accept_risk: acceptedRisk }),
      });
      await refreshData(selectedSkill.id);
    }, `已更新到 v${selectedSkill.latest_version}`);
  };

  const filteredSkills = skills.filter(skill => {
    const searchable = `${skill.name} ${skill.description} ${skill.capabilities.join(' ')} ${skill.bindings.map(binding => binding.business_name).join(' ')}`.toLocaleLowerCase();
    const matchesQuery = !deferredQuery || searchable.includes(deferredQuery);
    const matchesTab = activeTab === 'connected'
      ? skill.status === 'installed' || skill.status === 'update'
      : activeTab === 'updates'
        ? skill.update_available
        : true;
    return matchesQuery && matchesTab;
  });

  const installedCount = skills.filter(skill => skill.status !== 'available').length;
  const enabledCount = skills.filter(skill => skill.installation?.enabled).length;
  const updateCount = skills.filter(skill => skill.update_available).length;
  const businessCount = new Set(skills.flatMap(skill => skill.bindings.filter(binding => binding.enabled).map(binding => binding.business_key))).size;

  if (busy === 'loading') {
    return <div className="flex min-h-[70vh] items-center justify-center bg-[#F2F6F8]"><LoaderCircle className="h-7 w-7 animate-spin text-[#4F68C8]" /></div>;
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-[radial-gradient(circle_at_92%_4%,rgba(170,225,232,0.32),transparent_24%),linear-gradient(180deg,#F2F6F8_0%,#F6F8F9_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#5067BF]"><Sparkles className="h-4 w-4" />平台能力治理</div>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#1D2D36] sm:text-[36px]">Skill 能力中心</h1>
            <p className="mt-2 text-[13px] leading-6 text-[#687A85]">从可信开源来源发现能力，经过安全检查和业务绑定后，再交给 Agent 或受控 Worker 调用。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {[
              { label: '已接入', value: installedCount, suffix: `${enabledCount} 启用` },
              { label: '业务覆盖', value: businessCount, suffix: '个场景' },
              { label: '待更新', value: updateCount, suffix: '个版本' },
            ].map(item => <div key={item.label} className="min-w-[112px] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_12px_30px_rgba(45,67,82,0.05)] backdrop-blur"><span className="text-[11px] text-[#82919A]">{item.label}</span><div className="mt-1 flex items-baseline gap-1.5"><strong className="text-[22px] text-[#273842]">{item.value}</strong><span className="text-[10px] text-[#8C9AA3]">{item.suffix}</span></div></div>)}
          </div>
        </header>

        <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#DFE7EB] bg-white p-1.5 shadow-[0_8px_28px_rgba(41,62,78,0.04)] sm:w-fit">
          {[
            { key: 'connected', label: '已接入', icon: PackageCheck, count: installedCount },
            { key: 'discover', label: '发现能力', icon: Search, count: skills.length },
            { key: 'updates', label: '更新中心', icon: History, count: updateCount },
          ].map(item => { const Icon = item.icon; return <button key={item.key} type="button" onClick={() => setActiveTab(item.key as WorkspaceTab)} className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-[12px] font-semibold transition ${activeTab === item.key ? 'bg-[#EAF0FF] text-[#4E65BD]' : 'text-[#73838D] hover:bg-[#F4F7F8]'}`}><Icon className="h-4 w-4" /><span>{item.label}</span><span className={`rounded-md px-1.5 py-0.5 text-[9px] ${activeTab === item.key ? 'bg-white/80' : 'bg-[#EDF1F3]'}`}>{item.count}</span></button>; })}
        </div>

        {error ? <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#F0C9CC] bg-[#FFF5F5] px-4 py-3 text-[12px] text-[#A9464D]"><span className="flex items-center gap-2"><XCircle className="h-4 w-4" />{error}</span><button type="button" onClick={() => setError('')} className="font-semibold">关闭</button></div> : null}

        {activeTab === 'discover' ? (
          <section className="mt-5 overflow-hidden rounded-[24px] border border-[#DDE6EA] bg-white shadow-[0_16px_40px_rgba(41,63,78,0.06)]">
            <div className="grid gap-6 bg-[linear-gradient(120deg,#F7F9FF_0%,#F2FAFA_100%)] p-5 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.8fr)] lg:p-7">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[#344750]"><Github className="h-4 w-4" />粘贴 Skill 或仓库地址</div>
                <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#74848D]">支持单个 GitHub Skill 目录，也可扫描整个仓库。平台只读取清单和版本，不会在发现阶段执行源码。</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#D7E1E6] bg-white px-4 shadow-sm focus-within:border-[#9BADE4]">
                    <Github className="h-4 w-4 shrink-0 text-[#71838D]" />
                    <input value={discoverUrl} onChange={event => setDiscoverUrl(event.target.value)} aria-label="GitHub Skill 地址" className="min-w-0 flex-1 bg-transparent text-[12px] text-[#40535D] outline-none placeholder:text-[#9AA8B0]" placeholder="https://github.com/owner/repo/tree/main/skills/example" />
                  </label>
                  <button type="button" onClick={discover} disabled={busy === 'discover' || !discoverUrl.trim()} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#4F68C8] px-5 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(79,104,200,0.23)] disabled:opacity-50">{busy === 'discover' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}扫描来源</button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 self-end">
                {[
                  ['1', '读取来源'], ['2', '安全预检'], ['3', '业务试用'], ['4', '安装更新'],
                ].map(([step, label], index) => <div key={step} className="relative rounded-xl border border-white bg-white/80 px-2 py-3 text-center shadow-sm"><span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF0FF] text-[10px] font-bold text-[#5067BF]">{step}</span><span className="mt-1.5 block text-[9px] font-semibold text-[#657680]">{label}</span>{index < 3 ? <ChevronRight className="absolute -right-2.5 top-4 z-10 h-4 w-4 text-[#AAB6BD]" /> : null}</div>)}
              </div>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-3 lg:p-7">
              {recommendedSources.map(source => { const Icon = source.icon; return <button key={source.title} type="button" onClick={() => setDiscoverUrl(source.url)} className={`group rounded-2xl border p-4 text-left transition ${discoverUrl === source.url ? 'border-[#AEBBE7] bg-[#F8FAFF] ring-2 ring-[#E9EDFF]' : 'border-[#E2E9ED] hover:-translate-y-0.5 hover:border-[#BCC9D1]'}`}><span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${source.tone}`}><Icon className="h-5 w-5" /></span><strong className="mt-3 block text-[13px] text-[#344750]">{source.title}</strong><span className="mt-1.5 block text-[11px] leading-5 text-[#788891]">{source.detail}</span><span className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#566DBF]">使用此来源<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span></button>; })}
            </div>
          </section>
        ) : null}

        {activeTab === 'updates' ? (
          <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
            <div className="rounded-[22px] border border-[#DFE7EB] bg-white p-5 shadow-[0_12px_34px_rgba(41,63,78,0.05)]">
              <div className="flex items-center justify-between"><div><h2 className="text-[15px] font-semibold text-[#344750]">版本更新</h2><p className="mt-1 text-[11px] text-[#7B8A93]">先检查上游，再决定更新或保留当前版本。</p></div><RefreshCw className="h-5 w-5 text-[#6C7FC8]" /></div>
              <div className="mt-4 space-y-2">
                {filteredSkills.length ? filteredSkills.map(skill => <button key={skill.id} type="button" onClick={() => selectSkill(skill)} className="flex w-full items-center gap-3 rounded-2xl border border-[#E3EAED] p-3 text-left hover:border-[#B9C5EA]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E2] text-[#AA6D24]"><RefreshCw className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[12px] text-[#40525C]">{skillDisplayName(skill)}</strong><span className="mt-1 block text-[10px] text-[#83919A]">v{skill.installation?.version} → v{skill.latest_version}</span></span><ChevronRight className="h-4 w-4 text-[#9AA7AF]" /></button>) : <div className="rounded-2xl bg-[#F5F8F9] py-10 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-[#3F9974]" /><p className="mt-2 text-[12px] font-semibold text-[#53656F]">当前都是最新版本</p><p className="mt-1 text-[10px] text-[#8A98A0]">可在右侧详情中手动检查 GitHub 上游。</p></div>}
              </div>
            </div>
            <div className="rounded-[22px] border border-[#DFE7EB] bg-white p-5 shadow-[0_12px_34px_rgba(41,63,78,0.05)]">
              <div className="flex items-center gap-2"><History className="h-4 w-4 text-[#5C72C1]" /><h2 className="text-[15px] font-semibold text-[#344750]">变更审计</h2></div>
              <div className="mt-4 max-h-[440px] space-y-1 overflow-y-auto pr-1">
                {audits.map(audit => <div key={audit.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 rounded-xl px-2 py-2.5 hover:bg-[#F7F9FA]"><span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${audit.status === 'failed' ? 'bg-[#FFF0F0] text-[#B84D54]' : audit.status === 'warning' ? 'bg-[#FFF5E5] text-[#A56621]' : 'bg-[#EAF7F1] text-[#237B5C]'}`}>{audit.status === 'failed' ? <XCircle className="h-3.5 w-3.5" /> : audit.status === 'warning' ? <CircleAlert className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}</span><span className="min-w-0"><span className="block text-[11px] text-[#50616B]"><strong>{actionLabels[audit.action] || audit.action}</strong> · {audit.skill_name}</span><span className="mt-0.5 block truncate text-[10px] text-[#8A98A0]">{audit.detail} · {audit.actor_name}</span></span><time className="pt-0.5 text-[9px] text-[#98A5AD]">{formatTime(audit.created_at)}</time></div>)}
              </div>
            </div>
          </section>
        ) : null}

        <div className={`mt-5 grid gap-4 ${activeTab === 'updates' ? '' : 'xl:grid-cols-[minmax(0,1fr)_390px]'}`}>
          {activeTab !== 'updates' ? <section>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex h-10 max-w-md flex-1 items-center gap-2 rounded-xl border border-[#DCE5E9] bg-white px-3 shadow-sm focus-within:border-[#A7B4DF]"><Search className="h-4 w-4 text-[#819099]" /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索 Skill" placeholder="搜索能力、业务或来源" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#52636D] outline-none" /></label>
              <span className="text-[10px] text-[#84929A]">共 {filteredSkills.length} 个{activeTab === 'connected' ? '已接入能力' : '候选能力'}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filteredSkills.map(skill => {
                const active = selectedSkill?.id === skill.id;
                const risk = riskDefinition[skill.risk_level];
                const RiskIcon = risk.icon;
                const isWechat = skill.suggested_businesses.includes('wechat');
                const SkillIcon = isWechat ? Send : skill.capabilities.some(item => item.includes('图片')) ? ImageIcon : Zap;
                return <button key={skill.id} type="button" onClick={() => selectSkill(skill)} className={`rounded-[20px] border bg-white p-4 text-left shadow-[0_8px_28px_rgba(41,63,78,0.04)] transition hover:-translate-y-0.5 ${active ? 'border-[#A9B7E6] ring-2 ring-[#E9EDFC]' : 'border-[#DEE7EB] hover:border-[#BBC7CE]'}`}>
                  <div className="flex items-start justify-between gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isWechat ? 'bg-[#E7F7F0] text-[#25815F]' : 'bg-[#FFF0ED] text-[#BC5045]'}`}><SkillIcon className="h-5 w-5" /></span><span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-semibold ${skill.status === 'available' ? 'bg-[#EEF2F4] text-[#667982]' : skill.update_available ? 'bg-[#FFF5E5] text-[#A56621]' : 'bg-[#EAF7F1] text-[#237B5C]'}`}>{skill.status === 'available' ? <Download className="h-3 w-3" /> : skill.update_available ? <RefreshCw className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}{skill.status === 'available' ? '待接入' : skill.update_available ? '可更新' : '已接入'}</span></div>
                  <strong className="mt-3 block truncate text-[13px] text-[#344750]">{skillDisplayName(skill)}</strong>
                  <span className="mt-1.5 line-clamp-2 min-h-10 text-[10.5px] leading-5 text-[#778891]">{skill.description}</span>
                  <div className="mt-3 flex flex-wrap gap-1.5">{(skill.bindings.length ? skill.bindings.map(item => item.business_key) : skill.suggested_businesses).slice(0, 3).map(key => { const business = businesses.find(item => item.key === key); return <span key={key} className="rounded-md bg-[#F1F4F6] px-2 py-1 text-[8px] font-semibold text-[#6E7E87]">{business?.short || key}</span>; })}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#EDF1F3] pt-3"><span className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[8px] font-semibold ${risk.tone}`}><RiskIcon className="h-3 w-3" />{risk.label}</span><span className="flex items-center gap-1 text-[9px] text-[#8A98A0]"><Github className="h-3 w-3" />{skill.source_name} · v{skill.latest_version}</span></div>
                </button>;
              })}
            </div>
            {!filteredSkills.length ? <div className="rounded-[22px] border border-dashed border-[#CCD8DD] bg-white/60 py-16 text-center"><Unplug className="mx-auto h-7 w-7 text-[#8C9AA2]" /><p className="mt-2 text-[12px] font-semibold text-[#667780]">这里还没有能力</p><button type="button" onClick={() => setActiveTab('discover')} className="mt-2 text-[11px] font-semibold text-[#5269C0]">去发现新的 Skill</button></div> : null}
          </section> : null}

          {selectedSkill ? <aside className={`h-fit overflow-hidden rounded-[22px] border border-[#DCE5E9] bg-white shadow-[0_14px_38px_rgba(41,63,78,0.07)] ${activeTab === 'updates' ? 'mt-0' : 'xl:sticky xl:top-4'}`}>
            <div className="border-b border-[#E8EEF1] bg-[linear-gradient(135deg,#F8FAFF,#F4FAFA)] p-5">
              <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-[16px] font-semibold text-[#31434D]">{skillDisplayName(selectedSkill)}</h2>{selectedSkill.installation?.enabled ? <span className="h-2 w-2 rounded-full bg-[#39A077] shadow-[0_0_0_4px_rgba(57,160,119,0.12)]" /> : null}</div><a href={`${selectedSkill.repository_url}/tree/${selectedSkill.git_ref}/${selectedSkill.skill_path}`} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1 text-[10px] text-[#6579C1] hover:underline"><Github className="h-3 w-3" />{selectedSkill.source_name}/{selectedSkill.skill_path.split('/').at(-1)}<ExternalLink className="h-3 w-3" /></a></div><span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${riskDefinition[selectedSkill.risk_level].tone}`}>{riskDefinition[selectedSkill.risk_level].label}</span></div>
              <p className="mt-4 text-[11px] leading-5 text-[#6D7F89]">{selectedSkill.description}</p>
            </div>

            <div className="max-h-[min(62vh,620px)] space-y-5 overflow-y-auto p-5">
              <div>
                <div className="flex items-center justify-between"><h3 className="text-[11px] font-semibold text-[#53656F]">能力与版本</h3><span className="flex items-center gap-1 text-[9px] text-[#8B99A1]"><GitBranch className="h-3 w-3" />{selectedSkill.installation ? `当前 v${selectedSkill.installation.version}` : `最新 v${selectedSkill.latest_version}`}</span></div>
                <div className="mt-2 flex flex-wrap gap-1.5">{selectedSkill.capabilities.map(item => <span key={item} className="rounded-lg bg-[#F1F5F6] px-2 py-1 text-[9px] text-[#657781]">{item}</span>)}</div>
              </div>

              <div>
                <div className="flex items-center justify-between"><h3 className="text-[11px] font-semibold text-[#53656F]">安全检查</h3><button type="button" onClick={runPreflight} disabled={busy === 'preflight'} className="flex items-center gap-1 text-[9px] font-semibold text-[#536BC1] disabled:opacity-50">{busy === 'preflight' ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}重新预检</button></div>
                <div className="mt-2 space-y-1.5">{(preflight?.checks || selectedSkill.risk_findings.map(item => ({ key: item.code, label: item.title, status: item.severity === 'high' ? 'warning' as const : 'passed' as const, detail: item.detail }))).map(check => <div key={check.key} className="flex gap-2 rounded-xl bg-[#F7F9FA] p-2.5">{check.status === 'passed' ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#309070]" /> : check.status === 'failed' ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#BB4D54]" /> : <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B4772A]" />}<span><strong className="block text-[9px] text-[#596B75]">{check.label}</strong><span className="mt-0.5 block text-[8.5px] leading-4 text-[#82919A]">{check.detail}</span></span></div>)}</div>
                {selectedSkill.required_bins.length || selectedSkill.required_env.length ? <div className="mt-2 rounded-xl border border-[#E5EAED] px-3 py-2 text-[8.5px] leading-4 text-[#7A8992]">{selectedSkill.required_bins.length ? <div>运行时：<strong className="text-[#596B75]">{selectedSkill.required_bins.join(' / ')}</strong></div> : null}{selectedSkill.required_env.length ? <div>待配置：<strong className="text-[#596B75]">{selectedSkill.required_env.join('、')}</strong></div> : null}</div> : null}
              </div>

              <div>
                <h3 className="text-[11px] font-semibold text-[#53656F]">绑定业务场景</h3>
                <p className="mt-1 text-[9px] text-[#8A98A0]">只有已绑定业务的 Agent 才能发现并调用该能力。</p>
                <div className="mt-2 grid grid-cols-2 gap-2">{businesses.map(business => { const Icon = business.icon; const active = selectedBusinesses.includes(business.key); return <button key={business.key} type="button" onClick={() => setSelectedBusinesses(current => active ? current.filter(item => item !== business.key) : [...current, business.key])} className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${active ? 'border-[#AEBCE6] bg-[#F7F9FF]' : 'border-[#E3EAED] hover:bg-[#F7F9FA]'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${business.tone}`}><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-[#5D6F79]">{business.name}</span>{active ? <Check className="h-3.5 w-3.5 text-[#5068C0]" /> : null}</button>; })}</div>
                {selectedSkill.installation ? <button type="button" onClick={saveBindings} disabled={busy === 'bindings'} className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#CED8EA] text-[10px] font-semibold text-[#5269BA] disabled:opacity-50">{busy === 'bindings' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Workflow className="h-3.5 w-3.5" />}保存业务绑定</button> : null}
              </div>

              {selectedSkill.risk_level === 'high' && (selectedSkill.status === 'available' || selectedSkill.update_available) ? <label className="flex cursor-pointer gap-2.5 rounded-xl border border-[#F0D2D4] bg-[#FFF7F7] p-3"><input type="checkbox" checked={acceptedRisk} onChange={event => setAcceptedRisk(event.target.checked)} className="mt-0.5 accent-[#B84D54]" /><span className="text-[9px] leading-4 text-[#8B5559]">我已了解该 Skill 可能读取平台凭据、控制浏览器或对外发布内容，并同意在受控环境启用。</span></label> : null}
            </div>

            <div className="border-t border-[#E8EEF1] p-4">
              {selectedSkill.status === 'available' ? <div className="grid grid-cols-[auto_1fr] gap-2"><button type="button" onClick={runPreflight} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D8E0E5] px-3 text-[10px] font-semibold text-[#657680]"><ShieldCheck className="h-3.5 w-3.5" />预检</button><button type="button" onClick={install} disabled={!selectedBusinesses.length || (selectedSkill.risk_level === 'high' && !acceptedRisk) || busy === 'install'} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#4F68C8] text-[10px] font-semibold text-white disabled:opacity-45">{busy === 'install' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}安装并接入业务</button></div> : selectedSkill.update_available ? <div className="grid grid-cols-[auto_1fr] gap-2"><button type="button" onClick={checkUpdate} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D8E0E5] px-3 text-[10px] font-semibold text-[#657680]"><RefreshCw className="h-3.5 w-3.5" />检查</button><button type="button" onClick={updateSkill} disabled={(selectedSkill.risk_level === 'high' && !acceptedRisk) || busy === 'update'} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#A86C24] text-[10px] font-semibold text-white disabled:opacity-45"><RotateCcw className="h-3.5 w-3.5" />更新到 v{selectedSkill.latest_version}</button></div> : <div className="space-y-2"><div className="grid grid-cols-[1fr_auto] gap-2"><button type="button" onClick={toggleEnabled} disabled={busy === 'toggle'} className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[10px] font-semibold ${selectedSkill.installation?.enabled ? 'bg-[#EAF7F1] text-[#247C5E]' : 'bg-[#4F68C8] text-white'}`}>{selectedSkill.installation?.enabled ? <><CheckCircle2 className="h-3.5 w-3.5" />已启用，点击停用</> : <><Zap className="h-3.5 w-3.5" />启用 Skill</>}</button><button type="button" onClick={checkUpdate} disabled={busy === 'check-update'} aria-label="检查更新" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E0E5] text-[#667883]"><RefreshCw className={`h-3.5 w-3.5 ${busy === 'check-update' ? 'animate-spin' : ''}`} /></button></div><button type="button" onClick={() => setShowUninstall(true)} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-[9px] font-semibold text-[#B64D53] hover:bg-[#FFF2F2]"><Trash2 className="h-3.5 w-3.5" />卸载并解除业务绑定</button></div>}
            </div>
          </aside> : null}
        </div>
      </div>

      <PlatformDialog open={showUninstall} onClose={() => setShowUninstall(false)} title="卸载 Skill" description="安装记录和业务绑定会被移除，来源、版本与审计历史仍会保留。" width="sm" footer={<><button type="button" onClick={() => setShowUninstall(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#6F7F88]">取消</button><button type="button" onClick={uninstall} disabled={busy === 'uninstall'} className="flex h-9 items-center gap-2 rounded-xl bg-[#B84D54] px-4 text-[10px] font-semibold text-white"><Trash2 className="h-3.5 w-3.5" />确认卸载</button></>}><div className="rounded-xl bg-[#FFF5F5] p-3 text-[10px] leading-5 text-[#8A5559]">{selectedSkill ? `${skillDisplayName(selectedSkill)} 将不再被任何业务 Agent 调用。` : ''}</div></PlatformDialog>
    </div>
  );
}
