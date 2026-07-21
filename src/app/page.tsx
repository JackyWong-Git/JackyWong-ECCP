'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { ToastContainer } from '@/components/toast';
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

export type ViewType =
  | 'home'
  | 'studio'
  | 'design-system'
  | 'automation'
  | 'craft'
  | 'requests'
  | 'campaigns'
  | 'topics'
  | 'scripts'
  | 'workflows'
  | 'analytics';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeComposer />;
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
      default:
        return <HomeComposer />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#FAFAF8' }}>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
