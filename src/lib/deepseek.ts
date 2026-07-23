export const DEEPSEEK_MODELS = ['deepseek-v4-pro', 'deepseek-v4-flash'] as const;

export type DeepSeekModel = typeof DEEPSEEK_MODELS[number];

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
  model?: DeepSeekModel;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new DeepSeekConfigurationError('DeepSeek API Key 尚未配置。');

  const configuredModel = process.env.DEEPSEEK_MODEL?.trim();
  const model = input.model
    ?? (DEEPSEEK_MODELS.includes(configuredModel as DeepSeekModel) ? configuredModel as DeepSeekModel : 'deepseek-v4-pro');

  const response = await fetch('https://api.deepseek.com/chat/completions', {
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
    throw new DeepSeekRequestError(data.error?.message || 'DeepSeek 服务暂时不可用。', response.status);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new DeepSeekRequestError('DeepSeek 未返回有效内容。', 502);

  return {
    content,
    model: data.model || model,
    usage: data.usage,
  };
}
