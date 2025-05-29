
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageNavigationProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  title?: string;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  showBackButton = true,
  onBack,
  onForward,
  title
}) => {
  const { currentView, setCurrentView } = useAppContext();
  const isMobile = useIsMobile();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleForward = () => {
    if (onForward) {
      onForward();
    }
  };

  if (currentView === 'dashboard') {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center mb-4 gap-2">
      {showBackButton && (
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={handleBack} 
          className="flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          <span className={isMobile ? "sr-only" : ""}>Back</span>
        </Button>
      )}
      {onForward && (
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={handleForward} 
          className="flex items-center gap-1"
        >
          <span className={isMobile ? "sr-only" : ""}>Forward</span>
          <ArrowRight size={16} />
        </Button>
      )}
      {title && <h2 className="text-lg font-semibold ml-0 md:ml-2">{title}</h2>}
    </div>
  );
};

export default PageNavigation;
