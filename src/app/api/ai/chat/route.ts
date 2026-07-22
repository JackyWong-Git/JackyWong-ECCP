import { NextResponse } from 'next/server';
import {
  createDeepSeekChatCompletion,
  DEEPSEEK_MODELS,
  DeepSeekConfigurationError,
  DeepSeekRequestError,
  type DeepSeekMessage,
  type DeepSeekModel,
} from '@/lib/deepseek';
import { getAuthentication } from '@/lib/server-auth';
import { hasPermission } from '@/lib/access-control';

export const runtime = 'nodejs';

function parseMessages(value: unknown): DeepSeekMessage[] {
  if (!Array.isArray(value)) return [];

  return value.slice(-30).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = typeof record.content === 'string' ? record.content.trim().slice(0, 30_000) : '';
    if ((role !== 'user' && role !== 'assistant') || !content) return [];
    return [{ role, content }];
  });
}

export async function POST(request: Request) {
  try {
    const authentication = await getAuthentication(request);
    if (authentication.status === 'unavailable') {
      return NextResponse.json({ error: '认证服务暂时不可用。' }, { status: 503 });
    }
    if (authentication.status !== 'authenticated') {
      return NextResponse.json({ error: '登录状态已失效，请重新登录。' }, { status: 401 });
    }
    if (!hasPermission(authentication.user.permissions, 'accounts.use_ai_assistant')) {
      return NextResponse.json({ error: '当前账号没有使用 AI 助手的权限。' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const messages = parseMessages(body.messages);
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: '请提供有效的用户消息。' }, { status: 400 });
    }

    const model = typeof body.model === 'string' && DEEPSEEK_MODELS.includes(body.model as DeepSeekModel)
      ? body.model as DeepSeekModel
      : undefined;
    const system = typeof body.system === 'string' ? body.system.trim().slice(0, 20_000) : '';
    const result = await createDeepSeekChatCompletion({
      model,
      messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DeepSeekConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof DeepSeekRequestError) {
      const status = error.status === 401 || error.status === 402 || error.status === 429 ? error.status : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'AI 服务请求失败，请稍后重试。' }, { status: 502 });
  }
}
