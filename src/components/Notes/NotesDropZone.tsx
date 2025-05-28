
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface NotesDropZoneProps {
  onItemMove?: (itemId: string, itemType: 'page' | 'folder', targetFolderId: string) => void;
}

const NotesDropZone: React.FC<NotesDropZoneProps> = ({ onItemMove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show drop zone when cursor is near the right edge
      const showZone = e.clientX > window.innerWidth - 100;
      setIsVisible(showZone);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('text/plain')) {
        setIsVisible(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only hide if leaving the entire window
      if (e.clientX <= 0 || e.clientX >= window.innerWidth || 
          e.clientY <= 0 || e.clientY >= window.innerHeight) {
        setIsDragOver(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const data = e.dataTransfer.getData('text/plain');
    console.log('Item dropped in drop zone:', data);
    
    if (data) {
      const [type, id] = data.split(':');
      if (type && id && onItemMove) {
        // For now, move to root folder
        onItemMove(id, type as 'page' | 'folder', 'root');
        toast({
          title: "Item Moved",
          description: `${type === 'page' ? 'Page' : 'Folder'} moved successfully.`
        });
      } else {
        toast({
          title: "Move Feature",
          description: "Drag and drop functionality is ready for implementation."
        });
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50"
        >
          <Card
            className={`w-24 h-32 flex flex-col items-center justify-center border-dashed transition-colors ${
              isDragOver 
                ? 'bg-primary/20 border-primary' 
                : 'bg-primary/10 border-primary/20'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FolderOpen className={`h-8 w-8 mb-2 transition-colors ${
              isDragOver ? 'text-primary' : 'text-primary/70'
            }`} />
            <span className={`text-xs text-center transition-colors ${
              isDragOver ? 'text-primary' : 'text-primary/70'
            }`}>
              Drop to move
            </span>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotesDropZone;
