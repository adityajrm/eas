
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { NotionItem } from '@/types/notion';

// Fallback functions for localStorage
const loadData = (key: string): NotionItem[] => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return [];
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return [];
  }
};

const saveData = (key: string, data: NotionItem[]) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const getNotionItems = async (parentId: string | null = null): Promise<NotionItem[]> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase
          .from('notion_items')
          .select('*')
          .eq('parent_id', parentId)
          .order('type', { ascending: false }) // folders first
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching notion items from Supabase:', error);
          const allItems = loadData('notion_items');
          return allItems.filter(item => item.parent_id === parentId);
        }
        
        return data as NotionItem[];
      }
    }
    
    const allItems = loadData('notion_items');
    return allItems.filter(item => item.parent_id === parentId);
  } catch (error) {
    console.error('Error in getNotionItems:', error);
    const allItems = loadData('notion_items');
    return allItems.filter(item => item.parent_id === parentId);
  }
};

export const createNotionItem = async (item: Omit<NotionItem, 'id' | 'created_at' | 'updated_at'>): Promise<NotionItem> => {
  const newItem: NotionItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('notion_items').insert([newItem]);
        
        if (error) {
          console.error('Error creating notion item in Supabase:', error);
          const items = loadData('notion_items');
          items.push(newItem);
          saveData('notion_items', items);
          return newItem;
        }
        
        return newItem;
      }
    }
    
    const items = loadData('notion_items');
    items.push(newItem);
    saveData('notion_items', items);
    return newItem;
  } catch (error) {
    console.error('Error in createNotionItem:', error);
    const items = loadData('notion_items');
    items.push(newItem);
    saveData('notion_items', items);
    return newItem;
  }
};

export const updateNotionItem = async (item: NotionItem): Promise<NotionItem> => {
  const updatedItem = { ...item, updated_at: new Date() };

  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('notion_items')
          .update(updatedItem)
          .eq('id', item.id);
        
        if (error) {
          console.error('Error updating notion item in Supabase:', error);
          const items = loadData('notion_items');
          const updatedItems = items.map(i => i.id === item.id ? updatedItem : i);
          saveData('notion_items', updatedItems);
          return updatedItem;
        }
        
        return updatedItem;
      }
    }
    
    const items = loadData('notion_items');
    const updatedItems = items.map(i => i.id === item.id ? updatedItem : i);
    saveData('notion_items', updatedItems);
    return updatedItem;
  } catch (error) {
    console.error('Error updating notion item:', error);
    const items = loadData('notion_items');
    const updatedItems = items.map(i => i.id === item.id ? updatedItem : i);
    saveData('notion_items', updatedItems);
    return updatedItem;
  }
};

export const deleteNotionItem = async (id: string): Promise<void> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('notion_items').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting notion item from Supabase:', error);
          const items = loadData('notion_items');
          const filteredItems = items.filter(item => item.id !== id);
          saveData('notion_items', filteredItems);
          return;
        }
        
        return;
      }
    }
    
    const items = loadData('notion_items');
    const filteredItems = items.filter(item => item.id !== id);
    saveData('notion_items', filteredItems);
  } catch (error) {
    console.error('Error in deleteNotionItem:', error);
    const items = loadData('notion_items');
    const filteredItems = items.filter(item => item.id !== id);
    saveData('notion_items', filteredItems);
  }
};

export const getNotionItemById = async (id: string): Promise<NotionItem | null> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase
          .from('notion_items')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching notion item from Supabase:', error);
          const items = loadData('notion_items');
          return items.find(item => item.id === id) || null;
        }
        
        return data as NotionItem;
      }
    }
    
    const items = loadData('notion_items');
    return items.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Error in getNotionItemById:', error);
    const items = loadData('notion_items');
    return items.find(item => item.id === id) || null;
  }
};

export const searchNotionItems = async (query: string): Promise<NotionItem[]> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase
          .from('notion_items')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
        
        if (error) {
          console.error('Error searching notion items in Supabase:', error);
          const items = loadData('notion_items');
          return items.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
          );
        }
        
        return data as NotionItem[];
      }
    }
    
    const items = loadData('notion_items');
    return items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
    );
  } catch (error) {
    console.error('Error in searchNotionItems:', error);
    const items = loadData('notion_items');
    return items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
    );
  }
};
