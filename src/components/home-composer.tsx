'use client';

import {
  ArrowUp,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Database,
  FilePenLine,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  LoaderCircle,
  Megaphone,
  RotateCcw,
  Search,
  Sparkles,
  UsersRound,
  WandSparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth-guard';
import { type ViewType } from '@/lib/access-control';
import { executeAgentTask, type AgentRun } from '@/lib/agent-runtime';
import { type TopicSearchResponse } from '@/lib/topic-search-types';
import {
  type ContentTaskItem,
  type ListResponse,
  type TaskStatus,
  formatDate,
  workflowApi,
} from '@/lib/workflow-api';
import { showToast } from './toast';

interface HomeComposerProps {
  onNavigate: (view: ViewType) => void;
}

type PlannerStage = 'idle' | 'planning' | 'confirm' | 'researching' | 'review' | 'producing' | 'completed' | 'failed';
type StepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

interface PlanStep {
  id: 'understand' | 'search' | 'knowledge' | 'outline' | 'script' | 'save';
  label: string;
  description: string;
  status: StepStatus;
  detail?: string;
}

const INITIAL_STEPS: PlanStep[] = [
  { id: 'understand', label: '理解需求', description: '识别活动目标、受众和交付物', status: 'pending' },
  { id: 'search', label: '搜索热点', description: '检索近期外部话题和传播线索', status: 'pending' },
  { id: 'knowledge', label: '查询知识库', description: '引用企业话术、案例和历史资料', status: 'pending' },
  { id: 'outline', label: '生成选题与大纲', description: '形成内容策略和结构', status: 'pending' },
  { id: 'script', label: '生成内容脚本', description: '输出可审核的创作成果', status: 'pending' },
  { id: 'save', label: '保存到活动', description: '写入 Agent 任务中心并进入审核', status: 'pending' },
];

const TASK_STATUS: Record<TaskStatus, { label: string; tone: string }> = {
  todo: { label: '待开始', tone: 'bg-[#EEF2F5] text-[#687985]' },
  doing: { label: '制作中', tone: 'bg-[#EDF0FF] text-[#4660D3]' },
  review: { label: '待审核', tone: 'bg-[#FFF4E6] text-[#B36F27]' },
  approved: { label: '已通过', tone: 'bg-[#EAF7F1] text-[#21865D]' },
  published: { label: '已发布', tone: 'bg-[#E8F7FA] text-[#087B8C]' },
  cancelled: { label: '已取消', tone: 'bg-[#F8EDF0] text-[#9A6470]' },
};

const MEMBER_CAMPAIGNS = [
  { name: '22 周年文化传播', stage: '内容制作', progress: 76, due: '本周五', tone: '#5267E8' },
  { name: '新员工文化融入', stage: '方案确认', progress: 48, due: '8 月 6 日', tone: '#18A4B8' },
  { name: '品牌故事案例库', stage: '素材归档', progress: 91, due: '8 月 12 日', tone: '#25A76F' },
];

const MANAGER_CAMPAIGNS = [
  { name: '22 周年文化传播', owner: '熊臣坤', status: '内容制作', updated: '10 分钟前', progress: 76 },
  { name: '新员工文化融入计划', owner: '蔡雯欣', status: '方案确认', updated: '今天 09:20', progress: 48 },
  { name: '一线员工故事征集', owner: '樊莉芳', status: '部门报送', updated: '昨天 17:42', progress: 63 },
  { name: '品牌故事案例库', owner: '滕紫原', status: '素材归档', updated: '昨天 15:08', progress: 91 },
];

const DEPARTMENT_TOPICS = [
  { name: '生产管理部', value: 28 },
  { name: '销售本部', value: 24 },
  { name: '研发本部', value: 19 },
  { name: '品质管理部', value: 16 },
  { name: '人事总务部', value: 14 },
];

const QUICK_ENTRIES: Array<{
  label: string;
  description: string;
  view: ViewType;
  icon: typeof Lightbulb;
  tone: string;
}> = [
  { label: '选题报送', description: '提交部门宣传线索', view: 'requests', icon: Lightbulb, tone: 'bg-[#FFF4E8] text-[#B66B20]' },
  { label: 'AI 创作', description: '进入创作编排室', view: 'studio', icon: WandSparkles, tone: 'bg-[#EEF0FF] text-[#5267E8]' },
  { label: '活动协同', description: '查看项目与节点', view: 'campaigns', icon: Megaphone, tone: 'bg-[#E9F8F5] text-[#218B70]' },
  { label: 'Agent 任务中心', description: '跟进运行、待办与审核', view: 'tasks', icon: ListTodo, tone: 'bg-[#EBF7FF] text-[#347FAF]' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function PlannerPanel({
  compact = false,
  onNavigate,
  onTaskSaved,
}: {
  compact?: boolean;
  onNavigate: (view: ViewType) => void;
  onTaskSaved: (task: ContentTaskItem) => void;
}) {
  const { user } = useAuth();
  const [brief, setBrief] = useState('');
  const [activityName, setActivityName] = useState('22 周年文化传播');
  const [webEnabled, setWebEnabled] = useState(true);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(true);
  const [stage, setStage] = useState<PlannerStage>('idle');
  const [steps, setSteps] = useState<PlanStep[]>(INITIAL_STEPS);
  const [planSummary, setPlanSummary] = useState('');
  const [researchSummary, setResearchSummary] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [savedTask, setSavedTask] = useState<ContentTaskItem | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const updateStep = (id: PlanStep['id'], status: StepStatus, detail?: string) => {
    setSteps(current => current.map(step => step.id === id ? { ...step, status, detail } : step));
  };

  const resetPlanner = () => {
    setStage('idle');
    setSteps(INITIAL_STEPS);
    setPlanSummary('');
    setResearchSummary('');
    setFinalContent('');
    setRevisionNote('');
    setActiveRun(null);
    setSavedTask(null);
    window.setTimeout(() => inputRef.current?.focus(), 20);
  };

  const createPlan = async () => {
    const request = brief.trim();
    if (request.length < 4) {
      inputRef.current?.focus();
      showToast('请先描述本次宣传工作想完成什么', 'info');
      return;
    }

    setStage('planning');
    setSteps(INITIAL_STEPS);
    setPlanSummary('');
    setResearchSummary('');
    setFinalContent('');
    setRevisionNote('');
    setSavedTask(null);
    updateStep('understand', 'running', 'Planner 正在识别业务目标');

    try {
      const result = await executeAgentTask({
        source: 'home',
        input_text: [
          '你是企业内容协同平台的 Planner，只制定执行计划，不直接撰写最终成稿。',
          `所属活动：${activityName}`,
          `用户需求：${request}`,
          '请识别真正的传播目标、受众、渠道和交付物，并按“外部搜索、企业知识库、选题大纲、内容脚本、保存审核”给出简洁可确认的计划。',
        ].join('\n'),
        knowledge_enabled: false,
        web_enabled: false,
      });
      setActiveRun(result.run);
      setPlanSummary(result.content);
      updateStep('understand', 'completed', `由 ${result.run.agent_name} 完成需求拆解`);
      setStage('confirm');
    } catch (error) {
      updateStep('understand', 'failed', error instanceof Error ? error.message : '计划生成失败');
      setStage('failed');
      showToast(error instanceof Error ? error.message : '计划生成失败', 'error');
    }
  };

  const executeResearch = async () => {
    setStage('researching');
    let searchContext = '本次未启用外部搜索。';

    if (webEnabled) {
      updateStep('search', 'running', '正在检索近期外部话题');
      try {
        const response = await fetch('/api/topics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: brief.trim().slice(0, 100), provider: 'auto', range: 'week' }),
        });
        const payload = await response.json() as TopicSearchResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || '外部搜索暂时不可用');
        if (payload.results.length) {
          searchContext = payload.results.slice(0, 6).map((topic, index) => (
            `${index + 1}. ${topic.title}（${topic.sourceName}）\n${topic.summary}`
          )).join('\n');
          updateStep('search', 'completed', `找到 ${payload.results.length} 条线索 · ${payload.providers.join(' / ')}`);
        } else {
          searchContext = `没有检索到有效结果。${payload.failures.join('；')}`;
          updateStep('search', 'skipped', payload.failures[0] || '本次没有匹配的外部线索');
        }
      } catch (error) {
        searchContext = `外部搜索未完成：${error instanceof Error ? error.message : '未知错误'}`;
        updateStep('search', 'skipped', '数据源暂不可用，已继续使用企业知识库');
      }
    } else {
      updateStep('search', 'skipped', '用户未启用外部搜索');
    }

    updateStep('knowledge', 'running', knowledgeEnabled ? '正在检索企业知识库' : '未启用知识库');
    updateStep('outline', 'running', '正在组织选题与内容结构');

    try {
      const result = await executeAgentTask({
        source: 'home',
        input_text: [
          '你是企业文化内容策划 Agent。用户已经确认执行计划，本阶段只完成调研、选题和大纲，不生成最终脚本。',
          `【所属活动】${activityName}`,
          `【原始需求】${brief.trim()}`,
          `【已确认计划】\n${planSummary}`,
          `【外部搜索线索】\n${searchContext}`,
          '【交付要求】',
          '1. 先说明你对传播目标和受众的判断；',
          '2. 给出 3 个可选传播选题，并说明每个选题的依据；',
          '3. 明确推荐其中 1 个选题；',
          '4. 为推荐选题生成清晰的内容大纲；',
          '5. 给出渠道适配、待补充信息和风险提示；',
          '6. 不要生成最终脚本，等待用户二次确认选题方向。',
          '请使用中文，结构清晰，不要虚构企业事实；缺失信息要明确标注待确认。',
        ].join('\n'),
        knowledge_enabled: knowledgeEnabled,
        web_enabled: false,
      });

      setActiveRun(result.run);
      setResearchSummary(result.content);
      const ragStep = result.run.steps.find(step => step.step_type === 'rag');
      if (!knowledgeEnabled) {
        updateStep('knowledge', 'skipped', '用户未启用知识库');
      } else if (ragStep?.status === 'completed') {
        const referenceCount = ragStep.metadata.references?.length ?? result.references.length;
        updateStep('knowledge', 'completed', referenceCount ? `引用 ${referenceCount} 条企业资料` : '已完成知识检索');
      } else {
        updateStep('knowledge', 'skipped', ragStep?.output_summary || '未检索到可用企业资料');
      }
      updateStep('outline', 'completed', '选题与大纲已生成');
      setStage('review');
      showToast('选题与大纲已生成，请二次确认创作方向', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : '执行失败';
      setSteps(current => current.map(step => step.status === 'running' ? { ...step, status: 'failed', detail: message } : step));
      setStage('failed');
      showToast(message, 'error');
    }
  };

  const generateAndSave = async () => {
    setStage('producing');
    updateStep('script', 'running', '正在按已确认方向生成内容');

    try {
      const result = await executeAgentTask({
        source: 'home',
        input_text: [
          '你是企业文化内容创作 Agent。用户已经二次确认选题与大纲，请完成可进入审核的最终成稿。',
          `【所属活动】${activityName}`,
          `【原始需求】${brief.trim()}`,
          `【已确认执行计划】\n${planSummary}`,
          `【已确认选题与大纲】\n${researchSummary}`,
          `【用户补充调整】\n${revisionNote.trim() || '无，按推荐方向执行。'}`,
          '【交付要求】',
          '1. 输出可直接审核的 90 秒视频脚本或完整图文正文；',
          '2. 包含标题、开场、主体、结尾和行动号召；',
          '3. 附渠道适配建议、制作清单和执行节点；',
          '4. 不要虚构企业事实，缺失信息请保留明确占位。',
        ].join('\n'),
        knowledge_enabled: knowledgeEnabled,
        web_enabled: false,
      });

      setActiveRun(result.run);
      setFinalContent(result.content);
      updateStep('script', 'completed', `由 ${result.run.agent_name} 生成最终成果`);
      updateStep('save', 'running', '正在写入活动与 Agent 任务中心');

      const task = await workflowApi<ContentTaskItem>('content-tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `${activityName} · AI 创作成果`,
          description: [
            '【已确认选题与大纲】',
            researchSummary,
            '',
            '【最终创作成果】',
            result.content,
          ].join('\n').slice(0, 20_000),
          project_name: activityName,
          status: 'review',
          priority: 'high',
          owner_employee_id: user.employeeId,
          owner_name: user.displayName,
          ai_created: true,
        }),
      });
      setSavedTask(task);
      onTaskSaved(task);
      updateStep('save', 'completed', '已保存并进入待审核状态');
      setStage('completed');
      showToast('创作成果已保存到活动任务，等待审核', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : '执行失败';
      setSteps(current => current.map(step => step.status === 'running' ? { ...step, status: 'failed', detail: message } : step));
      setStage('failed');
      showToast(message, 'error');
    }
  };

  const busy = stage === 'planning' || stage === 'researching' || stage === 'producing';
  const showingResearch = stage === 'review' || stage === 'producing';
  const resultTitle = stage === 'completed'
    ? '最终创作成果'
    : showingResearch
      ? '选题与大纲 · 二次确认'
      : 'Planner 执行计划';
  const resultContent = stage === 'completed' ? finalContent : showingResearch ? researchSummary : planSummary;

  return (
    <section className={`overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-[0_16px_50px_rgba(38,57,72,0.08)] ${compact ? '' : 'workspace-reveal'}`}>
      <div className="bg-[radial-gradient(circle_at_92%_12%,rgba(79,199,232,0.18),transparent_15rem),linear-gradient(135deg,#F7F8FF_0%,#FFFFFF_56%,#F0FAFC_100%)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9ECFF] px-2.5 py-1 text-[9px] font-semibold text-[#5267E8]">
              <Sparkles className="h-3 w-3" /> AI PLANNER
            </span>
            <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.02em] text-[#263640]">今天想完成什么宣传工作？</h2>
            <p className="mt-1.5 text-[11px] leading-5 text-[#71818D]">理解需求 → 确认计划 → 搜索与 RAG → 确认选题大纲 → 生成脚本并保存。</p>
          </div>
          {stage !== 'idle' ? (
            <button type="button" onClick={resetPlanner} disabled={busy} className="flex h-9 w-fit items-center gap-1.5 rounded-xl border border-[#DDE5EA] bg-white px-3 text-[10px] font-semibold text-[#657682] disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" /> 新任务
            </button>
          ) : null}
        </div>

        {stage === 'idle' || stage === 'planning' ? (
          <div className="mt-5 rounded-2xl border border-[#DDE4F4] bg-white/90 p-2 shadow-[0_8px_24px_rgba(82,103,232,0.06)]">
            <textarea
              ref={inputRef}
              value={brief}
              disabled={busy}
              onChange={event => setBrief(event.target.value)}
              onKeyDown={event => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void createPlan();
              }}
              rows={compact ? 2 : 3}
              placeholder="例如：我要做 22 周年故事会宣传，面向全体员工，需要选题、大纲和 90 秒视频脚本"
              className="w-full resize-none bg-transparent px-2 py-2 text-[13px] leading-6 text-[#34444E] outline-none placeholder:text-[#9AA8B3] disabled:opacity-60"
            />
            <div className="flex flex-col gap-2 border-t border-[#EDF1F4] px-1 pt-2 sm:flex-row sm:items-center">
              <input
                value={activityName}
                disabled={busy}
                onChange={event => setActivityName(event.target.value)}
                aria-label="所属活动"
                className="h-9 min-w-0 flex-1 rounded-xl bg-[#F5F7FA] px-3 text-[10px] font-medium text-[#52636E] outline-none ring-[#C9D2F8] focus:ring-1"
              />
              <div className="flex items-center gap-1.5">
                <button type="button" aria-pressed={webEnabled} disabled={busy} onClick={() => setWebEnabled(value => !value)} className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-semibold ${webEnabled ? 'bg-[#EAF7FA] text-[#138096]' : 'bg-[#F2F5F7] text-[#81909B]'}`}>
                  <Globe2 className="h-3.5 w-3.5" /> 外部搜索
                </button>
                <button type="button" aria-pressed={knowledgeEnabled} disabled={busy} onClick={() => setKnowledgeEnabled(value => !value)} className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-semibold ${knowledgeEnabled ? 'bg-[#EEF0FF] text-[#5267E8]' : 'bg-[#F2F5F7] text-[#81909B]'}`}>
                  <Database className="h-3.5 w-3.5" /> 知识库
                </button>
                <button type="button" disabled={busy} onClick={() => void createPlan()} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#5267E8] px-4 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.2)] disabled:opacity-60">
                  {stage === 'planning' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                  {stage === 'planning' ? '正在规划' : '生成计划'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-2xl border border-[#E1E7F1] bg-white p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#5267E8]">
                <Bot className="h-4 w-4" /> {resultTitle}
              </div>
              <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-[11px] leading-6 text-[#52636E]">{resultContent}</div>
              {stage === 'confirm' ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EDF1F4] pt-4">
                  <button type="button" onClick={() => void executeResearch()} className="flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.2)]">
                    <Check className="h-4 w-4" /> 确认计划，开始调研
                  </button>
                  <button type="button" onClick={resetPlanner} className="h-10 rounded-xl px-3 text-[11px] font-semibold text-[#71818D]">重新描述</button>
                  <span className="ml-auto text-[9px] text-[#9AA8B3]">确认后调用外部搜索、知识库和策划 Agent</span>
                </div>
              ) : null}
              {stage === 'review' ? (
                <div className="mt-4 border-t border-[#EDF1F4] pt-4">
                  <label className="block text-[9px] font-semibold text-[#60717C]">二次确认 · 可补充修改要求</label>
                  <textarea
                    value={revisionNote}
                    onChange={event => setRevisionNote(event.target.value)}
                    rows={2}
                    placeholder="例如：采用选题 2，语气更年轻，重点突出一线员工故事"
                    className="mt-2 w-full resize-none rounded-xl border border-[#DFE6EB] bg-[#F8FAFC] px-3 py-2 text-[10px] leading-5 text-[#40515C] outline-none focus:border-[#AEBBF4]"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => void generateAndSave()} className="flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.2)]">
                      <WandSparkles className="h-4 w-4" /> 确认方向，生成并保存
                    </button>
                    <button type="button" onClick={resetPlanner} className="h-10 rounded-xl px-3 text-[11px] font-semibold text-[#71818D]">重新规划</button>
                    <span className="ml-auto text-[9px] text-[#9AA8B3]">最终成果自动归入“{activityName}”</span>
                  </div>
                </div>
              ) : null}
              {stage === 'completed' && savedTask ? (
                <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#F0FAF6] p-3 sm:flex-row sm:items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#25A76F]"><CheckCircle2 className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-[#2D5546]">成果已保存到“{savedTask.project_name}”</span>
                    <span className="mt-0.5 block text-[9px] text-[#6D8C80]">任务状态：待审核 · 负责人：{savedTask.owner_name}</span>
                  </span>
                  <button type="button" onClick={() => onNavigate('tasks')} className="flex h-9 items-center justify-center gap-1 rounded-xl bg-white px-3 text-[10px] font-semibold text-[#21865D]">
                    查看成果 <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
              {stage === 'failed' ? (
                <button type="button" onClick={resetPlanner} className="mt-4 flex h-9 items-center gap-1.5 rounded-xl bg-[#FFF1F1] px-3 text-[10px] font-semibold text-[#C94F56]">
                  <RotateCcw className="h-3.5 w-3.5" /> 调整后重试
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#E1E7F1] bg-[#F8FAFC] p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold text-[#52636E]">执行进度</span>
                <span className="text-[9px] text-[#8A99A4]">{activeRun ? activeRun.agent_name : '等待确认'}</span>
              </div>
              <div className="space-y-1">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      step.status === 'completed' ? 'bg-[#E7F7F0] text-[#21865D]'
                        : step.status === 'running' ? 'bg-[#E9ECFF] text-[#5267E8]'
                          : step.status === 'failed' ? 'bg-[#FFF0F0] text-[#C94F56]'
                            : step.status === 'skipped' ? 'bg-[#F0F3F5] text-[#8A99A4]'
                              : 'border border-[#D8E0E6] text-[#A0ADB7]'
                    }`}>
                      {step.status === 'completed' ? <Check className="h-3 w-3" />
                        : step.status === 'running' ? <LoaderCircle className="h-3 w-3 animate-spin" />
                          : step.status === 'failed' ? <X className="h-3 w-3" />
                            : <span className="text-[8px]">{index + 1}</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold text-[#40515C]">{step.label}</span>
                      <span className="mt-0.5 block truncate text-[8px] text-[#8A99A4]">{step.detail || step.description}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MemberHome({
  tasks,
  tasksLoading,
  onNavigate,
  onTaskSaved,
}: {
  tasks: ContentTaskItem[];
  tasksLoading: boolean;
  onNavigate: (view: ViewType) => void;
  onTaskSaved: (task: ContentTaskItem) => void;
}) {
  const { user } = useAuth();
  const myTasks = tasks.filter(task => task.owner_employee_id === user.employeeId || task.owner_name === user.displayName);
  const visibleTasks = (myTasks.length ? myTasks : tasks).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="workspace-reveal flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#5267E8]">企业内容协同平台 V1.0</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-[#1E2D37]">{getGreeting()}，{user.displayName}</h1>
          <p className="mt-1.5 text-[11px] text-[#71818D]">今天有 {visibleTasks.filter(task => task.status !== 'published').length} 项内容工作等待推进。</p>
        </div>
        <span className="flex w-fit items-center gap-2 rounded-xl border border-[#DFE6EB] bg-white px-3 py-2 text-[10px] text-[#657682]">
          <CalendarDays className="h-3.5 w-3.5 text-[#5267E8]" /> {new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}
        </span>
      </header>

      <PlannerPanel onNavigate={onNavigate} onTaskSaved={onTaskSaved} />

      <section className="workspace-reveal grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <div className="rounded-[22px] border border-white/90 bg-white p-5 shadow-[0_12px_36px_rgba(38,57,72,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-[#2D3E48]">今日待办</h2>
              <p className="mt-1 text-[9px] text-[#8A99A4]">真实同步 Agent 任务中心</p>
            </div>
            <button type="button" onClick={() => onNavigate('tasks')} className="flex items-center gap-1 text-[10px] font-semibold text-[#5267E8]">全部任务 <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
          <div className="mt-4 divide-y divide-[#EDF1F4]">
            {tasksLoading ? (
              <div className="flex h-32 items-center justify-center text-[10px] text-[#84939E]"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />正在读取待办</div>
            ) : visibleTasks.length ? visibleTasks.map(task => {
              const status = TASK_STATUS[task.status];
              return (
                <button key={task.id} type="button" onClick={() => onNavigate('tasks')} className="grid w-full gap-2 py-3 text-left sm:grid-cols-[minmax(0,1fr)_130px_90px] sm:items-center">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${task.ai_created ? 'bg-[#EEF0FF] text-[#5267E8]' : 'bg-[#F1F5F7] text-[#7D8D98]'}`}>
                      {task.ai_created ? <Sparkles className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-[#40515C]">{task.title}</span>
                      <span className="mt-1 block truncate text-[9px] text-[#8A99A4]">{task.project_name}</span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-1.5 text-[9px] text-[#71818D] sm:flex"><Clock3 className="h-3 w-3" />{formatDate(task.due_at, true)}</span>
                  <span className={`w-fit rounded-lg px-2 py-1 text-[8px] font-semibold ${status.tone}`}>{status.label}</span>
                </button>
              );
            }) : <div className="py-12 text-center text-[10px] text-[#8796A1]">今天暂无待办，可以从上方发起一项宣传工作</div>}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/90 bg-white p-5 shadow-[0_12px_36px_rgba(38,57,72,0.06)]">
          <div className="flex items-center justify-between">
            <div><h2 className="text-[14px] font-semibold text-[#2D3E48]">我的活动</h2><p className="mt-1 text-[9px] text-[#8A99A4]">我参与的宣传项目</p></div>
            <button type="button" onClick={() => onNavigate('campaigns')} className="text-[10px] font-semibold text-[#5267E8]">查看全部</button>
          </div>
          <div className="mt-4 space-y-3">
            {MEMBER_CAMPAIGNS.map(campaign => (
              <button key={campaign.name} type="button" onClick={() => onNavigate('campaigns')} className="w-full rounded-2xl border border-[#E8EDF1] p-3 text-left transition-colors hover:border-[#C9D2F8]">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[10px] font-semibold text-[#40515C]">{campaign.name}</span>
                  <span className="shrink-0 text-[8px] text-[#8A99A4]">{campaign.due}</span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#EEF2F5]"><div className="h-full rounded-full" style={{ width: `${campaign.progress}%`, backgroundColor: campaign.tone }} /></div>
                <div className="mt-2 flex justify-between text-[8px] text-[#82919C]"><span>{campaign.stage}</span><span>{campaign.progress}%</span></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-reveal">
        <div className="mb-3 flex items-end justify-between"><div><h2 className="text-[14px] font-semibold text-[#2D3E48]">快捷入口</h2><p className="mt-1 text-[9px] text-[#8A99A4]">常用宣传工作，一步直达</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ENTRIES.map(entry => {
            const Icon = entry.icon;
            return (
              <button key={entry.label} type="button" onClick={() => onNavigate(entry.view)} className="group flex items-center gap-3 rounded-[18px] border border-white/90 bg-white p-4 text-left shadow-[0_8px_26px_rgba(38,57,72,0.05)] transition-transform hover:-translate-y-0.5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${entry.tone}`}><Icon className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-[#40515C]">{entry.label}</span><span className="mt-1 block text-[9px] text-[#8796A1]">{entry.description}</span></span>
                <ChevronRight className="h-4 w-4 text-[#B1BDC5] transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ManagerHome({
  tasks,
  onNavigate,
  onTaskSaved,
}: {
  tasks: ContentTaskItem[];
  onNavigate: (view: ViewType) => void;
  onTaskSaved: (task: ContentTaskItem) => void;
}) {
  const { user } = useAuth();
  const reviewCount = tasks.filter(task => task.status === 'review').length;
  const maxTopics = Math.max(...DEPARTMENT_TOPICS.map(item => item.value));
  const metrics = [
    { label: '进行中活动', value: '6', detail: '2 项本周到期', icon: FolderKanban, tone: 'bg-[#EEF0FF] text-[#5267E8]' },
    { label: '待审核内容', value: String(reviewCount || 8), detail: '较昨日 +2', icon: FilePenLine, tone: 'bg-[#FFF4E8] text-[#B66B20]' },
    { label: '部门选题', value: '101', detail: '33 个部门已报送', icon: Lightbulb, tone: 'bg-[#EBF7FF] text-[#347FAF]' },
    { label: '本月已发布', value: '24', detail: '覆盖 5 个渠道', icon: Megaphone, tone: 'bg-[#E9F8F5] text-[#218B70]' },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="workspace-reveal flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#5267E8]">企业内容协同平台 V1.0</p>
            <span className="rounded-full bg-[#E9ECFF] px-2 py-0.5 text-[8px] font-semibold text-[#5267E8]">管理者视角</span>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-[#1E2D37]">{getGreeting()}，{user.displayName}</h1>
          <p className="mt-1.5 text-[11px] text-[#71818D]">宣传工作整体平稳，当前有 {reviewCount || 8} 项内容等待审核。</p>
        </div>
        <button type="button" onClick={() => onNavigate('analytics')} className="flex h-10 w-fit items-center gap-2 rounded-xl bg-[#263640] px-4 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(38,54,64,0.18)]">
          <LayoutDashboard className="h-3.5 w-3.5" /> 查看数据全景
        </button>
      </header>

      <PlannerPanel onNavigate={onNavigate} onTaskSaved={onTaskSaved} />

      <section className="workspace-reveal grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <button key={metric.label} type="button" onClick={() => onNavigate(metric.label === '待审核内容' ? 'tasks' : metric.label === '部门选题' ? 'topics' : metric.label === '本月已发布' ? 'analytics' : 'campaigns')} className="rounded-[20px] border border-white/90 bg-white p-4 text-left shadow-[0_10px_30px_rgba(38,57,72,0.055)]">
              <div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}><Icon className="h-4 w-4" /></span><ChevronRight className="h-4 w-4 text-[#B3BFC7]" /></div>
              <div className="mt-4 text-[24px] font-semibold tracking-[-0.04em] text-[#263640]">{metric.value}</div>
              <div className="mt-1 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#52636E]">{metric.label}</span><span className="text-[8px] text-[#8A99A4]">{metric.detail}</span></div>
            </button>
          );
        })}
      </section>

      <section className="workspace-reveal grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]">
        <div className="overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-[0_12px_36px_rgba(38,57,72,0.06)]">
          <div className="flex items-center justify-between border-b border-[#E9EEF2] px-5 py-4">
            <div><h2 className="text-[14px] font-semibold text-[#2D3E48]">活动总览</h2><p className="mt-1 text-[9px] text-[#8A99A4]">负责人、进度与最近更新时间</p></div>
            <button type="button" onClick={() => onNavigate('campaigns')} className="text-[10px] font-semibold text-[#5267E8]">管理全部活动</button>
          </div>
          <div className="hidden grid-cols-[minmax(180px,1.5fr)_90px_110px_110px_120px] gap-4 bg-[#F9FBFC] px-5 py-2.5 text-[8px] font-semibold tracking-[0.08em] text-[#8A99A4] md:grid">
            <span>活动</span><span>负责人</span><span>当前状态</span><span>更新时间</span><span>完成度</span>
          </div>
          <div className="divide-y divide-[#EDF1F4]">
            {MANAGER_CAMPAIGNS.map(campaign => (
              <button key={campaign.name} type="button" onClick={() => onNavigate('campaigns')} className="grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-[#FAFBFE] md:grid-cols-[minmax(180px,1.5fr)_90px_110px_110px_120px] md:items-center md:gap-4">
                <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-[#40515C]">{campaign.name}</span><span className="mt-1 block text-[8px] text-[#9AA8B3] md:hidden">{campaign.owner} · {campaign.status}</span></span>
                <span className="hidden items-center gap-1.5 text-[9px] text-[#60717C] md:flex"><UsersRound className="h-3 w-3" />{campaign.owner}</span>
                <span className="hidden w-fit rounded-lg bg-[#EEF0FF] px-2 py-1 text-[8px] font-semibold text-[#5267E8] md:block">{campaign.status}</span>
                <span className="hidden text-[8px] text-[#82919C] md:block">{campaign.updated}</span>
                <span className="flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDF1F4]"><span className="block h-full rounded-full bg-[#5267E8]" style={{ width: `${campaign.progress}%` }} /></span><span className="text-[8px] font-semibold text-[#687985]">{campaign.progress}%</span></span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/90 bg-white p-5 shadow-[0_12px_36px_rgba(38,57,72,0.06)]">
          <div className="flex items-center justify-between"><div><h2 className="text-[14px] font-semibold text-[#2D3E48]">部门选题统计</h2><p className="mt-1 text-[9px] text-[#8A99A4]">本月报送数量 TOP 5</p></div><Search className="h-4 w-4 text-[#9AA8B3]" /></div>
          <div className="mt-5 space-y-4">
            {DEPARTMENT_TOPICS.map((department, index) => (
              <button key={department.name} type="button" onClick={() => onNavigate('topics')} className="block w-full text-left">
                <div className="flex items-center justify-between text-[9px]"><span className="font-medium text-[#52636E]">{index + 1}. {department.name}</span><span className="font-semibold text-[#5267E8]">{department.value}</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF2F5]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#5267E8,#4FC7E8)]" style={{ width: `${department.value / maxTopics * 100}%` }} /></div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate('topics')} className="mt-5 flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-[#F3F5FA] text-[9px] font-semibold text-[#60717C]">查看 33 个部门 <ChevronRight className="h-3 w-3" /></button>
        </div>
      </section>

    </div>
  );
}

export function HomeComposer({ onNavigate }: HomeComposerProps) {
  const { workspaceRole } = useAuth();
  const [tasks, setTasks] = useState<ContentTaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    let active = true;
    workflowApi<ListResponse<ContentTaskItem>>('content-tasks?limit=20')
      .then(payload => {
        if (active) setTasks(payload.items);
      })
      .catch(error => showToast(error instanceof Error ? error.message : '无法加载任务', 'error'))
      .finally(() => {
        if (active) setTasksLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const addTask = (task: ContentTaskItem) => {
    setTasks(current => [task, ...current.filter(item => item.id !== task.id)]);
  };

  return (
    <div className="min-h-full overflow-x-hidden bg-[radial-gradient(circle_at_82%_-10%,rgba(79,199,232,0.11),transparent_30rem),linear-gradient(180deg,#F5F8FA_0%,#F0F5F7_100%)] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
      {workspaceRole === 'manager' ? (
        <ManagerHome tasks={tasks} onNavigate={onNavigate} onTaskSaved={addTask} />
      ) : (
        <MemberHome tasks={tasks} tasksLoading={tasksLoading} onNavigate={onNavigate} onTaskSaved={addTask} />
      )}
    </div>
  );
}
