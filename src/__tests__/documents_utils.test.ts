/**
 * @fileoverview
 * Unit tests for src/lib/utils/documents_render_utils.ts
 * Test suite checks:
 *  - Supabase queries are called correctly
 *  - Data is returned as expected (both nested and flattened)
 *  - Errors are handled cleanly
 *  - Complex joins work properly
 */

import {
  getUserDocuments,
  getSharedDocuments,
} from "@/lib/utils/documents_render_utils";
import { supabase } from "@/lib/supabaseClient";

// Mock the Supabase client
jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockedSupabase = jest.mocked(supabase);

describe("documents_utils", () => {
  // Create mock chain functions
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();

  beforeEach(() => {
    // Setup the chain: from() → select() → eq() → order()
    mockedSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    mockSelect.mockReturnValue({
      eq: mockEq,
    } as any);

    mockEq.mockReturnValue({
      order: mockOrder,
    } as any);

    mockOrder.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // getUserDocuments()
  describe("getUserDocuments", () => {
    it("returns user's owned documents", async () => {
      // Arrange
      const mockDocuments = [
        {
          id: "doc-001",
          owner_id: "user-123",
          title: "My Document",
          status: "ready" as const,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-02T00:00:00Z",
          page_count: 5,
        },
        {
          id: "doc-002",
          owner_id: "user-123",
          title: "Another Doc",
          status: "processing" as const,
          created_at: "2025-01-03T00:00:00Z",
          updated_at: "2025-01-04T00:00:00Z",
          page_count: 10,
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockDocuments,
        error: null,
      });

      // Act
      const result = await getUserDocuments("user-123");

      // Assert
      expect(supabase.from).toHaveBeenCalledWith("documents");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("owner_id", "user-123");
      expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("My Document");
      expect(result[1].title).toBe("Another Doc");
    });

    it("returns empty array when user has no documents", async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getUserDocuments("user-123");

      expect(result).toEqual([]);
    });

    it("throws error when Supabase query fails", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      await expect(getUserDocuments("user-123")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("returns empty array when data is null but no error", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await getUserDocuments("user-123");
      expect(result).toEqual([]);
    });
  });

  // getSharedDocuments (nested format)
  describe("getSharedDocuments - nested format", () => {
    it("returns shared documents in nested format by default", async () => {
      // Arrange
      const mockSharedDocs = [
        {
          document_id: "doc-shared-001",
          permission_level: "edit" as const,
          documents: {
            id: "doc-shared-001",
            owner_id: "user-456",
            title: "Shared Whitepaper",
            status: "ready" as const,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
            page_count: 15,
            storage_path: "docs/shared.pdf",
          },
          shared_by: {
            username: "alice",
            full_name: "Alice Smith",
          },
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockSharedDocs,
        error: null,
      });

      // Act
      const result = await getSharedDocuments("user-123");

      // Assert
      expect(supabase.from).toHaveBeenCalledWith("document_shares");
      expect(mockEq).toHaveBeenCalledWith("shared_with_user_id", "user-123");
      expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].document_id).toBe("doc-shared-001");
      expect(result[0].permission_level).toBe("edit");
      expect(result[0].documents.title).toBe("Shared Whitepaper");
      expect(result[0].shared_by.username).toBe("alice");
    });

    it("handles multiple shared documents", async () => {
      const mockSharedDocs = [
        {
          document_id: "doc-001",
          permission_level: "view" as const,
          documents: {
            id: "doc-001",
            owner_id: "user-456",
            title: "Document 1",
            status: "ready" as const,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
          },
          shared_by: { username: "bob", full_name: "Bob Jones" },
        },
        {
          document_id: "doc-002",
          permission_level: "comment" as const,
          documents: {
            id: "doc-002",
            owner_id: "user-789",
            title: "Document 2",
            status: "ready" as const,
            created_at: "2025-01-03T00:00:00Z",
            updated_at: "2025-01-04T00:00:00Z",
          },
          shared_by: { username: "carol", full_name: "Carol White" },
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockSharedDocs,
        error: null,
      });

      const result = await getSharedDocuments("user-123");

      expect(result).toHaveLength(2);
      expect(result[0].permission_level).toBe("view");
      expect(result[1].permission_level).toBe("comment");
    });

    it("throws error when query fails", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: "Failed to fetch shares" },
      });

      await expect(getSharedDocuments("user-123")).rejects.toThrow(
        "Failed to fetch shares"
      );
    });

    it("returns empty array when no documents are shared", async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getSharedDocuments("user-123");
      expect(result).toEqual([]);
    });

    it("returns empty array when data is null but no error", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await getSharedDocuments("user-123");
      expect(result).toEqual([]);
    });
  });

  // getSharedDocuments (flattened format)
  describe("getSharedDocuments - flattened format", () => {
    it("returns flattened shared documents when flatten=true", async () => {
      // Arrange
      const mockSharedDocs = [
        {
          document_id: "doc-shared-001",
          permission_level: "edit" as const,
          documents: {
            id: "doc-shared-001",
            owner_id: "user-456",
            title: "Shared Whitepaper",
            status: "ready" as const,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
            page_count: 15,
            storage_path: "docs/shared.pdf",
            file_size: 2048,
            storage_bucket: "documents",
          },
          shared_by: {
            username: "alice",
            full_name: "Alice Smith",
          },
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockSharedDocs,
        error: null,
      });

      // Act
      const result = await getSharedDocuments("user-123", true);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("doc-shared-001");
      expect(result[0].title).toBe("Shared Whitepaper");
      expect(result[0].permission_level).toBe("edit");
      expect(result[0].shared_by.username).toBe("alice");
      // Check that document fields are at top level
      expect(result[0].owner_id).toBe("user-456");
      expect(result[0].page_count).toBe(15);
      expect(result[0].storage_path).toBe("docs/shared.pdf");
    });

    it("flattens multiple documents correctly", async () => {
      const mockSharedDocs = [
        {
          document_id: "doc-001",
          permission_level: "view" as const,
          documents: {
            id: "doc-001",
            owner_id: "user-456",
            title: "Doc 1",
            status: "ready" as const,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
          },
          shared_by: { username: "bob", full_name: "Bob Jones" },
        },
        {
          document_id: "doc-002",
          permission_level: "edit" as const,
          documents: {
            id: "doc-002",
            owner_id: "user-789",
            title: "Doc 2",
            status: "processing" as const,
            created_at: "2025-01-03T00:00:00Z",
            updated_at: "2025-01-04T00:00:00Z",
          },
          shared_by: { username: "carol", full_name: "Carol White" },
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockSharedDocs,
        error: null,
      });

      const result = await getSharedDocuments("user-123", true);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Doc 1");
      expect(result[0].permission_level).toBe("view");
      expect(result[1].title).toBe("Doc 2");
      expect(result[1].permission_level).toBe("edit");
    });

    it("preserves all document fields when flattening", async () => {
      const mockSharedDocs = [
        {
          document_id: "doc-001",
          permission_level: "comment" as const,
          documents: {
            id: "doc-001",
            owner_id: "user-456",
            title: "Complete Doc",
            status: "ready" as const,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
            file_size: 1024,
            page_count: 20,
            storage_bucket: "docs",
            storage_path: "path/to/doc.pdf",
            bytes: 512,
            raw_text_bytes: 256,
          },
          shared_by: { username: "dan", full_name: "Dan Lee" },
        },
      ];

      mockOrder.mockResolvedValueOnce({
        data: mockSharedDocs,
        error: null,
      });

      const result = await getSharedDocuments("user-123", true);

      expect(result[0].file_size).toBe(1024);
      expect(result[0].page_count).toBe(20);
      expect(result[0].storage_bucket).toBe("docs");
      expect(result[0].storage_path).toBe("path/to/doc.pdf");
      expect(result[0].bytes).toBe(512);
      expect(result[0].raw_text_bytes).toBe(256);
    });

    it("returns empty array when no shared documents exist (flatten=true)", async () => {
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getSharedDocuments("user-123", true);
      expect(result).toEqual([]);
    });
  });
});
