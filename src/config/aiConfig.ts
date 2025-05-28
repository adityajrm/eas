
export interface AiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  enabled: boolean;
  autoTaskEnabled?: boolean; // Add setting for enabling/disabling AutoTask
}

// Default configuration
const defaultConfig: AiConfig = {
  apiKey: '',
  model: 'gemini-pro',
  temperature: 0.7,
  enabled: true,
  autoTaskEnabled: true, // AutoTask enabled by default
};

export const getAiConfig = (): AiConfig => {
  try {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error("Error loading AI configuration:", error);
  }
  return defaultConfig;
};

export const saveAiConfig = (config: AiConfig): void => {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(config));
  } catch (error) {
    console.error("Error saving AI configuration:", error);
  }
};
