
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Bold, Italic, Underline, Strikethrough, List, Sparkles } from 'lucide-react';
import { NotePage, NotesBreadcrumb } from '@/types/notes';
import AiNoteGen from './AiNoteGen';

interface PageEditorProps {
  page: NotePage;
  onUpdate: (page: NotePage) => void;
  onBack: () => void;
  breadcrumbs: NotesBreadcrumb[];
  onBreadcrumbClick: (crumb: NotesBreadcrumb) => void;
}

const PageEditor: React.FC<PageEditorProps> = ({
  page,
  onUpdate,
  onBack,
  breadcrumbs,
  onBreadcrumbClick
}) => {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showAiCompletion, setShowAiCompletion] = useState(false);
  const [aiCompletionPosition, setAiCompletionPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const hasChanges = title !== page.title || content !== page.content;
    setHasUnsavedChanges(hasChanges);
  }, [title, content, page]);

  const handleSave = () => {
    const updatedPage: NotePage = {
      ...page,
      title,
      content,
      updatedAt: new Date()
    };
    onUpdate(updatedPage);
    setHasUnsavedChanges(false);
  };

  const handleTextSelection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selected = content.substring(start, end);
      setSelectedText(selected);
      setSelectionRange({ start, end });
      
      // Calculate toolbar position
      const rect = textarea.getBoundingClientRect();
      const textBeforeSelection = content.substring(0, start);
      const lines = textBeforeSelection.split('\n').length;
      const lineHeight = 24; // Approximate line height
      
      setToolbarPosition({
        x: rect.left + 20,
        y: rect.top + (lines * lineHeight) - 50
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '\\') {
      e.preventDefault();
      if (!textareaRef.current) return;
      
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      setCursorPosition(cursorPos);
      
      // Calculate AI completion position
      const rect = textarea.getBoundingClientRect();
      const textBeforeCursor = content.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n').length;
      const lineHeight = 24;
      
      setAiCompletionPosition({
        x: rect.left + 20,
        y: rect.top + (lines * lineHeight) + 30
      });
      setShowAiCompletion(true);
    }
  };

  const applyTextFormat = (format: string) => {
    if (!textareaRef.current || !selectionRange) return;
    
    const { start, end } = selectionRange;
    const beforeText = content.substring(0, start);
    const selectedText = content.substring(start, end);
    const afterText = content.substring(end);
    
    let formattedText = selectedText;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
    }
    
    const newContent = beforeText + formattedText + afterText;
    setContent(newContent);
    setShowToolbar(false);
  };

  const handleAiCompletion = (generatedContent: string, isReplacement: boolean = false) => {
    if (isReplacement && selectionRange) {
      // Replace selected text with typewriter animation
      const { start, end } = selectionRange;
      const beforeText = content.substring(0, start);
      const afterText = content.substring(end);
      
      // Simulate typewriter effect
      animateTypewriter(beforeText, generatedContent, afterText);
    } else {
      // Insert at cursor position with typewriter animation
      const beforeText = content.substring(0, cursorPosition);
      const afterText = content.substring(cursorPosition);
      
      animateTypewriter(beforeText, generatedContent, afterText);
    }
    setShowAiCompletion(false);
    setShowToolbar(false);
  };

  const animateTypewriter = (beforeText: string, newText: string, afterText: string) => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= newText.length) {
        const currentText = beforeText + newText.substring(0, currentIndex) + afterText;
        setContent(currentText);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30); // Adjust speed as needed
  };

  const renderBreadcrumbs = () => {
    const maxWords = 2;
    return breadcrumbs.map((crumb, index) => {
      let displayName = crumb.name;
      const words = crumb.name.split(' ');
      if (words.length > maxWords) {
        displayName = words.slice(0, maxWords).join(' ') + '...';
      }
      
      return (
        <div key={crumb.id} className="flex items-center gap-2">
          <button
            onClick={() => onBreadcrumbClick(crumb)}
            className="hover:text-foreground transition-colors truncate max-w-[100px]"
            title={crumb.name}
          >
            {displayName}
          </button>
          {index < breadcrumbs.length - 1 && <span>/</span>}
        </div>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {renderBreadcrumbs()}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            )}
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-3xl font-bold border-none px-0 py-2 h-auto resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* Content Editor */}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleTextSelection}
            onKeyDown={handleKeyDown}
            placeholder="Start writing... Press '\' for AI completion"
            className="min-h-[500px] resize-none border-none px-0 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed"
          />
        </div>
      </div>

      {/* Text Selection Toolbar */}
      {showToolbar && (
        <div
          className="fixed bg-background border rounded-md shadow-lg p-2 flex gap-1 z-50"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y
          }}
        >
          <Button size="sm" variant="ghost" onClick={() => applyTextFormat('bold')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyTextFormat('italic')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyTextFormat('underline')}>
            <Underline className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyTextFormat('strikethrough')}>
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyTextFormat('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              setShowToolbar(false);
              setShowAiCompletion(true);
              setAiCompletionPosition(toolbarPosition);
            }}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* AI Completion */}
      {showAiCompletion && (
        <AiNoteGen
          isOpen={showAiCompletion}
          onClose={() => setShowAiCompletion(false)}
          onComplete={handleAiCompletion}
          position={aiCompletionPosition}
          selectedText={selectedText}
          context={content}
        />
      )}
    </div>
  );
};

export default PageEditor;
