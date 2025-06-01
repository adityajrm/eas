import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, X } from 'lucide-react';
import { Send, MessageCircle, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { getAiConfig } from '@/config/aiConfig';
import { callGeminiAPI } from '@/services/aiService';
import { SpeechRecognition } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "Hi there! I'm your AI assistant. How can I help you organize your workspace today?",
    sender: 'ai',
    timestamp: new Date()
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
    refreshEvents
  } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Set up speech recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, messages]);

  // Helper function to validate and parse dates
  const parseDate = (dateStr: string): Date | null => {
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  // Set up a default time (9:00 AM) for events if only a date is provided
  const setDefaultTimeForDate = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(9, 0, 0, 0); // Set to 9:00 AM
    return newDate;
  };

  // Process multiple AI actions if the response contains multiple commands
  const processAiAction = (actionType: string, actionData: any) => {
    try {
      // If we're dealing with multiple command lines
      if (actionType === 'createTask' && actionData.commandLines) {
        actionData.commandLines.forEach((line: string) => {
          // Process each command line separately
          const response = processCommandLine(line);
          if (response.actionType) {
            executeSingleAction(response.actionType, response.actionData);
          }
        });
        return;
      }

      // Otherwise process a single action
      executeSingleAction(actionType, actionData);
    } catch (error) {
      console.error("Error processing AI action:", error);
      toast({
        title: "Action Error",
        description: `Failed to process the requested action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Process a single command line
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
      ADD_KB: /^KB\{(.*?):(.*?)\}$/
    };

    // Check for createEvent command
    const createEventMatch = line.match(COMMAND_PATTERNS.CREATE_EVENT);
    if (createEventMatch) {
      const [, title, additionalInfo = ""] = createEventMatch;
      
      // Improved parsing logic for event creation
      let parts = additionalInfo.split(':');
      
      // Extract start date from the first part
      const startDateStr = parts.shift() || "";
      let start = parseDate(startDateStr);
      
      // Extract end date from the next part if available
      const endDateStr = parts.shift() || "";
      let end = parseDate(endDateStr);
      
      // Extract category from the next part if available
      const category = parts.shift() || "General";
      
      // The rest is combined as notes
      const notes = parts.join(':');
      
      // Use default times if date parsing failed
      if (!start) start = new Date();
      // If only hour data is missing, set a default time
      if (start && start.getHours() === 0 && start.getMinutes() === 0) {
        start = setDefaultTimeForDate(start);
      }
      
      // Default end time is 1 hour after start
      if (!end) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      } else if (end.getHours() === 0 && end.getMinutes() === 0) {
        // If end date is provided but no time, make it end of day
        end.setHours(17, 0, 0, 0); // 5:00 PM
      }

      return {
        text: `I'll create an event: "${title}"`,
        actionType: 'createEvent',
        actionData: {
          title,
          start,
          end,
          category,
          notes
        }
      };
    }

    // Check for createTask command
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
          dueDate
        }
      };
    }

    // Check for createNote command
    const createNoteMatch = line.match(COMMAND_PATTERNS.CREATE_NOTE);
    if (createNoteMatch) {
      const [, title, additionalInfo = ""] = createNoteMatch;
      const [content = "", tagString = ""] = additionalInfo.split(':');
      const tags = tagString.split(',').filter(tag => tag.trim().length > 0);
      return {
        text: `I'll create a note: "${title}"`,
        actionType: 'createNote',
        actionData: {
          title,
          content,
          tags
        }
      };
    }

    // Check for KB addition command
    const addKbMatch = line.match(COMMAND_PATTERNS.ADD_KB);
    if (addKbMatch) {
      const [, content, tag = "general"] = addKbMatch;
      return {
        text: `I'll add this to your knowledge base`,
        actionType: 'addKnowledgeItem',
        actionData: {
          title: `Knowledge: ${content.substring(0, 30)}...`,
          content: content,
          category: "Personal",
          tags: [tag]
        }
      };
    }

    // Check for updateTask command
    const updateTaskMatch = line.match(COMMAND_PATTERNS.UPDATE_TASK);
    if (updateTaskMatch) {
      const [, taskId, additionalInfo = ""] = updateTaskMatch;
      const [newTitle = "", newPriority = "", newNotes = "", completedStr = "", dueDateStr = ""] = additionalInfo.split(':');
      const completed = completedStr.toLowerCase() === 'true';
      const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
      return {
        text: `I'll update task "${taskId}"`,
        actionType: 'updateTask',
        actionData: {
          id: taskId,
          title: newTitle,
          priority: newPriority,
          notes: newNotes,
          completed,
          dueDate
        }
      };
    }

    // Check for updateNote command
    const updateNoteMatch = line.match(COMMAND_PATTERNS.UPDATE_NOTE);
    if (updateNoteMatch) {
      const [, noteId, additionalInfo = ""] = updateNoteMatch;
      const [newTitle = "", newContent = "", tagString = ""] = additionalInfo.split(':');
      const tags = tagString.split(',').filter(tag => tag.trim().length > 0);
      return {
        text: `I'll update note "${noteId}"`,
        actionType: 'updateNote',
        actionData: {
          id: noteId,
          title: newTitle,
          content: newContent,
          tags
        }
      };
    }

    // Check for updateEvent command
    const updateEventMatch = line.match(COMMAND_PATTERNS.UPDATE_EVENT);
    if (updateEventMatch) {
      const [, eventId, additionalInfo = ""] = updateEventMatch;
      const [newTitle = "", startDateStr = "", endDateStr = "", newNotes = "", newCategory = ""] = additionalInfo.split(':');
      const start = startDateStr ? new Date(startDateStr) : undefined;
      const end = endDateStr ? new Date(endDateStr) : undefined;
      return {
        text: `I'll update event "${eventId}"`,
        actionType: 'updateEvent',
        actionData: {
          id: eventId,
          title: newTitle,
          start,
          end,
          notes: newNotes,
          category: newCategory
        }
      };
    }

    // Check for delete commands
    const deleteTaskMatch = line.match(COMMAND_PATTERNS.DELETE_TASK);
    if (deleteTaskMatch) {
      return {
        text: `I'll delete task "${deleteTaskMatch[1]}"`,
        actionType: 'deleteTask',
        actionData: {
          id: deleteTaskMatch[1]
        }
      };
    }
    const deleteNoteMatch = line.match(COMMAND_PATTERNS.DELETE_NOTE);
    if (deleteNoteMatch) {
      return {
        text: `I'll delete note "${deleteNoteMatch[1]}"`,
        actionType: 'deleteNote',
        actionData: {
          id: deleteNoteMatch[1]
        }
      };
    }
    const deleteEventMatch = line.match(COMMAND_PATTERNS.DELETE_EVENT);
    if (deleteEventMatch) {
      return {
        text: `I'll delete event "${deleteEventMatch[1]}"`,
        actionType: 'deleteEvent',
        actionData: {
          id: deleteEventMatch[1]
        }
      };
    }
    return {
      text: line
    }; // Return the original line if no patterns match
  };

  // Execute a single action (create, update, delete)
  const executeSingleAction = (actionType: string, actionData: any) => {
    switch (actionType) {
      case 'createTask':
        addTask({
          title: actionData.title,
          priority: actionData.priority || 'medium',
          completed: false,
          notes: actionData.notes,
          dueDate: actionData.dueDate ? new Date(actionData.dueDate) : undefined
        });
        toast({
          title: "Task Created",
          description: `Created task: "${actionData.title}"`
        });
        break;
      case 'createNote':
        addNote({
          title: actionData.title,
          content: actionData.content,
          tags: actionData.tags || []
        });
        toast({
          title: "Note Created",
          description: `Created note: "${actionData.title}"`
        });
        break;
      case 'createEvent':
        const validatedStart = parseDate(actionData.start) || new Date();
        const validatedEnd = parseDate(actionData.end) || new Date(validatedStart.getTime() + 60 * 60 * 1000);
        addEvent({
          title: actionData.title,
          start: validatedStart,
          end: validatedEnd,
          notes: actionData.notes,
          category: actionData.category
        });
        toast({
          title: "Event Created",
          description: `Created event: "${actionData.title}"`
        });
        // Refresh events after creating
        refreshEvents();
        break;
      case 'addKnowledgeItem':
        addKnowledgeItem({
          title: actionData.title,
          content: actionData.content,
          category: actionData.category,
          tags: actionData.tags
        });
        toast({
          title: "Knowledge Added",
          description: `Added to knowledge base: "${actionData.title}"`
        });
        break;
      case 'updateTask':
        const taskToUpdate = tasks.find(t => t.id === actionData.id);
        if (taskToUpdate) {
          updateTask({
            ...taskToUpdate,
            title: actionData.title || taskToUpdate.title,
            priority: actionData.priority || taskToUpdate.priority,
            notes: actionData.notes !== undefined ? actionData.notes : taskToUpdate.notes,
            completed: actionData.completed !== undefined ? actionData.completed : taskToUpdate.completed,
            dueDate: actionData.dueDate ? new Date(actionData.dueDate) : taskToUpdate.dueDate
          });
          toast({
            title: "Task Updated",
            description: `Updated task: "${taskToUpdate.title}"`
          });
        } else {
          toast({
            title: "Task Not Found",
            description: `Could not find task with ID: ${actionData.id}`,
            variant: "destructive"
          });
        }
        break;
      case 'updateNote':
        const noteToUpdate = notes.find(n => n.id === actionData.id);
        if (noteToUpdate) {
          updateNote({
            ...noteToUpdate,
            title: actionData.title || noteToUpdate.title,
            content: actionData.content || noteToUpdate.content,
            tags: actionData.tags || noteToUpdate.tags,
            updatedAt: new Date()
          });
          toast({
            title: "Note Updated",
            description: `Updated note: "${noteToUpdate.title}"`
          });
        } else {
          toast({
            title: "Note Not Found",
            description: `Could not find note with ID: ${actionData.id}`,
            variant: "destructive"
          });
        }
        break;
      case 'updateEvent':
        const eventToUpdate = events.find(e => e.id === actionData.id);
        if (eventToUpdate) {
          updateEvent({
            ...eventToUpdate,
            title: actionData.title || eventToUpdate.title,
            start: actionData.start ? new Date(actionData.start) : eventToUpdate.start,
            end: actionData.end ? new Date(actionData.end) : eventToUpdate.end,
            notes: actionData.notes !== undefined ? actionData.notes : eventToUpdate.notes,
            category: actionData.category || eventToUpdate.category
          });
          toast({
            title: "Event Updated",
            description: `Updated event: "${eventToUpdate.title}"`
          });
          // Refresh events after updating
          refreshEvents();
        } else {
          toast({
            title: "Event Not Found",
            description: `Could not find event with ID: ${actionData.id}`,
            variant: "destructive"
          });
        }
        break;
      case 'deleteTask':
        deleteTask(actionData.id);
        toast({
          title: "Task Deleted",
          description: `Deleted task with ID: ${actionData.id}`
        });
        break;
      case 'deleteNote':
        deleteNote(actionData.id);
        toast({
          title: "Note Deleted",
          description: `Deleted note with ID: ${actionData.id}`
        });
        break;
      case 'deleteEvent':
        deleteEvent(actionData.id);
        toast({
          title: "Event Deleted",
          description: `Deleted event with ID: ${actionData.id}`
        });
        // Refresh events after deleting
        refreshEvents();
        break;
      default:
        console.warn("Unknown action type:", actionType);
    }
  };

  // Generate a friendly response instead of showing the raw command
  const generateFriendlyResponse = (actionType: string, actionData: any): string => {
    // For batch operations with multiple command lines
    if (actionType === 'createTask' && actionData.commandLines && actionData.commandLines.length > 0) {
      return "I've added those items to your workspace!";
    }
    switch (actionType) {
      case 'createTask':
        return `I've added the task "${actionData.title}" to your list${actionData.priority ? ` with ${actionData.priority} priority` : ''}.`;
      case 'createNote':
        return `I've created a note titled "${actionData.title}" for you.`;
      case 'createEvent':
        return `I've scheduled "${actionData.title}" on your calendar.`;
      case 'addKnowledgeItem':
        return `I've added that information to your knowledge base.`;
      case 'updateTask':
        return `I've updated the task as requested.`;
      case 'updateNote':
        return `I've updated your note.`;
      case 'updateEvent':
        return `I've updated the event on your calendar.`;
      case 'deleteTask':
        return `I've removed that task from your list.`;
      case 'deleteNote':
        return `I've deleted the note as requested.`;
      case 'deleteEvent':
        return `I've removed that event from your calendar.`;
      default:
        return "I've processed your request.";
    }
  };

  // Initialize speech recognition
  const initRecognition = () => {
    if (!recognitionRef.current) {
      // Check if browser supports SpeechRecognition
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        toast({
          title: "Voice Input Not Supported",
          description: "Your browser does not support speech recognition.",
          variant: "destructive"
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
          title: "Voice Input Error",
          description: `Error: ${event.error}`,
          variant: "destructive"
        });
      };
      
      recognitionRef.current = recognition;
    }
    return true;
  };
  
  // Toggle speech recognition
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      toast({
        title: "AI API Key Missing",
        description: "Please add your Gemini API key in the Settings page.",
        variant: "destructive"
      });
      return;
    }
    if (!aiConfig.enabled) {
      toast({
        title: "AI Assistant Disabled",
        description: "Please enable the AI assistant in the Settings page.",
        variant: "destructive"
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    try {
      const workspaceContext = {
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          priority: t.priority,
          dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString().split('T')[0] : null // Safely handle dueDate
        })),
        notes: notes.map(n => ({
          id: n.id,
          title: n.title,
          tags: n.tags
        })),
        events: events.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start instanceof Date ? e.start.toISOString() : null,
          // Safely handle start
          end: e.end instanceof Date ? e.end.toISOString() : null,
          // Safely handle end
          category: e.category
        })),
        knowledgeItems: knowledgeItems.map(k => ({
          id: k.id,
          title: k.title,
          category: k.category,
          tags: k.tags
        }))
      };
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      const userMessageWithContext = `[Current Workspace: ${JSON.stringify(workspaceContext)}]\n\n${inputValue}`;
      const aiResponse = await callGeminiAPI(userMessageWithContext, conversationHistory);

      // Parse the AI response for commands
      const commandLines = aiResponse.text.split('\n').filter(line => line.trim().length > 0);
      let processed = false;
      for (const line of commandLines) {
        const commandResult = processCommandLine(line);
        if (commandResult.actionType) {
          processAiAction(commandResult.actionType, commandResult.actionData);
          processed = true;
        }
      }
      const friendlyMessage = processed ? "I've processed your request." : aiResponse.text;

      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: friendlyMessage,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Refresh events if they might have been changed
      if (processed) {
        await refreshEvents();
      }
    } catch (error) {
      console.error("Error processing AI request:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "AI Error",
        description: "There was a problem with the AI service.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if the AI response contains command patterns
  const containsCommandPattern = (text: string): boolean => {
    const patterns = [/createTask\[.*?\]/, /createNote\[.*?\]/, /createEvent\[.*?\]/, /updateTask\[.*?\]/, /updateNote\[.*?\]/, /updateEvent\[.*?\]/, /deleteTask\[.*?\]/, /deleteNote\[.*?\]/, /deleteEvent\[.*?\]/, /KB\{.*?:.*?\}/];
    return patterns.some(pattern => pattern.test(text));
  };
  
  return (
    <>
      {/* Only show the floating chat button on desktop */}
      {!isMobile && (
        <motion.div 
          className="fixed bottom-6 right-6 z-40" 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)} 
            className="rounded-full w-14 h-14 shadow-lg transition-all duration-300 bg-assistant-primary"
          >
            {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
          </Button>
        </motion.div>
      )}

      {/* Chat window - adapt to full screen on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={`fixed z-50 bg-background/95 backdrop-blur-sm border border-primary/20 overflow-hidden 
              ${isMobile 
                ? 'inset-0 rounded-none' 
                : 'bottom-24 right-6 w-80 md:w-96 h-96 rounded-lg shadow-2xl'}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }} 
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex flex-col h-full">
              {/* Chat header */}
              <div className="px-4 py-3 border-b text-white flex items-center justify-between bg-assistant-primary">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} />
                  <h3 className="font-medium">AI Assistant</h3>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-white hover:bg-primary-foreground/20" 
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <motion.div 
                    key={message.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.3 }} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-muted'}`}>
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
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted mr-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" 
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div 
                          className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" 
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div 
                          className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" 
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat input */}
              <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2 bg-background/90">
                <Input 
                  ref={inputRef} 
                  value={inputValue} 
                  onChange={e => setInputValue(e.target.value)} 
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBox;
