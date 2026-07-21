'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { ToastContainer } from '@/components/toast';
import { MaterialSubmission } from '@/components/material-submission';
import { ContentCoordination } from '@/components/content-coordination';
import { ChannelPublishing } from '@/components/channel-publishing';
import { MaterialKnowledge } from '@/components/material-knowledge';
import { DataFeedback } from '@/components/data-feedback';

export type ViewType = 'submission' | 'coordination' | 'publishing' | 'knowledge' | 'feedback';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('coordination');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'submission':
        return <MaterialSubmission />;
      case 'coordination':
        return <ContentCoordination />;
      case 'publishing':
        return <ChannelPublishing />;
      case 'knowledge':
        return <MaterialKnowledge />;
      case 'feedback':
        return <DataFeedback />;
      default:
        return <ContentCoordination />;
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
