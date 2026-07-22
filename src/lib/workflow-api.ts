export type MaterialStatus = 'pending' | 'selected' | 'in_progress' | 'published' | 'rejected';
export type TopicStatus = 'idea' | 'research' | 'approved' | 'in_progress' | 'done' | 'archived';
export type TaskStatus = 'todo' | 'doing' | 'review' | 'approved' | 'published' | 'cancelled';

export interface MaterialItem {
  id: string;
  title: string;
  description: string;
  material_type: string;
  category: string;
  source_department: string;
  source_contact: string;
  happened_at: string | null;
  location: string;
  vp_attend: boolean;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  status: MaterialStatus;
  tags: string[];
  expected_channels: string[];
  selected_channels: string[];
  assignee_name: string;
  notes: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface TopicItem {
  id: string;
  material_id: string | null;
  title: string;
  description: string;
  status: TopicStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee_employee_id: string;
  assignee_name: string;
  tags: string[];
  source: string;
  source_url: string;
  channel: string;
  estimated_words: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ContentTaskItem {
  id: string;
  topic_id: string | null;
  material_id: string | null;
  title: string;
  description: string;
  project_name: string;
  status: TaskStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  owner_employee_id: string;
  owner_name: string;
  due_at: string | null;
  ai_created: boolean;
  version: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationItem {
  id: string;
  task_id: string;
  title: string;
  channel: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'failed';
  external_url: string;
  published_at: string | null;
  publisher_name: string;
  created_at: string;
}

export interface DashboardMetric {
  publication_id: string;
  title: string;
  channel: string;
  published_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;
  conversions: number;
  completion_rate: number;
}

export interface DashboardSummary {
  total_views: number;
  total_publications: number;
  total_engagements: number;
  total_conversions: number;
  channel_totals: Record<string, number>;
  items: DashboardMetric[];
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export async function workflowApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`/api/backend/v1/${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string; detail?: string } | null;
    throw new Error(payload?.error || payload?.detail || `请求失败（${response.status}）`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function formatDate(value: string | null, withTime = false) {
  if (!value) return '待设置';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
