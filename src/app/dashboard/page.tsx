"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  getUserDocuments,
  getSharedDocuments,
  type DocumentRow,
  type FlattenedSharedDocument,
} from "@/lib/utils/documents_render_utils";
import { Reading } from "@/lib/dummyData";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReadingGrid from "@/components/dashboard/ReadingGrid";
import ReadingList from "@/components/dashboard/ReadingList";
import DocumentsModal from "@/components/documents/DocumentsModal";

type ViewMode = "gallery" | "list";

function documentToReading(
  doc: DocumentRow,
  isShared = false,
  sharedBy?: string
): Reading {
  return {
    id: doc.id,
    title: doc.title,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    isShared,
    sharedBy,
    url: doc.storage_path ? `/documents/${doc.id}` : undefined,
    tags: [],
  };
}

function sharedDocumentToReading(doc: FlattenedSharedDocument): Reading {
  return {
    id: doc.id,
    title: doc.title,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    isShared: true,
    sharedBy: doc.shared_by.username,
    url: doc.storage_path ? `/documents/${doc.id}` : undefined,
    tags: [],
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState("personal");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setAuthChecked(true);
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    async function fetchReadings() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        const [userDocs, sharedDocs] = await Promise.all([
          getUserDocuments(user.id),
          getSharedDocuments(user.id, true) as Promise<
            FlattenedSharedDocument[]
          >,
        ]);

        const personalReadings = userDocs.map((doc) =>
          documentToReading(doc, false)
        );
        const sharedReadings = sharedDocs.map((doc) =>
          sharedDocumentToReading(doc)
        );

        setReadings([...personalReadings, ...sharedReadings]);
      } catch (err) {
        console.error("Error fetching readings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load readings"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReadings();
  }, [authChecked, router]);

  const getFilteredReadings = () => {
    if (loading || error) return [];

    switch (currentView) {
      case "personal":
        return readings.filter((reading) => !reading.isShared);
      case "shared":
        return readings.filter((reading) => reading.isShared);
      case "recent":
        return [...readings].sort(
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
  
  const handleDelete = (id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredReadings = getFilteredReadings();

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col my-2 mr-2">
        <div className="neu-panel dashboard-panel flex flex-col">
          <DashboardHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenDocuments={() => setShowDocs(true)}
          />

          <div className="p-4 flex-1 neu-scroll">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading readings...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Error: {error}</p>
              </div>
            ) : (
              <>
                {viewMode === "gallery" ? (
                  <ReadingGrid readings={filteredReadings} onDelete={handleDelete}/>
                ) : (
                  <ReadingList readings={filteredReadings} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <DocumentsModal open={showDocs} onClose={() => setShowDocs(false)} />
    </div>
  );
}
