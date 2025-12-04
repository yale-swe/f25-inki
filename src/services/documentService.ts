// Service layer for all document CRUD operations 

import { supabase } from '@/lib/supabaseClient';
import { Document, DocumentCreateInput } from '@/lib/types/document';

export class DocumentService {
  static async getUserDocuments(): Promise<Document[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message || 'Unable to fetch documents'}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user documents:', error);
      throw error;
    }
  }

  static async getDocument(id: string): Promise<Document | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // fetch doc with permission level
      const { data, error } = await supabase.rpc('get_document_info', {
        doc_id: id
      });

      if (error) {
        console.error('Error fetching document:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const docData = data[0];
      
      // determine permission
      let permission_level: 'owner' | 'edit' | 'comment' | 'view' | 'public' | null = null;
      
      if (user && docData.owner_id === user.id) {
        permission_level = 'owner';
      } else if (docData.permission_level) {
        permission_level = docData.permission_level;
      } else if (docData.is_public && !user) {
        permission_level = 'public';
      } else if (docData.is_public && user) {
        permission_level = 'view';
      }

      return {
        ...docData,
        permission_level
      };
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  static async createDocument(input: DocumentCreateInput): Promise<Document> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          owner_id: user.id,
          title: input.title,
          file_path: input.storage_path,
          mime_type: input.mime_type,
          bytes: input.bytes,
          page_count: input.page_count,
          raw_text: input.raw_text,
          storage_bucket: input.storage_bucket,
          storage_path: input.storage_path,
          status: 'ready'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  static async updateDocumentStatus(id: string, status: 'processing' | 'ready' | 'error'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('documents')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // 1. RPC delete: deletes the row, cascades document_shares, returns storage info
      const { data, error } = await supabase.rpc("delete_document", {
        p_document_id: id,
      });
      console.log("RPC result:", { data, error });

      if (error) {
        console.error("RPC delete_document error:", error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error("Document not found or not authorized to delete.");
      }

      const { storage_bucket, storage_path } = data[0];

      // 2. Frontend storage deletion
      if (storage_bucket && storage_path) {
        const { error: storageError } = await supabase
          .storage
          .from(storage_bucket)
          .remove([storage_path]);

        if (storageError) {
          console.error("Storage delete failed:", storageError);
          // We don't throw here because DB deletion was successful
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  static async createProcessingDocument(meta: {
    title: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string;
    bytes: number;
  }): Promise<Document> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error in createProcessingDocument:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          owner_id: user.id,
          title: meta.title,
          file_path: meta.storage_path,
          storage_bucket: meta.storage_bucket,
          storage_path: meta.storage_path,
          mime_type: meta.mime_type,
          bytes: meta.bytes,
          status: 'processing'
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating processing document:', error);
      throw error;
    }
  }

  static async finalizeDocument(id: string, payload: { raw_text: string; page_count: number }): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error in finalizeDocument:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('documents')
        .update({
          raw_text: payload.raw_text,
          page_count: payload.page_count,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error finalizing document:', error);
      throw error;
    }
  }

  static async getSummary(documentId: string): Promise<string> {
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }
}
