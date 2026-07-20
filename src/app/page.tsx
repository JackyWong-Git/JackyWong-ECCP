'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { ToastContainer } from '@/components/toast';
import HomeComposer from '@/components/home-composer';
import StudioMultiArtifact from '@/components/studio-multi-artifact';
import DesignSystemManager from '@/components/design-system-manager';
import AutomationPage from '@/components/automation-page';
import CraftPage from '@/components/craft-rules';

export type ViewType = 'home' | 'studio' | 'design-system' | 'automation' | 'craft';

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
        return <CraftPage />;
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
        <main className="flex-1 overflow-hidden flex flex-col">
          {renderView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
