
export interface NotionItem {
  id: string;
  title: string;
  type: 'folder' | 'page';
  parent_id: string | null;
  content?: string; // For pages only
  created_at: Date;
  updated_at: Date;
  icon?: string;
}

export interface NotionBreadcrumb {
  id: string;
  title: string;
  type: 'folder' | 'page';
}

export type NotionViewMode = 'grid' | 'list';
