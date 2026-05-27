import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REMOTION_PUBLIC, openD1, metricExists } from "./_shared/d1-client.js";
import { loadPrefectures } from "./_shared/load-prefectures.js";

// 47 県 年間総乗降客数 (Phase 3 で登録される metric)
const METRIC_KEY = "station-passengers-annual-total";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "station-passengers");

interface RawRow {
  areaCode: string;
  yearCode: string;
  value: number | null;
}

export function exportStationPassengers(): {
  files: number;
  skipped: string[];
} {
  const skipped: string[] = [];
  const db = openD1();
  try {
    if (!metricExists(db, METRIC_KEY)) {
      skipped.push(
        `metric ${METRIC_KEY} not registered (Phase 3 で登録してから再実行)`,
      );
      return { files: 0, skipped };
    }

    const prefs = loadPrefectures(db).filter((p) => {
      const n = Number(p.code.slice(0, 2));
      return n >= 1 && n <= 47;
    });

    const rows = db
      .prepare(
        `SELECT area_code AS areaCode, year_code AS yearCode, value
         FROM stats_prefecture
         WHERE metric_key = ?
         ORDER BY year_code DESC, area_code`,
      )
      .all(METRIC_KEY) as RawRow[];

    if (rows.length === 0) {
      skipped.push("stats_prefecture has no rows for station-passengers metric");
      return { files: 0, skipped };
    }

    // latest year per pref (5-digit area_code を直接 key に)
    const latestByPref = new Map<string, { year: string; value: number | null }>();
    for (const r of rows) {
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
