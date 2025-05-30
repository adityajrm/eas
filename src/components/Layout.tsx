import React from 'react';
import Sidebar from './Sidebar';
import { useAppContext } from '../context/AppContext';
import Dashboard from './Dashboard';
import BlockEditorPage from './NotionEditor/BlockEditorPage';
import TasksPage from './Tasks/TasksPage';
import KnowledgeBasePage from './KnowledgeBase/KnowledgeBasePage';
import CalendarPage from './Calendar/CalendarPage';
import SettingsPage from './Settings/SettingsPage';
import PageNavigation from './Navigation/PageNavigation';
import ChatBox from './ChatBox/ChatBox';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';

const Layout: React.FC = () => {
  const { currentView } = useAppContext();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = React.useState(!isMobile);
  const [showMobileChat, setShowMobileChat] = React.useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Hide sidebar when switching to mobile view
  React.useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [isMobile]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'notes':
      case 'notion-editor':
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
    <div className="flex h-screen overflow-hidden relative">
      {/* Enhanced glowing background with improved visibility */}
      <div className="glow-background"></div>
      
      {/* Mobile sidebar toggle button - visible when the sidebar is closed or when the chat is open */}
      {isMobile && (!showSidebar || showMobileChat) && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="absolute top-3 left-3 z-50 bg-background/80 backdrop-blur-sm"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>
      )}
      
      {/* Sidebar with conditional display for mobile - increased z-index */}
      <div 
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out fixed md:relative z-50 h-full`}
      >
        <Sidebar onCloseMobile={() => isMobile && setShowSidebar(false)} />
      </div>
      
      {/* Overlay to close sidebar on mobile when clicking outside */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
          aria-hidden="true"
        />
      )}
      
      <main className={`flex-1 overflow-y-auto p-3 md:p-6 bg-background/80 backdrop-blur-sm ${isMobile ? 'pt-14 pb-16' : ''}`}>
        <PageNavigation />
        <div className="mt-2 md:mt-0">
          {renderContent()}
        </div>
      </main>
      
      {/* ChatBox component shown conditionally based on screen size */}
      {!isMobile ? (
        <ChatBox />
      ) : (
        <MobileChatButton isOpen={showMobileChat} setIsOpen={setShowMobileChat} />
      )}
    </div>
  );
};

// Updated Mobile Chat Button component
interface MobileChatButtonProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MobileChatButton: React.FC<MobileChatButtonProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <div className="w-full h-full flex flex-col">
            <ChatBox />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 z-50 bg-background/80 rounded-full p-2"
            >
              <span className="sr-only">Close chat</span>
              ×
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="fixed bottom-0 left-0 right-0 h-14 rounded-none bg-assistant-primary text-white flex items-center justify-center gap-2 z-30"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare size={20} />
          <span>Chat with Assistant</span>
        </Button>
      )}
    </>
  );
};

export default Layout;
