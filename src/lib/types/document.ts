// Types for the document table
export interface Document {
  id: string;
  owner_id: string;
  title: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  bytes: number | null;
  page_count: number | null;
  status: 'processing' | 'ready' | 'error';
  public_id: string | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
  permission_level?: 'owner' | 'edit' | 'comment' | 'view' | 'public' | null;
}

export interface DocumentUpload {
  file: File;
  title?: string;
}

export interface DocumentParseResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

export interface DocumentCreateInput {
  title: string;
  mime_type: string;
  bytes: number;
  page_count: number;
  raw_text: string;
  storage_bucket?: string;
  storage_path?: string;
}
