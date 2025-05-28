
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDatabaseConfig } from '../config/database';

// Create a single supabase client for interacting with your database
const createSupabaseClient = () => {
  const config = getDatabaseConfig();
  
  // If no API key or URL is set, return null
  if (!config.apiKey || !config.apiUrl) {
    console.warn('Supabase configuration is incomplete. Please configure it in Settings.');
    return null;
  }
  
  try {
    // Ensure URL has the correct format
    const apiUrl = config.apiUrl.trim();
    const apiKey = config.apiKey.trim();
    
    console.log('Connecting to Supabase with URL:', apiUrl);
    
    // Use the config values from the settings with proper options
    return createClient(apiUrl, apiKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

// Cache the client instance
let supabaseClientInstance: SupabaseClient | null = null;

// Export a function to get the client, which will create it if needed
export const getSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createSupabaseClient();
  }
  return supabaseClientInstance;
};

// Utility function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  const config = getDatabaseConfig();
  return Boolean(config.apiKey && config.apiUrl);
};

// Reset the client instance (useful when settings change)
export const resetSupabaseClient = () => {
  supabaseClientInstance = null;
};
