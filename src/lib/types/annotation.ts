export type AnnotationType = 'highlight' | 'comment';

export type PermissionLevel = 'owner' | 'edit' | 'comment' | 'view' | 'public' | null;

export interface Annotation {
  id: string;
  document_id: string;
  user_id: string;
  type: AnnotationType;
  parent_id: string | null;
  content: string | null;
  selection_start: number | null;
  selection_end: number | null;
  selection_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnotationWithUser extends Annotation {
  user: {
    id: string;
    username: string;
    full_name: string | null;
  };
}

export interface CreateHighlightInput {
  document_id: string;
  selection_start: number;
  selection_end: number;
  selection_text: string;
}

export interface CreateCommentInput {
  document_id: string;
  parent_id: string;
  content: string;
}

export interface AnnotationPermissions {
  canView: boolean;
  canCreate: boolean;
  canDelete: (annotation: Annotation) => boolean;
}

export interface AnnotationThread {
  highlight: AnnotationWithUser;
  comments: AnnotationWithUser[];
}

