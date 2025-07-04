import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Strikethrough, Type, List, ListOrdered, Table, Save, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { NotionItem } from '@/types/notion';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { callAINoteAPI } from '@/services/aiNoteService';

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
  const isMobile = useIsMobile();
  
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-1 animate-fade-in"
      style={{ 
        top: Math.max(10, position.top), 
        left: isMobile ? Math.max(10, Math.min(position.left, window.innerWidth - 250)) : Math.max(10, position.left)
      }}
    >
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onFormat('bold')} className="h-8 w-8 p-0">
          <Bold size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onFormat('italic')} className="h-8 w-8 p-0">
          <Italic size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onFormat('underline')} className="h-8 w-8 p-0">
          <Underline size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onFormat('strikethrough')} className="h-8 w-8 p-0">
          <Strikethrough size={14} />
        </Button>
      </div>
      <div className="w-px h-4 bg-border mx-1" />
      <Button variant="ghost" size="sm" onClick={onAIGenerate} className="text-blue-600 text-xs px-2 h-8">
        AI Generate
      </Button>
    </div>
  );
};

const NotionEditor: React.FC<NotionEditorProps> = ({ item, onSave, onCancel }) => {
  const [title, setTitle] = useState(item.title);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const undoStack: string[] = [];
  const redoStack: string[] = [];

  // Function to convert markdown headings and lists to basic HTML
  const formatContent = (text: string): string => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold my-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium my-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<ul><li class="ml-4 list-disc">$1</li></ul>')
      .replace(/\n\n/g, '<br /><br />');
  };

  // Initialize content only once
  useEffect(() => {
    if (contentRef.current && !contentRef.current.innerHTML.trim()) {
      contentRef.current.innerHTML = formatContent(item.content || '<p>Start typing...</p>');
    }
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  }, [savedSelection]);

  const saveToUndoStack = () => {
    if (contentRef.current) {
      undoStack.push(contentRef.current.innerHTML);
      if (undoStack.length > 50) undoStack.shift(); // Limit stack size
    }
  };

  const undoChange = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack.pop();
      if (lastState && contentRef.current) {
        redoStack.push(contentRef.current.innerHTML);
        contentRef.current.innerHTML = lastState;
      }
    }
  };

  const redoChange = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      if (nextState && contentRef.current) {
        undoStack.push(contentRef.current.innerHTML);
        contentRef.current.innerHTML = nextState;
      }
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && contentRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(selection.toString());
        setToolbarPosition({
          top: rect.top + window.scrollY - 60,
          left: rect.left + window.scrollX + (rect.width / 2) - 100
        });
        setShowToolbar(true);
        saveSelection();
      } else {
        setShowToolbar(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redoChange();
          } else {
            undoChange();
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const tabNode = document.createTextNode('\t');
          range.insertNode(tabNode);
          range.setStartAfter(tabNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else if (e.key === '\\' && contentRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setToolbarPosition({
            top: rect.top + window.scrollY - 60,
            left: rect.left + window.scrollX
          });
          setSelectedText('');
          setShowAIDialog(true);
          saveSelection();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveSelection]);

  const formatText = (command: string) => {
    if (savedSelection && contentRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        document.execCommand(command, false);
        
        selection.removeAllRanges();
        setShowToolbar(false);
      }
    }
  };

  const insertElement = (type: string) => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    let element: HTMLElement;
    
    switch (type) {
      case 'h1':
        element = document.createElement('h1');
        element.className = 'text-3xl font-bold my-4 outline-none';
        element.textContent = 'Heading 1';
        element.contentEditable = 'true';
        break;
      case 'h2':
        element = document.createElement('h2');
        element.className = 'text-2xl font-semibold my-3 outline-none';
        element.textContent = 'Heading 2';
        element.contentEditable = 'true';
        break;
      case 'h3':
        element = document.createElement('h3');
        element.className = 'text-xl font-medium my-2 outline-none';
        element.textContent = 'Heading 3';
        element.contentEditable = 'true';
        break;
      case 'ul':
        element = document.createElement('ul');
        element.className = 'list-disc list-inside my-2';
        const li = document.createElement('li');
        li.textContent = 'List item';
        li.contentEditable = 'true';
        li.className = 'outline-none';
        element.appendChild(li);
        break;
      case 'ol':
        element = document.createElement('ol');
        element.className = 'list-decimal list-inside my-2';
        const oli = document.createElement('li');
        oli.textContent = 'List item';
        oli.contentEditable = 'true';
        oli.className = 'outline-none';
        element.appendChild(oli);
        break;
      case 'table':
        element = document.createElement('table');
        element.className = 'border-collapse border border-gray-300 my-4 w-full max-w-full resize';
        element.style.resize = 'both';
        element.style.overflow = 'auto';
        element.style.minWidth = '300px';
        element.style.minHeight = '100px';
        
        const tbody = document.createElement('tbody');
        for (let i = 0; i < 2; i++) {
          const row = document.createElement('tr');
          for (let j = 0; j < 3; j++) {
            const cell = document.createElement('td');
            cell.className = 'border border-gray-300 p-2 min-w-[100px] outline-none resize';
            cell.contentEditable = 'true';
            cell.textContent = `Cell ${i + 1}-${j + 1}`;
            cell.style.resize = 'both';
            cell.style.overflow = 'auto';
            row.appendChild(cell);
          }
          tbody.appendChild(row);
        }
        element.appendChild(tbody);
        break;
      default:
        return;
    }

    range.deleteContents();
    range.insertNode(element);
    
    range.setStartAfter(element);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const typewriterEffect = async (text: string) => {
    if (!savedSelection || !contentRef.current) return;

    setIsTyping(true);
    
    try {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        const range = savedSelection;
        
        if (selectedText) {
          range.deleteContents();
        }
        
        const textNode = document.createTextNode('');
        range.insertNode(textNode);
        
        for (let i = 0; i < text.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          textNode.textContent += text[i];
        }
        
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error('Error in typewriter effect:', error);
      toast({
        title: "Error",
        description: "Failed to insert generated content",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    try {
      const contextMessage = selectedText 
        ? `Please process this text according to the request: "${selectedText}"\n\nRequest: ${aiPrompt}`
        : `Please generate content based on this request: ${aiPrompt}`;

      const response = await callAINoteAPI(aiPrompt, selectedText);

      if (response.text) {
        await typewriterEffect(response.text);
        
        setShowAIDialog(false);
        setAiPrompt('');
        setSelectedText('');
        
        toast({
          title: "AI Content Generated",
          description: "Content has been generated and inserted",
        });
      } else {
        throw new Error('No response from AI Note service');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI content. Please check your AI configuration in Settings.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    const updatedItem: NotionItem = {
      ...item,
      title,
      content: contentRef.current?.innerHTML || '',
      updated_at: new Date(),
    };
    onSave(updatedItem);
  };

  const handleContentChange = () => {
    saveToUndoStack();
    if (contentRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0).cloneRange(); // Save current selection

      contentRef.current.innerHTML = formatContent(contentRef.current.innerText);

      if (range) {
        selection?.removeAllRanges();
        selection?.addRange(range); // Restore selection
      }
    }
  };

  useEffect(() => {
    const handleFormattingShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            formatText('bold');
            break;
          case 'i':
            e.preventDefault();
            formatText('italic');
            break;
          case 'u':
            e.preventDefault();
            formatText('underline');
            break;
          case 's':
            e.preventDefault();
            formatText('strikethrough');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleFormattingShortcut);

    return () => {
      document.removeEventListener('keydown', handleFormattingShortcut);
    };
  }, [formatText]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-bold border border-muted rounded-md px-2 py-1 w-full md:w-auto"
          placeholder="Untitled"
        />
        <Button onClick={handleSave} disabled={isTyping} className="flex items-center gap-2">
          <Save size={16} />
          <span>Save</span>
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="flex flex-wrap items-center gap-4 p-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center"
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Home size={16} />
          </Button>
        </div>
        <div className="flex-1 flex items-center gap-1 px-3 py-2 bg-muted rounded-md text-sm min-w-0">
          <span className="text-muted-foreground flex-shrink-0">Editing</span>
          <span className="text-muted-foreground flex-shrink-0">/</span>
          <span className="truncate">{title}</span>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-6 border-b bg-card overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>
        <div className="w-px h-4 bg-border mx-2" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => insertElement('ul')}>
            <List size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => insertElement('ol')}>
            <ListOrdered size={16} />
          </Button>
        </div>
        <div className="w-px h-4 bg-border mx-2" />
        <Button variant="outline" size="sm" onClick={() => insertElement('table')}>
          <Table size={16} />
        </Button>
      </div>

      {/* Content Editor */}
        <div className="max-w-4xl mx-auto">
          <div
            ref={contentRef}
            contentEditable
            className="min-h-full p-8 focus:outline-none prose prose-lg max-w-none bg-card rounded-lg border shadow-sm"
            onInput={handleContentChange}
            onFocus={saveSelection}
            onBlur={saveSelection}
            style={{ minHeight: 'calc(100vh - 300px)' }}
            suppressContentEditableWarning={true}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Generate Content</DialogTitle>
            <DialogDescription>
              Enter a prompt to generate content with AI
            </DialogDescription>
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
