import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Home, Grid3X3, List, Search, Plus, FolderPlus, FileText, Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotionItem, NotionViewMode, NotionBreadcrumb } from '@/types/notion';
import { getNotionItems, createNotionItem, updateNotionItem, deleteNotionItem, getNotionItemById, searchNotionItems } from '@/services/notionService';
import { BlockEditor } from './BlockEditor';
import { AISidebar } from '../AISidebar/AISidebar';

const BlockEditorPage: React.FC = () => {
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
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      newHistory.push(pathId);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setCurrentPath(pathId);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const prevPath = history[historyIndex - 1];
      setCurrentPath(prevPath);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextPath = history[historyIndex + 1];
      setCurrentPath(nextPath);
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

  const handleSaveItem = async (content: string) => {
    if (!selectedItem) return;

    try {
      const updatedItem: NotionItem = {
        ...selectedItem,
        content: content,
        updated_at: new Date(),
      };

      await updateNotionItem(updatedItem);
      setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
      setSelectedItem(updatedItem);

    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: "Failed to save page",
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

  const getContentPreview = (content: string | undefined): string => {
    if (!content) return '';
    
    // Strip HTML tags for preview
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  const filteredItems = searchQuery 
    ? items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.content && getContentPreview(item.content).toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  if (isEditing && selectedItem) {
    return (
      <div className="min-h-screen bg-background">
        <BlockEditor
          initialContent={selectedItem.content || ''}
          onSave={handleSaveItem}
          title={selectedItem.title}
          onTitleChange={(newTitle) => {
            if (selectedItem) {
              const updatedItem = { ...selectedItem, title: newTitle };
              setSelectedItem(updatedItem);
              updateNotionItem(updatedItem);
            }
          }}
          onBack={() => {
            setIsEditing(false);
            setSelectedItem(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm sticky top-0 z-10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
            <div>
              <h1 className="text-2xl font-bold">Notes</h1>
              <p className="text-muted-foreground">Organize your thoughts with powerful editing</p>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <Plus size={16} />
                <span>New</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* ... keep existing code (navigation buttons and breadcrumbs) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {!isMobile && "Back"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              className="flex items-center gap-2"
            >
              <ArrowRight size={16} />
              {!isMobile && "Forward"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleHome}
              className="flex items-center gap-2"
            >
              <Home size={16} />
              {!isMobile && "Home"}
            </Button>
          </div>
          
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm min-w-0">
            <span className="text-muted-foreground flex-shrink-0">Home</span>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id}>
                <span className="text-muted-foreground flex-shrink-0">/</span>
                <button
                  className="hover:text-primary truncate"
                  onClick={() => handleNavigation(crumb.id)}
                >
                  {crumb.title}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                className="pl-10 w-full md:w-64"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {/* ... keep existing code (content rendering) */}
        {filteredItems.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first folder or page to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create your first page
              </Button>
            )}
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-3'
          }>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`group relative border rounded-lg p-6 hover:shadow-lg cursor-pointer transition-all duration-200 bg-card hover:border-primary/50 ${
                  viewMode === 'list' ? 'flex items-center gap-4' : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {item.type === 'folder' ? (
                    <Folder size={24} className="text-blue-500 flex-shrink-0 mt-1" />
                  ) : (
                    <FileText size={24} className="text-gray-500 flex-shrink-0 mt-1" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg mb-1 truncate">{item.title}</h3>
                    {item.type === 'page' && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getContentPreview(item.content) || 'Empty page'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(item.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
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
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New {createType === 'folder' ? 'Folder' : 'Page'}</DialogTitle>
            <DialogDescription>
              Enter a name for your new {createType === 'folder' ? 'folder' : 'page'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={`${createType === 'folder' ? 'Folder' : 'Page'} name`}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem} disabled={!newItemTitle.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Sidebar */}
      <AISidebar
        isOpen={isAISidebarOpen}
        onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
        mode="chat"
      />
    </div>
  );
};

export default BlockEditorPage;
