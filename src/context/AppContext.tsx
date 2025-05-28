import React, { createContext, useContext, useState, useEffect } from 'react';
import { Note, Task, KnowledgeItem, CalendarEvent, AppView } from '../types';
import databaseService from '../services/databaseService';
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteNote: (id: string) => void;
  updateNote: (note: Note) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (updatedTask: Task) => void;
  knowledgeItems: KnowledgeItem[];
  addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteKnowledgeItem: (id: string) => void;
  updateKnowledgeItem: (item: KnowledgeItem) => void;
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
  updateEvent: (event: CalendarEvent) => void;
  refreshEvents: () => Promise<void>;
  analytics: {
    completedTasks: number;
    totalTasks: number;
    deadlinesMet: number;
    totalDeadlines: number;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate proper UUID for Supabase compatibility
const generateId = () => uuidv4();

// Sample data for initial state
const initialNotes: Note[] = [
  {
    id: uuidv4(),
    title: 'Welcome to Notes',
    content: 'This is where you can create and organize your notes.',
    tags: ['welcome'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Create your first task',
    completed: false,
    priority: 'medium',
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
];

const initialKnowledgeItems: KnowledgeItem[] = [
  {
    id: uuidv4(),
    title: 'Welcome to Knowledge Base',
    content: 'This is where you can store important information for easy access later.',
    category: 'General',
    tags: ['welcome'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const initialEvents: CalendarEvent[] = [
  {
    id: uuidv4(),
    title: 'Get Started with Calendar',
    start: new Date(today.setHours(10, 0, 0, 0)),
    end: new Date(today.setHours(11, 0, 0, 0)),
    notes: 'Explore the calendar features',
    category: 'Personal',
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(initialKnowledgeItems);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate analytics
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  
  const deadlinesMet = tasks.filter(task => {
    if (!task.dueDate || !task.completed) return false;
    const dueDate = new Date(task.dueDate);
    const completedDate = new Date(); // Ideally we'd store the completion date
    return completedDate <= dueDate;
  }).length;
  
  const totalDeadlines = tasks.filter(task => task.dueDate).length;
  
  const analytics = {
    completedTasks,
    totalTasks,
    deadlinesMet,
    totalDeadlines,
  };

  // Load data from database on initial render
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [notesData, tasksData, knowledgeData, eventsData] = await Promise.all([
        databaseService.getNotes(),
        databaseService.getTasks(),
        databaseService.getKnowledgeItems(),
        databaseService.getEvents()
      ]);

      if (notesData) setNotes(notesData);
      if (tasksData) setTasks(tasksData);
      if (knowledgeData) setKnowledgeItems(knowledgeData);
      if (eventsData) setEvents(eventsData);
    } catch (error) {
      console.error("Error loading data:", error);
      // Keep using initial data if loading fails
    } finally {
      setIsLoading(false);
    }
  };

  // Function to specifically refresh events
  const refreshEvents = async () => {
    try {
      const eventsData = await databaseService.getEvents();
      if (eventsData) {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Error refreshing events:", error);
    }
  };

  // Save data to localStorage as a backup
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('knowledgeItems', JSON.stringify(knowledgeItems));
    localStorage.setItem('events', JSON.stringify(events));
  }, [notes, tasks, knowledgeItems, events]);

  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = generateId();
    const newNote: Note = {
      ...note,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setNotes(prev => [...prev, newNote]);
    
    try {
      await databaseService.saveNote(newNote);
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving note:", error);
    }
    
    return newId; // Return the ID of the newly created note
  };

  const deleteNote = async (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    
    try {
      await databaseService.deleteNote(id);
      toast({
        title: "Note Deleted",
        description: "Your note has been removed.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };
  
  const updateNote = async (updatedNote: Note) => {
    setNotes(notes.map(note => note.id === updatedNote.id ? 
      { ...updatedNote, updatedAt: new Date() } : note
    ));
    
    try {
      await databaseService.updateNote({ ...updatedNote, updatedAt: new Date() });
      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date(),
    };
    
    setTasks(prev => [...prev, newTask]);
    
    try {
      await databaseService.saveTask(newTask);
      toast({
        title: "Task Created",
        description: "Your new task has been added to your list.",
      });
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          
          // Try to update in database
          try {
            databaseService.updateTask(updatedTask);
            
            // Show completion toast only when marking as completed
            if (!task.completed) {
              toast({
                title: "Task Completed! 🎉",
                description: "Great job on completing your task!",
              });
            }
          } catch (error) {
            console.error("Error updating task:", error);
          }
          
          return updatedTask;
        }
        return task;
      })
    );
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    
    try {
      await databaseService.deleteTask(id);
      toast({
        title: "Task Deleted",
        description: "Your task has been removed.",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  
  // Add the missing updateTask function
  const updateTask = async (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    
    try {
      await databaseService.updateTask(updatedTask);
      toast({
        title: "Task Updated",
        description: "Your task has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const addKnowledgeItem = async (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: KnowledgeItem = {
      ...item,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setKnowledgeItems(prev => [...prev, newItem]);
    
    try {
      await databaseService.saveKnowledgeItem(newItem);
      toast({
        title: "Knowledge Item Added",
        description: "Your information has been saved to the knowledge base.",
      });
    } catch (error) {
      console.error("Error saving knowledge item:", error);
    }
  };
  
  const updateKnowledgeItem = async (updatedItem: KnowledgeItem) => {
    setKnowledgeItems(knowledgeItems.map(item => 
      item.id === updatedItem.id ? 
      { ...updatedItem, updatedAt: new Date() } : item
    ));
    
    try {
      await databaseService.updateKnowledgeItem({ ...updatedItem, updatedAt: new Date() });
      toast({
        title: "Knowledge Item Updated",
        description: "Your information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating knowledge item:", error);
    }
  };

  const deleteKnowledgeItem = async (id: string) => {
    setKnowledgeItems(knowledgeItems.filter(item => item.id !== id));
    
    try {
      await databaseService.deleteKnowledgeItem(id);
      toast({
        title: "Item Deleted",
        description: "The knowledge item has been removed.",
      });
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: generateId(),
    };
    
    setEvents(prev => [...prev, newEvent]);
    
    try {
      await databaseService.saveEvent(newEvent);
      toast({
        title: "Event Scheduled",
        description: "Your event has been added to the calendar.",
      });
      
      // Refresh events after adding a new one
      await refreshEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    
    try {
      await databaseService.updateEvent(updatedEvent);
      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully.",
      });
      
      // Refresh events after updating
      await refreshEvents();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const deleteEvent = async (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    
    try {
      await databaseService.deleteEvent(id);
      toast({
        title: "Event Deleted",
        description: "The event has been removed from your calendar.",
      });
      
      // Refresh events after deleting
      await refreshEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        notes,
        addNote,
        deleteNote,
        updateNote,
        tasks,
        addTask,
        toggleTaskCompletion,
        deleteTask,
        updateTask,
        knowledgeItems,
        addKnowledgeItem,
        deleteKnowledgeItem,
        updateKnowledgeItem,
        events,
        addEvent,
        deleteEvent,
        updateEvent,
        refreshEvents,
        analytics,
      }}
    >
      {!isLoading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
