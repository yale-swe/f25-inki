"use client";

import { Reading } from "@/lib/dummyData";
import { useState, useEffect, useRef } from "react";

interface ReadingListCondensedProps {
  readings: Reading[];
}

export default function ReadingListCondensed({
  readings,
}: ReadingListCondensedProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = (id: string) => {
    console.log("Delete reading:", id);
    // TODO: Implement actual delete functionality
  };

  const handleShare = (id: string) => {
    console.log("Share reading:", id);
    // TODO: Implement actual share functionality
  };

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getFileSize = (reading: Reading) => {
    const baseSize = reading.title.length * 10;
    const authorSize = reading.author ? reading.author.length * 5 : 0;
    const descSize = reading.description ? reading.description.length * 2 : 0;
    const totalSize = baseSize + authorSize + descSize;

    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`;
    return `${Math.round(totalSize / (1024 * 1024))} MB`;
  };

  if (readings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No readings found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new reading.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden neu-outset">
      <div className="px-6 py-3 neu-inset">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={
                selectedItems.length === readings.length && readings.length > 0
              }
              onChange={() => {
                if (selectedItems.length === readings.length) {
                  setSelectedItems([]);
                } else {
                  setSelectedItems(readings.map((r) => r.id));
                }
              }}
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
          </div>
          <div className="col-span-5">Name</div>
          <div className="col-span-2 hidden md:block">Owner</div>
          <div className="col-span-2 hidden sm:block">Modified</div>
          <div className="col-span-1 hidden lg:block">Size</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      <div className="px-6">
        <div className="neu-separator" />
      </div>

      <div>
        {readings.map((reading) => (
          <div
            key={reading.id}
            className={`px-6 py-4 ${
              selectedItems.includes(reading.id) ? "bg-pink-50" : ""
            }`}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(reading.id)}
                  onChange={() => toggleSelection(reading.id)}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
              </div>

              <div className="col-span-5 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {reading.thumbnail ? (
                    <img
                      src={reading.thumbnail}
                      alt={reading.title}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-400"
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
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {reading.title}
                  </p>
                  {reading.tags && reading.tags.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      {reading.tags.slice(0, 2).join(", ")}
                      {reading.tags.length > 2 &&
                        ` +${reading.tags.length - 2}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="col-span-2 hidden md:block">
                <p className="text-sm text-gray-900 truncate">
                  {reading.isShared && reading.sharedBy
                    ? reading.sharedBy
                    : reading.author || "Unknown"}
                </p>
              </div>

              <div className="col-span-2 hidden sm:block">
                <p className="text-sm text-gray-500">
                  {formatDate(reading.updatedAt)}
                </p>
              </div>

              <div className="col-span-1 hidden lg:block">
                <p className="text-sm text-gray-500">{getFileSize(reading)}</p>
              </div>

              <div className="col-span-1">
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === reading.id ? null : reading.id
                      )
                    }
                    className="p-1 text-gray-500"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {openMenuId === reading.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleShare(reading.id);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                            />
                          </svg>
                          Share
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(reading.id);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
