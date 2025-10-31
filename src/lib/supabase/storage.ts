// uploads the pdf file to storage bucket organized by the user ID 
import { supabase } from "@/lib/supabaseClient";
export async function uploadUserPdf(userId: string, file: File): Promise<{ bucket: string; path: string; mime: string; bytes: number }> {
  if (file.type !== 'application/pdf') throw new Error('Not a PDF');
  const bucket = 'documents';
  const path = `${userId}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (error) throw error;
  return { bucket, path, mime: file.type, bytes: file.size };}
