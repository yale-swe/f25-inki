// Utilities for fetching and managing user documents in Supabase
import { supabase } from "@/lib/supabaseClient";

// Represents a row from the `documents` table.
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

// Represents the user profile of the sharer (joined via shared_by)
export interface SharedByProfile {
  username: string;
  full_name: string;
}

// Represents a single record from the `document_shares` table.
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


// Get all docs owned by a user 
/**
 * @param userId - The Supabase Auth user ID (UUID)
 * @returns Promise<Array<DocumentRow>> - List of document rows
 * @throws Error if the query fails
*/
export async function getUserDocuments(userId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false }); // most recent 1st

  if (error) {
    console.error("Error fetching user documents:", error);
    throw new Error(error.message);
  }

  return data || [];
}

// Get all docs shared w a user
/**
 * Fetch docs that shared w given user by joining `document_shares` and `documents`
 * @param userId - The Supabase Auth user ID (UUID)
 * @returns Promise<Array<SharedDocumentRow>>
 * @throws Error if the query fails
*/
export async function getSharedDocuments(
  userId: string
): Promise<SharedDocumentRow[]>;

export async function getSharedDocuments(
  userId: string,
  flatten: true
): Promise<FlattenedSharedDocument[]>;

// Implementation
export async function getSharedDocuments(
  userId: string,
  flatten = false
): Promise<SharedDocumentRow[] | FlattenedSharedDocument[]> {
  const { data, error } = await supabase
    .from("document_shares")
    .select(`
      document_id,
      permission_level,
      documents!inner (
        id, title, owner_id, created_at, updated_at, status, page_count, storage_path,
        file_size, storage_bucket, bytes, raw_text_bytes
      ),
      shared_by:profiles!document_shares_shared_by_fkey ( username, full_name )
    `)
    .eq("shared_with_user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching shared documents:", error);
    throw new Error(error.message);
  }

  // Handle null/undefined data explicitly
  if (!data || data.length === 0) {
    return [];
  }

  // Normalize nested arrays (Supabase sometimes returns arrays for relationships)
  const normalized = data.map((row: any) => ({
    document_id: row.document_id,
    permission_level: row.permission_level,
    documents: Array.isArray(row.documents) ? row.documents[0] : row.documents,
    shared_by: Array.isArray(row.shared_by) ? row.shared_by[0] : row.shared_by,
  }));

  // Flatten if requested
  if (flatten) {
    return normalized.map((row: any) => ({
      ...row.documents,
      permission_level: row.permission_level,
      shared_by: row.shared_by,
    })) as FlattenedSharedDocument[];
  }

  return normalized as SharedDocumentRow[];
}


/*
EXAMPLE USAGE:

-- getUserDocuments()
const docs: DocumentRow[] = await getUserDocuments(user.id);
docs.map(doc => console.log(doc.title, doc.status));

-- output structure ^
[
  {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  status: "processing" | "ready" | "error";
  ...
  },
  ...
]


-- getSharedDocuments()
// UNFLATTENED
async function loadSharedDocuments() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const sharedDocs = await getSharedDocuments(user.id); // default: nested
    console.log("Shared documents (nested):", sharedDocs);

    sharedDocs.forEach((row) => {
      console.log(`Title: ${row.documents.title}`);
      console.log(`Permission: ${row.permission_level}`);
      console.log(`Shared by: ${row.shared_by.full_name}`);
    });
  } catch (err) {
    console.error("Error fetching shared docs:", err);
  }
}

// FLATTENED
import { getSharedDocuments } from "@/lib/utils/documents_utils";

async function loadSharedDocumentsFlat() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const sharedDocs = await getSharedDocuments(user.id, true); // flatten = true
    console.log("Shared documents (flattened):", sharedDocs);

    sharedDocs.forEach((doc) => {
      console.log(`${doc.title} (${doc.status})`);
      console.log(`Shared by: ${doc.shared_by.full_name}`);
      console.log(`Permission: ${doc.permission_level}`);
    });
  } catch (err) {
    console.error("Error fetching shared docs (flat):", err);
  }
}

});

-- output structure ^
// UNFLATTENED
[
  {
  document_id: "doc-123",
  permission_level: "edit",
  documents: {
    id: "doc-123",
    title: "Team Notes Q4",
    owner_id: "user-456",
    created_at: "2025-10-21T12:00:00Z",
    updated_at: "2025-10-22T12:00:00Z",
    status: "ready",
    page_count: 12,
    file_size: 256000,
    storage_path: "documents/user-456/team-notes-q4.pdf",
    storage_bucket: "documents",
    bytes: 250000,
    raw_text_bytes: 249800
  },
  shared_by: {
    username: "eva",
    full_name: "Eva Z"
  }
  },
  ...
]

// FLATTENED
[
  {
  id: "doc-123",
  title: "Team Notes Q4",
  owner_id: "user-456",
  created_at: "2025-10-21T12:00:00Z",
  updated_at: "2025-10-22T12:00:00Z",
  status: "ready",
  page_count: 12,
  file_size: 256000,
  storage_path: "documents/user-456/team-notes-q4.pdf",
  storage_bucket: "documents",
  bytes: 250000,
  raw_text_bytes: 249800,
  permission_level: "edit",
  shared_by: {
    username: "eva",
    full_name: "Eva Z"
  }
  },
  ...
]
*/
