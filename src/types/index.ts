export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  audioUrl?: string; // Add optional audio URL for voice notes
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'autotask';
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  isProcessing?: boolean; // Add flag to track if an autotask is being processed
  linkedNoteId?: string; // Add reference to a linked note (for autotask results)
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  notes?: string;
  category?: string;
}

export type AppView = 'dashboard' | 'notes' | 'tasks' | 'knowledge' | 'calendar' | 'settings';

// Define the SpeechRecognition interfaces
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

// Define the constructor interface
export interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

// Now declare the globals with proper typing
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// Import the new notes types
export * from './notes';
