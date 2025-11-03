"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import DocumentUpload from "@/components/documents/DocumentUpload";

interface DocumentsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DocumentsModal({ open, onClose }: DocumentsModalProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl m-4 neu-panel">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-semibold">Upload a document</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4">
          <div className="neu-separator" />
        </div>

        <div className="p-4">
          {error && <p className="text-red-500 mb-3">{error}</p>}
          <div className="neu-inset p-4 rounded-lg">
            <DocumentUpload
              onUploadSuccess={onClose}
              onUploadError={(msg: string) => setError(msg)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
