"use client";

import { Reading } from "@/lib/dummyData";
import ReadingListCondensed from "./ReadingListCondensed";

interface ReadingListProps {
  readings: Reading[];
}

export default function ReadingList({ readings }: ReadingListProps) {
  return <ReadingListCondensed readings={readings} />;
}
