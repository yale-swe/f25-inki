import { supabase } from "@/lib/supabaseClient";

// Basic friendship row from the database
export interface FriendRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: string;
  updated_at: string;
}

// User profile info
interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

// Friendship record with friend's profile info
export interface FriendRecord {
  id: string;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: string;
  updated_at: string;
  friend: UserProfile;
}


// Fetch all accepted friendships for a user.
// Includes both directions (where user is requester or addressee)
export async function getFriends(userId: string): Promise<FriendRecord[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select(`
      id,
      status,
      requester_id,
      addressee_id,
      created_at,
      updated_at,
      requester:profiles!friendships_requester_id_fkey(id, username, full_name, avatar_url),
      addressee:profiles!friendships_addressee_id_fkey(id, username, full_name, avatar_url)
    `)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (error) {
    console.error("Error fetching friends:", error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map to FriendRecord, determining which profile is the "friend"
  return data.map((row: any) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    friend: row.requester_id === userId ? row.addressee : row.requester,
  }));
}

// Get pending friend requests (where current user is addressee)
export async function getPendingRequests(userId: string): Promise<FriendRecord[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select(`
      id,
      status,
      requester_id,
      addressee_id,
      created_at,
      updated_at,
      requester:profiles!friendships_requester_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("addressee_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching pending requests:", error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    friend: row.requester,
  }));
}

// Get sent friend requests (where current user is requester)
export async function getSentRequests(userId: string): Promise<FriendRecord[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select(`
      id,
      status,
      requester_id,
      addressee_id,
      created_at,
      updated_at,
      addressee:profiles!friendships_addressee_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq("requester_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("Error fetching sent requests:", error.message);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    friend: row.addressee,
  }));
}

// Send a new friend request
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<FriendRow> {
  if (requesterId === addresseeId) {
    throw new Error("Cannot send a friend request to yourself.");
  }

  // Check if friendship already exists (in either direction)
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
    .maybeSingle();

  if (existing) {
    throw new Error(`Friendship already exists with status: ${existing.status}`);
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert([
      {
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error sending friend request:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// Respond to a friend request (accept / reject / block)
// Only the addressee can respond
export async function respondToFriendRequest(
  friendshipId: string,
  userId: string,
  newStatus: "accepted" | "rejected" | "blocked"
): Promise<FriendRow> {
  // Verify user is the addressee
  const { data: friendship, error: fetchError } = await supabase
    .from("friendships")
    .select("addressee_id, status")
    .eq("id", friendshipId)
    .single();

  if (fetchError) {
    console.error("Error fetching friendship:", fetchError.message);
    throw new Error(fetchError.message);
  }

  if (friendship.addressee_id !== userId) {
    throw new Error("Only the addressee can respond to this request.");
  }

  if (friendship.status !== "pending") {
    throw new Error(`Cannot respond to a ${friendship.status} request.`);
  }

  const { data, error } = await supabase
    .from("friendships")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .select()
    .single();

  if (error) {
    console.error("Error updating friend request:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// Remove a friendship (either user can remove)
export async function removeFriend(
  friendshipId: string,
  userId: string
): Promise<boolean> {
  // Verify user is part of this friendship
  const { data: friendship, error: fetchError } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("id", friendshipId)
    .single();

  if (fetchError) {
    console.error("Error fetching friendship:", fetchError.message);
    throw new Error(fetchError.message);
  }

  if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
    throw new Error("You are not authorized to remove this friendship.");
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    console.error("Error deleting friendship:", error.message);
    throw new Error(error.message);
  }

  return true;
}
