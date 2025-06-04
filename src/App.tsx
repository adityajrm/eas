
import React, { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TasksPage from './components/Tasks/TasksPage';
import KnowledgeBasePage from './components/KnowledgeBase/KnowledgeBasePage';
import CalendarPage from './components/Calendar/CalendarPage';
import SettingsPage from './components/Settings/SettingsPage';
import BlockEditorPage from './components/BlockEditor/BlockEditorPage';
import { useAppContext } from './context/AppContext';
import { useIsMobile } from './hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AISidebar } from './components/AISidebar/AISidebar';

const AppContent: React.FC = () => {
  const { currentView } = useAppContext();
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  const renderContent = () => {
    const baseClasses = "flex-1 overflow-auto";
    const contentClasses = currentView === 'notes' 
      ? baseClasses // Notes page handles its own padding
      : `${baseClasses} p-6`; // Other pages get standard padding

    const content = (() => {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard />;
        case 'notes':
          return <BlockEditorPage />;
        case 'tasks':
          return <TasksPage />;
        case 'knowledge':
          return <KnowledgeBasePage />;
        case 'calendar':
          return <CalendarPage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <Dashboard />;
      }
    })();

    return <main className={contentClasses}>{content}</main>;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar */}
      {isMobile ? (
        <>
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
              >
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </>
      ) : (
        /* Desktop Sidebar */
        <Sidebar />
      )}

      {/* Main Content */}
      {renderContent()}

      {/* AI Sidebar - part of main layout, not overlay */}
      <AISidebar
        isOpen={isAISidebarOpen}
        onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
        mode={currentView === 'notes' ? 'notes' : 'chat'}
        currentView={currentView}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
