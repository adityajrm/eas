
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Wand2, FileText, CheckSquare, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { callAINoteAPI } from '@/services/aiNoteService';
import { callGeminiAPI } from '@/services/aiService';
import { cn } from '@/lib/utils';

interface AISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: 'notes' | 'chat';
  onInsertContent?: (content: string) => void;
  currentContent?: string;
  currentView?: string;
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
  currentContent = '',
  currentView = 'dashboard'
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string; timestamp?: string }[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatHistory]);

  const addUserMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);
    return userMessage;
  };

  const addAssistantMessage = (content: string) => {
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, assistantMessage]);
    return assistantMessage;
  };

  const handleGenerate = async (action?: string) => {
    if (!prompt.trim() && !action) return;

    setIsGenerating(true);
    
    try {
      let finalPrompt = prompt;
      let context = '';

      if (mode === 'notes') {
        // Add user message immediately for notes mode
        if (!action) {
          addUserMessage(prompt);
        }
        
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

        const response = await callAINoteAPI(finalPrompt, context);

        if (onInsertContent) {
          onInsertContent(response.text);
          if (!action) {
            const truncatedText = response.text.substring(0, 100);
            const displayText = response.text.length > 100 ? `${truncatedText}...` : truncatedText;
            addAssistantMessage(`Content generated and inserted into your notes: "${displayText}"`);
          }
          toast({
            title: "Content Generated",
            description: "AI content has been inserted into your notes",
          });
        }
      } else {
        // Chat mode - add user message immediately
        const userMessage = addUserMessage(prompt);
        
        // Update conversation history for context
        const newConversationHistory = [
          ...conversationHistory,
          { role: 'user', content: prompt, timestamp: new Date().toISOString() }
        ];

        const response = await callGeminiAPI(prompt, newConversationHistory);
        
        // Add assistant response
        addAssistantMessage(response.text);
        
        // Update conversation history
        setConversationHistory([
          ...newConversationHistory,
          { role: 'assistant', content: response.text, timestamp: new Date().toISOString() }
        ]);
      }

      setPrompt('');
    } catch (error) {
      console.error('Error generating content:', error);
      addAssistantMessage('Sorry, I encountered an error while processing your request. Please check your AI configuration and try again.');
      toast({
        title: "Error",
        description: "Failed to generate content. Please check your AI configuration.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const notesActions = [
    { id: 'generate', label: 'Generate', icon: Wand2, description: 'Generate new content' },
    { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Create a brief summary' },
    { id: 'paraphrase', label: 'Paraphrase', icon: MessageCircle, description: 'Rephrase content' },
    { id: 'expand', label: 'Expand', icon: CheckSquare, description: 'Add more details' },
  ];

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 transition-all duration-300"
      >
        <ChevronLeft size={16} />
        AI Assistant
      </Button>
    );
  }

  return (
    <div className="w-80 bg-background border-l shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {mode === 'notes' ? 'Notes AI' : 'AI Assistant'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {mode === 'notes' ? (
          <>
            {/* Notes Mode Actions */}
            <div className="p-4 space-y-3 border-b">
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
            </div>
            
            {/* Notes Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm">
                    Ask me to help with your notes or use the quick actions above
                  </div>
                )}
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] p-3 rounded-lg text-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg text-sm max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            {/* Chat Mode */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm">
                    Ask me anything! I can help you create tasks, manage your workspace, and more.
                  </div>
                )}
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] p-3 rounded-lg text-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg text-sm max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Input Area */}
        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder={mode === 'notes' ? "Ask me to help with your notes..." : "Ask me anything..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={2}
              className="resize-none"
              disabled={isGenerating}
            />
            <Button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              size="sm"
              className="px-3"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
