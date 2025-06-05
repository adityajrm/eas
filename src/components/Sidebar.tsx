import React from 'react';
import { Book, Calendar, FileText, Home, ListTodo, Moon, Settings, Sun, X, Edit3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
interface SidebarProps {
  onCloseMobile?: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile
}) => {
  const {
    currentView,
    setCurrentView
  } = useAppContext();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const isMobile = useIsMobile();
  const menuItems = [{
    id: 'dashboard',
    icon: Home,
    label: 'Dashboard'
  }, {
    id: 'notes',
    icon: FileText,
    label: 'Notes'
  }, {
    id: 'tasks',
    icon: ListTodo,
    label: 'Tasks'
  }, {
    id: 'knowledge',
    icon: Book,
    label: 'Knowledge Base'
  }, {
    id: 'calendar',
    icon: Calendar,
    label: 'Calendar'
  }];
  const handleItemClick = (id: string) => {
    setCurrentView(id as any);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };
  return <div className="w-64 bg-sidebar h-screen p-4 flex flex-col relative rounded-none border border-gray-200\n">
      {isMobile && <Button variant="ghost" size="icon" onClick={onCloseMobile} className="absolute top-2 right-2 text-sidebar-foreground/70" aria-label="Close sidebar">
          <X size={18} />
        </Button>}

      <div className="py-2 mb-8">
        <h1 className="text-2xl font-bold text-sidebar-foreground">Assistant</h1>
        <p className="text-sm text-sidebar-foreground/70">Personal Workspace</p>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map(item => <button key={item.id} onClick={() => handleItemClick(item.id)} className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors', currentView === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>)}
      </nav>

      <div className="pt-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => handleItemClick('settings')} className={cn('flex items-center gap-3 px-3 py-2 rounded-md transition-colors', currentView === 'settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} className="transition-all duration-200 mr-1 bg-inherit text-slate-950">
            {theme === 'light' ? <Moon size={18} className="transition-transform duration-300 rotate-0" /> : <Sun size={18} className="transition-transform duration-300 rotate-90" />}
          </Button>
        </div>
      </div>
    </div>;
};
export default Sidebar;