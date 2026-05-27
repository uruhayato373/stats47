import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REMOTION_PUBLIC, openD1, metricExists } from "./_shared/d1-client.js";
import { loadPrefectures } from "./_shared/load-prefectures.js";

// 47 都道府県の総人口 (日本人口 / 総人口どちらを使うか確定後に切替可能)
const POPULATION_METRIC_KEY = "japanese-population";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "population-yoy-47");

interface RawRow {
  areaCode: string;
  yearCode: string;
  value: number | null;
}

interface YoyFrame {
  year: number;
  values: Array<{ code: string; name: string; value: number; yoy: number | null }>;
}

export function exportPopulationYoy47(): { files: number; skipped: string[] } {
  const skipped: string[] = [];
  const db = openD1();
  try {
    if (!metricExists(db, POPULATION_METRIC_KEY)) {
      skipped.push(`metric ${POPULATION_METRIC_KEY} not in metrics table`);
      return { files: 0, skipped };
    }

    // prefectures.code は 5-digit ("01000"〜"47000")。area_code も同じく 5-digit。
    const prefs = loadPrefectures(db).filter((p) => {
      const n = Number(p.code.slice(0, 2));
      return n >= 1 && n <= 47;
    });

    const rows = db
      .prepare(
        `SELECT area_code AS areaCode, year_code AS yearCode, value
         FROM stats_prefecture
         WHERE metric_key = ?
         ORDER BY year_code, area_code`,
      )
      .all(POPULATION_METRIC_KEY) as RawRow[];

    if (rows.length === 0) {
      skipped.push("stats_prefecture has no rows for population metric");
      return { files: 0, skipped };
    }

    // year → 5-digit code → value
    const byYear = new Map<number, Map<string, number>>();
    for (const r of rows) {
      const y = Number(r.yearCode);
      if (!Number.isFinite(y)) continue;
      if (r.value == null) continue;
      const map = byYear.get(y) ?? new Map<string, number>();
      map.set(r.areaCode, r.value);
      byYear.set(y, map);
    }

    const years = [...byYear.keys()].sort((a, b) => a - b);
    const frames: YoyFrame[] = [];
    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const cur = byYear.get(year)!;
      const prev = i > 0 ? byYear.get(years[i - 1]) : null;
      frames.push({
        year,
        values: prefs.map((p) => {
          const v = cur.get(p.code) ?? 0;
          const prevV = prev?.get(p.code) ?? null;
          const yoy =
            prevV != null && prevV !== 0 ? ((v - prevV) / prevV) * 100 : null;
          return { code: p.code, name: p.name, value: v, yoy };
        }),
      });
    }

    mkdirSync(FEATURE_DIR, { recursive: true });
    writeFileSync(
      resolve(FEATURE_DIR, "timeseries.json"),
      JSON.stringify({
        metric: POPULATION_METRIC_KEY,
        source: "e-Stat 人口推計",
        yearRange: years.length > 0 ? [years[0], years[years.length - 1]] : null,
        frames,
      }),
    );
    return { files: 1, skipped };
  } finally {
    db.close();
  }
}
