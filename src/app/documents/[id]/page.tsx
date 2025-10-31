import { use } from "react";
import DocumentViewer from "@/components/documents/DocumentViewer";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { id } = use(params);
  return <DocumentViewer documentId={id} />;
}
