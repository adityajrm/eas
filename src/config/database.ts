
export interface DatabaseConfig {
  apiKey: string;
  apiUrl: string;
}

// Default config for development - will be replaced by user's settings
const defaultConfig: DatabaseConfig = {
  apiKey: '',
  apiUrl: '',
};

// Get config from localStorage if available
export const getDatabaseConfig = (): DatabaseConfig => {
  const storedConfig = localStorage.getItem('databaseConfig');
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig);
    } catch (error) {
      console.error('Error parsing stored database config:', error);
      return defaultConfig;
    }
  }
  return defaultConfig;
};

// Save config to localStorage
export const saveDatabaseConfig = (config: DatabaseConfig): void => {
  try {
    // Ensure the URL has the correct format
    let apiUrl = config.apiUrl;
    if (apiUrl) {
      // Remove trailing slashes
      apiUrl = apiUrl.trim().replace(/\/+$/, '');
      
      // Add protocol if it's missing
      if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        apiUrl = `https://${apiUrl}`;
      }
    }
    
    // Save the potentially corrected config
    const configToSave = {
      ...config,
      apiUrl,
      apiKey: config.apiKey.trim() // Trim API key as well
    };
    
    localStorage.setItem('databaseConfig', JSON.stringify(configToSave));
  } catch (error) {
    console.error('Error saving database config:', error);
  }
};
