
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { NoteFolder, NotePage } from '@/types/notes';

// Fallback functions for localStorage
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

const saveData = (key: string, data: any) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Folder operations
export const getFolders = async (): Promise<NoteFolder[] | undefined> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase.from('folders').select('*');
        
        if (error) {
          console.error('Error fetching folders from Supabase:', error);
          return loadData('folders');
        }
        
        return data as NoteFolder[];
      }
    }
    
    return loadData('folders');
  } catch (error) {
    console.error('Error in getFolders:', error);
    return loadData('folders');
  }
};

export const saveFolder = async (folder: NoteFolder) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('folders').insert([folder]);
        
        if (error) {
          console.error('Error saving folder to Supabase:', error);
          const foldersData = await loadData('folders') || [];
          foldersData.push(folder);
          saveData('folders', foldersData);
          return folder;
        }
        
        return folder;
      }
    }
    
    const foldersData = await loadData('folders') || [];
    foldersData.push(folder);
    saveData('folders', foldersData);
    return folder;
  } catch (error) {
    console.error('Error in saveFolder:', error);
    const foldersData = await loadData('folders') || [];
    foldersData.push(folder);
    saveData('folders', foldersData);
    return folder;
  }
};

export const updateFolder = async (folder: NoteFolder) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('folders')
          .update(folder)
          .eq('id', folder.id);
        
        if (error) {
          console.error('Error updating folder in Supabase:', error);
          const foldersData = await loadData('folders');
          const updatedFolders = foldersData ? foldersData.map(f => f.id === folder.id ? folder : f) : [folder];
          saveData('folders', updatedFolders);
          return folder;
        }
        
        return folder;
      }
    }
    
    const foldersData = await loadData('folders');
    const updatedFolders = foldersData ? foldersData.map(f => f.id === folder.id ? folder : f) : [folder];
    saveData('folders', updatedFolders);
    return folder;
  } catch (error) {
    console.error('Error updating folder:', error);
    const foldersData = await loadData('folders');
    const updatedFolders = foldersData ? foldersData.map(f => f.id === folder.id ? folder : f) : [folder];
    saveData('folders', updatedFolders);
    return folder;
  }
};

export const deleteFolder = async (id: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('folders').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting folder from Supabase:', error);
          const foldersData = await loadData('folders');
          if (foldersData) {
            const updatedFolders = foldersData.filter(folder => folder.id !== id);
            saveData('folders', updatedFolders);
          }
          return;
        }
        
        return;
      }
    }
    
    const foldersData = await loadData('folders');
    if (foldersData) {
      const updatedFolders = foldersData.filter(folder => folder.id !== id);
      saveData('folders', updatedFolders);
    }
  } catch (error) {
    console.error('Error in deleteFolder:', error);
    const foldersData = await loadData('folders');
    if (foldersData) {
      const updatedFolders = foldersData.filter(folder => folder.id !== id);
      saveData('folders', updatedFolders);
    }
  }
};

// Page operations
export const getPages = async (): Promise<NotePage[] | undefined> => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { data, error } = await supabase.from('pages').select('*');
        
        if (error) {
          console.error('Error fetching pages from Supabase:', error);
          return loadData('pages');
        }
        
        return data as NotePage[];
      }
    }
    
    return loadData('pages');
  } catch (error) {
    console.error('Error in getPages:', error);
    return loadData('pages');
  }
};

export const savePage = async (page: NotePage) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('pages').insert([page]);
        
        if (error) {
          console.error('Error saving page to Supabase:', error);
          const pagesData = await loadData('pages') || [];
          pagesData.push(page);
          saveData('pages', pagesData);
          return page;
        }
        
        return page;
      }
    }
    
    const pagesData = await loadData('pages') || [];
    pagesData.push(page);
    saveData('pages', pagesData);
    return page;
  } catch (error) {
    console.error('Error in savePage:', error);
    const pagesData = await loadData('pages') || [];
    pagesData.push(page);
    saveData('pages', pagesData);
    return page;
  }
};

export const updatePage = async (page: NotePage) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('pages')
          .update(page)
          .eq('id', page.id);
        
        if (error) {
          console.error('Error updating page in Supabase:', error);
          const pagesData = await loadData('pages');
          const updatedPages = pagesData ? pagesData.map(p => p.id === page.id ? page : p) : [page];
          saveData('pages', updatedPages);
          return page;
        }
        
        return page;
      }
    }
    
    const pagesData = await loadData('pages');
    const updatedPages = pagesData ? pagesData.map(p => p.id === page.id ? page : p) : [page];
    saveData('pages', updatedPages);
    return page;
  } catch (error) {
    console.error('Error updating page:', error);
    const pagesData = await loadData('pages');
    const updatedPages = pagesData ? pagesData.map(p => p.id === page.id ? page : p) : [page];
    saveData('pages', updatedPages);
    return page;
  }
};

export const deletePage = async (id: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase.from('pages').delete().eq('id', id);
        
        if (error) {
          console.error('Error deleting page from Supabase:', error);
          const pagesData = await loadData('pages');
          if (pagesData) {
            const updatedPages = pagesData.filter(page => page.id !== id);
            saveData('pages', updatedPages);
          }
          return;
        }
        
        return;
      }
    }
    
    const pagesData = await loadData('pages');
    if (pagesData) {
      const updatedPages = pagesData.filter(page => page.id !== id);
      saveData('pages', updatedPages);
    }
  } catch (error) {
    console.error('Error in deletePage:', error);
    const pagesData = await loadData('pages');
    if (pagesData) {
      const updatedPages = pagesData.filter(page => page.id !== id);
      saveData('pages', updatedPages);
    }
  }
};

// Move page to different folder
export const movePageToFolder = async (pageId: string, newFolderId: string) => {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('pages')
          .update({ folderId: newFolderId, updatedAt: new Date() })
          .eq('id', pageId);
        
        if (error) {
          console.error('Error moving page in Supabase:', error);
          // Fallback to localStorage
          const pagesData = await loadData('pages');
          if (pagesData) {
            const updatedPages = pagesData.map(p => 
              p.id === pageId ? { ...p, folderId: newFolderId, updatedAt: new Date() } : p
            );
            saveData('pages', updatedPages);
          }
          return;
        }
        
        return;
      }
    }
    
    const pagesData = await loadData('pages');
    if (pagesData) {
      const updatedPages = pagesData.map(p => 
        p.id === pageId ? { ...p, folderId: newFolderId, updatedAt: new Date() } : p
      );
      saveData('pages', updatedPages);
    }
  } catch (error) {
    console.error('Error moving page:', error);
  }
};

