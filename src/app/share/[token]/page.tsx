// Handles /share/:token route (server component version)
// Fetches the shared document by token and redirects unauthenticated users

import { supabase } from '@/lib/supabaseClient';
import DocumentViewer from '@/components/documents/DocumentViewer';
import { redirect } from 'next/navigation';

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/share/${token}`);
  }

  // Validate share token and fetch document info
  const { data, error } = await supabase.rpc('get_document_by_share_token', { token });

  if (error || !data || data.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Invalid or expired share link.
      </div>
    );
  }

  const documentId = data[0].id;

  // Get the original share (the one with the token)
  const { data: originalShare } = await supabase
    .from('document_shares')
    .select('id, shared_with_user_id, shared_by, document_id')
    .eq('share_token', token)
    .eq('is_active', true)
    .single();

  if (!originalShare) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Share not found.
      </div>
    );
  }

  // Check if THIS USER already has access to this document (don't create duplicates)
  const { data: userAccess } = await supabase
    .from('document_shares')
    .select('id')
    .eq('document_id', documentId)
    .eq('shared_with_user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  // If user doesn't have access yet, create a new share record for them
  if (!userAccess) {
    await supabase
      .from('document_shares')
      .insert({
        document_id: originalShare.document_id,
        shared_by: originalShare.shared_by,
        shared_with_user_id: user.id,
        permission_level: 'view',
        share_token: null, // No token - this is a claimed share
        is_active: true,
      });
  }

  return <DocumentViewer documentId={documentId} />;
}
