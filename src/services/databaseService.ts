
import { Note, Task, KnowledgeItem, CalendarEvent } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

// Function to simulate a delay (e.g., for API calls)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Function to load data from localStorage (used as fallback)
const loadData = (key: string) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return undefined;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return undefined;
  }
};

// Function to save data to localStorage (used as fallback)
const saveData = (key: string, data: any) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Notes operations
const getNotes = async (): Promise<Note[] | undefined> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase.from('notes').select('*');
        
        if (error) {
          console.error('Error fetching notes from Supabase:', error);
          return loadData('notes'); // Fallback to localStorage
        }
        
        return data as Note[];
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    return loadData('notes');
  } catch (error) {
    console.error('Error in getNotes:', error);
    return loadData('notes'); // Fallback to localStorage
  }
};

const saveNote = async (note: Note) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('notes').insert([note]);
        
        if (error) {
          console.error('Error saving note to Supabase:', error);
          // Fallback to localStorage
          const notesData = await loadData('notes') || [];
          notesData.push(note);
          saveData('notes', notesData);
          return note;
        }
        
        return note;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const notesData = await loadData('notes') || [];
    notesData.push(note);
    saveData('notes', notesData);
    return note;
  } catch (error) {
    console.error('Error in saveNote:', error);
    // Fallback to localStorage
    const notesData = await loadData('notes') || [];
    notesData.push(note);
    saveData('notes', notesData);
    return note;
  }
};

const deleteNote = async (id: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting note from Supabase:', error);
          // Fallback to localStorage
          const notesData = await loadData('notes');
          if (notesData) {
            const updatedNotes = notesData.filter(note => note.id !== id);
            saveData('notes', updatedNotes);
          }
          return;
        }
        
        return;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const notesData = await loadData('notes');
    if (notesData) {
      const updatedNotes = notesData.filter(note => note.id !== id);
      saveData('notes', updatedNotes);
    }
  } catch (error) {
    console.error('Error in deleteNote:', error);
    // Fallback to localStorage
    const notesData = await loadData('notes');
    if (notesData) {
      const updatedNotes = notesData.filter(note => note.id !== id);
      saveData('notes', updatedNotes);
    }
  }
};

// Tasks operations
const getTasks = async (): Promise<Task[] | undefined> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase.from('tasks').select('*');
        
        if (error) {
          console.error('Error fetching tasks from Supabase:', error);
          return loadData('tasks'); // Fallback to localStorage
        }
        
        return data as Task[];
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    return loadData('tasks');
  } catch (error) {
    console.error('Error in getTasks:', error);
    return loadData('tasks'); // Fallback to localStorage
  }
};

const saveTask = async (task: Task) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('tasks').insert([task]);
        
        if (error) {
          console.error('Error saving task to Supabase:', error);
          // Fallback to localStorage
          const tasksData = await loadData('tasks') || [];
          tasksData.push(task);
          saveData('tasks', tasksData);
          return task;
        }
        
        return task;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const tasksData = await loadData('tasks') || [];
    tasksData.push(task);
    saveData('tasks', tasksData);
    return task;
  } catch (error) {
    console.error('Error in saveTask:', error);
    // Fallback to localStorage
    const tasksData = await loadData('tasks') || [];
    tasksData.push(task);
    saveData('tasks', tasksData);
    return task;
  }
};

const deleteTask = async (id: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting task from Supabase:', error);
          // Fallback to localStorage
          const tasksData = await loadData('tasks');
          if (tasksData) {
            const updatedTasks = tasksData.filter(task => task.id !== id);
            saveData('tasks', updatedTasks);
          }
          return;
        }
        
        return;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const tasksData = await loadData('tasks');
    if (tasksData) {
      const updatedTasks = tasksData.filter(task => task.id !== id);
      saveData('tasks', updatedTasks);
    }
  } catch (error) {
    console.error('Error in deleteTask:', error);
    // Fallback to localStorage
    const tasksData = await loadData('tasks');
    if (tasksData) {
      const updatedTasks = tasksData.filter(task => task.id !== id);
      saveData('tasks', updatedTasks);
    }
  }
};

// Knowledge Items operations
const getKnowledgeItems = async (): Promise<KnowledgeItem[] | undefined> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase.from('knowledge_items').select('*');
        
        if (error) {
          console.error('Error fetching knowledge items from Supabase:', error);
          return loadData('knowledgeItems'); // Fallback to localStorage
        }
        
        return data as KnowledgeItem[];
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    return loadData('knowledgeItems');
  } catch (error) {
    console.error('Error in getKnowledgeItems:', error);
    return loadData('knowledgeItems'); // Fallback to localStorage
  }
};

const saveKnowledgeItem = async (item: KnowledgeItem) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('knowledge_items').insert([item]);
        
        if (error) {
          console.error('Error saving knowledge item to Supabase:', error);
          // Fallback to localStorage
          const knowledgeItemsData = await loadData('knowledgeItems') || [];
          knowledgeItemsData.push(item);
          saveData('knowledgeItems', knowledgeItemsData);
          return item;
        }
        
        return item;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const knowledgeItemsData = await loadData('knowledgeItems') || [];
    knowledgeItemsData.push(item);
    saveData('knowledgeItems', knowledgeItemsData);
    return item;
  } catch (error) {
    console.error('Error in saveKnowledgeItem:', error);
    // Fallback to localStorage
    const knowledgeItemsData = await loadData('knowledgeItems') || [];
    knowledgeItemsData.push(item);
    saveData('knowledgeItems', knowledgeItemsData);
    return item;
  }
};

const deleteKnowledgeItem = async (id: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('knowledge_items').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting knowledge item from Supabase:', error);
          // Fallback to localStorage
          const knowledgeItemsData = await loadData('knowledgeItems');
          if (knowledgeItemsData) {
            const updatedItems = knowledgeItemsData.filter(item => item.id !== id);
            saveData('knowledgeItems', updatedItems);
          }
          return;
        }
        
        return;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const knowledgeItemsData = await loadData('knowledgeItems');
    if (knowledgeItemsData) {
      const updatedItems = knowledgeItemsData.filter(item => item.id !== id);
      saveData('knowledgeItems', updatedItems);
    }
  } catch (error) {
    console.error('Error in deleteKnowledgeItem:', error);
    // Fallback to localStorage
    const knowledgeItemsData = await loadData('knowledgeItems');
    if (knowledgeItemsData) {
      const updatedItems = knowledgeItemsData.filter(item => item.id !== id);
      saveData('knowledgeItems', updatedItems);
    }
  }
};

// Calendar Events operations
const getEvents = async (): Promise<CalendarEvent[] | undefined> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase.from('calendar_events').select('*');
        
        if (error) {
          console.error('Error fetching events from Supabase:', error);
          return loadData('events'); // Fallback to localStorage
        }
        
        // Ensure dates are properly parsed
        const parsedData = data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        
        return parsedData as CalendarEvent[];
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const events = loadData('events');
    if (events) {
      // Ensure dates are properly parsed
      return events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
    }
    return events;
  } catch (error) {
    console.error('Error in getEvents:', error);
    return loadData('events'); // Fallback to localStorage
  }
};

const saveEvent = async (event: CalendarEvent) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('calendar_events').insert([event]);
        
        if (error) {
          console.error('Error saving event to Supabase:', error);
          // Fallback to localStorage
          const eventsData = await loadData('events') || [];
          eventsData.push(event);
          saveData('events', eventsData);
          return event;
        }
        
        return event;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const eventsData = await loadData('events') || [];
    eventsData.push(event);
    saveData('events', eventsData);
    return event;
  } catch (error) {
    console.error('Error in saveEvent:', error);
    // Fallback to localStorage
    const eventsData = await loadData('events') || [];
    eventsData.push(event);
    saveData('events', eventsData);
    return event;
  }
};

const deleteEvent = async (id: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting event from Supabase:', error);
          // Fallback to localStorage
          const eventsData = await loadData('events');
          if (eventsData) {
            const updatedEvents = eventsData.filter(event => event.id !== id);
            saveData('events', updatedEvents);
          }
          return;
        }
        
        return;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const eventsData = await loadData('events');
    if (eventsData) {
      const updatedEvents = eventsData.filter(event => event.id !== id);
      saveData('events', updatedEvents);
    }
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    // Fallback to localStorage
    const eventsData = await loadData('events');
    if (eventsData) {
      const updatedEvents = eventsData.filter(event => event.id !== id);
      saveData('events', updatedEvents);
    }
  }
};

// Add update methods for each entity
const updateNote = async (note: Note) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('notes')
          .update(note)
          .eq('id', note.id);
        
        if (error) {
          console.error('Error updating note in Supabase:', error);
          // Fallback to localStorage
          const notesData = await loadData('notes');
          const updatedNotes = notesData ? notesData.map(n => n.id === note.id ? note : n) : [note];
          saveData('notes', updatedNotes);
          return note;
        }
        
        return note;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const notesData = await loadData('notes');
    const updatedNotes = notesData ? notesData.map(n => n.id === note.id ? note : n) : [note];
    saveData('notes', updatedNotes);
    return note;
  } catch (error) {
    console.error('Error updating note:', error);
    // Fallback to localStorage
    const notesData = await loadData('notes');
    const updatedNotes = notesData ? notesData.map(n => n.id === note.id ? note : n) : [note];
    saveData('notes', updatedNotes);
    return note;
  }
};

const updateTask = async (task: Task) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('tasks')
          .update(task)
          .eq('id', task.id);
        
        if (error) {
          console.error('Error updating task in Supabase:', error);
          // Fallback to localStorage
          const tasksData = await loadData('tasks');
          const updatedTasks = tasksData ? tasksData.map(t => t.id === task.id ? task : t) : [task];
          saveData('tasks', updatedTasks);
          return task;
        }
        
        return task;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const tasksData = await loadData('tasks');
    const updatedTasks = tasksData ? tasksData.map(t => t.id === task.id ? task : t) : [task];
    saveData('tasks', updatedTasks);
    return task;
  } catch (error) {
    console.error('Error updating task:', error);
    // Fallback to localStorage
    const tasksData = await loadData('tasks');
    const updatedTasks = tasksData ? tasksData.map(t => t.id === task.id ? task : t) : [task];
    saveData('tasks', updatedTasks);
    return task;
  }
};

const updateKnowledgeItem = async (item: KnowledgeItem) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('knowledge_items')
          .update(item)
          .eq('id', item.id);
        
        if (error) {
          console.error('Error updating knowledge item in Supabase:', error);
          // Fallback to localStorage
          const itemsData = await loadData('knowledgeItems');
          const updatedItems = itemsData ? itemsData.map(i => i.id === item.id ? item : i) : [item];
          saveData('knowledgeItems', updatedItems);
          return item;
        }
        
        return item;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const itemsData = await loadData('knowledgeItems');
    const updatedItems = itemsData ? itemsData.map(i => i.id === item.id ? item : i) : [item];
    saveData('knowledgeItems', updatedItems);
    return item;
  } catch (error) {
    console.error('Error updating knowledge item:', error);
    // Fallback to localStorage
    const itemsData = await loadData('knowledgeItems');
    const updatedItems = itemsData ? itemsData.map(i => i.id === item.id ? item : i) : [item];
    saveData('knowledgeItems', updatedItems);
    return item;
  }
};

const updateEvent = async (event: CalendarEvent) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('calendar_events')
          .update(event)
          .eq('id', event.id);
        
        if (error) {
          console.error('Error updating event in Supabase:', error);
          // Fallback to localStorage
          const eventsData = await loadData('events');
          const updatedEvents = eventsData ? eventsData.map(e => e.id === event.id ? event : e) : [event];
          saveData('events', updatedEvents);
          return event;
        }
        
        return event;
      }
    }
    
    // Fallback to localStorage if Supabase is not configured
    const eventsData = await loadData('events');
    const updatedEvents = eventsData ? eventsData.map(e => e.id === event.id ? event : e) : [event];
    saveData('events', updatedEvents);
    return event;
  } catch (error) {
    console.error('Error updating event:', error);
    // Fallback to localStorage
    const eventsData = await loadData('events');
    const updatedEvents = eventsData ? eventsData.map(e => e.id === event.id ? event : e) : [event];
    saveData('events', updatedEvents);
    return event;
  }
};

// Add the config update method
const updateConfig = async (config: any) => {
  try {
    localStorage.setItem('databaseConfig', JSON.stringify(config));
    return config;
  } catch (error) {
    console.error("Error updating database configuration:", error);
    throw error;
  }
};

// Export the service
const databaseService = {
  getNotes,
  saveNote,
  deleteNote,
  updateNote,
  getTasks,
  saveTask,
  deleteTask,
  updateTask,
  getKnowledgeItems,
  saveKnowledgeItem,
  deleteKnowledgeItem,
  updateKnowledgeItem,
  getEvents,
  saveEvent,
  deleteEvent,
  updateEvent,
  updateConfig,
};

export default databaseService;
