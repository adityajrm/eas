
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Home, Grid3X3, List, Search, Plus, FolderPlus, FileText, Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NotionItem, NotionViewMode, NotionBreadcrumb } from '@/types/notion';
import { getNotionItems, createNotionItem, updateNotionItem, deleteNotionItem, getNotionItemById, searchNotionItems } from '@/services/notionService';
import NotionEditor from './NotionEditor';

const NotionEditorPage: React.FC = () => {
  const [items, setItems] = useState<NotionItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<NotionBreadcrumb[]>([]);
  const [viewMode, setViewMode] = useState<NotionViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'folder' | 'page'>('page');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedItem, setSelectedItem] = useState<NotionItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, [currentPath]);

  const loadItems = async () => {
    try {
      const fetchedItems = await getNotionItems(currentPath);
      setItems(fetchedItems);
      await buildBreadcrumbs();
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    }
  };

  const buildBreadcrumbs = async () => {
    const crumbs: NotionBreadcrumb[] = [];
    let currentId = currentPath;
    
    while (currentId) {
      const item = await getNotionItemById(currentId);
      if (item) {
        crumbs.unshift({ id: item.id, title: item.title, type: item.type });
        currentId = item.parent_id;
      } else {
        break;
      }
    }
    
    setBreadcrumbs(crumbs);
  };

  const handleNavigation = (pathId: string | null) => {
    if (pathId !== currentPath) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentPath || 'root');
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setCurrentPath(pathId);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const prevPath = history[historyIndex - 1];
      setCurrentPath(prevPath === 'root' ? null : prevPath);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextPath = history[historyIndex + 1];
      setCurrentPath(nextPath === 'root' ? null : nextPath);
    }
  };

  const handleHome = () => {
    handleNavigation(null);
  };

  const handleCreateItem = async () => {
    if (!newItemTitle.trim()) return;

    try {
      const newItem = await createNotionItem({
        title: newItemTitle,
        type: createType,
        parent_id: currentPath,
        content: createType === 'page' ? '' : undefined,
      });

      setItems([...items, newItem]);
      setNewItemTitle('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: `${createType === 'folder' ? 'Folder' : 'Page'} created successfully`,
      });
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (item: NotionItem) => {
    if (item.type === 'folder') {
      handleNavigation(item.id);
    } else {
      setSelectedItem(item);
      setIsEditing(true);
    }
  };

  const handleDeleteItem = async (item: NotionItem) => {
    try {
      await deleteNotionItem(item.id);
      setItems(items.filter(i => i.id !== item.id));
      
      toast({
        title: "Success",
        description: `${item.type === 'folder' ? 'Folder' : 'Page'} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleSaveItem = async (updatedItem: NotionItem) => {
    try {
      await updateNotionItem(updatedItem);
      setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
      setIsEditing(false);
      setSelectedItem(null);
      
      toast({
        title: "Success",
        description: "Item saved successfully",
      });
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadItems();
      return;
    }

    try {
      const searchResults = await searchNotionItems(searchQuery);
      setItems(searchResults);
    } catch (error) {
      console.error('Error searching items:', error);
      toast({
        title: "Error",
        description: "Failed to search items",
        variant: "destructive",
      });
    }
  };

  const filteredItems = searchQuery 
    ? items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  if (isEditing && selectedItem) {
    return (
      <NotionEditor
        item={selectedItem}
        onSave={handleSaveItem}
        onCancel={() => {
          setIsEditing(false);
          setSelectedItem(null);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-4 border-b bg-card">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={historyIndex <= 0}
        >
          <ArrowLeft size={16} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleForward}
          disabled={historyIndex >= history.length - 1}
        >
          <ArrowRight size={16} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleHome}
        >
          <Home size={16} />
        </Button>

        {/* Address Bar */}
        <div className="flex-1 flex items-center gap-1 px-3 py-1 bg-muted rounded-md text-sm">
          <span className="text-muted-foreground">Home</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <span className="text-muted-foreground">/</span>
              <button
                className="hover:text-primary"
                onClick={() => handleNavigation(crumb.id)}
              >
                {crumb.title}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
        </Button>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-48"
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search size={16} />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-card">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setCreateType('folder');
                setIsCreateDialogOpen(true);
              }}
            >
              <FolderPlus size={16} className="mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCreateType('page');
                setIsCreateDialogOpen(true);
              }}
            >
              <FileText size={16} className="mr-2" />
              New Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {searchQuery ? 'No items found matching your search.' : 'No items yet. Create your first folder or page!'}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`group relative border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors ${
                  viewMode === 'list' ? 'flex items-center gap-3' : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'folder' ? (
                    <Folder size={20} className="text-blue-500" />
                  ) : (
                    <FileText size={20} className="text-gray-500" />
                  )}
                  <span className="font-medium truncate">{item.title}</span>
                </div>
                
                {viewMode === 'grid' && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {item.type === 'page' && item.content && (
                      <p className="line-clamp-2">{item.content.substring(0, 100)}...</p>
                    )}
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleItemClick(item)}>
                      <Edit2 size={16} className="mr-2" />
                      {item.type === 'folder' ? 'Open' : 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'folder' ? 'Folder' : 'Page'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={`${createType === 'folder' ? 'Folder' : 'Page'} name`}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateItem()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotionEditorPage;
