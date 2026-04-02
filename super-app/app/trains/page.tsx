"use client";

import dynamic from "next/dynamic";

const TrainMap = dynamic(() => import("@/components/maps/train-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-0px)]">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  ),
});

export default function TrainsPage() {
  return <TrainMap />;
}
