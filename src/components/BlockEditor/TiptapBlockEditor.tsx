
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TiptapBlockEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onInsertContent?: (callback: (content: string) => void) => void;
}

export const TiptapBlockEditor: React.FC<TiptapBlockEditorProps> = ({
  initialContent = '',
  onSave,
  title = 'Untitled',
  onTitleChange,
  onInsertContent
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your notes...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-6',
        'data-tiptap-editor': 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setIsSaving(true);
      
      const timeoutId = setTimeout(() => {
        if (onSave) {
          onSave(content);
        }
        setIsSaving(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    },
  });

  // Register insert content function
  useEffect(() => {
    if (onInsertContent && editor) {
      onInsertContent((content: string) => {
        const currentPos = editor.state.selection.anchor;
        editor.chain().focus().insertContentAt(currentPos, content).run();
      });
    }
  }, [onInsertContent, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const isActive = (name: string, attrs?: any) => {
    return editor.isActive(name, attrs);
  };

  const toggleFormat = (name: string, attrs?: any) => {
    if (name === 'heading') {
      editor.chain().focus().toggleHeading(attrs).run();
    } else if (name === 'bulletList') {
      editor.chain().focus().toggleBulletList().run();
    } else if (name === 'orderedList') {
      editor.chain().focus().toggleOrderedList().run();
    } else if (name === 'taskList') {
      editor.chain().focus().toggleTaskList().run();
    } else if (name === 'blockquote') {
      editor.chain().focus().toggleBlockquote().run();
    } else {
      // For marks like bold, italic, etc.
      editor.chain().focus().toggleMark(name).run();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Title */}
      <div className="mb-6">
        <Input
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className="text-3xl font-bold border-none bg-transparent p-0 focus-visible:ring-0"
          placeholder="Untitled"
        />
      </div>

      {/* Bubble Menu */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-1 p-2 bg-background border rounded-lg shadow-lg">
          <Button
            variant={isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('bold')}
          >
            <Bold size={14} />
          </Button>
          <Button
            variant={isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('italic')}
          >
            <Italic size={14} />
          </Button>
          <Button
            variant={isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('strike')}
          >
            <Strikethrough size={14} />
          </Button>
          <Button
            variant={isActive('code') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('code')}
          >
            <Code size={14} />
          </Button>
        </div>
      </BubbleMenu>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-4 border rounded-lg mb-4 bg-card">
        <div className="flex items-center gap-1">
          <Button
            variant={isActive('heading', { level: 1 }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFormat('heading', { level: 1 })}
          >
            <Heading1 size={16} />
          </Button>
          <Button
            variant={isActive('heading', { level: 2 }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFormat('heading', { level: 2 })}
          >
            <Heading2 size={16} />
          </Button>
          <Button
            variant={isActive('heading', { level: 3 }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFormat('heading', { level: 3 })}
          >
            <Heading3 size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-1">
          <Button
            variant={isActive('bulletList') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFormat('bulletList')}
          >
            <List size={16} />
          </Button>
          <Button
            variant={isActive('orderedList') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFormat('orderedList')}
          >
            <ListOrdered size={16} />
          </Button>
          <Button
            variant={isActive('taskList') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFormat('taskList')}
          >
            <CheckSquare size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        <Button
          variant={isActive('blockquote') ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleFormat('blockquote')}
        >
          <Quote size={16} />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {isSaving && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="border rounded-lg bg-card">
        <EditorContent 
          editor={editor} 
          className="min-h-[500px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-lg"
        />
      </div>
    </div>
  );
};
