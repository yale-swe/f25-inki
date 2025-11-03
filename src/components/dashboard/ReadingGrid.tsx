"use client";

import { Reading } from "@/lib/dummyData";
import ReadingItem from "./ReadingItem";

interface ReadingGridProps {
  readings: Reading[];
}

export default function ReadingGrid({ readings }: ReadingGridProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {readings.map((reading) => (
        <div key={reading.id} className="neu-outset rounded-lg">
          <ReadingItem reading={reading} viewMode="gallery" />
        </div>
      ))}
    </div>
  );
}
