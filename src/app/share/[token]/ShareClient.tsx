"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShareClient({ token }: { token: string }) {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      // 1. Wait for full session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/login?redirect=/share/${token}`);
        return;
      }

      // 2. Load user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=/share/${token}`);
        return;
      }

      // 3. Resolve doc ID from token
      const { data, error } = await supabase.rpc(
        "get_document_by_share_token",
        { token }
      );

      if (error || !data || data.length === 0) {
        router.replace("/404");
        return;
      }

      const docId = data[0].id;

      // 4. Insert viewer access row
      const { error: insertError } = await supabase
        .from("document_shares")
        .insert({
          document_id: docId,
          shared_with_user_id: user.id,
          shared_by: user.id,
          permission_level: "view",
          is_active: true,
        });

      if (insertError) {
        console.error("Failed to insert viewer share row:", insertError);
        // mayb: show an error page/toast
      }

      // 5. Redirect
      router.replace(`/documents/${docId}`);
    }

    run();
  }, [token, router]);

  return (
    <div className="flex h-screen items-center justify-center text-gray-500">
      Loading shared document…
    </div>
  );
}
