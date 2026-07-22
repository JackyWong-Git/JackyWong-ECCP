'use client';

import { ArrowDownRight, ArrowUpRight, BarChart3, LoaderCircle, Plus, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type DashboardMetric,
  type DashboardSummary,
  compactNumber,
  formatDate,
  workflowApi,
} from '@/lib/workflow-api';
import { showToast } from './toast';

type TimeRange = '7d' | '30d' | '90d' | 'all';

const channelColors = ['#5267E8', '#4FC7E8', '#25A76F', '#E99B3C', '#7357FF', '#DC5A60'];
const emptySummary: DashboardSummary = { total_views: 0, total_publications: 0, total_engagements: 0, total_conversions: 0, channel_totals: {}, items: [] };

function inRange(item: DashboardMetric, range: TimeRange) {
  if (range === 'all' || !item.published_at) return true;
  const days = Number(range.slice(0, -1));
  return Date.now() - new Date(item.published_at).getTime() <= days * 86_400_000;
}

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [editing, setEditing] = useState<DashboardMetric | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ views: 0, likes: 0, comments: 0, shares: 0, favorites: 0, conversions: 0, completion_rate: 0 });

  const load = async () => {
    setLoading(true);
    try {
      setSummary(await workflowApi<DashboardSummary>('analytics/dashboard'));
    } catch (error) {
      showToast(error instanceof Error ? error.message : '数据加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const items = summary.items.filter(item => inRange(item, timeRange));
  const totals = items.reduce((result, item) => ({
    views: result.views + item.views,
    engagements: result.engagements + item.likes + item.comments + item.shares + item.favorites,
    conversions: result.conversions + item.conversions,
  }), { views: 0, engagements: 0, conversions: 0 });
  const channelTotals = items.reduce<Record<string, number>>((result, item) => {
    result[item.channel] = (result[item.channel] || 0) + item.views;
    return result;
  }, {});
  const channels = Object.entries(channelTotals).sort((a, b) => b[1] - a[1]);
  const topItems = [...items].sort((a, b) => b.views - a.views);

  const openFeedback = (item: DashboardMetric) => {
    setEditing(item);
    setForm({ views: item.views, likes: item.likes, comments: item.comments, shares: item.shares, favorites: item.favorites, conversions: item.conversions, completion_rate: item.completion_rate });
  };

  const saveFeedback = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await workflowApi(`publications/${editing.publication_id}/metrics`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, sentiment_score: 0, raw_metrics: { source: 'manual-dashboard' } }),
      });
      await load();
      setEditing(null);
      showToast('发布数据已回流', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '回流失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    { label: '总阅读量', value: compactNumber(totals.views), helper: `${items.length} 条发布记录`, positive: true },
    { label: '互动量', value: compactNumber(totals.engagements), helper: totals.views ? `互动率 ${((totals.engagements / totals.views) * 100).toFixed(1)}%` : '等待数据', positive: true },
    { label: '转化数', value: compactNumber(totals.conversions), helper: totals.views ? `转化率 ${((totals.conversions / totals.views) * 100).toFixed(2)}%` : '等待数据', positive: totals.conversions > 0 },
    { label: '覆盖渠道', value: String(channels.length), helper: channels[0] ? `最高：${channels[0][0]}` : '尚未发布', positive: channels.length > 0 },
  ];

  return (
    <div className="min-h-full bg-[#F2F6F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold text-[#5267E8]">数据回流</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#17232D]">内容效果看板</h1><p className="mt-2 text-[12px] text-[#71818D]">从发布记录自动汇总，支持手工回填渠道数据。</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl bg-white p-1 shadow-sm">{([{ id: '7d', label: '7天' }, { id: '30d', label: '30天' }, { id: '90d', label: '90天' }, { id: 'all', label: '全部' }] as const).map(option => <button key={option.id} onClick={() => setTimeRange(option.id)} className={`rounded-lg px-3 py-2 text-[10px] font-semibold ${timeRange === option.id ? 'bg-[#EEF0FF] text-[#5267E8]' : 'text-[#71818D]'}`}>{option.label}</button>)}</div><button onClick={() => void load()} aria-label="刷新数据" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E1E8ED] bg-white text-[#71818D]"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/></button></div></header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <article key={card.label} className="rounded-2xl border border-[#E1E8ED] bg-white p-5 shadow-[0_8px_24px_rgba(35,54,72,0.04)]"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[#84939E]">{card.label}</span>{card.positive ? <ArrowUpRight className="h-4 w-4 text-[#25A76F]"/> : <ArrowDownRight className="h-4 w-4 text-[#98A5AE]"/>}</div><strong className="mt-4 block text-[30px] tracking-[-0.04em] text-[#20303A]">{loading ? '—' : card.value}</strong><span className="mt-2 block text-[10px] text-[#8796A1]">{card.helper}</span></article>)}</div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <section className="rounded-2xl border border-[#E1E8ED] bg-white p-5 shadow-[0_8px_24px_rgba(35,54,72,0.04)]"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-[#263640]">内容表现</h2><p className="mt-1 text-[10px] text-[#8796A1]">按阅读量排序</p></div><span className="rounded-lg bg-[#F1F4F7] px-2 py-1 text-[9px] text-[#748590]">{items.length} 条</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-[#E8EDF1] text-[9px] font-semibold text-[#8D9BA5]"><th className="py-3">内容</th><th>渠道</th><th className="text-right">阅读</th><th className="text-right">互动</th><th className="text-right">转化</th><th className="text-right">完读率</th><th className="text-right">操作</th></tr></thead><tbody>{topItems.map(item => <tr key={item.publication_id} className="border-b border-[#EDF1F4] text-[10px] text-[#667985]"><td className="py-4"><span className="block max-w-[280px] truncate text-[11px] font-semibold text-[#34444E]">{item.title}</span><span className="mt-1 block text-[9px] text-[#94A2AE]">{formatDate(item.published_at)}</span></td><td><span className="rounded-lg bg-[#F1F4F7] px-2 py-1">{item.channel}</span></td><td className="text-right font-semibold text-[#34444E]">{compactNumber(item.views)}</td><td className="text-right">{compactNumber(item.likes + item.comments + item.shares + item.favorites)}</td><td className="text-right">{compactNumber(item.conversions)}</td><td className="text-right">{item.completion_rate.toFixed(1)}%</td><td className="text-right"><button onClick={() => openFeedback(item)} className="rounded-lg border border-[#DCE4F8] px-2.5 py-1.5 font-semibold text-[#5267E8]">回填数据</button></td></tr>)}</tbody></table>{!loading && !items.length && <div className="flex h-48 flex-col items-center justify-center text-center"><BarChart3 className="h-7 w-7 text-[#AAB5BD]"/><p className="mt-3 text-xs font-semibold text-[#667985]">暂无发布数据</p><p className="mt-1 text-[10px] text-[#94A2AE]">任务审核通过并发布后，记录会出现在这里。</p></div>}</div></section>
          <section className="rounded-2xl border border-[#E1E8ED] bg-white p-5 shadow-[0_8px_24px_rgba(35,54,72,0.04)]"><h2 className="text-sm font-semibold text-[#263640]">渠道分布</h2><p className="mt-1 text-[10px] text-[#8796A1]">按阅读量统计</p><div className="mt-6 space-y-5">{channels.map(([name, views], index) => { const percent = totals.views ? views / totals.views * 100 : 0; return <div key={name}><div className="mb-2 flex justify-between text-[10px]"><span className="font-semibold text-[#4D5E69]">{name}</span><span className="text-[#84939E]">{compactNumber(views)} · {percent.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF2F5]"><div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: channelColors[index % channelColors.length] }}/></div></div>; })}{!channels.length && <p className="py-16 text-center text-xs text-[#94A2AE]">等待渠道数据</p>}</div></section>
        </div>
      </div>

      {editing && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#17232D]/25 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.currentTarget === event.target) setEditing(null); }}><div className="w-full max-w-[620px] rounded-3xl border border-white/80 bg-white p-5 shadow-[0_28px_80px_rgba(26,44,58,0.22)] sm:p-7"><div className="flex items-start justify-between"><div><p className="text-[10px] font-semibold text-[#5267E8]">数据回流</p><h2 className="mt-1 text-xl font-semibold text-[#263640]">{editing.title}</h2><p className="mt-1 text-[10px] text-[#8796A1]">{editing.channel} · {formatDate(editing.published_at)}</p></div><button aria-label="关闭" onClick={() => setEditing(null)} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[#F1F4F7]"><X className="h-4 w-4"/></button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(form).map(([key, value]) => <label key={key} className={key === 'completion_rate' ? 'col-span-2 sm:col-span-4' : ''}><span className="mb-1.5 block text-[10px] font-semibold text-[#6C7C87]">{{ views: '阅读', likes: '点赞', comments: '评论', shares: '分享', favorites: '收藏', conversions: '转化', completion_rate: '完读率（%）' }[key]}</span><input type="number" min="0" max={key === 'completion_rate' ? 100 : undefined} value={value} onChange={event => setForm(current => ({ ...current, [key]: Number(event.target.value) }))} className="h-10 w-full rounded-xl border border-[#DDE5EA] px-3 text-sm outline-none focus:border-[#7083EE]"/></label>)}</div><button disabled={saving} onClick={() => void saveFeedback()} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5267E8] text-xs font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}保存回流数据</button></div></div>}
    </div>
  );
}
