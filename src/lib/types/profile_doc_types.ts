// TS Formatting for all Util Returns

// USER PROFILES

/**
 * Represents a user's profile row in the `profiles` table.
 * Mirrors Supabase's public.profiles schema.
 */
export interface UserProfile {
  id: string; // UUID (auth.users.id)
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio_text?: string;
  created_at?: string;
  updated_at?: string;
}


// DOCUMENTS

/**
 * Represents a row from the `documents` table.
 * These are owned by a user (via owner_id → profiles.id).
 */
export interface DocumentRow {
  id: string;
  owner_id: string;
  title: string;
  status: "processing" | "ready" | "error";
  created_at: string;
  updated_at: string;
  file_size?: number;
  page_count?: number;
  storage_bucket?: string;
  storage_path?: string;
  bytes?: number;
  raw_text_bytes?: number;
}


// DOCUMENT SHARES

/**
 * Represents the user profile of the sharer (joined via shared_by).
 */
export interface SharedByProfile {
  username: string;
  full_name: string;
}

/**
 * Represents a single record from the `document_shares` table.
 * The response includes nested relationships:
 *  - documents → document metadata
 *  - shared_by → profile of the user who shared it
 */
export interface SharedDocumentRow {
  document_id: string;
  permission_level: "view" | "comment" | "edit";
  documents: DocumentRow; // nested object from `documents`
  shared_by: SharedByProfile; // nested object from `profiles`
}

export interface FlattenedSharedDocument extends DocumentRow {
  permission_level: "view" | "comment" | "edit";
  shared_by: SharedByProfile;
}
