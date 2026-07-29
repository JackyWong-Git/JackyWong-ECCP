import { createFastApiHeaders, fastApiUrl } from '@/lib/fastapi-proxy';
import { type AuthenticatedUser } from '@/lib/server-auth';

export type DeepSeekModel = string;

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  model?: string;
  provider?: string;
  choices?: Array<{ message?: { content?: string } }>;
  content?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
  detail?: string;
}

export class DeepSeekConfigurationError extends Error {}

export class DeepSeekRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function createDeepSeekChatCompletion(input: {
  user: AuthenticatedUser;
  messages: DeepSeekMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const response = await fetch(fastApiUrl(['v1', 'model-runtime', 'chat']), {
    method: 'POST',
    headers: createFastApiHeaders(input.user, 'application/json'),
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      max_tokens: input.maxTokens ?? 2400,
      temperature: input.temperature ?? 0.65,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(90_000),
  });

  const data = await response.json() as DeepSeekResponse;
  if (!response.ok) {
    const message = data.detail || data.error?.message || 'LLM 服务暂时不可用。';
    if (response.status === 503 && message.includes('配置')) throw new DeepSeekConfigurationError(message);
    throw new DeepSeekRequestError(message, response.status);
  }

  const content = data.content?.trim() || data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new DeepSeekRequestError('LLM 未返回有效内容。', 502);

  return {
    content,
    model: data.model || input.model || 'default',
    provider: data.provider,
    usage: data.usage,
  };
}
