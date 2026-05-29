import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REMOTION_PUBLIC, openD1 } from "./_shared/d1-client.js";
import { loadPrefectures } from "./_shared/load-prefectures.js";
import { readLocalStatsValues } from "./_shared/local-r2-reader.js";

// 47 県 年間総乗降客数
const METRIC_KEY = "station-passengers-annual-total";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "station-passengers");

export async function exportStationPassengers(): Promise<{
  files: number;
  skipped: string[];
}> {
  const skipped: string[] = [];

  const payload = readLocalStatsValues(METRIC_KEY, "prefecture");
  if (!payload || payload.rows.length === 0) {
    skipped.push(
      `R2 has no stats for ${METRIC_KEY} (app/stats/${METRIC_KEY}/values.json) — see TS-config TODO for source ID`,
    );
    return { files: 0, skipped };
  }

  const db = openD1();
  try {
    const prefs = loadPrefectures(db).filter((p) => {
      const n = Number(p.code.slice(0, 2));
      return n >= 1 && n <= 47;
    });

    // payload.rows は全年 × 全 area。最新年を pref ごとに取り出す
    // (year_code 降順 sort → 各 areaCode の最初の row を採用)
    const sorted = [...payload.rows].sort((a, b) =>
      b.yearCode.localeCompare(a.yearCode),
    );
    const latestByPref = new Map<string, { year: string; value: number | null }>();
    for (const r of sorted) {
      if (!latestByPref.has(r.areaCode)) {
        latestByPref.set(r.areaCode, { year: r.yearCode, value: r.value });
      }
    }

    const summary = prefs.map((p) => ({
      code: p.code,
      name: p.name,
      latestYear: latestByPref.get(p.code)?.year ?? null,
      latestTotal: latestByPref.get(p.code)?.value ?? null,
    }));

    mkdirSync(FEATURE_DIR, { recursive: true });
    writeFileSync(
      resolve(FEATURE_DIR, "index.json"),
      JSON.stringify({
        metric: METRIC_KEY,
        source: "国交省 駅別乗降客数調査",
        prefectures: summary,
      }),
    );
    return { files: 1, skipped };
  } finally {
    db.close();
  }
}
