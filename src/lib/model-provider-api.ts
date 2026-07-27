export interface ModelProvider {
  id: string;
  provider_key: string;
  name: string;
  base_url: string;
  default_model: string;
  api_key_masked: string;
  has_api_key: boolean;
  enabled: boolean;
  is_default: boolean;
  status: 'untested' | 'connected' | 'error';
  last_error: string;
  last_tested_at: string | null;
  updated_at: string;
}

export interface ModelProviderList {
  items: ModelProvider[];
  environment_fallback_configured: boolean;
  environment_fallback_model: string;
  environment_fallback_base_url: string;
}

export interface ModelProviderInput {
  name: string;
  provider_key: string;
  base_url: string;
  default_model: string;
  api_key: string;
}

async function modelProviderRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/v1/model-providers${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
    cache: 'no-store',
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json() as T & { detail?: string; error?: string };
  if (!response.ok) throw new Error(data.detail || data.error || '模型配置请求失败');
  return data;
}

export function listModelProviders() {
  return modelProviderRequest<ModelProviderList>('');
}

export function createModelProvider(payload: ModelProviderInput) {
  return modelProviderRequest<ModelProvider>('', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateModelProvider(id: string, payload: Partial<ModelProviderInput> & { enabled?: boolean }) {
  return modelProviderRequest<ModelProvider>(`/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function testModelProvider(id: string) {
  return modelProviderRequest<{ ok: boolean; model: string; latency_ms: number; message: string }>(
    `/${id}/test`,
    { method: 'POST', body: '{}' },
  );
}

export function activateModelProvider(id: string, applyModelToAgents: boolean) {
  return modelProviderRequest<ModelProvider>(`/${id}/activate`, {
    method: 'POST',
    body: JSON.stringify({ apply_model_to_agents: applyModelToAgents }),
  });
}

export function deleteModelProvider(id: string) {
  return modelProviderRequest<void>(`/${id}`, { method: 'DELETE' });
}
