"use client";
import { PrefectureMap } from "@/components/PrefectureMap";

export function PrefectureMapWidget({ areaCode }: { areaCode: string }) {
  return (
    <div className="p-2 rounded border border-border bg-card">
      <PrefectureMap areaCode={areaCode} width={500} height={380} />
    </div>
  );
}
