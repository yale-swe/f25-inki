"use client";

import { useState } from "react";
// Temporary type - will be replaced after merge
type ViewMode = "gallery" | "list";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReadingGrid from "@/components/dashboard/ReadingGrid";
import ReadingList from "@/components/dashboard/ReadingList";
import { dummyReadings } from "@/lib/dummyData";

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState("personal");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [readings] = useState(dummyReadings);

  // Filter readings based on current view
  const getFilteredReadings = () => {
    switch (currentView) {
      case "personal":
        return readings.filter((reading) => !reading.isShared);
      case "shared":
        return readings.filter((reading) => reading.isShared);
      case "recent":
        return readings.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "favorites":
        return readings.filter((reading) => reading.readingProgress === 100);
      case "archive":
        return []; // Empty for now
      default:
        return readings;
    }
  };

  const filteredReadings = getFilteredReadings();

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col my-2 mr-2">
        <div className="neu-panel dashboard-panel flex flex-col">
          <DashboardHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddReading={() => console.log("Add reading clicked")}
          />

          <div className="p-4 flex-1 neu-scroll">
            {viewMode === "gallery" ? (
              <ReadingGrid readings={filteredReadings} />
            ) : (
              <ReadingList readings={filteredReadings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
