import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

export interface FishingPortData {
  portCode: string;
  portName: string;
  prefectureCode: string;
  prefectureName: string;
  portType: string;
  portTypeName: string;
  administratorName: string | null;
  latitude: number;
  longitude: number;
}

export const FISHING_PORTS_SNAPSHOT_KEY = "app/fishing-ports/all.json";

export interface FishingPortsSnapshot {
  generatedAt: string;
  ports: FishingPortData[];
}

// module-level キャッシュは持たない (r2-storage-design.md)。毎回 R2 を直接 fetch する。
const loadSnapshot = createSnapshotReader<FishingPortsSnapshot, FishingPortsSnapshot>({
  key: FISHING_PORTS_SNAPSHOT_KEY,
  label: "fishing-ports",
  select: (snapshot) => snapshot,
  fallback: { generatedAt: new Date(0).toISOString(), ports: [] },
  staleAfterDays: 90,
});

export async function loadFishingPortData(): Promise<{
  ports: FishingPortData[];
  stats: {
    total: number;
    byType: Array<{ typeName: string; count: number }>;
    byPrefecture: Array<{ prefectureName: string; count: number }>;
  };
}> {
  let ports: FishingPortData[] = [];
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      const snapshot = await loadSnapshot();
      ports = snapshot.ports;
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "loadFishingPortData: snapshot fetch failed",
      );
    }
  }

  // 種別集計
  const typeMap = new Map<string, number>();
  for (const p of ports) {
    typeMap.set(p.portTypeName, (typeMap.get(p.portTypeName) || 0) + 1);
  }
  const byType = Array.from(typeMap.entries())
    .map(([typeName, count]) => ({ typeName, count }))
    .sort((a, b) => b.count - a.count);

  // 都道府県集計
  const prefMap = new Map<string, number>();
  for (const p of ports) {
    prefMap.set(p.prefectureName, (prefMap.get(p.prefectureName) || 0) + 1);
  }
  const byPrefecture = Array.from(prefMap.entries())
    .map(([prefectureName, count]) => ({ prefectureName, count }))
    .sort((a, b) => b.count - a.count);

  return {
    ports,
    stats: {
      total: ports.length,
      byType,
      byPrefecture,
    },
  };
}
