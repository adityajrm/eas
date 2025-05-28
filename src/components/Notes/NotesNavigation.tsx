
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Home, Search, Grid3X3, List } from 'lucide-react';
import { NotesBreadcrumb, NotesViewMode } from '@/types/notes';

interface NotesNavigationProps {
  breadcrumbs: NotesBreadcrumb[];
  onBreadcrumbClick: (crumb: NotesBreadcrumb) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: NotesViewMode;
  onViewModeChange: (mode: NotesViewMode) => void;
}

const NotesNavigation: React.FC<NotesNavigationProps> = ({
  breadcrumbs,
  onBreadcrumbClick,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          disabled={!canGoBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoForward}
          disabled={!canGoForward}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBreadcrumbClick({ id: 'root', name: 'Notes', type: 'folder' })}
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <button
              onClick={() => onBreadcrumbClick(crumb)}
              className="hover:text-foreground transition-colors"
            >
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 && <span>/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes and folders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotesNavigation;
