
import React, { useState } from 'react';
import { X, MessageCircle, Wand2, FileText, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { callAINoteAPI } from '@/services/aiNoteService';
import { cn } from '@/lib/utils';

interface AISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: 'notes' | 'chat';
  onInsertContent?: (content: string) => void;
  currentContent?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onToggle,
  mode,
  onInsertContent,
  currentContent = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const handleGenerate = async (action?: string) => {
    if (!prompt.trim() && !action) return;

    setIsGenerating(true);
    try {
      let finalPrompt = prompt;
      let context = '';

      if (mode === 'notes' && action) {
        context = currentContent;
        switch (action) {
          case 'generate':
            finalPrompt = prompt || 'Generate content based on the current notes';
            break;
          case 'summarize':
            finalPrompt = 'Create a brief summary of the following content';
            break;
          case 'paraphrase':
            finalPrompt = 'Paraphrase and rephrase the following content to improve clarity';
            break;
          case 'expand':
            finalPrompt = 'Expand and elaborate on the following content with more details';
            break;
        }
      }

      const response = await callAINoteAPI(finalPrompt, context);

      if (mode === 'notes' && onInsertContent) {
        onInsertContent(response.text);
        toast({
          title: "Content Generated",
          description: "AI content has been inserted into your notes",
        });
      } else {
        // Chat mode
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: prompt,
          timestamp: new Date()
        };

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date()
        };

        setChatHistory(prev => [...prev, userMessage, assistantMessage]);
      }

      setPrompt('');
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please check your AI configuration.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const notesActions = [
    { id: 'generate', label: 'Generate', icon: Wand2, description: 'Generate new content' },
    { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Create a brief summary' },
    { id: 'paraphrase', label: 'Paraphrase', icon: MessageCircle, description: 'Rephrase content' },
    { id: 'expand', label: 'Expand', icon: CheckSquare, description: 'Add more details' },
  ];

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={cn(
          "fixed top-4 right-4 z-50 transition-all duration-300",
          isOpen && "right-80"
        )}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        AI Assistant
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-background border-l shadow-lg transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {mode === 'notes' ? 'Notes AI' : 'AI Assistant'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X size={16} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {mode === 'notes' ? (
              <>
                {/* Notes Mode Actions */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {notesActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerate(action.id)}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-1 h-auto py-3"
                      >
                        <action.icon size={16} />
                        <span className="text-xs">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Prompt</label>
                    <Textarea
                      placeholder="Describe what you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={() => handleGenerate('generate')}
                      disabled={!prompt.trim() || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Chat Mode */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatHistory.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "p-3 rounded-lg max-w-[90%]",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t space-y-2">
                  <Textarea
                    placeholder="Ask me anything..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    rows={3}
                  />
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? 'Thinking...' : 'Send'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};
