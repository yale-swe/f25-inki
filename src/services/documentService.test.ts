import { DocumentService } from './documentService';
import { supabase } from '@/lib/supabaseClient';
import type { Document, DocumentCreateInput } from '@/lib/types/document';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    },
    rpc: jest.fn()
  }
}));

interface MockQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  single: jest.Mock;
  then: jest.Mock;
  _setResolveValue: (value: { data?: unknown; error?: Error | null }) => void;
}

describe('DocumentService', () => {
  const createMockQuery = (): MockQueryBuilder => {
    let resolveValue: { data?: unknown; error?: Error | null } = { data: null, error: null };
    
    const queryBuilder = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      single: jest.fn(),
      then: jest.fn((onResolve?: (value: unknown) => unknown, onReject?: (reason?: unknown) => unknown) => {
        const result = Promise.resolve(resolveValue);
        return result.then(onResolve, onReject);
      }),
      _setResolveValue: (value: { data?: unknown; error?: Error | null }) => {
        resolveValue = value;
      }
    };
    
    return queryBuilder as MockQueryBuilder;
  };

  let mockQuery: MockQueryBuilder;

  beforeEach(() => {
    mockQuery = createMockQuery();
    jest.clearAllMocks();
    
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockImplementation(() => mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.insert.mockReturnValue(mockQuery);
    mockQuery.update.mockReturnValue(mockQuery);
    mockQuery.delete.mockReturnValue(mockQuery);
    mockQuery.single.mockReturnValue(mockQuery);
    
    mockQuery._setResolveValue({ data: null, error: null });
    
    (supabase.from as jest.Mock).mockReturnValue(mockQuery);
  });

  describe('getUserDocuments', () => {
    it('should fetch user documents successfully', async () => {
      const mockUser = { id: 'user-1' };
      const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          owner_id: 'user-1',
          title: 'Test Document',
          file_path: '/path/to/file',
          file_size: 1024,
          mime_type: 'application/pdf',
          storage_bucket: 'bucket',
          storage_path: '/path',
          bytes: 1024,
          page_count: 1,
          status: 'ready',
          public_id: null,
          raw_text: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        data: mockDocuments,
        error: null
      });

      const result = await DocumentService.getUserDocuments();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockDocuments);
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Auth error');

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: authError
      });

      await expect(DocumentService.getUserDocuments()).rejects.toThrow('Authentication error: Auth error');
    });

    it('should handle unauthenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(DocumentService.getUserDocuments()).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-1' };
      const dbError = new Error('Database error');

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        data: null,
        error: dbError
      });

      await expect(DocumentService.getUserDocuments()).rejects.toThrow('Database error: Database error');
    });

    it('should return empty array when no documents found', async () => {
      const mockUser = { id: 'user-1' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        data: [],
        error: null
      });

      const result = await DocumentService.getUserDocuments();
      expect(result).toEqual([]);
    });
  });

  describe('getDocument', () => {
    it('should fetch document with owner permission level', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [{
          id: documentId,
          owner_id: 'user-1',
          title: 'Test Document',
          file_path: '/path/to/file',
          file_size: 1024,
          mime_type: 'application/pdf',
          storage_bucket: 'bucket',
          storage_path: '/path',
          bytes: 1024,
          page_count: 1,
          status: 'ready',
          public_id: null,
          raw_text: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_public: false,
          permission_level: null
        }],
        error: null
      });

      const result = await DocumentService.getDocument(documentId);

      expect(supabase.rpc).toHaveBeenCalledWith('get_document_info', { doc_id: documentId });
      expect(result).not.toBeNull();
      expect(result?.permission_level).toBe('owner');
    });

    it('should fetch document with explicit permission level', async () => {
      const mockUser = { id: 'user-2' };
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [{
          id: documentId,
          owner_id: 'user-1',
          title: 'Test Document',
          file_path: '/path/to/file',
          file_size: 1024,
          mime_type: 'application/pdf',
          storage_bucket: 'bucket',
          storage_path: '/path',
          bytes: 1024,
          page_count: 1,
          status: 'ready',
          public_id: null,
          raw_text: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_public: false,
          permission_level: 'edit'
        }],
        error: null
      });

      const result = await DocumentService.getDocument(documentId);

      expect(result).not.toBeNull();
      expect(result?.permission_level).toBe('edit');
    });

    it('should fetch public document for unauthenticated user', async () => {
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [{
          id: documentId,
          owner_id: 'user-1',
          title: 'Test Document',
          file_path: '/path/to/file',
          file_size: 1024,
          mime_type: 'application/pdf',
          storage_bucket: 'bucket',
          storage_path: '/path',
          bytes: 1024,
          page_count: 1,
          status: 'ready',
          public_id: null,
          raw_text: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_public: true,
          permission_level: null
        }],
        error: null
      });

      const result = await DocumentService.getDocument(documentId);

      expect(result).not.toBeNull();
      expect(result?.permission_level).toBe('public');
    });

    it('should fetch public document for authenticated user', async () => {
      const mockUser = { id: 'user-2' };
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [{
          id: documentId,
          owner_id: 'user-1',
          title: 'Test Document',
          file_path: '/path/to/file',
          file_size: 1024,
          mime_type: 'application/pdf',
          storage_bucket: 'bucket',
          storage_path: '/path',
          bytes: 1024,
          page_count: 1,
          status: 'ready',
          public_id: null,
          raw_text: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_public: true,
          permission_level: null
        }],
        error: null
      });

      const result = await DocumentService.getDocument(documentId);

      expect(result).not.toBeNull();
      expect(result?.permission_level).toBe('view');
    });

    it('should return null when document not found', async () => {
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null
      });

      const result = await DocumentService.getDocument(documentId);
      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      const documentId = 'doc-1';
      const error = new Error('RPC error');

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error
      });

      await expect(DocumentService.getDocument(documentId)).rejects.toThrow('RPC error');
    });
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      const mockUser = { id: 'user-1' };
      const input: DocumentCreateInput = {
        title: 'New Document',
        mime_type: 'application/pdf',
        bytes: 1024,
        page_count: 1,
        raw_text: 'Content',
        storage_bucket: 'bucket',
        storage_path: '/path'
      };

      const mockDocument: Document = {
        id: 'doc-1',
        owner_id: mockUser.id,
        title: input.title,
        file_path: input.storage_path || null,
        file_size: null,
        mime_type: input.mime_type,
        storage_bucket: input.storage_bucket || null,
        storage_path: input.storage_path || null,
        bytes: input.bytes,
        page_count: input.page_count,
        status: 'ready',
        public_id: null,
        raw_text: input.raw_text,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        data: mockDocument,
        error: null
      });

      const result = await DocumentService.createDocument(input);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        owner_id: mockUser.id,
        title: input.title,
        file_path: input.storage_path,
        mime_type: input.mime_type,
        bytes: input.bytes,
        page_count: input.page_count,
        raw_text: input.raw_text,
        storage_bucket: input.storage_bucket,
        storage_path: input.storage_path,
        status: 'ready'
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw error when user is not authenticated', async () => {
      const input: DocumentCreateInput = {
        title: 'New Document',
        mime_type: 'application/pdf',
        bytes: 1024,
        page_count: 1,
        raw_text: 'Content'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(DocumentService.createDocument(input)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors when creating document', async () => {
      const mockUser = { id: 'user-1' };
      const input: DocumentCreateInput = {
        title: 'New Document',
        mime_type: 'application/pdf',
        bytes: 1024,
        page_count: 1,
        raw_text: 'Content',
        storage_bucket: 'bucket',
        storage_path: '/path'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const dbError = new Error('Database error');
      mockQuery._setResolveValue({
        data: null,
        error: dbError
      });

      await expect(DocumentService.createDocument(input)).rejects.toThrow('Database error');
    });
  });

  describe('updateDocumentStatus', () => {
    it('should update document status successfully', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';
      const status: 'processing' | 'ready' | 'error' = 'ready';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        error: null
      });

      await DocumentService.updateDocumentStatus(documentId, status);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.update).toHaveBeenCalledWith({
        status,
        updated_at: expect.any(String)
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', documentId);
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('should throw error when user is not authenticated', async () => {
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(DocumentService.updateDocumentStatus(documentId, 'ready')).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors when updating status', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const dbError = new Error('Database error');
      mockQuery._setResolveValue({
        error: dbError
      });

      await expect(DocumentService.updateDocumentStatus(documentId, 'ready')).rejects.toThrow('Database error');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock RPC response
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [
          {
            id: documentId,
            storage_bucket: null,
            storage_path: null
          }
        ],
        error: null
      });

      // Ensure storage API exists
      (supabase as any).storage = {
        from: jest.fn()
      };

      // Mock storage removal
      (supabase.storage.from as jest.Mock).mockReturnValue({
        remove: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      await DocumentService.deleteDocument(documentId);

      expect(supabase.rpc).toHaveBeenCalledWith("delete_document", {
        p_document_id: documentId,
      });
    });

    it('should throw error when user is not authenticated', async () => {
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null
      });

      await expect(DocumentService.deleteDocument(documentId)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors when deleting document', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      });

      await expect(DocumentService.deleteDocument(documentId)).rejects.toThrow('Database error');
    });
  });

  describe('createProcessingDocument', () => {
    it('should create a processing document successfully', async () => {
      const mockUser = { id: 'user-1' };
      const meta = {
        title: 'New Document',
        storage_bucket: 'bucket',
        storage_path: '/path',
        mime_type: 'application/pdf',
        bytes: 1024
      };

      const mockDocument: Document = {
        id: 'doc-1',
        owner_id: mockUser.id,
        title: meta.title,
        file_path: meta.storage_path,
        file_size: null,
        mime_type: meta.mime_type,
        storage_bucket: meta.storage_bucket,
        storage_path: meta.storage_path,
        bytes: meta.bytes,
        page_count: null,
        status: 'processing',
        public_id: null,
        raw_text: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        data: mockDocument,
        error: null
      });

      const result = await DocumentService.createProcessingDocument(meta);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        owner_id: mockUser.id,
        title: meta.title,
        file_path: meta.storage_path,
        storage_bucket: meta.storage_bucket,
        storage_path: meta.storage_path,
        mime_type: meta.mime_type,
        bytes: meta.bytes,
        status: 'processing'
      });
      expect(result).toEqual(mockDocument);
    });

    it('should handle authentication errors', async () => {
      const meta = {
        title: 'New Document',
        storage_bucket: 'bucket',
        storage_path: '/path',
        mime_type: 'application/pdf',
        bytes: 1024
      };

      const authError = new Error('Auth error');

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: authError
      });

      await expect(DocumentService.createProcessingDocument(meta)).rejects.toThrow('Authentication error: Auth error');
    });

    it('should handle database errors when creating processing document', async () => {
      const mockUser = { id: 'user-1' };
      const meta = {
        title: 'New Document',
        storage_bucket: 'bucket',
        storage_path: '/path',
        mime_type: 'application/pdf',
        bytes: 1024
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const dbError = new Error('Database error');
      mockQuery._setResolveValue({
        data: null,
        error: dbError
      });

      await expect(DocumentService.createProcessingDocument(meta)).rejects.toThrow('Database error: Database error');
    });
  });

  describe('finalizeDocument', () => {
    it('should finalize document successfully', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';
      const payload = {
        raw_text: 'Final content',
        page_count: 5
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        error: null
      });

      await DocumentService.finalizeDocument(documentId, payload);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockQuery.update).toHaveBeenCalledWith({
        raw_text: payload.raw_text,
        page_count: payload.page_count,
        status: 'ready',
        updated_at: expect.any(String)
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', documentId);
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('should handle authentication errors', async () => {
      const documentId = 'doc-1';
      const payload = {
        raw_text: 'Final content',
        page_count: 5
      };

      const authError = new Error('Auth error');

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: authError
      });

      await expect(DocumentService.finalizeDocument(documentId, payload)).rejects.toThrow('Authentication error: Auth error');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-1' };
      const documentId = 'doc-1';
      const payload = {
        raw_text: 'Final content',
        page_count: 5
      };
      const dbError = new Error('Database error');

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockQuery._setResolveValue({
        error: dbError
      });

      await expect(DocumentService.finalizeDocument(documentId, payload)).rejects.toThrow('Database error: Database error');
    });
  });
});

