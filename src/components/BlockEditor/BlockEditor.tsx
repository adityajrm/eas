
import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save, FileDown, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TiptapBlockEditor } from './TiptapBlockEditor';

interface BlockEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialContent = '',
  onSave,
  title = 'Untitled',
  onTitleChange,
  onBack
}) => {
  const [content, setContent] = useState(initialContent);
  const [insertContentCallback, setInsertContentCallback] = useState<((content: string) => void) | null>(null);
  const { toast } = useToast();

  const handleSave = useCallback((newContent: string) => {
    setContent(newContent);
    if (onSave) {
      onSave(newContent);
    }
  }, [onSave]);

  const handleInsertContent = useCallback((callback: (content: string) => void) => {
    setInsertContentCallback(() => callback);
  }, []);

  const handleAIInsert = useCallback((aiContent: string) => {
    if (insertContentCallback) {
      insertContentCallback(aiContent);
    }
  }, [insertContentCallback]);

  const handleExport = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${title}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setContent(content);
        if (onSave) {
          onSave(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm sticky top-0 z-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
              )}
              <h1 className="text-lg font-semibold">Notes Editor</h1>
            </div>
            
            <div className="flex items-center gap-2">
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
                  accept=".html,.txt,.md"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <Button
                onClick={() => onSave?.(content)}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TiptapBlockEditor
          initialContent={content}
          onSave={handleSave}
          title={title}
          onTitleChange={onTitleChange}
          onInsertContent={handleInsertContent}
        />
      </div>
    </div>
  );
};
