
import React, { useRef, useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, CheckSquare, Square, Lightbulb, AlertTriangle, AlertCircle, CheckCircle, Wand2 } from 'lucide-react';
import { Block, BlockType } from '@/types/blocks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlockComponentProps {
  block: Block;
  index: number;
  onContentChange: (blockId: string, content: string, checked?: boolean) => void;
  onTypeChange: (blockId: string, type: BlockType) => void;
  onAddBlock: (index: number, type?: BlockType) => void;
  onDeleteBlock: (blockId: string) => void;
  onKeyDown: (e: KeyboardEvent, blockId: string, index: number) => void;
  onAIGenerate: (blockId: string, context?: string) => void;
  focused: boolean;
  onFocus: () => void;
  selectedText: string;
}

export const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  index,
  onContentChange,
  onTypeChange,
  onAddBlock,
  onDeleteBlock,
  onKeyDown,
  onAIGenerate,
  focused,
  onFocus,
  selectedText
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const contentRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showAIButton, setShowAIButton] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (focused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [focused]);

  // Show AI button when there's selected text
  useEffect(() => {
    setShowAIButton(!!selectedText);
  }, [selectedText]);

  const handleContentChange = () => {
    if (contentRef.current) {
      onContentChange(block.id, contentRef.current.innerText || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown(e.nativeEvent, block.id, index);
  };

  const handleCheckboxToggle = () => {
    onContentChange(block.id, block.content, !block.checked);
  };

  const handleToggleCollapse = () => {
    onContentChange(block.id, block.content);
  };

  const handleAIClick = () => {
    onAIGenerate(block.id, selectedText);
  };

  const renderBlockContent = () => {
    const baseClasses = "w-full min-h-[1.5rem] outline-none resize-none border-none bg-transparent focus:ring-0 focus:outline-none";
    
    switch (block.type) {
      case 'heading1':
        return (
          <div
            ref={contentRef}
            contentEditable
            className={cn(baseClasses, "text-3xl font-bold py-2")}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      case 'heading2':
        return (
          <div
            ref={contentRef}
            contentEditable
            className={cn(baseClasses, "text-2xl font-semibold py-2")}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      case 'heading3':
        return (
          <div
            ref={contentRef}
            contentEditable
            className={cn(baseClasses, "text-xl font-medium py-1")}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      case 'bulletList':
        return (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground mt-2">•</span>
            <div
              ref={contentRef}
              contentEditable
              className={cn(baseClasses, "flex-1")}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
      
      case 'numberedList':
        return (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground mt-2">{index + 1}.</span>
            <div
              ref={contentRef}
              contentEditable
              className={cn(baseClasses, "flex-1")}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
      
      case 'todo':
        return (
          <div className="flex items-start gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 mt-1"
              onClick={handleCheckboxToggle}
            >
              {block.checked ? (
                <CheckSquare size={16} className="text-primary" />
              ) : (
                <Square size={16} className="text-muted-foreground" />
              )}
            </Button>
            <div
              ref={contentRef}
              contentEditable
              className={cn(baseClasses, "flex-1", block.checked && "line-through text-muted-foreground")}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
      
      case 'toggle':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-6 w-6 mt-1"
                onClick={handleToggleCollapse}
              >
                {block.collapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Button>
              <div
                ref={contentRef}
                contentEditable
                className={cn(baseClasses, "flex-1 font-medium")}
                onInput={handleContentChange}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                suppressContentEditableWarning={true}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            {!block.collapsed && block.children && (
              <div className="ml-8 space-y-2">
                {/* Render nested blocks here */}
              </div>
            )}
          </div>
        );
      
      case 'quote':
        return (
          <div className="border-l-4 border-primary pl-4 italic">
            <div
              ref={contentRef}
              contentEditable
              className={baseClasses}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
      
      case 'code':
        return (
          <div className="bg-muted rounded-md p-4 font-mono text-sm">
            <div
              ref={contentRef}
              contentEditable
              className={cn(baseClasses, "whitespace-pre-wrap")}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
      
      case 'callout':
        const calloutIcons = {
          info: <Lightbulb size={16} className="text-blue-500" />,
          warning: <AlertTriangle size={16} className="text-yellow-500" />,
          error: <AlertCircle size={16} className="text-red-500" />,
          success: <CheckCircle size={16} className="text-green-500" />
        };
        
        const calloutColors = {
          info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
          warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
          error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
          success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
        };
        
        return (
          <div className={cn("border rounded-md p-4", calloutColors[block.calloutType || 'info'])}>
            <div className="flex items-start gap-2">
              {calloutIcons[block.calloutType || 'info']}
              <div
                ref={contentRef}
                contentEditable
                className={cn(baseClasses, "flex-1")}
                onInput={handleContentChange}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                suppressContentEditableWarning={true}
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          </div>
        );
      
      case 'divider':
        return <hr className="border-border my-4" />;
      
      default:
        return (
          <div className="relative">
            <div
              ref={contentRef}
              contentEditable
              className={baseClasses}
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
            {!block.content && (
              <div className="absolute top-0 left-0 pointer-events-none text-muted-foreground">
                Type '/' for commands
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md transition-all duration-200 p-2",
        isHovered && "bg-accent/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-1 flex-shrink-0",
            isDragging && "opacity-100"
          )}
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
        
        {/* Block Content */}
        <div className="flex-1 min-w-0">
          {renderBlockContent()}
        </div>

        {/* AI Generate Button */}
        {(isHovered || showAIButton) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAIClick}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-xs flex items-center gap-1"
          >
            <Wand2 size={12} />
            AI
          </Button>
        )}
      </div>
    </div>
  );
};
