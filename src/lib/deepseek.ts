const DEFAULT_BASE_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-pro';

export const LLM_BASE_URL = process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL;
export const LLM_DEFAULT_MODEL = process.env.LLM_MODEL?.trim() || DEFAULT_MODEL;

export type DeepSeekModel = string;

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
}

export class DeepSeekConfigurationError extends Error {}

export class DeepSeekRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function createDeepSeekChatCompletion(input: {
  messages: DeepSeekMessage[];
  model?: string;
}) {
  const apiKey = (process.env.NEW_API_KEY || process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY)?.trim();
  if (!apiKey) throw new DeepSeekConfigurationError('LLM API Key 尚未配置。');

  const model = input.model || LLM_DEFAULT_MODEL;

  const response = await fetch(LLM_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      max_tokens: 2400,
      temperature: 0.65,
      stream: false,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const data = await response.json() as DeepSeekResponse;
  if (!response.ok) {
    throw new DeepSeekRequestError(data.error?.message || 'LLM 服务暂时不可用。', response.status);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new DeepSeekRequestError('LLM 未返回有效内容。', 502);

  return {
    content,
    model: data.model || model,
    usage: data.usage,
  };
}
