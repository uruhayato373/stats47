import "server-only";

import { getDrizzle } from "@stats47/database/server";
import { fishingPorts } from "@stats47/database/schema";

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

export async function loadFishingPortData(): Promise<{
  ports: FishingPortData[];
  stats: {
    total: number;
    byType: Array<{ typeName: string; count: number }>;
    byPrefecture: Array<{ prefectureName: string; count: number }>;
  };
}> {
  const db = getDrizzle();

  const allPorts = await db.select().from(fishingPorts);

  const ports: FishingPortData[] = allPorts.map((p) => ({
    portCode: p.portCode,
    portName: p.portName,
    prefectureCode: p.prefectureCode,
    prefectureName: p.prefectureName,
    portType: p.portType,
    portTypeName: p.portTypeName,
    administratorName: p.administratorName,
    latitude: p.latitude,
    longitude: p.longitude,
  }));

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
