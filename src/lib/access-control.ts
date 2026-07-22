export type ViewType =
  | 'home'
  | 'assistant'
  | 'tasks'
  | 'studio'
  | 'design-system'
  | 'automation'
  | 'craft'
  | 'requests'
  | 'campaigns'
  | 'topics'
  | 'scripts'
  | 'workflows'
  | 'analytics'
  | 'agents'
  | 'skills'
  | 'knowledge'
  | 'connections';

export const viewPermissions: Record<ViewType, string> = {
  home: 'accounts.access_workspace',
  assistant: 'accounts.use_ai_assistant',
  tasks: 'accounts.view_tasks',
  studio: 'accounts.create_content',
  'design-system': 'accounts.manage_platform',
  automation: 'accounts.manage_platform',
  craft: 'accounts.create_content',
  requests: 'accounts.manage_projects',
  campaigns: 'accounts.manage_projects',
  topics: 'accounts.view_topics',
  scripts: 'accounts.create_content',
  workflows: 'accounts.manage_platform',
  analytics: 'accounts.view_analytics',
  agents: 'accounts.manage_platform',
  skills: 'accounts.manage_platform',
  knowledge: 'accounts.view_knowledge',
  connections: 'accounts.manage_platform',
};

export function hasPermission(permissions: string[], permission: string) {
  return permissions.includes('*') || permissions.includes(permission);
}

export function canAccessView(permissions: string[], view: ViewType) {
  return hasPermission(permissions, viewPermissions[view]);
}
