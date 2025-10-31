/**
 * @fileoverview
 * Unit tests for src/lib/utils/friends_utils.ts
 */

import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from "@/lib/utils/friends_utils";
import { supabase } from "@/lib/supabaseClient";

jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockedSupabase = jest.mocked(supabase);

describe("friends_utils", () => {
  let mockChain: any;

  beforeEach(() => {
    // Create mock chain object
    mockChain = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      or: jest.fn(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    // Setup default chaining behavior
    mockChain.select.mockReturnValue(mockChain);
    mockChain.insert.mockReturnValue(mockChain);
    mockChain.update.mockReturnValue(mockChain);
    mockChain.delete.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.or.mockReturnValue(mockChain);

    // Default terminal responses
    mockChain.single.mockResolvedValue({ data: null, error: null });
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });

    mockedSupabase.from.mockReturnValue(mockChain);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // getFriends
  // --------------------------------------------------------------------------
  describe("getFriends", () => {
    it("returns accepted friends correctly", async () => {
      const mockData = [
        {
          id: "f-001",
          status: "accepted",
          requester_id: "user-1",
          addressee_id: "user-2",
          requester: { id: "user-1", username: "alice" },
          addressee: { id: "user-2", username: "bob" },
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
        },
      ];
      
      // Chain: select().or().eq() - last eq resolves
      mockChain.eq.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getFriends("user-1");

      expect(supabase.from).toHaveBeenCalledWith("friendships");
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.or).toHaveBeenCalledWith(
        `requester_id.eq.user-1,addressee_id.eq.user-1`
      );
      expect(mockChain.eq).toHaveBeenCalledWith("status", "accepted");
      expect(result).toHaveLength(1);
      expect(result[0].friend.username).toBe("bob");
    });

    it("returns empty array when no friends", async () => {
      mockChain.eq.mockResolvedValueOnce({ data: [], error: null });
      const result = await getFriends("user-1");
      expect(result).toEqual([]);
    });

    it("returns empty array when data is null", async () => {
      mockChain.eq.mockResolvedValueOnce({ data: null, error: null });
      const result = await getFriends("user-1");
      expect(result).toEqual([]);
    });

    it("throws if Supabase returns error", async () => {
      mockChain.eq.mockResolvedValueOnce({
        data: null,
        error: { message: "Query failed" },
      });
      await expect(getFriends("user-1")).rejects.toThrow("Query failed");
    });

    it("correctly identifies friend when user is addressee", async () => {
      const mockData = [
        {
          id: "f-001",
          status: "accepted",
          requester_id: "user-2",
          addressee_id: "user-1",
          requester: { id: "user-2", username: "bob" },
          addressee: { id: "user-1", username: "alice" },
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
        },
      ];
      
      mockChain.eq.mockResolvedValueOnce({ data: mockData, error: null });
      const result = await getFriends("user-1");
      
      expect(result[0].friend.username).toBe("bob");
    });
  });

  // --------------------------------------------------------------------------
  // getPendingRequests
  // --------------------------------------------------------------------------
  describe("getPendingRequests", () => {
    it("returns pending requests sent to current user", async () => {
      const mockData = [
        {
          id: "f-002",
          status: "pending",
          requester_id: "user-3",
          addressee_id: "user-1",
          requester: { id: "user-3", username: "charlie" },
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
        },
      ];
      
      // Chain: select().eq().eq() - first eq returns chain, second resolves
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getPendingRequests("user-1");

      expect(mockChain.eq).toHaveBeenCalledWith("addressee_id", "user-1");
      expect(mockChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(result).toHaveLength(1);
      expect(result[0].friend.username).toBe("charlie");
    });

    it("returns empty array if no pending requests", async () => {
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: [], error: null });
      const result = await getPendingRequests("user-1");
      expect(result).toEqual([]);
    });

    it("returns empty array when data is null", async () => {
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: null, error: null });
      const result = await getPendingRequests("user-1");
      expect(result).toEqual([]);
    });

    it("throws if query fails", async () => {
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Query error" },
        });
      await expect(getPendingRequests("user-1")).rejects.toThrow("Query error");
    });
  });

  // --------------------------------------------------------------------------
  // getSentRequests
  // --------------------------------------------------------------------------
  describe("getSentRequests", () => {
    it("returns requests sent by the user", async () => {
      const mockData = [
        {
          id: "f-003",
          status: "pending",
          requester_id: "user-1",
          addressee_id: "user-4",
          addressee: { id: "user-4", username: "diana" },
          created_at: "2025-01-01",
          updated_at: "2025-01-02",
        },
      ];
      
      // Chain: select().eq().eq()
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: mockData, error: null });

      const result = await getSentRequests("user-1");

      expect(mockChain.eq).toHaveBeenCalledWith("requester_id", "user-1");
      expect(mockChain.eq).toHaveBeenCalledWith("status", "pending");
      expect(result).toHaveLength(1);
      expect(result[0].friend.username).toBe("diana");
    });

    it("returns empty array when no sent requests", async () => {
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: [], error: null });
      const result = await getSentRequests("user-1");
      expect(result).toEqual([]);
    });

    it("throws if query fails", async () => {
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Bad request" },
        });
      await expect(getSentRequests("user-1")).rejects.toThrow("Bad request");
    });
  });

  // --------------------------------------------------------------------------
  // sendFriendRequest
  // --------------------------------------------------------------------------
  describe("sendFriendRequest", () => {
    it("inserts new pending request successfully", async () => {
      const mockInsertRow = {
        id: "f-004",
        requester_id: "user-1",
        addressee_id: "user-5",
        status: "pending",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      };
      
      // First check for existing: select().or().maybeSingle()
      mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // Then insert: insert().select().single()
      mockChain.single.mockResolvedValueOnce({ data: mockInsertRow, error: null });

      const result = await sendFriendRequest("user-1", "user-5");

      expect(mockChain.insert).toHaveBeenCalledWith([
        {
          requester_id: "user-1",
          addressee_id: "user-5",
          status: "pending",
        },
      ]);
      expect(result.status).toBe("pending");
      expect(result.addressee_id).toBe("user-5");
    });

    it("prevents sending a request to self", async () => {
      await expect(sendFriendRequest("user-1", "user-1")).rejects.toThrow(
        "Cannot send a friend request to yourself."
      );
      expect(mockChain.insert).not.toHaveBeenCalled();
    });

    it("throws if friendship already exists", async () => {
      mockChain.maybeSingle.mockResolvedValueOnce({
        data: { id: "existing", status: "accepted" },
        error: null,
      });
      
      await expect(sendFriendRequest("user-1", "user-2")).rejects.toThrow(
        "Friendship already exists with status: accepted"
      );
      expect(mockChain.insert).not.toHaveBeenCalled();
    });

    it("throws if insert fails", async () => {
      mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(sendFriendRequest("user-1", "user-5")).rejects.toThrow(
        "Insert failed"
      );
    });
  });

  // --------------------------------------------------------------------------
  // respondToFriendRequest
  // --------------------------------------------------------------------------
  describe("respondToFriendRequest", () => {
    it("allows addressee to accept pending request", async () => {
      // First query: select().eq().single()
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single
        .mockResolvedValueOnce({
          data: { addressee_id: "user-2", status: "pending" },
          error: null,
        })
        // Second query: update().eq().select().single()
        .mockResolvedValueOnce({
          data: { id: "f-005", status: "accepted" },
          error: null,
        });

      const result = await respondToFriendRequest("f-005", "user-2", "accepted");

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "accepted" })
      );
      expect(result.status).toBe("accepted");
    });

    it("rejects if non-addressee tries to respond", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: { addressee_id: "user-2", status: "pending" },
        error: null,
      });
      
      await expect(
        respondToFriendRequest("f-005", "user-1", "accepted")
      ).rejects.toThrow("Only the addressee can respond to this request.");
    });

    it("rejects if friendship is not pending", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: { addressee_id: "user-2", status: "accepted" },
        error: null,
      });
      
      await expect(
        respondToFriendRequest("f-005", "user-2", "accepted")
      ).rejects.toThrow("Cannot respond to a accepted request.");
    });

    it("throws if fetching friendship fails", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      await expect(
        respondToFriendRequest("f-005", "user-2", "accepted")
      ).rejects.toThrow("Not found");
    });

    it("throws if update fails", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single
        .mockResolvedValueOnce({
          data: { addressee_id: "user-2", status: "pending" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed" },
        });

      await expect(
        respondToFriendRequest("f-005", "user-2", "accepted")
      ).rejects.toThrow("Update failed");
    });
  });

  // --------------------------------------------------------------------------
  // removeFriend
  // --------------------------------------------------------------------------
  describe("removeFriend", () => {
    it("allows requester to remove friendship", async () => {
      // First query: select().eq().single()
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: { requester_id: "user-1", addressee_id: "user-2" },
        error: null,
      });
      
      // Second query: delete().eq()
      mockChain.eq.mockResolvedValueOnce({ error: null });

      const result = await removeFriend("f-006", "user-1");

      expect(mockChain.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("allows addressee to remove friendship", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: { requester_id: "user-2", addressee_id: "user-1" },
        error: null,
      });
      
      mockChain.eq.mockResolvedValueOnce({ error: null });

      const result = await removeFriend("f-006", "user-1");
      expect(result).toBe(true);
    });

    it("throws if user not part of friendship", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: { requester_id: "user-2", addressee_id: "user-3" },
        error: null,
      });
      
      await expect(removeFriend("f-006", "user-1")).rejects.toThrow(
        "You are not authorized to remove this friendship."
      );
      expect(mockChain.delete).not.toHaveBeenCalled();
    });

    it("throws if fetching friendship fails", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      await expect(removeFriend("f-006", "user-1")).rejects.toThrow("Not found");
    });

    it("throws if deletion fails", async () => {
      mockChain.eq.mockReturnValueOnce(mockChain);
      mockChain.single.mockResolvedValueOnce({
        data: { requester_id: "user-1", addressee_id: "user-2" },
        error: null,
      });
      
      mockChain.eq.mockResolvedValueOnce({ error: { message: "Delete failed" } });
      
      await expect(removeFriend("f-006", "user-1")).rejects.toThrow(
        "Delete failed"
      );
    });
  });
});
