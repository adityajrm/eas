
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { DatabaseConfig, getDatabaseConfig, saveDatabaseConfig } from '@/config/database';
import { AiConfig, getAiConfig, saveAiConfig } from '@/config/aiConfig';
import databaseService from '@/services/databaseService';
import { useTheme } from '@/context/ThemeContext';
import { resetSupabaseClient } from '@/services/supabaseClient';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(getDatabaseConfig());
  const [aiConfig, setAiConfig] = useState<AiConfig>(getAiConfig());

  const handleDbConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDbConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAiConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAiConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemperatureChange = (value: number[]) => {
    setAiConfig(prev => ({
      ...prev,
      temperature: value[0]
    }));
  };

  const handleAiEnabledChange = (enabled: boolean) => {
    setAiConfig(prev => ({
      ...prev,
      enabled
    }));
  };

  const saveConfig = () => {
    // Save configurations
    saveDatabaseConfig(dbConfig);
    saveAiConfig(aiConfig);
    
    // Reset the Supabase client to apply new settings
    resetSupabaseClient();
    
    // Update database service config
    databaseService.updateConfig(dbConfig);
    
    toast({
      title: 'Settings Saved',
      description: 'Your configuration has been updated.'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in px-1 md:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={saveConfig} className="w-full md:w-auto">Save Settings</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle">Dark Mode</Label>
            <Switch 
              id="theme-toggle" 
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-api-key">Gemini API Key</Label>
            <Input
              id="ai-api-key"
              name="apiKey"
              value={aiConfig.apiKey}
              onChange={handleAiConfigChange}
              placeholder="Enter your Gemini API key"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              You can get a Gemini API key from Google AI Studio. This will be stored locally in your browser.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model">AI Model</Label>
            <Input
              id="ai-model"
              name="model"
              value={aiConfig.model}
              onChange={handleAiConfigChange}
              placeholder="gemini-pro"
            />
            <p className="text-xs text-muted-foreground">
              The Gemini model to use (e.g., gemini-pro)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="ai-temperature">Temperature: {aiConfig.temperature.toFixed(1)}</Label>
            </div>
            <Slider
              id="ai-temperature"
              min={0}
              max={1}
              step={0.1}
              value={[aiConfig.temperature]}
              onValueChange={handleTemperatureChange}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness: Lower values for more focused responses, higher for more creative ones.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="ai-enabled">Enable AI Assistant</Label>
            <Switch 
              id="ai-enabled" 
              checked={aiConfig.enabled}
              onCheckedChange={handleAiEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              name="apiKey"
              value={dbConfig.apiKey}
              onChange={handleDbConfigChange}
              placeholder="Enter your API key"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Your Supabase anon key for database access. This will be stored locally.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              name="apiUrl"
              value={dbConfig.apiUrl}
              onChange={handleDbConfigChange}
              placeholder="https://your-project.supabase.co"
            />
            <p className="text-xs text-muted-foreground">
              Your Supabase project URL
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
