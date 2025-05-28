
import { createClient } from '@supabase/supabase-js';
import { getDatabaseConfig } from './src/config/database';

export const getSupabaseClient = () => {
  const config = getDatabaseConfig();
  
  if (!config.apiKey || !config.apiUrl) {
    console.warn('Supabase configuration is incomplete. Using localStorage fallback.');
    return null;
  }
  
  return createClient(config.apiUrl, config.apiKey);
};

export const isSupabaseConfigured = () => {
  const config = getDatabaseConfig();
  return Boolean(config.apiKey && config.apiUrl);
};
