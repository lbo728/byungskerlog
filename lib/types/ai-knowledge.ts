export interface AIKnowledgePreset {
  id: string;
  name: string;
  instruction: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIKnowledgeReference {
  id: string;
  title: string;
  content: string;
  presetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIKnowledgePresetWithReferences extends AIKnowledgePreset {
  references: AIKnowledgeReference[];
}

export interface CreatePresetData {
  name: string;
  instruction: string;
}

export interface UpdatePresetData {
  name?: string;
  instruction?: string;
  lastUsedAt?: Date;
}

export interface CreateReferenceData {
  title: string;
  content: string;
}

export interface UpdateReferenceData {
  title?: string;
  content?: string;
}
