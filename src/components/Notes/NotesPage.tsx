import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteFolder, NotePage, NotesBreadcrumb, NotesViewMode } from '@/types/notes';
import NotesNavigation from './NotesNavigation';
import FolderView from './FolderView';
import PageEditor from './PageEditor';
import NotesDropZone from './NotesDropZone';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import * as notesDb from '../../services/notesDbService';

const NotesPage = () => {
  const { notes, addNote, updateNote, deleteNote } = useAppContext();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [pages, setPages] = useState<NotePage[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<NotesBreadcrumb[]>([]);
  const [viewMode, setViewMode] = useState<NotesViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [foldersData, pagesData] = await Promise.all([
        notesDb.getFolders(),
        notesDb.getPages()
      ]);

      // Migrate existing notes to pages if no pages exist
      if (foldersData) setFolders(foldersData);
      if (pagesData && pagesData.length > 0) {
        setPages(pagesData);
      } else {
        // Convert existing notes to pages
        const convertedPages: NotePage[] = notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          folderId: 'root',
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          audioUrl: note.audioUrl
        }));
        setPages(convertedPages);
        
        // Save converted pages to database
        for (const page of convertedPages) {
          await notesDb.savePage(page);
        }
      }
    } catch (error) {
      console.error("Error loading notes data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update breadcrumbs when navigation changes
  useEffect(() => {
    updateBreadcrumbs();
  }, [currentFolderId, currentPageId, folders, pages]);

  const updateBreadcrumbs = () => {
    const crumbs: NotesBreadcrumb[] = [{ id: 'root', name: 'Notes', type: 'folder' }];
    
    if (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        const buildFolderPath = (folderId: string): NotesBreadcrumb[] => {
          const folder = folders.find(f => f.id === folderId);
          if (!folder) return [];
          
          const parentCrumbs = folder.parentId ? buildFolderPath(folder.parentId) : [];
          return [...parentCrumbs, { id: folder.id, name: folder.name, type: 'folder' }];
        };
        
        crumbs.push(...buildFolderPath(currentFolderId));
      }
    }
    
    if (currentPageId) {
      const page = pages.find(p => p.id === currentPageId);
      if (page) {
        crumbs.push({ id: page.id, name: page.title, type: 'page' });
      }
    }
    
    setBreadcrumbs(crumbs);
  };

  const handleCreateFolder = async () => {
    const newFolder: NoteFolder = {
      id: uuidv4(),
      name: 'New Folder',
      parentId: currentFolderId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      icon: '📁'
    };
    
    try {
      await notesDb.saveFolder(newFolder);
      setFolders(prev => [...prev, newFolder]);
      toast({
        title: "Folder Created",
        description: "New folder has been created successfully."
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder.",
        variant: "destructive"
      });
    }
  };

  const handleCreatePage = async () => {
    const newPage: NotePage = {
      id: uuidv4(),
      title: 'Untitled Page',
      content: '',
      folderId: currentFolderId || 'root',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      await notesDb.savePage(newPage);
      setPages(prev => [...prev, newPage]);
      setCurrentPageId(newPage.id);
      addNavigationHistory(newPage.id);
      toast({
        title: "Page Created",
        description: "New page has been created successfully."
      });
    } catch (error) {
      console.error("Error creating page:", error);
      toast({
        title: "Error",
        description: "Failed to create page.",
        variant: "destructive"
      });
    }
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setCurrentPageId(null);
    addNavigationHistory(folderId);
  };

  const handlePageClick = (pageId: string) => {
    setCurrentPageId(pageId);
    addNavigationHistory(pageId);
  };

  const addNavigationHistory = (id: string) => {
    const newHistory = navigationHistory.slice(0, historyIndex + 1);
    newHistory.push(id);
    setNavigationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prevId = navigationHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      navigateToId(prevId);
    }
  };

  const goForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const nextId = navigationHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      navigateToId(nextId);
    }
  };

  const navigateToId = (id: string) => {
    const folder = folders.find(f => f.id === id);
    const page = pages.find(p => p.id === id);
    
    if (folder) {
      setCurrentFolderId(id);
      setCurrentPageId(null);
    } else if (page) {
      setCurrentPageId(id);
      setCurrentFolderId(page.folderId === 'root' ? null : page.folderId);
    }
  };

  const handleBreadcrumbClick = (crumb: NotesBreadcrumb) => {
    if (crumb.type === 'folder') {
      setCurrentFolderId(crumb.id === 'root' ? null : crumb.id);
      setCurrentPageId(null);
    } else {
      setCurrentPageId(crumb.id);
    }
    addNavigationHistory(crumb.id);
  };

  const getCurrentFolderItems = () => {
    const currentFolders = folders.filter(f => f.parentId === currentFolderId);
    const currentPages = pages.filter(p => p.folderId === (currentFolderId || 'root'));
    
    if (searchQuery) {
      const filteredFolders = currentFolders.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const filteredPages = currentPages.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return { folders: filteredFolders, pages: filteredPages };
    }
    
    return { folders: currentFolders, pages: currentPages };
  };

  // Handle drag and drop
  const handleDrop = async (draggedId: string, targetFolderId: string | null) => {
    const [type, id] = draggedId.split(':');
    
    if (type === 'page') {
      const page = pages.find(p => p.id === id);
      if (page && page.folderId !== (targetFolderId || 'root')) {
        try {
          await notesDb.movePageToFolder(id, targetFolderId || 'root');
          setPages(prev => prev.map(p => 
            p.id === id ? { ...p, folderId: targetFolderId || 'root', updatedAt: new Date() } : p
          ));
          toast({
            title: "Page Moved",
            description: "Page has been moved successfully."
          });
        } catch (error) {
          console.error("Error moving page:", error);
          toast({
            title: "Error",
            description: "Failed to move page.",
            variant: "destructive"
          });
        }
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // If viewing a specific page, show the editor
  if (currentPageId) {
    const currentPage = pages.find(p => p.id === currentPageId);
    if (currentPage) {
      return (
        <div className="h-full">
          <PageEditor
            page={currentPage}
            onUpdate={async (updatedPage) => {
              try {
                await notesDb.updatePage(updatedPage);
                setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
              } catch (error) {
                console.error("Error updating page:", error);
              }
            }}
            onBack={() => {
              setCurrentPageId(null);
              goBack();
            }}
            breadcrumbs={breadcrumbs}
            onBreadcrumbClick={handleBreadcrumbClick}
          />
          
          <NotesDropZone />
        </div>
      );
    }
  }

  const { folders: displayFolders, pages: displayPages } = getCurrentFolderItems();

  return (
    <motion.div 
      className="space-y-6 h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer?.getData('text/plain');
        if (draggedId) {
          handleDrop(draggedId, currentFolderId);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <NotesNavigation
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={handleBreadcrumbClick}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < navigationHistory.length - 1}
        onGoBack={goBack}
        onGoForward={goForward}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : 'Notes'}
        </h1>
        
        <div className="flex gap-2">
          <Button onClick={handleCreateFolder} variant="outline" size="sm">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button onClick={handleCreatePage} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>
      </div>

      <FolderView
        folders={displayFolders}
        pages={displayPages}
        viewMode={viewMode}
        onFolderClick={handleFolderClick}
        onPageClick={handlePageClick}
        onFolderUpdate={async (folder) => {
          try {
            await notesDb.updateFolder(folder);
            setFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
          } catch (error) {
            console.error("Error updating folder:", error);
          }
        }}
        onPageUpdate={async (page) => {
          try {
            await notesDb.updatePage(page);
            setPages(prev => prev.map(p => p.id === page.id ? page : p));
          } catch (error) {
            console.error("Error updating page:", error);
          }
        }}
        onFolderDelete={async (folderId) => {
          try {
            await notesDb.deleteFolder(folderId);
            setFolders(prev => prev.filter(f => f.id !== folderId));
          } catch (error) {
            console.error("Error deleting folder:", error);
          }
        }}
        onPageDelete={async (pageId) => {
          try {
            await notesDb.deletePage(pageId);
            setPages(prev => prev.filter(p => p.id !== pageId));
          } catch (error) {
            console.error("Error deleting page:", error);
          }
        }}
        onDrop={handleDrop}
      />

      <NotesDropZone />
    </motion.div>
  );
};

export default NotesPage;
