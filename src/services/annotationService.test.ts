import { AnnotationService } from './annotationService';
import { supabase } from '@/lib/supabaseClient';
import type { 
  Annotation, 
  AnnotationWithUser, 
  CreateHighlightInput, 
  CreateCommentInput,
  PermissionLevel,
  AnnotationPermissions 
} from '@/lib/types/annotation';

const mockChannelMethod = jest.fn();
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    },
    channel: jest.fn(() => mockChannelMethod()),
    removeChannel: jest.fn()
  }
}));

describe('AnnotationService', () => {
  const mockQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    single: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.insert.mockReturnValue(mockQuery);
    mockQuery.delete.mockReturnValue(mockQuery);
    mockQuery.single.mockReturnValue(mockQuery);
  });

  describe('getAnnotations', () => {
    it('should fetch annotations with user data successfully', async () => {
      const documentId = 'doc-123';
      const mockAnnotations: AnnotationWithUser[] = [
        {
          id: 'ann-1',
          document_id: documentId,
          user_id: 'user-1',
          type: 'highlight',
          parent_id: null,
          content: null,
          selection_start: 0,
          selection_end: 10,
          selection_text: 'test text',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            username: 'testuser',
            full_name: 'Test User'
          }
        }
      ];

      mockQuery.order.mockResolvedValue({
        data: mockAnnotations,
        error: null
      });

      const result = await AnnotationService.getAnnotations(documentId);

      expect(supabase.from).toHaveBeenCalledWith('annotations');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('document_id', documentId);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(mockAnnotations);
    });

    it('should handle errors when fetching annotations', async () => {
      const documentId = 'doc-123';
      const error = new Error('Database error');

      mockQuery.order.mockResolvedValue({
        data: null,
        error
      });

      await expect(AnnotationService.getAnnotations(documentId)).rejects.toThrow('Database error');
    });

    it('should return empty array when no annotations found', async () => {
      const documentId = 'doc-123';

      mockQuery.order.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await AnnotationService.getAnnotations(documentId);
      expect(result).toEqual([]);
    });
  });

  describe('createHighlight', () => {
    it('should create a highlight successfully', async () => {
      const mockUser = { id: 'user-1' };
      const input: CreateHighlightInput = {
        document_id: 'doc-123',
        selection_start: 0,
        selection_end: 10,
        selection_text: 'selected text'
      };

      const mockAnnotation: Annotation = {
        id: 'ann-1',
        document_id: input.document_id,
        user_id: mockUser.id,
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: input.selection_start,
        selection_end: input.selection_end,
        selection_text: input.selection_text,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery.single.mockResolvedValue({
        data: mockAnnotation,
        error: null
      });

      const result = await AnnotationService.createHighlight(input);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        document_id: input.document_id,
        user_id: mockUser.id,
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: input.selection_start,
        selection_end: input.selection_end,
        selection_text: input.selection_text
      });
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw error when user is not authenticated', async () => {
      const input: CreateHighlightInput = {
        document_id: 'doc-123',
        selection_start: 0,
        selection_end: 10,
        selection_text: 'selected text'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(AnnotationService.createHighlight(input)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-1' };
      const input: CreateHighlightInput = {
        document_id: 'doc-123',
        selection_start: 0,
        selection_end: 10,
        selection_text: 'selected text'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const error = new Error('Database error');
      mockQuery.single.mockResolvedValue({
        data: null,
        error
      });

      await expect(AnnotationService.createHighlight(input)).rejects.toThrow('Database error');
    });
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const mockUser = { id: 'user-1' };
      const input: CreateCommentInput = {
        document_id: 'doc-123',
        parent_id: 'ann-1',
        content: 'This is a comment'
      };

      const mockAnnotation: Annotation = {
        id: 'ann-2',
        document_id: input.document_id,
        user_id: mockUser.id,
        type: 'comment',
        parent_id: input.parent_id,
        content: input.content,
        selection_start: null,
        selection_end: null,
        selection_text: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery.single.mockResolvedValue({
        data: mockAnnotation,
        error: null
      });

      const result = await AnnotationService.createComment(input);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        document_id: input.document_id,
        user_id: mockUser.id,
        type: 'comment',
        parent_id: input.parent_id,
        content: input.content,
        selection_start: null,
        selection_end: null,
        selection_text: null
      });
      expect(result).toEqual(mockAnnotation);
    });

    it('should throw error when user is not authenticated', async () => {
      const input: CreateCommentInput = {
        document_id: 'doc-123',
        parent_id: 'ann-1',
        content: 'This is a comment'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(AnnotationService.createComment(input)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-1' };
      const input: CreateCommentInput = {
        document_id: 'doc-123',
        parent_id: 'ann-1',
        content: 'This is a comment'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const error = new Error('Database error');
      mockQuery.single.mockResolvedValue({
        data: null,
        error
      });

      await expect(AnnotationService.createComment(input)).rejects.toThrow('Database error');
    });
  });

  describe('deleteAnnotation', () => {
    it('should delete an annotation successfully', async () => {
      const mockUser = { id: 'user-1' };
      const annotationId = 'ann-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery.eq.mockResolvedValue({
        error: null
      });

      await AnnotationService.deleteAnnotation(annotationId);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', annotationId);
    });

    it('should throw error when user is not authenticated', async () => {
      const annotationId = 'ann-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(AnnotationService.deleteAnnotation(annotationId)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-1' };
      const annotationId = 'ann-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const error = new Error('Database error');
      mockQuery.eq.mockResolvedValue({
        error
      });

      await expect(AnnotationService.deleteAnnotation(annotationId)).rejects.toThrow('Database error');
    });
  });

  describe('subscribeToAnnotations', () => {
    it('should subscribe to annotation changes', () => {
      const documentId = 'doc-123';
      const onInsert = jest.fn();
      const onUpdate = jest.fn();
      const onDelete = jest.fn();

      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis()
      };

      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const channel = AnnotationService.subscribeToAnnotations(
        documentId,
        onInsert,
        onUpdate,
        onDelete
      );

      expect(supabase.channel).toHaveBeenCalledWith(`annotations:${documentId}`);
      expect(mockChannel.on).toHaveBeenCalledTimes(3);
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(channel).toBe(mockChannel);
    });
  });

  describe('getAnnotationPermissions', () => {
    it('should return correct permissions for owner', () => {
      const permissionLevel: PermissionLevel = 'owner';
      const currentUserId = 'user-1';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-2' } as Annotation)).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-1' } as Annotation)).toBe(true);
    });

    it('should return correct permissions for edit level', () => {
      const permissionLevel: PermissionLevel = 'edit';
      const currentUserId = 'user-2';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-2' } as Annotation)).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-3' } as Annotation)).toBe(false);
    });

    it('should return correct permissions for comment level', () => {
      const permissionLevel: PermissionLevel = 'comment';
      const currentUserId = 'user-2';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-2' } as Annotation)).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-3' } as Annotation)).toBe(false);
    });

    it('should return correct permissions for view level', () => {
      const permissionLevel: PermissionLevel = 'view';
      const currentUserId = 'user-2';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canDelete({ user_id: 'user-2' } as Annotation)).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-3' } as Annotation)).toBe(false);
    });

    it('should return correct permissions for public level', () => {
      const permissionLevel: PermissionLevel = 'public';
      const currentUserId = undefined;
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      expect(permissions.canView).toBe(true);
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canDelete({ user_id: 'user-2' } as Annotation)).toBe(false);
      expect(permissions.canDelete({ user_id: 'user-1' } as Annotation)).toBe(false);
    });

    it('should return correct permissions when permission level is null', () => {
      const permissionLevel: PermissionLevel = null;
      const currentUserId = 'user-2';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      expect(permissions.canView).toBe(false);
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canDelete({ user_id: 'user-2' } as Annotation)).toBe(true);
      expect(permissions.canDelete({ user_id: 'user-3' } as Annotation)).toBe(false);
    });

    it('should allow document owner to delete any annotation', () => {
      const permissionLevel: PermissionLevel = 'owner';
      const currentUserId = 'user-1';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      const annotation: Annotation = { user_id: 'user-999' } as Annotation;
      expect(permissions.canDelete(annotation)).toBe(true);
    });

    it('should allow users to delete their own annotations', () => {
      const permissionLevel: PermissionLevel = 'edit';
      const currentUserId = 'user-2';
      const documentOwnerId = 'user-1';

      const permissions = AnnotationService.getAnnotationPermissions(
        permissionLevel,
        currentUserId,
        documentOwnerId
      );

      const annotation: Annotation = { user_id: 'user-2' } as Annotation;
      expect(permissions.canDelete(annotation)).toBe(true);
    });
  });
});

