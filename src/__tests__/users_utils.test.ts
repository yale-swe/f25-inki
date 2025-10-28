/**
 * @fileoverview
 * Unit tests for src/lib/utils/users_utils.ts
 * Test suite checks:
 *  - Supabase queries are called correctly
 *  - Data is returned as expected
 *  - Errors are handled cleanly
 *  - Edge cases like missing fields and timestamp updates
 */

import { getUserProfile, updateUserProfile } from "@/lib/utils/users_utils";
import { supabase } from "@/lib/supabaseClient";

// Mock the Supabase client with proper query chain
jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockedSupabase = jest.mocked(supabase);

describe("users_utils", () => {
  // Create mock chain functions
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockUpdate = jest.fn();

  beforeEach(() => {
    // Setup the chain: from() → select()/update()
    mockedSupabase.from.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    } as any);

    // For getUserProfile: select() → eq() → single()
    // For updateUserProfile after eq: select() → single()
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,  // For when select comes after eq
    } as any);

    // For updateUserProfile: update() → eq() → select() → single()
    mockUpdate.mockReturnValue({
      eq: mockEq,
    } as any);

    // eq() can lead to either single() or select()
    mockEq.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
    } as any);

    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // getUserProfile
  describe("getUserProfile", () => {
    it("returns user data when profile exists", async () => {
      // Arrange
      const mockProfile = {
        id: "user-123",
        username: "eva",
        bio_text: "hi there",
        full_name: "Eva Z",
        avatar_url: "https://example.com/avatar.png",
      };

      mockSingle.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      // Act
      const result = await getUserProfile("user-123");

      // Assert
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockSingle).toHaveBeenCalled();
    //   expect(result).not.toBeNull();
      expect(result).toEqual(mockProfile);
    });

    it("throws an error when Supabase returns error", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Profile not found" },
      });

      await expect(getUserProfile("bad-id")).rejects.toThrow("Profile not found");
    });

    it("returns null if Supabase returns no data and no error", async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: null });
        const result = await getUserProfile("missing-user");
        expect(result).toBeNull();
    });

    it("handles partial user profiles with optional fields", async () => {
      const partialProfile = {
        id: "user-999",
        username: "partial",
        full_name: null,
        avatar_url: null,
        bio_text: "",
      };
      mockSingle.mockResolvedValueOnce({ data: partialProfile, error: null });

      const result = await getUserProfile("user-999");

      expect(result).toEqual(partialProfile);
      expect(result?.full_name).toBeNull();
      expect(result?.bio_text).toBe("");
    });
  });


  // updateUserProfile
  describe("updateUserProfile", () => {
    it("updates and returns the updated profile", async () => {
      const mockUpdated = {
        id: "user-123",
        bio_text: "updated bio",
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await updateUserProfile("user-123", { bio_text: "updated bio" });

      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ bio_text: "updated bio" })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockSelect).toHaveBeenCalled();
    //   expect(result).not.toBeNull();
      expect(result?.bio_text).toBe("updated bio");
    });

    it("throws when Supabase returns error", async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Permission denied" },
      });

      await expect(updateUserProfile("user-123", { bio_text: "oops" }))
        .rejects.toThrow("Permission denied");
    });

    it("adds updated_at timestamp automatically", async () => {
      const now = Date.now;
      Date.now = jest.fn(() => 1730000000000); // fixed timestamp

      const mockUpdated = {
        id: "user-123",
        bio_text: "new bio",
        updated_at: new Date(1730000000000).toISOString(),
      };
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await updateUserProfile("user-123", { bio_text: "new bio" });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          bio_text: "new bio",
          updated_at: expect.any(String),
        })
      );
      expect(result?.updated_at).toBe(mockUpdated.updated_at);

      Date.now = now; // restore
    });

    it("updates multiple fields correctly", async () => {
      const mockUpdated = {
        id: "user-888",
        username: "updated_user",
        full_name: "Updated Name",
        bio_text: "Refreshed bio",
        updated_at: new Date().toISOString(),
      };
      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await updateUserProfile("user-888", {
        username: "updated_user",
        full_name: "Updated Name",
        bio_text: "Refreshed bio",
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "updated_user",
          full_name: "Updated Name",
          bio_text: "Refreshed bio",
        })
      );
      expect(result?.username).toBe("updated_user");
    });

    it("returns null when no updated data but no error", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateUserProfile("user-123", { bio_text: "ok" });
      expect(result).toBeNull();
    });

  });
});
