
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
import { Plus, Save, FileDown, FileUp, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Block, BlockType } from '@/types/blocks';
import { BlockComponent } from './BlockComponent';
import { SlashCommandMenu } from './SlashCommandMenu';
import { exportToMarkdown, importFromMarkdown } from '@/utils/blockUtils';
import { callAINoteAPI } from '@/services/aiNoteService';

interface BlockEditorProps {
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialBlocks = [],
  onSave,
  title = 'Untitled',
  onTitleChange
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
  const lastSaveRef = useRef<string>('');
  const { toast } = useToast();

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

  // Auto-save with debouncing and duplicate prevention
  useEffect(() => {
    const currentState = JSON.stringify(blocks);
    if (currentState !== lastSaveRef.current && blocks.length > 0) {
      const timeoutId = setTimeout(() => {
        if (onSave) {
          onSave(blocks);
          lastSaveRef.current = currentState;
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
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

  const handleSlashCommand = useCallback((type: BlockType) => {
    if (slashMenuBlockId) {
      handleBlockTypeChange(slashMenuBlockId, type);
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
      const contextMessage = aiContext 
        ? `Context: "${aiContext}"\n\nPrompt: ${aiPrompt}`
        : aiPrompt;

      const response = await callAINoteAPI(aiPrompt, aiContext);
      
      if (response.text) {
        if (targetBlockId) {
          // Replace content in existing block with typewriter effect
          await typewriterEffect(targetBlockId, response.text);
        } else {
          // Create new block with generated content
          const newBlock = createBlock('text', '');
          setBlocks(prev => [...prev, newBlock]);
          await typewriterEffect(newBlock.id, response.text);
        }
        
        toast({
          title: "AI Content Generated",
          description: "Content has been generated successfully",
        });
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI content. Please check your AI configuration.",
        variant: "destructive",
      });
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="text-3xl font-bold border-none bg-transparent p-0 focus-visible:ring-0"
            placeholder="Untitled"
          />
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Generating...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIGenerate()}
            className="flex items-center gap-2"
          >
            <Wand2 size={16} />
            AI Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <FileDown size={16} />
            Export
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
                Import
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

      {/* Editor */}
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
        <DialogContent className="max-w-md">
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
