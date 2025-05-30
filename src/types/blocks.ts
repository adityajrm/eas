
export type BlockType = 
  | 'text' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todo'
  | 'toggle'
  | 'quote'
  | 'code'
  | 'callout'
  | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // for todo blocks
  language?: string; // for code blocks
  calloutType?: 'info' | 'warning' | 'error' | 'success'; // for callout blocks
  children?: Block[]; // for nested blocks
  collapsed?: boolean; // for toggle blocks
}

export interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onSave?: () => void;
}

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  type: BlockType;
  icon: string;
}
