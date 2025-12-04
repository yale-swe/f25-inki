"use client";

import { Reading } from "@/lib/dummyData";
import ReadingItem from "./ReadingItem";

interface ReadingGridProps {
  readings: Reading[];
  onDelete?: (id: string) => void;
}

export default function ReadingGrid({ readings, onDelete }: ReadingGridProps) {
  if (readings.length === 0) {
    return (
      <div className="text-center py-12">
        {/* empty state */}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {readings.map((reading) => (
        <div key={reading.id} className="neu-outset rounded-lg">
          <ReadingItem
            reading={reading}
            viewMode="gallery"
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
