'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { ToastContainer } from '@/components/toast';
import { TopicsBoard } from '@/components/topics-board';
import { ScriptEditor } from '@/components/script-editor';
import { WorkflowBuilder } from '@/components/workflow-builder';
import { KnowledgeBase } from '@/components/knowledge-base';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

export type ViewType = 'topics' | 'scripts' | 'workflows' | 'knowledge' | 'analytics';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('topics');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'topics':
        return <TopicsBoard />;
      case 'scripts':
        return <ScriptEditor />;
      case 'workflows':
        return <WorkflowBuilder />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <TopicsBoard />;
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
