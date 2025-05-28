
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Folder, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { NoteFolder, NotePage, NotesViewMode } from '@/types/notes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FolderViewProps {
  folders: NoteFolder[];
  pages: NotePage[];
  viewMode: NotesViewMode;
  onFolderClick: (folderId: string) => void;
  onPageClick: (pageId: string) => void;
  onFolderUpdate: (folder: NoteFolder) => void;
  onPageUpdate: (page: NotePage) => void;
  onFolderDelete: (folderId: string) => void;
  onPageDelete: (pageId: string) => void;
  onDrop: (draggedId: string, targetFolderId: string | null) => void;
}

const FolderView: React.FC<FolderViewProps> = ({
  folders,
  pages,
  viewMode,
  onFolderClick,
  onPageClick,
  onFolderUpdate,
  onPageUpdate,
  onFolderDelete,
  onPageDelete,
  onDrop
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const handleStartEdit = (item: NoteFolder | NotePage, name: string) => {
    setEditingId(item.id);
    setEditingName(name);
  };

  const handleSaveEdit = (item: NoteFolder | NotePage) => {
    if ('folderId' in item) {
      onPageUpdate({ ...item, title: editingName, updatedAt: new Date() });
    } else {
      onFolderUpdate({ ...item, name: editingName, updatedAt: new Date() });
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDragStart = (e: React.DragEvent, type: string, id: string) => {
    e.dataTransfer.setData('text/plain', `${type}:${id}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId) {
      onDrop(draggedId, targetFolderId);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        <AnimatePresence>
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors ${
                dragOverFolder === folder.id ? 'bg-accent border-primary' : ''
              }`}
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className="flex items-center gap-3 flex-1"
              >
                <Folder className="h-5 w-5 text-blue-500" />
                {editingId === folder.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveEdit(folder)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(folder);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="flex-1"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => onFolderClick(folder.id)}
                    className="flex-1 text-left font-medium hover:underline"
                  >
                    {folder.icon} {folder.name}
                  </button>
                )}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(folder.updatedAt), 'MMM d, yyyy')}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStartEdit(folder, folder.name)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onFolderDelete(folder.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
          
          {pages.map((page) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'page', page.id)}
                className="flex items-center gap-3 flex-1"
              >
                <FileText className="h-5 w-5 text-gray-500" />
                {editingId === page.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveEdit(page)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(page);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="flex-1"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => onPageClick(page.id)}
                    className="flex-1 text-left font-medium hover:underline"
                  >
                    {page.title}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  {page.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {page.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{page.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStartEdit(page, page.title)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onPageDelete(page.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {folders.map((folder) => (
          <motion.div
            key={folder.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer group ${
                dragOverFolder === folder.id ? 'ring-2 ring-primary bg-accent' : ''
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-2xl">{folder.icon}</span>
                      {editingId === folder.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleSaveEdit(folder)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(folder);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="text-sm"
                          autoFocus
                        />
                      ) : (
                        <CardTitle 
                          className="text-sm font-medium cursor-pointer truncate"
                          onClick={() => onFolderClick(folder.id)}
                          title={folder.name}
                        >
                          {folder.name}
                        </CardTitle>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStartEdit(folder, folder.name)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onFolderDelete(folder.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Modified {format(new Date(folder.updatedAt), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}

        {pages.map((page) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'page', page.id)}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      {editingId === page.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleSaveEdit(page)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(page);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="text-sm"
                          autoFocus
                        />
                      ) : (
                        <CardTitle 
                          className="text-sm font-medium cursor-pointer truncate"
                          onClick={() => onPageClick(page.id)}
                          title={page.title}
                        >
                          {page.title}
                        </CardTitle>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStartEdit(page, page.title)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onPageDelete(page.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {page.content.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FolderView;
