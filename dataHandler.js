
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

// Local storage fallback functions
const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Folder operations
export const createFolder = async (name, parentId = null) => {
  const folder = {
    id: crypto.randomUUID(),
    name,
    parent_id: parentId,
    type: 'folder',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('notes').insert([folder]);
      if (error) {
        console.error('Error creating folder:', error);
        // Fallback to localStorage
        const folders = loadFromStorage('folders');
        folders.push(folder);
        saveToStorage('folders', folders);
      }
    }
  } else {
    const folders = loadFromStorage('folders');
    folders.push(folder);
    saveToStorage('folders', folders);
  }

  return folder;
};

export const createNote = async (title, parentId = null) => {
  const note = {
    id: crypto.randomUUID(),
    title,
    content: '',
    parent_id: parentId,
    type: 'note',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('notes').insert([note]);
      if (error) {
        console.error('Error creating note:', error);
        // Fallback to localStorage
        const notes = loadFromStorage('notes');
        notes.push(note);
        saveToStorage('notes', notes);
      }
    }
  } else {
    const notes = loadFromStorage('notes');
    notes.push(note);
    saveToStorage('notes', notes);
  }

  return note;
};

export const updateNote = async (id, updates) => {
  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from('notes')
        .update(updatedData)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating note:', error);
        // Fallback to localStorage
        const notes = loadFromStorage('notes');
        const index = notes.findIndex(note => note.id === id);
        if (index !== -1) {
          notes[index] = { ...notes[index], ...updatedData };
          saveToStorage('notes', notes);
        }
      }
    }
  } else {
    const notes = loadFromStorage('notes');
    const index = notes.findIndex(note => note.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updatedData };
      saveToStorage('notes', notes);
    }
  }
};

export const deleteItem = async (id) => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) {
        console.error('Error deleting item:', error);
      }
    }
  } else {
    const notes = loadFromStorage('notes');
    const folders = loadFromStorage('folders');
    
    const filteredNotes = notes.filter(note => note.id !== id);
    const filteredFolders = folders.filter(folder => folder.id !== id);
    
    saveToStorage('notes', filteredNotes);
    saveToStorage('folders', filteredFolders);
  }
};

export const getItems = async (parentId = null) => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching items:', error);
        return [];
      }
      
      return data || [];
    }
  }
  
  // Fallback to localStorage
  const notes = loadFromStorage('notes');
  const folders = loadFromStorage('folders');
  const allItems = [...notes, ...folders];
  
  return allItems.filter(item => item.parent_id === parentId);
};

export const getItemById = async (id) => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching item:', error);
        return null;
      }
      
      return data;
    }
  }
  
  // Fallback to localStorage
  const notes = loadFromStorage('notes');
  const folders = loadFromStorage('folders');
  const allItems = [...notes, ...folders];
  
  return allItems.find(item => item.id === id) || null;
};

export const searchItems = async (query) => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      
      if (error) {
        console.error('Error searching items:', error);
        return [];
      }
      
      return data || [];
    }
  }
  
  // Fallback to localStorage
  const notes = loadFromStorage('notes');
  const folders = loadFromStorage('folders');
  const allItems = [...notes, ...folders];
  
  return allItems.filter(item => 
    item.title?.toLowerCase().includes(query.toLowerCase()) ||
    item.content?.toLowerCase().includes(query.toLowerCase()) ||
    item.name?.toLowerCase().includes(query.toLowerCase())
  );
};
