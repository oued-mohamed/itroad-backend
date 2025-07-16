export type DocumentCategory = 'identity' | 'medical' | 'education' | 'employment' | 'financial' | 'other';

export interface Document {
  id: string;
  adherantId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  description?: string;
  category: DocumentCategory;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadDocumentData {
  description?: string;
  category: DocumentCategory;
  isPublic?: boolean;
  tags?: string[];
}

export interface DocumentStats {
  total: number;
  totalSize: number;
  categories: Record<string, number>;
  fileTypes: Record<string, number>;
  recentUploads: Document[];
}
