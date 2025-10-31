import { supabase } from "@/lib/supabaseClient";

// Define a TS interface for type safety
export interface UserProfile {
  id: string; // UUID matches auth.users.id
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio_text?: string;
  created_at?: string;
  updated_at?: string;
}


// Fetch user's profile data from 'profiles' table
/**
 * @param userId - UUID of the user (usually from session.user.id)
 * @returns The user's profile data, null if no record found, throws an error if supabase error

Promise<Profile | null>

where Profile looks like:
{
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio_text?: string;
  created_at: string;
  updated_at: string;
}
*/
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    throw new Error(error.message);
  }

  return data;
}

// Update one or more profile fields (e.g., username, avatar, bio) for the logged-in user
/**
 * @param userId - UUID of the user to update
 * @param updates - An object containing one or more fields to update
 * @returns
    Promise<Profile> — the updated profile row, fetched via .single()
    Throws an Error if Supabase returns an error (e.g., RLS denial or invalid field)
*/
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error.message);
    throw new Error(error.message);
  }

  return data;
}


/*
EXAMPLE USAGE:

-- getUserProfile()
async function loadProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    const profile = await getUserProfile(user.id);
    console.log("User profile:", profile);
  } catch (err) {
    console.error("Failed to load profile:", err);
  }
}

-- updateUserProfile
async function saveBio(newBio: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  try {
    const updated = await updateUserProfile(user.id, { bio_text: newBio });
    console.log("Updated profile:", updated);
  } catch (err) {
    console.error("Profile update failed:", err);
  }
}
*/
