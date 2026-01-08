export interface CustomSnippet {
  id: string;
  name: string;
  content: string;
  shortcut: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSnippetData {
  name: string;
  content: string;
  shortcut?: string | null;
  order?: number;
}

export interface UpdateSnippetData {
  name?: string;
  content?: string;
  shortcut?: string | null;
  order?: number;
}
