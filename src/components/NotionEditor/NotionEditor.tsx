
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bold, Italic, Underline, Strikethrough, Type, List, ListOrdered, Table, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { NotionItem } from '@/types/notion';
import { useToast } from '@/hooks/use-toast';

interface NotionEditorProps {
  item: NotionItem;
  onSave: (item: NotionItem) => void;
  onCancel: () => void;
}

interface SelectionToolbarProps {
  visible: boolean;
  position: { top: number; left: number };
  onFormat: (command: string) => void;
  onAIGenerate: () => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ visible, position, onFormat, onAIGenerate }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-1"
      style={{ top: position.top, left: position.left }}
    >
      <Button variant="ghost" size="sm" onClick={() => onFormat('bold')}>
        <Bold size={14} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormat('italic')}>
        <Italic size={14} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormat('underline')}>
        <Underline size={14} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormat('strikethrough')}>
        <Strikethrough size={14} />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <Button variant="ghost" size="sm" onClick={onAIGenerate} className="text-blue-600">
        AI Generate
      </Button>
    </div>
  );
};

const NotionEditor: React.FC<NotionEditorProps> = ({ item, onSave, onCancel }) => {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content || '');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && contentRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(selection.toString());
        setToolbarPosition({
          top: rect.top - 60,
          left: rect.left + (rect.width / 2) - 100
        });
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '\\' && contentRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setToolbarPosition({
            top: rect.top - 60,
            left: rect.left
          });
          setShowAIDialog(true);
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatText = (command: string) => {
    document.execCommand(command, false);
    setShowToolbar(false);
  };

  const insertElement = (type: string) => {
    const selection = window.getSelection();
    if (!selection || !contentRef.current) return;

    let element: HTMLElement;
    
    switch (type) {
      case 'h1':
        element = document.createElement('h1');
        element.className = 'text-3xl font-bold my-4';
        element.textContent = 'Heading 1';
        break;
      case 'h2':
        element = document.createElement('h2');
        element.className = 'text-2xl font-semibold my-3';
        element.textContent = 'Heading 2';
        break;
      case 'h3':
        element = document.createElement('h3');
        element.className = 'text-xl font-medium my-2';
        element.textContent = 'Heading 3';
        break;
      case 'ul':
        element = document.createElement('ul');
        element.className = 'list-disc list-inside my-2';
        const li = document.createElement('li');
        li.textContent = 'List item';
        element.appendChild(li);
        break;
      case 'ol':
        element = document.createElement('ol');
        element.className = 'list-decimal list-inside my-2';
        const oli = document.createElement('li');
        oli.textContent = 'List item';
        element.appendChild(oli);
        break;
      case 'table':
        element = document.createElement('table');
        element.className = 'border-collapse border border-gray-300 my-4';
        const tbody = document.createElement('tbody');
        for (let i = 0; i < 2; i++) {
          const row = document.createElement('tr');
          for (let j = 0; j < 3; j++) {
            const cell = document.createElement('td');
            cell.className = 'border border-gray-300 p-2 min-w-[100px]';
            cell.contentEditable = 'true';
            cell.textContent = `Cell ${i + 1}-${j + 1}`;
            row.appendChild(cell);
          }
          tbody.appendChild(row);
        }
        element.appendChild(tbody);
        break;
      default:
        return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(element);
    
    // Move cursor after the inserted element
    range.setStartAfter(element);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const typewriterEffect = async (text: string, targetElement: Node) => {
    setIsTyping(true);
    const selection = window.getSelection();
    if (!selection) return;

    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30)); // Typing speed
      const range = selection.getRangeAt(0);
      range.insertNode(document.createTextNode(text[i]));
      range.setStartAfter(range.endContainer);
      range.collapse(true);
    }
    setIsTyping(false);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    try {
      // Simulate AI response - replace with actual AI service call
      const response = await new Promise<string>(resolve => {
        setTimeout(() => {
          resolve(`Generated content based on prompt: "${aiPrompt}"`);
        }, 1000);
      });

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        if (selectedText) {
          // Replace selected text
          range.deleteContents();
        }
        
        await typewriterEffect(response, range.startContainer);
      }

      setShowAIDialog(false);
      setAiPrompt('');
      setSelectedText('');
      
      toast({
        title: "AI Content Generated",
        description: "Content has been generated and inserted",
      });
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI content",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    const updatedItem: NotionItem = {
      ...item,
      title,
      content: contentRef.current?.innerHTML || content,
      updated_at: new Date(),
    };
    onSave(updatedItem);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-lg font-semibold border-none shadow-none"
          placeholder="Untitled"
        />
        
        <Button onClick={handleSave} disabled={isTyping}>
          <Save size={16} className="mr-2" />
          Save
        </Button>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-card">
        <Button variant="outline" size="sm" onClick={() => insertElement('h1')}>
          <Type size={16} className="mr-1" />
          H1
        </Button>
        <Button variant="outline" size="sm" onClick={() => insertElement('h2')}>
          <Type size={16} className="mr-1" />
          H2
        </Button>
        <Button variant="outline" size="sm" onClick={() => insertElement('h3')}>
          <Type size={16} className="mr-1" />
          H3
        </Button>
        <div className="w-px h-4 bg-border mx-2" />
        <Button variant="outline" size="sm" onClick={() => insertElement('ul')}>
          <List size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => insertElement('ol')}>
          <ListOrdered size={16} />
        </Button>
        <div className="w-px h-4 bg-border mx-2" />
        <Button variant="outline" size="sm" onClick={() => insertElement('table')}>
          <Table size={16} />
        </Button>
      </div>

      {/* Content Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <div
          ref={contentRef}
          contentEditable
          className="min-h-full p-4 focus:outline-none prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>

      {/* Selection Toolbar */}
      <SelectionToolbar
        visible={showToolbar}
        position={toolbarPosition}
        onFormat={formatText}
        onAIGenerate={() => setShowAIDialog(true)}
      />

      {/* AI Generate Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Generate Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedText && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
                <p className="text-sm">{selectedText}</p>
              </div>
            )}
            <Textarea
              placeholder="Enter your prompt (e.g., 'make this shorter', 'expand this idea', 'rewrite professionally')"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAIGenerate} disabled={!aiPrompt.trim()}>
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotionEditor;
