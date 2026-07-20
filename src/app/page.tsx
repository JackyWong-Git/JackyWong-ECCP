'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { ToastContainer } from '@/components/toast';
import { ContentDashboard } from '@/components/content-dashboard';
import { BlockEditor } from '@/components/block-editor';
import { StoryboardTimeline } from '@/components/storyboard-timeline';
import { KnowledgeBase } from '@/components/knowledge-base';

export type ViewType = 'dashboard' | 'editor' | 'storyboard' | 'knowledge';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ContentDashboard />;
      case 'editor':
        return <BlockEditor />;
      case 'storyboard':
        return <StoryboardTimeline />;
      case 'knowledge':
        return <KnowledgeBase />;
      default:
        return <ContentDashboard />;
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
