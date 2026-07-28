export interface AgentReference {
  document: string;
  content: string;
  score: number;
}

export interface AgentRunStep {
  id: string;
  ordinal: number;
  step_type: 'route' | 'rag' | 'skill' | 'model' | 'approval';
  name: string;
  status: string;
  output_summary: string;
  metadata: { references?: AgentReference[]; risk_level?: string; version?: string };
}

export interface AgentApproval {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewed_by_name: string;
  review_note: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_status: string;
  agent_version: number;
  source: string;
  input_text: string;
  status: string;
  business_key: string;
  route_reason: string;
  model_id: string;
  output_text: string;
  error_message: string;
  requested_by_name: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  steps: AgentRunStep[];
  approval: AgentApproval | null;
}

export interface AgentRunList {
  items: AgentRun[];
  total: number;
}

export interface AgentExecutionResult {
  content: string;
  model?: string;
  run: AgentRun;
  references: AgentReference[];
}

export async function executeAgentTask(payload: {
  input_text?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  source: 'home' | 'assistant' | 'test';
  agent_id?: string;
  conversation_id?: string;
  knowledge_enabled?: boolean;
  web_enabled?: boolean;
}): Promise<AgentExecutionResult> {
  const response = await fetch('/api/agent/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as AgentExecutionResult & { error?: string };
  if (!response.ok || !data.content || !data.run) throw new Error(data.error || 'Agent 未返回有效内容');
  return data;
}

export async function listAgentRuns(options: { limit?: number; source?: string } = {}): Promise<AgentRunList> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 6) });
  if (options.source) params.set('source', options.source);
  const response = await fetch(`/api/backend/v1/agent-runs?${params.toString()}`, {
    cache: 'no-store',
  });
  const data = await response.json() as AgentRunList & { detail?: string };
  if (!response.ok || !Array.isArray(data.items)) {
    throw new Error(data.detail || '无法加载 Agent 运行记录');
  }
  return data;
}
