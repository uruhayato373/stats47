import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REMOTION_PUBLIC, openD1 } from "./_shared/d1-client.js";
import { loadPrefectures } from "./_shared/load-prefectures.js";
import { readLocalStatsValues } from "./_shared/local-r2-reader.js";

// 47 都道府県の総人口 (日本人口 / 総人口どちらを使うか確定後に切替可能)
const POPULATION_METRIC_KEY = "japanese-population";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "population-yoy-47");

interface YoyFrame {
  year: number;
  values: Array<{ code: string; name: string; value: number; yoy: number | null }>;
}

export async function exportPopulationYoy47(): Promise<{
  files: number;
  skipped: string[];
}> {
  const skipped: string[] = [];

  const payload = readLocalStatsValues(POPULATION_METRIC_KEY, "prefecture");
  if (!payload || payload.rows.length === 0) {
    skipped.push(
      `R2 has no stats for ${POPULATION_METRIC_KEY} (app/stats/${POPULATION_METRIC_KEY}/values.json)`,
    );
    return { files: 0, skipped };
  }

  // prefectures.code は 5-digit ("01000"〜"47000")。area_code も同じく 5-digit。
  const db = openD1();
  try {
    const prefs = loadPrefectures(db).filter((p) => {
      const n = Number(p.code.slice(0, 2));
      return n >= 1 && n <= 47;
    });

    // year → 5-digit code → value
    const byYear = new Map<number, Map<string, number>>();
    for (const r of payload.rows) {
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
