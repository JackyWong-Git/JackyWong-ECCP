import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/access-control';
import {
  createDeepSeekChatCompletion,
  DeepSeekConfigurationError,
  DeepSeekRequestError,
  type DeepSeekMessage,
  type DeepSeekModel,
} from '@/lib/deepseek';
import { createFastApiHeaders, fastApiUrl } from '@/lib/fastapi-proxy';
import { getAuthentication, type AuthenticatedUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

interface RunStep {
  step_type: string;
  name: string;
  status: string;
  output_summary: string;
  metadata: { references?: Array<{ document: string; content: string; score: number }> };
}

interface AgentRun {
  id: string;
  agent_name: string;
  system_prompt: string;
  model_id: DeepSeekModel;
  steps: RunStep[];
  status: string;
  [key: string]: unknown;
}

function parseMessages(value: unknown): DeepSeekMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-30).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const content = typeof record.content === 'string' ? record.content.trim().slice(0, 30_000) : '';
    if ((record.role !== 'user' && record.role !== 'assistant') || !content) return [];
    return [{ role: record.role, content } as DeepSeekMessage];
  });
}

async function callRuntime(user: AuthenticatedUser, path: string[], body: object) {
  const response = await fetch(fastApiUrl(path), {
    method: 'POST',
    headers: createFastApiHeaders(user, 'application/json'),
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  const data = await response.json() as AgentRun & { detail?: string };
  if (!response.ok) throw new Error(data.detail || 'Agent 运行服务请求失败');
  return data;
}

export async function POST(request: Request) {
  let run: AgentRun | null = null;
  let user: AuthenticatedUser | null = null;
  try {
    const authentication = await getAuthentication(request);
    if (authentication.status === 'unavailable') return NextResponse.json({ error: '认证服务暂时不可用。' }, { status: 503 });
    if (authentication.status !== 'authenticated') return NextResponse.json({ error: '登录状态已失效，请重新登录。' }, { status: 401 });
    if (!hasPermission(authentication.user.permissions, 'accounts.use_ai_assistant')) return NextResponse.json({ error: '当前账号没有使用 AI 助手的权限。' }, { status: 403 });
    user = authentication.user;

    const body = await request.json() as Record<string, unknown>;
    const messages = parseMessages(body.messages);
    const inputText = typeof body.input_text === 'string'
      ? body.input_text.trim()
      : messages.at(-1)?.role === 'user' ? messages.at(-1)?.content || '' : '';
    if (!inputText) return NextResponse.json({ error: '请提供有效的任务内容。' }, { status: 400 });

    run = await callRuntime(user, ['v1', 'agent-runs'], {
      input_text: inputText,
      source: typeof body.source === 'string' ? body.source : 'assistant',
      agent_id: typeof body.agent_id === 'string' ? body.agent_id : null,
      business_key: typeof body.business_key === 'string' ? body.business_key : null,
      conversation_id: typeof body.conversation_id === 'string' ? body.conversation_id : '',
      knowledge_enabled: body.knowledge_enabled !== false,
      web_enabled: body.web_enabled === true,
    });

    const references = run.steps.flatMap(step => step.metadata?.references || []);
    const ragContext = references.length
      ? `\n\n以下是本次 RAG 检索到的可追溯资料，仅在相关时使用：\n${references.map((reference, index) => `[资料 ${index + 1}] ${reference.document}：${reference.content}`).join('\n')}`
      : '';
    const result = await createDeepSeekChatCompletion({
      user,
      messages: [
        { role: 'system', content: `${run.system_prompt}${ragContext}` },
        ...(messages.length ? messages : [{ role: 'user' as const, content: inputText }]),
      ],
    });
    const completed = await callRuntime(user, ['v1', 'agent-runs', run.id, 'complete'], {
      success: true,
      output_text: result.content,
    });
    return NextResponse.json({ ...result, run: completed, references });
  } catch (error) {
    if (run && user) {
      try {
        await callRuntime(user, ['v1', 'agent-runs', run.id, 'complete'], {
          success: false,
          error_message: error instanceof Error ? error.message : '模型调用失败',
        });
      } catch {
        // The original failure is more useful than a best-effort status update failure.
      }
    }
    if (error instanceof DeepSeekConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof DeepSeekRequestError) return NextResponse.json({ error: error.message }, { status: error.status === 429 ? 429 : 502 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Agent 执行失败，请稍后重试。' }, { status: 502 });
  }
}
