
export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string; // null for root folders
  createdAt: Date;
  updatedAt: Date;
  icon?: string;
}

export interface NotePage {
  id: string;
  title: string;
  content: string; // Rich content in JSON format for the editor
  folderId: string; // Which folder this page belongs to
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  audioUrl?: string;
}

export interface NotesBreadcrumb {
  id: string;
  name: string;
  type: 'folder' | 'page';
}

export type NotesViewMode = 'grid' | 'list';

export interface AICompletionRequest {
  type: 'brief' | 'detailed';
  prompt: string;
  context?: string; // Current page content for context
}
