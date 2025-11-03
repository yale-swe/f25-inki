"use client";

// Temporary type - will be replaced after merge
type ViewMode = "gallery" | "list";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddReading: () => void;
}

export default function DashboardHeader({
  viewMode,
  onViewModeChange,
  onAddReading,
}: DashboardHeaderProps) {
  return (
    <div className="px-3">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold text-gray-900">My Readings</h1>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg neu-inset">
            <button
              onClick={() => onViewModeChange("gallery")}
              className={`p-2 rounded-md ${
                viewMode === "gallery" ? "neu-outset" : ""
              }`}
              title="Gallery View"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-2 rounded-md ${
                viewMode === "list" ? "neu-outset" : ""
              }`}
              title="List View"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={onAddReading}
            className="px-3.5 py-1.5 rounded-md font-medium flex items-center gap-2 neu-outset"
          >
            <Plus className="w-5 h-5" />
            New
          </button>
        </div>
      </div>
      <div className="neu-separator mb-2" />
    </div>
  );
}
