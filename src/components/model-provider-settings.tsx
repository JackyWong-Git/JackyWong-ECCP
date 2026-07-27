'use client';

import {
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  activateModelProvider,
  createModelProvider,
  deleteModelProvider,
  listModelProviders,
  type ModelProvider,
  type ModelProviderInput,
  testModelProvider,
  updateModelProvider,
} from '@/lib/model-provider-api';
import { PlatformDialog } from './platform-dialog';
import { showToast } from './toast';

const emptyForm: ModelProviderInput = {
  name: '',
  provider_key: '',
  base_url: 'https://www.kudexapi.com/v1/chat/completions',
  default_model: 'gpt-5.4',
  api_key: '',
};

const statusMeta = {
  connected: { label: '测试通过', icon: CheckCircle2, className: 'bg-[#EAF7F1] text-[#21865D]' },
  error: { label: '连接异常', icon: TriangleAlert, className: 'bg-[#FFF0F1] text-[#C44F55]' },
  untested: { label: '待测试', icon: Clock3, className: 'bg-[#EEF2F5] text-[#657682]' },
};

function timeLabel(value: string | null) {
  if (!value) return '尚未测试';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ModelProviderSettings() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [fallback, setFallback] = useState({ configured: false, model: '', baseUrl: '' });
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<ModelProviderInput>(emptyForm);
  const [editing, setEditing] = useState<ModelProvider | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [applyToAgents, setApplyToAgents] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const selected = providers.find(provider => provider.id === selectedId) ?? providers[0];

  const load = async () => {
    setLoading(true);
    try {
      const data = await listModelProviders();
      setProviders(data.items);
      setFallback({
        configured: data.environment_fallback_configured,
        model: data.environment_fallback_model,
        baseUrl: data.environment_fallback_base_url,
      });
      setSelectedId(current => data.items.some(item => item.id === current) ? current : data.items[0]?.id || '');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '无法读取模型配置', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败', 'error');
    } finally {
      setBusy('');
    }
  };

  const create = () => runAction('create', async () => {
    await createModelProvider({
      ...form,
      name: form.name.trim(),
      provider_key: form.provider_key.trim().toLowerCase(),
      base_url: form.base_url.trim(),
      default_model: form.default_model.trim(),
      api_key: form.api_key.trim(),
    });
    setShowCreate(false);
    setForm(emptyForm);
    showToast('模型供应商已保存，API Key 已加密，请先测试连接', 'success');
  });

  const save = () => {
    if (!editing) return Promise.resolve();
    return runAction('save', async () => {
      await updateModelProvider(editing.id, {
        name: editing.name.trim(),
        base_url: editing.base_url.trim(),
        default_model: editing.default_model.trim(),
        ...(form.api_key.trim() ? { api_key: form.api_key.trim() } : {}),
      });
      setEditing(null);
      setForm(emptyForm);
      showToast('配置已更新，需要重新测试后才能切换', 'success');
    });
  };

  const test = () => {
    if (!selected) return Promise.resolve();
    return runAction('test', async () => {
      const result = await testModelProvider(selected.id);
      showToast(`连接成功：${result.model} · ${result.latency_ms} ms`, 'success');
    });
  };

  const activate = () => {
    if (!selected) return Promise.resolve();
    return runAction('activate', async () => {
      await activateModelProvider(selected.id, applyToAgents);
      setShowActivate(false);
      showToast(applyToAgents ? '已切换平台默认模型，并同步到全部 Agent' : '已切换平台默认模型', 'success');
    });
  };

  const remove = () => {
    if (!selected) return Promise.resolve();
    return runAction('delete', async () => {
      await deleteModelProvider(selected.id);
      setShowDelete(false);
      showToast(`${selected.name} 已删除`, 'info');
    });
  };

  if (loading) {
    return (
      <section className="surface-card flex min-h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#5267E8]" />
      </section>
    );
  }

  return (
    <>
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E5EBF0] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#EEF1FF,#E8F8FA)] text-[#5267E8]">
              <ServerCog className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-semibold text-[#263640]">模型路由与凭据</h3>
                <span className="rounded-lg bg-[#EAF7F1] px-2 py-1 text-[9px] font-semibold text-[#21865D]">服务端加密</span>
              </div>
              <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#7D8D98]">API Key 仅在 FastAPI 内解密并调用供应商，浏览器、日志和查询接口都不会获得明文。</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.2)]">
            <Plus className="h-4 w-4" />添加模型供应商
          </button>
        </div>

        <div className="grid min-h-[330px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-[#E8EDF1] p-3 lg:border-b-0 lg:border-r">
            <div className="space-y-2">
              {providers.map(provider => {
                const meta = statusMeta[provider.status];
                const Icon = meta.icon;
                const active = provider.id === selected?.id;
                return (
                  <button key={provider.id} type="button" onClick={() => setSelectedId(provider.id)} className={`w-full rounded-2xl border p-3 text-left transition-colors ${active ? 'border-[#C9D1FA] bg-[#F1F3FF]' : 'border-transparent hover:bg-[#F5F8FA]'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${provider.is_default ? 'bg-[#5267E8] text-white' : 'bg-white text-[#6C7D88]'}`}>
                        <Bot className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <strong className="truncate text-[11px] text-[#35454F]">{provider.name}</strong>
                          {provider.is_default ? <span className="rounded-md bg-[#E4E8FF] px-1.5 py-0.5 text-[8px] font-semibold text-[#5267E8]">默认</span> : null}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[9px] text-[#85949F]"><Icon className="h-3 w-3" />{meta.label} · {provider.default_model}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
              {!providers.length ? (
                <div className="rounded-2xl border border-dashed border-[#DCE4E9] p-5 text-center">
                  <KeyRound className="mx-auto h-5 w-5 text-[#8797A2]" />
                  <p className="mt-2 text-[10px] font-semibold text-[#5D6E79]">尚未保存模型供应商</p>
                  <p className="mt-1 text-[9px] leading-5 text-[#94A1AA]">{fallback.configured ? `当前由环境变量提供 ${fallback.model}` : '添加后先测试，再设为平台默认'}</p>
                </div>
              ) : null}
            </div>
            <div className="mt-3 rounded-2xl bg-[#F7F9FB] p-3">
              <span className="text-[9px] font-semibold text-[#667782]">环境变量回退</span>
              <p className="mt-1 truncate text-[9px] text-[#8A99A4]">{fallback.configured ? `${fallback.model} · 已配置` : '未配置'}</p>
            </div>
          </div>

          <div className="p-5">
            {selected ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[18px] font-semibold text-[#263640]">{selected.name}</h4>
                      <span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${statusMeta[selected.status].className}`}>{statusMeta[selected.status].label}</span>
                    </div>
                    <p className="mt-1 font-mono text-[9px] text-[#8A99A4]">{selected.provider_key}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(busy)} onClick={() => { setEditing(selected); setForm(current => ({ ...current, api_key: '' })); }} className="h-9 rounded-xl border border-[#DDE5EA] px-3 text-[10px] font-semibold text-[#60707D]">编辑</button>
                    <button type="button" disabled={Boolean(busy)} onClick={test} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#C9D1FA] px-3 text-[10px] font-semibold text-[#5267E8]">
                      {busy === 'test' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}测试连接
                    </button>
                    {!selected.is_default ? <button type="button" disabled={selected.status !== 'connected' || Boolean(busy)} onClick={() => setShowActivate(true)} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-3 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-3.5 w-3.5" />设为默认</button> : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E5EBF0] bg-[#FAFBFC] p-4"><span className="text-[9px] text-[#8A99A4]">服务地址</span><p className="mt-1 break-all font-mono text-[10px] leading-5 text-[#455660]">{selected.base_url}</p></div>
                  <div className="rounded-2xl border border-[#E5EBF0] bg-[#FAFBFC] p-4"><span className="text-[9px] text-[#8A99A4]">默认模型</span><p className="mt-1 font-mono text-[11px] font-semibold text-[#455660]">{selected.default_model}</p></div>
                  <div className="rounded-2xl border border-[#E5EBF0] bg-[#FAFBFC] p-4"><span className="text-[9px] text-[#8A99A4]">API Key</span><p className="mt-1 font-mono text-[10px] text-[#455660]">{selected.api_key_masked}</p></div>
                  <div className="rounded-2xl border border-[#E5EBF0] bg-[#FAFBFC] p-4"><span className="text-[9px] text-[#8A99A4]">最近测试</span><p className="mt-1 text-[10px] text-[#455660]">{timeLabel(selected.last_tested_at)}</p></div>
                </div>

                {selected.last_error ? <div className="flex gap-2 rounded-2xl border border-[#F1CDD0] bg-[#FFF5F5] p-4 text-[10px] leading-5 text-[#A7444A]"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{selected.last_error}</div> : null}

                <div className="flex items-center justify-between border-t border-[#E8EDF1] pt-4">
                  <div className="flex items-center gap-2 text-[9px] text-[#7C8C97]"><ShieldCheck className="h-3.5 w-3.5 text-[#21865D]" />更换密钥时必须重新测试，未通过的供应商不能切为默认。</div>
                  {!selected.is_default ? <button type="button" onClick={() => setShowDelete(true)} disabled={Boolean(busy)} className="flex items-center gap-1.5 text-[9px] font-semibold text-[#C44F55]"><Trash2 className="h-3.5 w-3.5" />删除</button> : null}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[270px] flex-col items-center justify-center text-center">
                <ServerCog className="h-7 w-7 text-[#8D9BA5]" />
                <h4 className="mt-3 text-[13px] font-semibold text-[#52636E]">建立第一个模型连接</h4>
                <p className="mt-1 max-w-sm text-[10px] leading-5 text-[#8A99A4]">支持 Kudex、OpenAI、DeepSeek、Kimi 及其他 OpenAI Chat Completions 兼容服务。</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <PlatformDialog open={showCreate} onClose={() => setShowCreate(false)} title="添加模型供应商" description="凭据保存后不可查看明文，仅可覆盖更新。" footer={<><button type="button" onClick={() => setShowCreate(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D]">取消</button><button type="button" disabled={busy === 'create'} onClick={create} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white disabled:opacity-50">{busy === 'create' ? '保存中…' : '加密保存'}</button></>}>
        <ProviderForm form={form} onChange={setForm} includeKey />
      </PlatformDialog>

      <PlatformDialog open={Boolean(editing)} onClose={() => setEditing(null)} title="编辑模型供应商" description="留空 API Key 将保留原密钥；修改后状态会回到待测试。" footer={<><button type="button" onClick={() => setEditing(null)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D]">取消</button><button type="button" disabled={busy === 'save'} onClick={save} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">保存更改</button></>}>
        {editing ? <ProviderForm form={{ name: editing.name, provider_key: editing.provider_key, base_url: editing.base_url, default_model: editing.default_model, api_key: form.api_key }} onChange={value => { setEditing(current => current ? { ...current, name: value.name, base_url: value.base_url, default_model: value.default_model } : null); setForm(value); }} includeKey={false} /> : null}
      </PlatformDialog>

      <PlatformDialog open={showActivate} onClose={() => setShowActivate(false)} title="切换平台默认模型" width="sm" footer={<><button type="button" onClick={() => setShowActivate(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D]">取消</button><button type="button" disabled={busy === 'activate'} onClick={activate} className="h-9 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white">确认切换</button></>}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#F4F6FF] p-4"><p className="text-[10px] text-[#647581]">即将切换为</p><p className="mt-1 text-[13px] font-semibold text-[#394A57]">{selected?.name} · {selected?.default_model}</p></div>
          <label className="flex items-start gap-3 rounded-2xl border border-[#E2E8ED] p-4"><input type="checkbox" checked={applyToAgents} onChange={event => setApplyToAgents(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#5267E8]" /><span><strong className="block text-[10px] text-[#52636E]">同步更新全部 Agent</strong><span className="mt-1 block text-[9px] leading-5 text-[#8A99A4]">将现有 Agent 的模型统一改为 {selected?.default_model}，避免端点与模型不兼容。</span></span></label>
        </div>
      </PlatformDialog>

      <PlatformDialog open={showDelete} onClose={() => setShowDelete(false)} title="删除模型供应商" width="sm" footer={<><button type="button" onClick={() => setShowDelete(false)} className="h-9 rounded-xl px-4 text-[10px] font-semibold text-[#71818D]">取消</button><button type="button" disabled={busy === 'delete'} onClick={remove} className="h-9 rounded-xl bg-[#C44F55] px-4 text-[10px] font-semibold text-white">确认删除</button></>}>
        <div className="rounded-2xl border border-[#F1CDD0] bg-[#FFF5F5] p-4 text-[10px] leading-5 text-[#9E4248]">将永久删除“{selected?.name}”的连接信息和加密凭据。默认供应商不能删除。</div>
      </PlatformDialog>
    </>
  );
}

function ProviderForm({ form, onChange, includeKey }: { form: ModelProviderInput; onChange: (value: ModelProviderInput) => void; includeKey: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">显示名称</span><input value={form.name} onChange={event => onChange({ ...form, name: event.target.value })} placeholder="例如：Kudex GPT" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
      <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">供应商标识</span><input disabled={!includeKey} value={form.provider_key} onChange={event => onChange({ ...form, provider_key: event.target.value })} placeholder="kudex" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 font-mono text-[11px] outline-none focus:border-[#AEBBF4] disabled:bg-[#F4F6F8]" /></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">Chat Completions 地址</span><input value={form.base_url} onChange={event => onChange({ ...form, base_url: event.target.value })} placeholder="https://api.example.com/v1/chat/completions" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 font-mono text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
      <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">默认模型</span><input value={form.default_model} onChange={event => onChange({ ...form, default_model: event.target.value })} placeholder="gpt-5.4" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 font-mono text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
      <label><span className="mb-1.5 block text-[10px] font-semibold text-[#60707D]">{includeKey ? 'API Key' : '新 API Key（可留空）'}</span><input type="password" autoComplete="new-password" value={form.api_key} onChange={event => onChange({ ...form, api_key: event.target.value })} placeholder="sk-…" className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 font-mono text-[11px] outline-none focus:border-[#AEBBF4]" /></label>
    </div>
  );
}
