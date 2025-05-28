
import { AiConfig, getAiConfig } from '../config/aiConfig';
import { Note, Task, CalendarEvent, KnowledgeItem } from '../types';

interface AiResponse {
  text: string;
  actionType?: 'createTask' | 'createNote' | 'createEvent' | 'updateTask' | 'updateNote' | 'updateEvent' | 'deleteTask' | 'deleteNote' | 'deleteEvent' | 'addKnowledgeItem';
  actionData?: any;
}

// Commands that the AI can recognize
const COMMAND_PATTERNS = {
  CREATE_TASK: /^createTask\[(.*?)\](?::(.*))?$/,
  CREATE_NOTE: /^createNote\[(.*?)\](?::(.*))?$/,
  CREATE_EVENT: /^createEvent\[(.*?)\](?::(.*))?$/,
  UPDATE_TASK: /^updateTask\[(.*?)\](?::(.*))?$/,
  UPDATE_NOTE: /^updateNote\[(.*?)\](?::(.*))?$/,
  UPDATE_EVENT: /^updateEvent\[(.*?)\](?::(.*))?$/,
  DELETE_TASK: /^deleteTask\[(.*?)\]$/,
  DELETE_NOTE: /^deleteNote\[(.*?)\]$/,
  DELETE_EVENT: /^deleteEvent\[(.*?)\]$/,
  ADD_KB: /^KB\{(.*?):(.*?)\}$/,
};

// The system prompt that instructs the AI how to respond to workspace management requests
const SYSTEM_PROMPT = `
You are an AI assistant integrated with a personal workspace management system. 
When users ask you to perform actions on their workspace, respond with the appropriate command format:

For creating tasks:
createTask[Task Title]:priority:notes:YYYY-MM-DD (optional due date)
Example: createTask[Complete project report]:high:Need to finish by Friday:2025-05-15

For creating notes:
createNote[Note Title]:content:tag1,tag2
Example: createNote[Meeting Notes]:Points discussed in the team meeting:meeting,team

For creating events:
createEvent[Event Title]:YYYY-MM-DD HH:MM:YYYY-MM-DD HH:MM:Category:Notes
Example: createEvent[Team Meeting]:2025-05-15 14:00:2025-05-15 15:00:Work:Weekly standup with the development team

IMPORTANT:
- Ensure the \`start\` and \`end\` fields are in the format "YYYY-MM-DD HH:MM".
- The \`category\` field must be one of the following: Personal, General, Work, Health, or Education.
- If the \`end\` time is missing, default it to 1 hour after the \`start\` time.
- Time-specific items like meetings, calls, or deadlines should be created as events.
- For events, separate the notes from the category with a colon.

For updating tasks:
updateTask[taskId]:newTitle:newPriority:newNotes:completed(true/false):newDueDate(YYYY-MM-DD)
Example: updateTask[task123]:Updated report title:high:New notes:false:2025-05-20

For updating notes:
updateNote[noteId]:newTitle:newContent:newTag1,newTag2
Example: updateNote[note123]:Updated Meeting Notes:New content:meeting,updated

For updating events:
updateEvent[eventId]:newTitle:newStartDate(YYYY-MM-DD HH:MM):newEndDate(YYYY-MM-DD HH:MM):newNotes:newCategory
Example: updateEvent[event123]:Updated Meeting:2025-05-16 13:00:2025-05-16 14:00:Discuss project timeline:Work

For deleting:
deleteTask[taskId]
deleteNote[noteId]
deleteEvent[eventId]

NEW FEATURE - Adding to Knowledge Base:
When the user mentions important personal information that should be saved for future reference (like preferences, important dates, personal details, etc.), add it to their knowledge base using:
KB{information:tag}
Example: KB{prefers vegetarian food:preferences}
Example: KB{interview at Google on March 12, 2025:events}

IMPORTANT: When the user describes multiple items to create or modify at once (like planning a workday), respond with each command on a new line. For example:
createTask[Morning standup]:high:Daily team update:2025-05-15
createEvent[Client Meeting]:2025-05-15 10:00:2025-05-15 11:00:Work:Discuss new project requirements
createTask[Send follow-up email]:medium:Summarize meeting points:2025-05-15

When the user asks for information about their workspace items, analyze the data provided in their message (which will be in JSON format at the beginning of their messages) and provide relevant information.

For any commands that require a specific ID, look it up in the workspace data to find the correct item.
If the user's request doesn't match any of these actions, respond normally without using a command format.

Remember, your responses will be processed by the system to actually perform these actions, so be precise with your command syntax.
`;

// Function to call the Gemini API
export const callGeminiAPI = async (message: string, conversationHistory: { role: string; content: string; timestamp?: string }[]): Promise<AiResponse> => {
  const config = getAiConfig();
  
  if (!config.apiKey) {
    return { text: "AI API key is not set. Please add your Gemini API key in the Settings." };
  }

  // Add timestamp if the last message was sent more than 5 minutes ago
  const now = new Date();
  const lastMessage = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : null;
  const lastMessageTime = lastMessage?.timestamp ? new Date(lastMessage.timestamp) : null;
  const includeTimestamp = !lastMessageTime || (now.getTime() - lastMessageTime.getTime()) > 5 * 60 * 1000;

  const timestampedMessage = includeTimestamp
    ? `[Current Timestamp: ${now.toISOString()}]\n\n${message}`
    : message;

  try {
    // Prepare conversation history including the system prompt
    const formattedMessages = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: timestampedMessage }] }
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: config.temperature,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("AI API error:", errorData);
      return { text: `Error calling AI API: ${errorData?.error?.message || response.statusText}` };
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts || !data.candidates[0]?.content?.parts[0]?.text) {
      return { text: "Received empty response from AI API." };
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    // Process the text for commands, now handling multiple commands
    return processBatchCommands(aiText);
  } catch (error) {
    console.error("Error calling AI API:", error);
    return { text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}` };
  }
};

// Function to process multiple commands from AI response
const processBatchCommands = (text: string): AiResponse => {
  // Split response by lines to check for multiple commands
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Check if we have multiple command lines
  if (lines.length > 1) {
    let hasCommand = false;
    
    // Process each line individually
    for (const line of lines) {
      const commandResponse = processAiResponse(line);
      if (commandResponse.actionType) {
        // We found at least one command line
        hasCommand = true;
        break;
      }
    }
    
    if (hasCommand) {
      // Return a friendly batch message and let the frontend handle each line
      return { 
        text: text, // Keep the original text with the commands
        actionType: 'createTask', 
        actionData: { 
          title: 'Multiple items created',
          commandLines: lines
        }
      };
    }
  }
  
  // If not a batch command or no commands detected, process normally
  return processAiResponse(text);
};

// Function to process a single AI command response
const processAiResponse = (text: string): AiResponse => {
  // Check for KB addition command
  const addKbMatch = text.match(COMMAND_PATTERNS.ADD_KB);
  if (addKbMatch) {
    const [, content, tag = "general"] = addKbMatch;
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'addKnowledgeItem',
      actionData: {
        title: `Knowledge: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
        content: content,
        category: 'Personal',
        tags: [tag]
      }
    };
  }

  // Check for createTask command
  const createTaskMatch = text.match(COMMAND_PATTERNS.CREATE_TASK);
  if (createTaskMatch) {
    const [, title, additionalInfo = ""] = createTaskMatch;
    const [priority = "medium", notes = "", dueDateStr = ""] = additionalInfo.split(':');
    
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'createTask',
      actionData: {
        title,
        priority,
        notes,
        completed: false,
        dueDate
      }
    };
  }

  // Check for createNote command
  const createNoteMatch = text.match(COMMAND_PATTERNS.CREATE_NOTE);
  if (createNoteMatch) {
    const [, title, additionalInfo = ""] = createNoteMatch;
    const [content = "", tagString = ""] = additionalInfo.split(':');
    const tags = tagString.split(',').filter(tag => tag.trim().length > 0);
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'createNote',
      actionData: {
        title,
        content,
        tags,
      }
    };
  }

  // Check for createEvent command
  const createEventMatch = text.match(COMMAND_PATTERNS.CREATE_EVENT);
  if (createEventMatch) {
    const [, title, additionalInfo = ""] = createEventMatch;
    
    // Improved parsing for event data
    let parts = additionalInfo.split(':');
    
    // First two parts should be dates, followed by category, then notes
    const startDateStr = parts.shift() || "";
    const endDateStr = parts.shift() || "";
    const category = parts.shift() || "General";
    const notes = parts.join(':'); // Combine any remaining parts as notes
    
    const start = startDateStr ? new Date(startDateStr) : new Date();
    const end = endDateStr ? new Date(endDateStr) : new Date(start.getTime() + 60 * 60 * 1000); // Default to 1 hour after start
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'createEvent',
      actionData: {
        title,
        start,
        end,
        category,
        notes
      }
    };
  }

  // Check for updateTask command
  const updateTaskMatch = text.match(COMMAND_PATTERNS.UPDATE_TASK);
  if (updateTaskMatch) {
    const [, taskId, additionalInfo = ""] = updateTaskMatch;
    const [newTitle = "", newPriority = "", newNotes = "", completedStr = "", dueDateStr = ""] = additionalInfo.split(':');
    
    const completed = completedStr.toLowerCase() === 'true';
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'updateTask',
      actionData: {
        id: taskId,
        title: newTitle,
        priority: newPriority,
        notes: newNotes,
        completed,
        dueDate,
      }
    };
  }

  // Check for updateNote command
  const updateNoteMatch = text.match(COMMAND_PATTERNS.UPDATE_NOTE);
  if (updateNoteMatch) {
    const [, noteId, additionalInfo = ""] = updateNoteMatch;
    const [newTitle = "", newContent = "", tagString = ""] = additionalInfo.split(':');
    const tags = tagString.split(',').filter(tag => tag.trim().length > 0);
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'updateNote',
      actionData: {
        id: noteId,
        title: newTitle,
        content: newContent,
        tags,
      }
    };
  }

  // Check for updateEvent command
  const updateEventMatch = text.match(COMMAND_PATTERNS.UPDATE_EVENT);
  if (updateEventMatch) {
    const [, eventId, additionalInfo = ""] = updateEventMatch;
    const [newTitle = "", startDateStr = "", endDateStr = "", newNotes = "", newCategory = ""] = additionalInfo.split(':');
    
    const start = startDateStr ? new Date(startDateStr) : undefined;
    const end = endDateStr ? new Date(endDateStr) : undefined;
    
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'updateEvent',
      actionData: {
        id: eventId,
        title: newTitle,
        start,
        end,
        notes: newNotes,
        category: newCategory,
      }
    };
  }

  // Check for delete commands
  const deleteTaskMatch = text.match(COMMAND_PATTERNS.DELETE_TASK);
  if (deleteTaskMatch) {
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'deleteTask',
      actionData: { id: deleteTaskMatch[1] }
    };
  }

  const deleteNoteMatch = text.match(COMMAND_PATTERNS.DELETE_NOTE);
  if (deleteNoteMatch) {
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'deleteNote',
      actionData: { id: deleteNoteMatch[1] }
    };
  }

  const deleteEventMatch = text.match(COMMAND_PATTERNS.DELETE_EVENT);
  if (deleteEventMatch) {
    return {
      text: text, // Return original text so frontend can process it
      actionType: 'deleteEvent',
      actionData: { id: deleteEventMatch[1] }
    };
  }

  // If no command patterns match, return the original text
  return { text };
};

export default { callGeminiAPI };
