
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Search, Plus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Block, BlockType, SlashCommand } from '@/types/blocks';
import { BlockComponent } from './BlockComponent';
import { SlashCommandMenu } from './SlashCommandMenu';
import { createBlock, exportToMarkdown, importFromMarkdown } from '@/utils/blockUtils';

interface BlockEditorProps {
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialBlocks = [],
  onSave,
  title = '',
  onTitleChange
}) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks.length > 0 ? initialBlocks : [createBlock('text')]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const handleBlockChange = useCallback((blockId: string, newContent: string, newChecked?: boolean) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content: newContent, ...(newChecked !== undefined && { checked: newChecked }) }
        : block
    ));
  }, []);

  const handleBlockTypeChange = useCallback((blockId: string, newType: BlockType) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, type: newType }
        : block
    ));
  }, []);

  const handleAddBlock = useCallback((index: number, type: BlockType = 'text') => {
    const newBlock = createBlock(type);
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    setFocusedBlockId(newBlock.id);
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const filtered = prev.filter(block => block.id !== blockId);
      return filtered.length === 0 ? [createBlock('text')] : filtered;
    });
  }, []);

  const handleSlashCommand = useCallback((command: SlashCommand) => {
    if (activeBlockId) {
      handleBlockTypeChange(activeBlockId, command.type);
      setShowSlashMenu(false);
      setActiveBlockId(null);
    }
  }, [activeBlockId, handleBlockTypeChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent, blockId: string, blockIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddBlock(blockIndex);
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '' && blocks.length > 1) {
        e.preventDefault();
        handleDeleteBlock(blockId);
        // Focus previous block
        if (blockIndex > 0) {
          const prevBlock = blocks[blockIndex - 1];
          setFocusedBlockId(prevBlock.id);
        }
      }
    } else if (e.key === '/' && e.target instanceof HTMLElement) {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        setSlashMenuPosition({ x: rect.left, y: rect.bottom });
        setShowSlashMenu(true);
        setActiveBlockId(blockId);
      }
    }
  }, [blocks, handleAddBlock, handleDeleteBlock]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setBlocks(blocks => {
        const oldIndex = blocks.findIndex(block => block.id === active.id);
        const newIndex = blocks.findIndex(block => block.id === over.id);
        
        return arrayMove(blocks, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onSave?.(blocks);
    toast({
      title: "Saved",
      description: "Your notes have been saved successfully",
    });
  };

  const handleExport = () => {
    const markdown = exportToMarkdown(blocks);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'notes'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importedBlocks = importFromMarkdown(content);
        setBlocks(importedBlocks);
        toast({
          title: "Imported",
          description: "Notes imported successfully",
        });
      };
      reader.readAsText(file);
    }
  };

  const filteredBlocks = searchQuery 
    ? blocks.filter(block => 
        block.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blocks;

  // Auto-save every 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onSave?.(blocks);
    }, 2000);
    return () => clearTimeout(timer);
  }, [blocks, onSave]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="text-3xl font-bold border-none shadow-none px-0 py-2 bg-transparent focus-visible:ring-0"
          placeholder="Untitled"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} size="sm" variant="outline">
            Save
          </Button>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline" asChild>
            <label htmlFor="import-file" className="cursor-pointer flex items-center">
              <Upload size={16} className="mr-2" />
              Import
            </label>
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".md,.txt"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          className="pl-10"
          placeholder="Search blocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Editor */}
      <div 
        ref={editorRef}
        className="min-h-[600px] space-y-2 relative"
        onClick={(e) => {
          if (e.target === editorRef.current) {
            handleAddBlock(blocks.length - 1);
          }
        }}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredBlocks.map(block => block.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredBlocks.map((block, index) => (
              <BlockComponent
                key={block.id}
                block={block}
                index={index}
                onContentChange={handleBlockChange}
                onTypeChange={handleBlockTypeChange}
                onAddBlock={handleAddBlock}
                onDeleteBlock={handleDeleteBlock}
                onKeyDown={handleKeyDown}
                focused={focusedBlockId === block.id}
                onFocus={() => setFocusedBlockId(block.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Block Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4 text-muted-foreground hover:text-foreground"
          onClick={() => handleAddBlock(blocks.length - 1)}
        >
          <Plus size={16} className="mr-2" />
          Add a block
        </Button>
      </div>

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <SlashCommandMenu
          position={slashMenuPosition}
          onSelect={handleSlashCommand}
          onClose={() => {
            setShowSlashMenu(false);
            setActiveBlockId(null);
          }}
        />
      )}
    </div>
  );
};
