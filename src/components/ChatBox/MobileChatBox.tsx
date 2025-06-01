import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { callGeminiAPI } from '@/services/aiService';
import { useAppContext } from '@/context/AppContext';
import { SpeechRecognition } from '@/types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface MobileChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileChatBox: React.FC<MobileChatBoxProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your AI assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    notes,
    addNote,
    updateNote,
    deleteNote,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    knowledgeItems,
    addKnowledgeItem,
    refreshEvents,
  } = useAppContext();

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, messages]);

  const initRecognition = () => {
    if (!recognitionRef.current) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        toast({
          title: 'Voice Input Not Supported',
          description: 'Your browser does not support speech recognition.',
          variant: 'destructive',
        });
        return false;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: 'Voice Input Error',
          description: `Error: ${event.error}`,
          variant: 'destructive',
        });
      };

      recognitionRef.current = recognition;
    }
    return true;
  };

  const toggleListening = () => {
    if (!isListening) {
      const initialized = initRecognition();
      if (initialized && recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processCommandLine = (line: string) => {
    const COMMAND_PATTERNS = {
      CREATE_TASK: /^createTask\[(.*?)\](?::(.*))?$/,
      CREATE_NOTE: /^createNote\[(.*?)\](?::(.*))?$/,
      CREATE_EVENT: /^createEvent\[(.*?)\](?::(.*))?$/,
      UPDATE_TASK: /^updateTask\[(.*?)\](?::(.*))?$/,
      UPDATE_NOTE: /^updateNote\[(.*?)\](?::(.*))?$/,
      UPDATE_EVENT: /^updateEvent\[(.*?)\](?::(.*))?$/,
      DELETE_TASK: /^deleteTask\[(.*?)\]$/,
      DELETE_NOTE: /^deleteNote\[(.*?)\]$/,
      DELETE_EVENT: /^deleteEvent\[(.*?)\]$/,
      ADD_KB: /^KB\{(.*?):(.*?)\}$/,
    };

    // Logic for parsing commands (similar to original ChatBox)
    const createTaskMatch = line.match(COMMAND_PATTERNS.CREATE_TASK);
    if (createTaskMatch) {
      const [, title, additionalInfo = ""] = createTaskMatch;
      const [priority = "medium", notes = "", dueDateStr = ""] = additionalInfo.split(':');
      const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
      return {
        text: `I'll create a task: "${title}"`,
        actionType: 'createTask',
        actionData: {
          title,
          priority,
          notes,
          completed: false,
          dueDate,
        },
      };
    }

    // Other command parsing logic...
    // ...existing code...
  };

  const executeSingleAction = (actionType: string, actionData: any) => {
    switch (actionType) {
      case 'createTask':
        addTask({
          title: actionData.title,
          priority: actionData.priority || 'medium',
          completed: false,
          notes: actionData.notes,
          dueDate: actionData.dueDate ? new Date(actionData.dueDate) : undefined,
        });
        toast({
          title: 'Task Created',
          description: `Created task: "${actionData.title}"`,
        });
        break;
      case 'createNote':
        addNote({
          title: actionData.title,
          content: actionData.content,
          tags: actionData.tags || [],
        });
        toast({
          title: 'Note Created',
          description: `Created note: "${actionData.title}"`,
        });
        break;
      case 'createEvent':
        const validatedStart = new Date(actionData.start);
        const validatedEnd = new Date(actionData.end);
        addEvent({
          title: actionData.title,
          start: validatedStart,
          end: validatedEnd,
          notes: actionData.notes,
          category: actionData.category,
        });
        toast({
          title: 'Event Created',
          description: `Created event: "${actionData.title}"`,
        });
        refreshEvents();
        break;
      case 'addKnowledgeItem':
        addKnowledgeItem({
          title: actionData.title,
          content: actionData.content,
          category: actionData.category,
          tags: actionData.tags,
        });
        toast({
          title: 'Knowledge Added',
          description: `Added to knowledge base: "${actionData.title}"`,
        });
        break;
      // Other cases for update/delete actions
      // ...existing code...
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await callGeminiAPI(inputValue, updatedMessages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })));

      const commandLines = aiResponse.text.split('\n').filter((line) => line.trim().length > 0);
      let processed = false;
      for (const line of commandLines) {
        const commandResult = processCommandLine(line);
        if (commandResult.actionType) {
          executeSingleAction(commandResult.actionType, commandResult.actionData);
          processed = true;
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: processed ? "I've processed your request." : aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error communicating with AI:', error);
      toast({
        title: 'AI Error',
        description: 'There was a problem with the AI service.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b text-white flex items-center justify-between bg-assistant-primary">
            <h3 className="font-medium">AI Assistant</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-primary-foreground/20"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user' ? 'bg-primary text-white' : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2 bg-background/90">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border-primary/30 focus-visible:ring-primary/30"
              disabled={isLoading || isListening}
            />
            <Button
              type="button"
              size="icon"
              onClick={toggleListening}
              className={`h-10 w-10 ${isListening ? 'bg-red-500' : 'bg-assistant-primary'}`}
            >
              {isListening ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white" />}
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="h-10 w-10 bg-assistant-primary"
            >
              <Send size={18} className="text-white" />
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileChatBox;
