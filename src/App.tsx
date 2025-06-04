
import React, { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AppContextProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TasksPage from './components/TasksPage';
import KnowledgeBasePage from './components/KnowledgeBasePage';
import CalendarPage from './components/CalendarPage';
import SettingsPage from './components/SettingsPage';
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
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>

      {/* AI Sidebar for non-notes pages */}
      {currentView !== 'notes' && (
        <AISidebar
          isOpen={isAISidebarOpen}
          onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
          mode="chat"
        />
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContextProvider>
        <AppContent />
        <Toaster />
      </AppContextProvider>
    </ThemeProvider>
  );
}

export default App;
