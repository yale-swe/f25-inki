// Button to generate a shareable link
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Check, Link2 } from "lucide-react";


interface ShareLinkButtonProps {
  documentId: string; // ID of the document we want to share
}

export default function ShareLinkButton({ documentId }: ShareLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Main action, triggered when the user clicks the button
   * - Checks if an active share already exists for this document
   * - If one exists and hasn't expired, copies the existing link
   * - Otherwise creates a new share and copies that link
   */
  const handleGenerateLink = async () => {
    setLoading(true);

    // Fetch the current user (needed for the `shared_by` column)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not found:", userError);
      setLoading(false);
      return;
    }

    try {
      // 1. Check for an existing active share
      const { data: existingShare, error: fetchError } = await supabase
        .from("document_shares")
        .select("id, share_token, expires_at, is_active")
        .eq("document_id", documentId)
        .eq("shared_by", user.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching share link:", fetchError);
        throw fetchError;
      }

      let shareUrl: string;

      // 2. If active share exists, reuse it
      if (existingShare) {
        shareUrl = `${window.location.origin}/share/${existingShare.share_token}`;
      } else {
        // 3. Create a new share row
        const { data: newShare, error: createError } = await supabase
          .from("document_shares")
          .insert([
            {
              document_id: documentId,
              shared_by: user.id,
              permission_level: "view", // adjust if needed
            },
          ])
          .select("share_token")
          .single();

        if (createError) {
          console.error("Error creating share link:", createError);
          throw createError;
        }

        shareUrl = `${window.location.origin}/share/${newShare.share_token}`;
      }

      // 4. Copy link to clipboard
      await navigator.clipboard.writeText(shareUrl);

      // 5. Show temporary "Copied!" feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error generating link:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerateLink}
      disabled={loading}
      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" /> Copied!
        </>
      ) : loading ? (
        <>
          <Link2 className="h-4 w-4 animate-pulse text-gray-400" /> Generating...
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Share
        </>
      )}
    </button>
  );
}
