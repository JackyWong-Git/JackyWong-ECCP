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
  status: string;
  business_key: string;
  route_reason: string;
  model_id: string;
  output_text: string;
  steps: AgentRunStep[];
  approval: AgentApproval | null;
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
