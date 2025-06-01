
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Plus, Save, FileDown, FileUp, Wand2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Block, BlockType, SlashCommand } from '@/types/blocks';
import { BlockComponent } from './BlockComponent';
import { SlashCommandMenu } from './SlashCommandMenu';
import { exportToMarkdown, importFromMarkdown } from '@/utils/blockUtils';
import { callAINoteAPI } from '@/services/aiNoteService';

interface BlockEditorProps {
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialBlocks = [],
  onSave,
  title = 'Untitled',
  onTitleChange,
  onBack
}) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const blocksRef = useRef<Block[]>(initialBlocks);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with a default block if empty
  useEffect(() => {
    if (blocks.length === 0) {
      const defaultBlock: Block = {
        id: `block-${Date.now()}`,
        type: 'text',
        content: '',
      };
      setBlocks([defaultBlock]);
      setFocusedBlockId(defaultBlock.id);
    }
  }, []);

  // Silent auto-save without affecting UI state
  useEffect(() => {
    blocksRef.current = blocks;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (onSave && blocks.length > 0) {
        onSave(blocksRef.current);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [blocks, onSave]);

  const createBlock = (type: BlockType = 'text', content: string = ''): Block => ({
    id: `block-${Date.now()}-${Math.random()}`,
    type,
    content,
    checked: type === 'todo' ? false : undefined,
    collapsed: type === 'toggle' ? false : undefined,
    calloutType: type === 'callout' ? 'info' : undefined,
  });

  const handleBlockContentChange = useCallback((blockId: string, content: string, checked?: boolean) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content, ...(checked !== undefined && { checked }) }
        : block
    ));
  }, []);

  const handleBlockTypeChange = useCallback((blockId: string, type: BlockType) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, type, ...(type === 'todo' && { checked: false }) }
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
      const newBlocks = prev.filter(block => block.id !== blockId);
      if (newBlocks.length === 0) {
        const defaultBlock = createBlock();
        setFocusedBlockId(defaultBlock.id);
        return [defaultBlock];
      }
      return newBlocks;
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent, blockId: string, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddBlock(index);
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '' && blocks.length > 1) {
        e.preventDefault();
        handleDeleteBlock(blockId);
        if (index > 0) {
          setFocusedBlockId(blocks[index - 1].id);
        }
      }
    } else if (e.key === '/' && blocks.find(b => b.id === blockId)?.content === '') {
      e.preventDefault();
      setShowSlashMenu(true);
      setSlashMenuBlockId(blockId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setSlashMenuPosition({ x: rect.left, y: rect.bottom });
    }
  }, [blocks, handleAddBlock, handleDeleteBlock]);

  const handleSlashCommand = useCallback((command: SlashCommand) => {
    if (slashMenuBlockId) {
      handleBlockTypeChange(slashMenuBlockId, command.type);
      setFocusedBlockId(slashMenuBlockId);
    }
    setShowSlashMenu(false);
    setSlashMenuBlockId(null);
  }, [slashMenuBlockId, handleBlockTypeChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(block => block.id === active.id);
        const newIndex = prev.findIndex(block => block.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleAIGenerate = async (blockId?: string, context?: string) => {
    setTargetBlockId(blockId || null);
    setAiContext(context || selectedText || '');
    setShowAIDialog(true);
  };

  const generateAIContent = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await callAINoteAPI(aiPrompt, aiContext);
      
      if (response.text) {
        if (targetBlockId) {
          await typewriterEffect(targetBlockId, response.text);
        } else {
          const newBlock = createBlock('text', '');
          setBlocks(prev => [...prev, newBlock]);
          await typewriterEffect(newBlock.id, response.text);
        }
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setIsGenerating(false);
      setShowAIDialog(false);
      setAiPrompt('');
      setAiContext('');
      setSelectedText('');
      setTargetBlockId(null);
    }
  };

  const typewriterEffect = async (blockId: string, text: string) => {
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      setBlocks(prev => prev.map(block => 
        block.id === blockId 
          ? { ...block, content: currentText }
          : block
      ));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const handleExport = () => {
    const markdown = exportToMarkdown(blocks);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
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
      };
      reader.readAsText(file);
    }
  };

  // Handle text selection for AI generation
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString());
      } else {
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header matching BlockEditorPage structure */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Notes</span>
              </Button>
            )}
            
            <div className="flex-1 max-w-md mx-4">
              <Input
                value={title}
                onChange={(e) => onTitleChange?.(e.target.value)}
                className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0"
                placeholder="Untitled"
              />
            </div>

            <div className="flex items-center gap-2">
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="hidden sm:inline">Generating...</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAIGenerate()}
                className="flex items-center gap-2"
              >
                <Wand2 size={16} />
                <span className="hidden sm:inline">AI Generate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <FileDown size={16} />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <label>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2"
                >
                  <span>
                    <FileUp size={16} />
                    <span className="hidden sm:inline">Import</span>
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, index) => (
                <BlockComponent
                  key={block.id}
                  block={block}
                  index={index}
                  onContentChange={handleBlockContentChange}
                  onTypeChange={handleBlockTypeChange}
                  onAddBlock={handleAddBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onKeyDown={handleKeyDown}
                  onAIGenerate={handleAIGenerate}
                  focused={focusedBlockId === block.id}
                  onFocus={() => setFocusedBlockId(block.id)}
                  selectedText={selectedText}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add Block Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddBlock(blocks.length - 1)}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Plus size={16} className="mr-2" />
            Add a block
          </Button>
        </div>
      </div>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        isOpen={showSlashMenu}
        position={slashMenuPosition}
        onSelect={handleSlashCommand}
        onClose={() => {
          setShowSlashMenu(false);
          setSlashMenuBlockId(null);
        }}
      />

      {/* AI Generate Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>AI Generate Content</DialogTitle>
            <DialogDescription>
              Describe what you want to generate and AI will create content for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {aiContext && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Context:</p>
                <p className="text-sm">{aiContext}</p>
              </div>
            )}
            <Textarea
              placeholder="Describe what you want to generate... (e.g., 'Write a summary about renewable energy', 'Create a to-do list for project planning')"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                Cancel
              </Button>
              <Button onClick={generateAIContent} disabled={!aiPrompt.trim() || isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
