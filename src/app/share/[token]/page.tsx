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

  return <DocumentViewer documentId={documentId} />;
}
