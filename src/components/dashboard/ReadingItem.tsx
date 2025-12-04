"use client";

import { Reading } from "@/lib/dummyData";
import {} from "react";
import ShareLinkButton from "@/components/ShareLinkButton";
import { DocumentService } from "@/services/documentService";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReadingItemProps {
  reading: Reading;
  viewMode: "gallery" | "list";
  onDelete?: (id: string) => void;
}

export default function ReadingItem({ reading, viewMode, onDelete }: ReadingItemProps) {
  // Minimal actions (share handled by icon button)
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    console.log("Attempting to delete:", reading.id);

    const confirmed = window.confirm(
      `Delete "${reading.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const { id: deletedId } = await DocumentService.deleteDocument(reading.id);
      onDelete?.(deletedId);
      router.refresh();
    } catch (err) {
      const error = err as Error;
      // console.error("Delete error →", error);
      alert("Failed to delete document: " + (error.message ?? ""));
    }
  };

  const handleNavigate = () => {
    if (reading.id) {
      router.push(`/documents/${reading.id}`);
    }
  };
  if (viewMode === "list") {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleNavigate}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {reading.title}
                </h3>
                {reading.author && (
                  <p className="text-sm text-gray-600 mt-1">
                    by {reading.author}
                  </p>
                )}
                {reading.isShared && reading.sharedBy && (
                  <p className="text-xs text-pink-600 mt-1">
                    Shared by {reading.sharedBy}
                  </p>
                )}
                {reading.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {reading.description}
                  </p>
                )}

                {reading.tags && reading.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {reading.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="ml-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleDelete}
                  className="p-1 text-red-500 hover:text-red-700"
                  aria-label="Delete document"
                >
                  <Trash className="w-5 h-5" />
                </button>

                <ShareLinkButton documentId={reading.id} variant="icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-visible transition-shadow cursor-pointer"
      onClick={handleNavigate}
    >
      <div className="aspect-w-16 aspect-h-9">
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {reading.title}
          </h3>
          <div className="ml-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDelete}
              aria-label="Delete document"
              className="
                rounded-md p-2 
                bg-white 
                shadow-[2px_2px_6px_#d1d5db,-2px_-2px_6px_#ffffff] 
                hover:shadow-[1px_1px_3px_#d1d5db,-1px_-1px_3px_#ffffff] 
                transition-shadow
                text-red-500 hover:text-red-600
                flex items-center justify-center
              "
            >
              <Trash className="w-4 h-4" strokeWidth={2} />
            </button>

            <ShareLinkButton documentId={reading.id} variant="icon" />
          </div>
        </div>

        {reading.author && (
          <p className="text-sm text-gray-600 mb-2">by {reading.author}</p>
        )}

        {reading.isShared && reading.sharedBy && (
          <p className="text-xs text-pink-600 mb-2">
            Shared by {reading.sharedBy}
          </p>
        )}

        {reading.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {reading.description}
          </p>
        )}

        {/* Tags */}
        {reading.tags && reading.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {reading.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {reading.tags.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{reading.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
