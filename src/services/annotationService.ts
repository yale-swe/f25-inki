import { supabase } from '@/lib/supabaseClient';
import type { 
  Annotation, 
  AnnotationWithUser, 
  CreateHighlightInput, 
  CreateCommentInput,
  PermissionLevel,
  AnnotationPermissions 
} from '@/lib/types/annotation';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class AnnotationService {
  static async getAnnotations(documentId: string): Promise<AnnotationWithUser[]> {
    try {
      // join profiles table to get user info for each annotation
      const { data, error } = await supabase
        .from('annotations')
        .select(`
          *,
          user:profiles!annotations_user_id_fkey(
            id,
            username,
            full_name
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching annotations:', error);
        throw error;
      }

      return (data || []) as AnnotationWithUser[];
    } catch (error) {
      console.error('Error in getAnnotations:', error);
      throw error;
    }
  }

  static async createHighlight(input: CreateHighlightInput): Promise<Annotation> {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      
      if (authError || !data?.user) {
        throw new Error('User not authenticated');
      }

      const { data: annotationData, error } = await supabase
        .from('annotations')
        .insert({
          document_id: input.document_id,
          user_id: data.user.id,
          type: 'highlight',
          parent_id: null,
          content: null,
          selection_start: input.selection_start,
          selection_end: input.selection_end,
          selection_text: input.selection_text
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating highlight:', error);
        throw error;
      }

      return annotationData;
    } catch (error) {
      console.error('Error in createHighlight:', error);
      throw error;
    }
  }

  static async createComment(input: CreateCommentInput): Promise<Annotation> {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      
      if (authError || !data?.user) {
        throw new Error('User not authenticated');
      }

      const { data: annotationData, error } = await supabase
        .from('annotations')
        .insert({
          document_id: input.document_id,
          user_id: data.user.id,
          type: 'comment',
          parent_id: input.parent_id,
          content: input.content,
          selection_start: null,
          selection_end: null,
          selection_text: null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        throw error;
      }

      return annotationData;
    } catch (error) {
      console.error('Error in createComment:', error);
      throw error;
    }
  }

  static async deleteAnnotation(annotationId: string): Promise<void> {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      
      if (authError || !data?.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', annotationId);

      if (error) {
        console.error('Error deleting annotation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAnnotation:', error);
      throw error;
    }
  }

  static subscribeToAnnotations(
    documentId: string,
    onInsert: (annotation: Annotation) => void,
    onUpdate: (annotation: Annotation) => void,
    onDelete: (annotationId: string) => void
  ): RealtimeChannel {
    // supabase realtime needs eq. syntax
    const channel = supabase
      .channel(`annotations:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'annotations',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          onInsert(payload.new as Annotation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'annotations',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          onUpdate(payload.new as Annotation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'annotations',
          filter: `document_id=eq.${documentId}`
        },
        (payload) => {
          onDelete((payload.old as Annotation).id);
        }
      )
      .subscribe();

    return channel;
  }

  static getAnnotationPermissions(
    permissionLevel: PermissionLevel,
    currentUserId: string | undefined,
    documentOwnerId: string
  ): AnnotationPermissions {
    const canView = permissionLevel !== null;
    const canCreate = 
      permissionLevel === 'owner' || 
      permissionLevel === 'edit' || 
      permissionLevel === 'comment';
    
    // check per annotation
    const canDelete = (annotation: Annotation): boolean => {
      // owner gets to delete anything on their doc
      if (currentUserId === documentOwnerId) {
        return true;
      }
      if (currentUserId === annotation.user_id) {
        return true;
      }
      return false;
    };

    return {
      canView,
      canCreate,
      canDelete
    };
  }
}

