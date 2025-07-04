
import React, { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

const AppContent: React.FC = () => {
  const { currentView } = useAppContext();
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [currentContent, setCurrentContent] = useState('');

  // Handle text selection for notes mode - only within notes editor
  useEffect(() => {
    const handleSelection = () => {
      if (currentView === 'notes') {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          // Check if the selection is within the notes editor
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const editorElement = document.querySelector('[data-tiptap-editor]') || 
                               document.querySelector('.ProseMirror') ||
                               document.querySelector('[contenteditable="true"]');
          
          if (editorElement && (editorElement.contains(container) || container === editorElement)) {
            setSelectedText(selection.toString().trim());
          }
        } else {
          // Clear selected text when nothing is selected
          setSelectedText('');
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [currentView]);

  const renderContent = () => {
    const baseClasses = "flex-1 overflow-auto transition-all duration-300 ease-in-out";
    const contentClasses = currentView === 'notes' 
      ? `${baseClasses}` // Notes page handles its own padding
      : `${baseClasses} p-6`; // Other pages get standard padding

    const content = (() => {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard />;
        case 'notes':
          return (
            <BlockEditorPage 
              onContentChange={setCurrentContent}
              onInsertContent={(content) => {
                // This will be handled by the BlockEditor component
              }}
            />
          );
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

    return <main className={cn(contentClasses, "animate-fade-in")}>{content}</main>;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
        <div className="transition-all duration-300 ease-in-out">
          <Sidebar />
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex flex-1 transition-all duration-300 ease-in-out">
        {renderContent()}
      </div>

      {/* AI Sidebar */}
      <AISidebar
        isOpen={isAISidebarOpen}
        onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
        mode={currentView === 'notes' ? 'notes' : 'chat'}
        currentView={currentView}
        currentContent={currentContent}
        selectedText={selectedText}
        onInsertContent={(content) => {
          // This will be passed down to the editor
          if (currentView === 'notes') {
            const event = new CustomEvent('insertAIContent', { detail: content });
            window.dispatchEvent(event);
          }
        }}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
