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
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
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
          public_id: input.public_id,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) {
        throw error;
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
          public_id: meta.public_id,
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
}
