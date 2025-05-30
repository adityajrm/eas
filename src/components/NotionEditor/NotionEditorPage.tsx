import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Home, Grid3X3, List, Search, Plus, FolderPlus, FileText, Folder, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [history, setHistory] = useState<(string | null)[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadItems();
  }, [currentPath]);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([null]);
      setHistoryIndex(0);
    }
  }, []);

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

  const getContentPreview = (content: string | undefined): string => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Organize your notes and folders</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>New</span>
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

      {/* Navigation Bar */}
      <div className="flex flex-wrap items-center gap-4 p-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="flex items-center"
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="flex items-center"
          >
            <ArrowRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHome}
            className="flex items-center"
          >
            <Home size={16} />
          </Button>
        </div>
        <div className="flex-1 flex items-center gap-1 px-3 py-2 bg-muted rounded-md text-sm min-w-0">
          <span className="text-muted-foreground flex-shrink-0">Home</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <span className="text-muted-foreground flex-shrink-0">/</span>
              <button
                className="hover:text-primary truncate"
                onClick={() => handleNavigation(crumb.id)}
              >
                {crumb.title}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            className="pl-10 w-full md:w-48"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center"
          >
            {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {filteredItems.length === 0 ? (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-medium">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first folder or page'}
          </p>
        </motion.div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-3'
        }>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group relative border rounded-lg p-4 hover:bg-accent cursor-pointer transition-all duration-200 hover:shadow-md bg-card ${
                viewMode === 'list' ? 'flex items-center gap-3' : ''
              }`}
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.type === 'folder' ? (
                  <Folder size={20} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <FileText size={20} className="text-gray-500 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate block">{item.title}</span>
                  {item.type === 'page' && item.content && (
                    <div className="mt-1">
                      <p className={`text-sm text-muted-foreground ${viewMode === 'grid' ? 'line-clamp-2' : 'truncate'}`}>
                        {getContentPreview(item.content)}
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
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
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

      {/* Create Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New {createType === 'folder' ? 'Folder' : 'Page'}</DialogTitle>
            <DialogDescription>Enter a name for your new {createType === 'folder' ? 'folder' : 'page'}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
