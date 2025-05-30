
import React, { useState, useEffect, useRef } from 'react';
import { Type, List, ListOrdered, CheckSquare, ChevronRight, Quote, Code, Lightbulb, Minus } from 'lucide-react';
import { SlashCommand, BlockType } from '@/types/blocks';
import { cn } from '@/lib/utils';

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

const commands: SlashCommand[] = [
  { id: 'text', label: 'Text', description: 'Just start typing with plain text', type: 'text', icon: 'text' },
  { id: 'h1', label: 'Heading 1', description: 'Big section heading', type: 'heading1', icon: 'h1' },
  { id: 'h2', label: 'Heading 2', description: 'Medium section heading', type: 'heading2', icon: 'h2' },
  { id: 'h3', label: 'Heading 3', description: 'Small section heading', type: 'heading3', icon: 'h3' },
  { id: 'bullet', label: 'Bulleted List', description: 'Create a simple bulleted list', type: 'bulletList', icon: 'bullet' },
  { id: 'numbered', label: 'Numbered List', description: 'Create a list with numbering', type: 'numberedList', icon: 'numbered' },
  { id: 'todo', label: 'To-do List', description: 'Track tasks with a to-do list', type: 'todo', icon: 'todo' },
  { id: 'toggle', label: 'Toggle List', description: 'Toggles can hide and show content inside', type: 'toggle', icon: 'toggle' },
  { id: 'quote', label: 'Quote', description: 'Capture a quote', type: 'quote', icon: 'quote' },
  { id: 'code', label: 'Code', description: 'Capture a code snippet', type: 'code', icon: 'code' },
  { id: 'callout', label: 'Callout', description: 'Make writing stand out', type: 'callout', icon: 'callout' },
  { id: 'divider', label: 'Divider', description: 'Visually divide blocks', type: 'divider', icon: 'divider' },
];

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  position,
  onSelect,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(commands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedIndex, onSelect, onClose]);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'h1': return <Type size={16} className="font-bold" />;
      case 'h2': return <Type size={16} />;
      case 'h3': return <Type size={14} />;
      case 'bullet': return <List size={16} />;
      case 'numbered': return <ListOrdered size={16} />;
      case 'todo': return <CheckSquare size={16} />;
      case 'toggle': return <ChevronRight size={16} />;
      case 'quote': return <Quote size={16} />;
      case 'code': return <Code size={16} />;
      case 'callout': return <Lightbulb size={16} />;
      case 'divider': return <Minus size={16} />;
      default: return <Type size={16} />;
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-2 w-80 max-h-80 overflow-y-auto"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <div className="text-xs text-muted-foreground p-2 border-b">
        Basic blocks
      </div>
      <div className="space-y-1 mt-2">
        {commands.map((command, index) => (
          <div
            key={command.id}
            className={cn(
              "flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors",
              index === selectedIndex 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-accent"
            )}
            onClick={() => onSelect(command)}
          >
            <div className="mt-0.5">
              {getIcon(command.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{command.label}</div>
              <div className={cn(
                "text-xs",
                index === selectedIndex 
                  ? "text-primary-foreground/80" 
                  : "text-muted-foreground"
              )}>
                {command.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
