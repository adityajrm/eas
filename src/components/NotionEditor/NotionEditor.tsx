
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Bold, Italic, Underline, Strikethrough, Type, List, ListOrdered, Table, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { NotionItem } from '@/types/notion';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
      className="fixed z-50 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-1 animate-fade-in"
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
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Save selection to prevent cursor jumping
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  // Restore selection
  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  }, [savedSelection]);

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
      if (e.key === '\\' && contentRef.current?.contains(e.target as Node)) {
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
      // Restore selection first
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        // Apply formatting only to selected text
        document.execCommand(command, false);
        
        // Clear selection to prevent formatting from continuing
        selection.removeAllRanges();
        setShowToolbar(false);
        
        // Update content state
        setContent(contentRef.current.innerHTML);
      }
    }
  };

  const insertElement = (type: string) => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Ensure we're inserting inside the content area
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
        element.className = 'border-collapse border border-gray-300 my-4 w-full max-w-full';
        const tbody = document.createElement('tbody');
        for (let i = 0; i < 2; i++) {
          const row = document.createElement('tr');
          for (let j = 0; j < 3; j++) {
            const cell = document.createElement('td');
            cell.className = 'border border-gray-300 p-2 min-w-[100px] outline-none';
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

    // Insert the element
    range.deleteContents();
    range.insertNode(element);
    
    // Move cursor after the inserted element
    range.setStartAfter(element);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update content
    setContent(contentRef.current.innerHTML);
  };

  const typewriterEffect = async (text: string) => {
    if (!savedSelection || !contentRef.current) return;

    setIsTyping(true);
    
    try {
      // Restore the saved selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        const range = savedSelection;
        
        // If there's selected text, delete it first
        if (selectedText) {
          range.deleteContents();
        }
        
        // Create a text node for the new content
        const textNode = document.createTextNode('');
        range.insertNode(textNode);
        
        // Animate typing effect
        for (let i = 0; i < text.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          textNode.textContent += text[i];
        }
        
        // Position cursor at the end
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update content state
        setContent(contentRef.current.innerHTML);
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
      // Simulate AI response - replace with actual AI service call
      const response = await new Promise<string>((resolve) => {
        setTimeout(() => {
          const prompts = {
            "shorten": "Shortened version of the content.",
            "expand": "This is an expanded version with more details and context.",
            "professional": "This content has been rewritten in a professional tone.",
            "summary": "Key points: Professional summary of the main ideas."
          };
          
          const key = Object.keys(prompts).find(k => aiPrompt.toLowerCase().includes(k)) || "expand";
          resolve(prompts[key as keyof typeof prompts]);
        }, 1000);
      });

      await typewriterEffect(response);

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

  const handleContentChange = () => {
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        <Button variant="outline" onClick={onCancel} size={isMobile ? "sm" : "default"}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-lg font-semibold border-none shadow-none focus-visible:ring-0"
          placeholder="Untitled"
        />
        
        <Button onClick={handleSave} disabled={isTyping} size={isMobile ? "sm" : "default"}>
          <Save size={16} className="mr-2" />
          Save
        </Button>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-card overflow-x-auto">
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
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div
            ref={contentRef}
            contentEditable
            className="min-h-full p-6 focus:outline-none prose prose-lg max-w-none bg-card rounded-lg border shadow-sm"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={handleContentChange}
            onFocus={saveSelection}
            onBlur={saveSelection}
            style={{ minHeight: 'calc(100vh - 300px)' }}
          />
        </div>
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
