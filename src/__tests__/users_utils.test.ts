/**
 * @fileoverview
 * Unit tests for src/lib/utils/users_utils.ts
 * Verifies Supabase query behavior, data handling, and edge cases.
 */

import { getUserProfile, updateUserProfile } from "@/lib/utils/users_utils";
import { supabase } from "@/lib/supabaseClient";

// Create typed mocks inline

// Define a small interface describing the chained Supabase methods you use
interface SupabaseTableMock {
  select: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

// Mock the Supabase client module before any imports use it
jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Strongly type the mocked Supabase client
const mockedSupabase = jest.mocked(supabase);

// Individual mocks for chain methods
const mockSelect: jest.Mock = jest.fn();
const mockUpdate: jest.Mock = jest.fn();
const mockEq: jest.Mock = jest.fn();
const mockSingle: jest.Mock = jest.fn();


beforeEach(() => {
  // Clear all mocks between tests
  jest.clearAllMocks();

  // Reset base mock behavior
  mockSingle.mockResolvedValue({ data: null, error: null });

  // Chain behavior: from() → select()/update()
  mockedSupabase.from.mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
} as unknown as ReturnType<typeof supabase.from>);

  // select() → eq() → single()
  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  } satisfies Pick<SupabaseTableMock, "eq" | "single">);

  // update() → eq()
  mockUpdate.mockReturnValue({
    eq: mockEq,
  } satisfies Pick<SupabaseTableMock, "eq">);

  // eq() → select()/single()
  mockEq.mockReturnValue({
    select: mockSelect,
    single: mockSingle,
  } satisfies Pick<SupabaseTableMock, "select" | "single">);
});


// Tests

describe("users_utils", () => {
  // getUserProfile
  describe("getUserProfile", () => {
    it("returns user data when profile exists", async () => {
      const mockProfile = {
        id: "user-123",
        username: "eva",
        bio_text: "hi there",
        full_name: "Eva Z",
        avatar_url: "https://example.com/avatar.png",
      };

      mockSingle.mockResolvedValueOnce({ data: mockProfile, error: null });

      const result = await getUserProfile("user-123");

      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockSingle).toHaveBeenCalled();
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

      mockSingle.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await updateUserProfile("user-123", { bio_text: "updated bio" });

      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ bio_text: "updated bio" })
      );
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockSelect).toHaveBeenCalled();
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
      const originalNow = Date.now;
      Date.now = jest.fn(() => 1730000000000);

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

      Date.now = originalNow;
    });

    it("returns null when no updated data but no error", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      const result = await updateUserProfile("user-123", { bio_text: "ok" });
      expect(result).toBeNull();
    });
  });
});
