
import { getAiConfig } from '../config/aiConfig';

/**
 * Call the Gemini API for AI-powered document editing tasks
 * @param prompt The prompt describing the task
 * @param context Optional context for the task
 * @returns Promise with the generated text
 */
export const callAINoteAPI = async (prompt: string, context: string = ''): Promise<{ text: string }> => {
  const config = getAiConfig();

  if (!config.apiKey) {
    throw new Error("AI API key is not set. Please add your Gemini API key in the Settings.");
  }

  try {
    // Determine if this is a content generation request
    const isContentRequest = /write|create|generate|draft|compose|make|build|develop|produce/i.test(prompt);
    
    let systemPrompt;
    if (isContentRequest) {
      systemPrompt = `You are a professional content writer. Generate only the requested content without any conversational phrases like "Here is", "Sure", "I'll help you", etc. Provide direct, clean content that can be immediately used. Context: "${context}". Task: "${prompt}".`;
    } else {
      systemPrompt = `You are an expert document editor and writing assistant. Provide helpful advice and suggestions. When the user asks for content generation, provide only the content without conversational phrases. Context: "${context}". User request: "${prompt}".`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { 
            role: "user", 
            parts: [{ 
              text: systemPrompt 
            }] 
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error calling AI API: ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    const generatedText = responseData.candidates[0].content.parts[0].text;

    return { text: generatedText };
  } catch (error) {
    console.error('Error calling AI Note API:', error);
    throw error;
  }
};
