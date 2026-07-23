'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { showToast, ToastContainer } from '@/components/toast';
import { HomeComposer } from '@/components/home-composer';
import { StudioMultiArtifact } from '@/components/studio-multi-artifact';
import { DesignSystemManager } from '@/components/design-system-manager';
import { AutomationPage } from '@/components/automation-page';
import { CraftRules } from '@/components/craft-rules';
import { RequestIntake } from '@/components/request-intake';
import { CampaignManager } from '@/components/campaign-manager';
import { TopicsBoard } from '@/components/topics-board';
import { ScriptEditor } from '@/components/script-editor';
import { WorkflowBuilder } from '@/components/workflow-builder';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { AgentManagement } from '@/components/agent-management';
import { SkillMarketplace } from '@/components/skill-marketplace';
import { RAGKnowledgeBase } from '@/components/rag-knowledge-base';
import { ExternalConnections } from '@/components/external-connections';
import { AssistantWorkspace } from '@/components/assistant-workspace';
import { TaskCenter } from '@/components/task-center';
import { AuthGuard, useAuth } from '@/components/auth-guard';
import { canAccessView, type ViewType } from '@/lib/access-control';

export default function Home() {
  return (
    <AuthGuard>
      <AuthenticatedWorkspace />
    </AuthGuard>
  );
}

function AuthenticatedWorkspace() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const syncSidebar = () => setSidebarCollapsed(!desktopQuery.matches);

    syncSidebar();
    desktopQuery.addEventListener('change', syncSidebar);
    return () => desktopQuery.removeEventListener('change', syncSidebar);
  }, []);

  const navigateTo = (view: ViewType) => {
    if (!canAccessView(user.permissions, view)) {
      showToast('当前账号没有访问该功能的权限', 'info');
      return;
    }
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeComposer onNavigate={navigateTo} />;
      case 'assistant':
        return <AssistantWorkspace onNavigate={navigateTo} />;
      case 'tasks':
        return <TaskCenter onNavigate={navigateTo} />;
      case 'studio':
        return <StudioMultiArtifact />;
      case 'design-system':
        return <DesignSystemManager />;
      case 'automation':
        return <AutomationPage />;
      case 'craft':
        return <CraftRules />;
      case 'requests':
        return <RequestIntake />;
      case 'campaigns':
        return <CampaignManager />;
      case 'topics':
        return <TopicsBoard />;
      case 'scripts':
        return <ScriptEditor />;
      case 'workflows':
        return <WorkflowBuilder />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'agents':
        return <AgentManagement />;
      case 'skills':
        return <SkillMarketplace />;
      case 'knowledge':
        return <RAGKnowledgeBase />;
      case 'connections':
        return <ExternalConnections />;
      default:
        return <HomeComposer onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-[#F2F6F8]">
        <Sidebar
          currentView={currentView}
          onViewChange={navigateTo}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar currentView={currentView} onViewChange={navigateTo} />
          <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            {renderView()}
          </main>
        </div>
        <ToastContainer />
    </div>
  );
}
