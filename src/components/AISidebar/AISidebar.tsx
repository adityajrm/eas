
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Wand2, FileText, CheckSquare, ChevronLeft, ChevronRight, Send, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { callAINoteAPI } from '@/services/aiNoteService';
import { callGeminiAPI } from '@/services/aiService';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface AISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: 'notes' | 'chat';
  onInsertContent?: (content: string) => void;
  currentContent?: string;
  currentView?: string;
  selectedText?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasAddButton?: boolean;
}

interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

// Markdown processing function
const processMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li>$1. $2</li>');
};

export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onToggle,
  mode,
  onInsertContent,
  currentContent = '',
  currentView = 'dashboard',
  selectedText = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{
    role: string;
    content: string;
    timestamp?: string;
  }[]>([]);
  const [contextText, setContextText] = useState('');
  const {
    addTask,
    tasks
  } = useAppContext();
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

  // Update context when selected text changes (only for notes mode)
  useEffect(() => {
    if (selectedText && mode === 'notes') {
      setContextText(selectedText);
    }
  }, [selectedText, mode]);

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

  const addAssistantMessage = (content: string, hasAddButton: boolean = false) => {
    // Filter out command tokens from display
    const cleanContent = content
      .replace(/createTask\[.*?\](?::.*)?/g, '')
      .replace(/updateTask\[.*?\](?::.*)?/g, '')
      .replace(/deleteTask\[.*?\]/g, '')
      .replace(/createNote\[.*?\](?::.*)?/g, '')
      .replace(/updateNote\[.*?\](?::.*)?/g, '')
      .replace(/deleteNote\[.*?\]/g, '')
      .replace(/createEvent\[.*?\](?::.*)?/g, '')
      .replace(/updateEvent\[.*?\](?::.*)?/g, '')
      .replace(/deleteEvent\[.*?\]/g, '')
      .replace(/KB\{.*?\}/g, '')
      .trim();

    if (cleanContent) {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        hasAddButton
      };
      setChatHistory(prev => [...prev, assistantMessage]);
      return assistantMessage;
    }
  };

  const createTaskFromSuggestion = async (suggestion: TaskSuggestion) => {
    try {
      await addTask({
        title: suggestion.title,
        notes: suggestion.description,
        priority: suggestion.priority,
        dueDate: suggestion.dueDate ? new Date(suggestion.dueDate) : undefined,
        completed: false
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const parseTaskSuggestions = (text: string): TaskSuggestion[] => {
    const suggestions: TaskSuggestion[] = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^\d+\.\s+(.+)/)) {
        const title = line.replace(/^\d+\.\s+/, '');
        suggestions.push({
          title,
          description: '',
          priority: 'medium'
        });
      }
    }
    return suggestions;
  };

  // Process command tokens and auto-execute task creation
  const processCommandTokens = (text: string) => {
    const createTaskMatches = text.match(/createTask\[(.*?)\](?::(.*))?/g);
    if (createTaskMatches) {
      createTaskMatches.forEach(match => {
        const taskMatch = match.match(/createTask\[(.*?)\](?::(.*))?/);
        if (taskMatch) {
          const [, title, additionalInfo = ""] = taskMatch;
          const [priority = "medium", notes = "", dueDateStr = ""] = additionalInfo.split(':');
          const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
          
          createTaskFromSuggestion({
            title,
            description: notes,
            priority: priority as 'low' | 'medium' | 'high',
            dueDate: dueDateStr
          });
        }
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    addUserMessage(prompt);
    setIsGenerating(true);
    
    try {
      let response;
      if (mode === 'notes') {
        const context = contextText || currentContent;
        response = await callAINoteAPI(prompt, context);
        addAssistantMessage(response.text, true);
      } else {
        const isTaskRequest = /create|task|todo|remind|schedule|plan|update|modify|delete|complete/i.test(prompt);
        const newConversationHistory = [...conversationHistory, {
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString()
        }];

        let contextualPrompt = prompt;
        if (currentView === 'tasks') {
          const taskContext = `Current tasks: ${JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            completed: t.completed,
            notes: t.notes
          })))}`;
          contextualPrompt = `${taskContext}\n\nUser request: ${prompt}`;
        }

        if (isTaskRequest) {
          const taskPrompt = `Based on the user's request: "${contextualPrompt}", suggest 2-3 specific, actionable tasks. Format each task as a numbered list with clear, concise titles.`;
          response = await callGeminiAPI(taskPrompt, newConversationHistory);
          
          // Auto-process task creation tokens
          processCommandTokens(response.text);
          
          const suggestions = parseTaskSuggestions(response.text);
          addAssistantMessage(response.text);
        } else {
          response = await callGeminiAPI(contextualPrompt, newConversationHistory);
          addAssistantMessage(response.text);
        }

        setConversationHistory([...newConversationHistory, {
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString()
        }]);
      }
      setPrompt('');
    } catch (error) {
      console.error('Error generating content:', error);
      addAssistantMessage('Sorry, I encountered an error while processing your request. Please check your AI configuration and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToContent = (content: string) => {
    if (onInsertContent) {
      // Clean the content before inserting
      const cleanedContent = content
        .replace(/^(Sure,?\s*here\s*(is|are)\s*(the|your)?\s*.*?[:.]\s*)/i, '')
        .replace(/^(Here\s*(is|are)\s*(the|your)?\s*.*?[:.]\s*)/i, '')
        .replace(/^(I'll\s*.*?[:.]\s*)/i, '')
        .replace(/^(Let me\s*.*?[:.]\s*)/i, '')
        .trim();
      
      onInsertContent(cleanedContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const clearContext = () => {
    setContextText('');
  };

  const startNewChat = () => {
    setChatHistory([]);
    setConversationHistory([]);
    setPrompt('');
  };

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggle} 
          className="rounded-l-lg rounded-r-none border-r-0 shadow-lg bg-background hover:bg-accent transition-all duration-300 p-2"
        >
          <ChevronLeft size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 w-80 h-full bg-background border-l shadow-lg flex flex-col transition-all duration-300 ease-in-out z-40 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h2 className="text-lg font-semibold">
            {mode === 'notes' ? 'Notes AI' : 'AI Assistant'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={startNewChat}>
            <Plus size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Context Display for Notes */}
      {contextText && mode === 'notes' && (
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">Selected Text:</p>
            <Button variant="ghost" size="sm" onClick={clearContext} className="h-6 w-6 p-0">
              <Trash2 size={12} />
            </Button>
          </div>
          <ScrollArea className="h-20 bg-background p-2 rounded border">
            <p className="text-sm">{contextText}</p>
          </ScrollArea>
        </div>
      )}

      {/* Task Context for Tasks View */}
      {currentView === 'tasks' && (
        <div className="p-4 border-b bg-muted/20">
          <p className="text-xs text-muted-foreground font-medium mb-2">Current Tasks:</p>
          <ScrollArea className="h-32 bg-background p-2 rounded border">
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks available</p>
              ) : (
                tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="text-sm">
                    <span className={cn("font-medium", task.completed && "line-through")}>
                      {task.title}
                    </span>
                    <span className={cn(
                      "ml-2 text-xs px-1 rounded",
                      task.priority === 'high' && "bg-red-100 text-red-700",
                      task.priority === 'medium' && "bg-yellow-100 text-yellow-700",
                      task.priority === 'low' && "bg-green-100 text-green-700"
                    )}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
              {tasks.length > 5 && (
                <p className="text-xs text-muted-foreground">+ {tasks.length - 5} more tasks</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              {mode === 'notes' 
                ? 'Select text in your editor or start typing to get AI assistance with your notes.' 
                : 'Start a conversation! I can help you create tasks, answer questions, and more.'
              }
            </div>
          )}
          
          {chatHistory.map(message => (
            <div key={message.id} className="space-y-2">
              <div className={cn(
                "flex", 
                message.role === 'user' ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[85%] p-3 rounded-lg text-sm",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                    : "bg-muted rounded-bl-sm"
                )}>
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: processMarkdown(message.content) }}
                  />
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {/* Add to Content Button for Notes Mode */}
              {message.role === 'assistant' && message.hasAddButton && mode === 'notes' && onInsertContent && (
                <div className="flex justify-start">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddToContent(message.content)} 
                    className="ml-0"
                  >
                    <Plus size={14} className="mr-1" />
                    Add to Content
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg text-sm max-w-[85%] rounded-bl-sm">
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

      {/* Input Area */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder={mode === 'notes' ? "Ask about your notes or request editing help..." : "Type your message..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={2}
            className="resize-none"
            disabled={isGenerating}
          />
          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || isGenerating} 
            size="sm" 
            className="px-3"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
