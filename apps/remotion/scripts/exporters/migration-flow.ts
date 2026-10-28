import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildMigrationFocusFile } from "@stats47/migration-flow/focus-file";

import { loadPrefectures } from "./_shared/load-prefectures.js";
import {
  LOCAL_R2_ROOT,
  readLocalMigrationFlow,
  readLocalStatsValues,
} from "./_shared/local-r2-reader.js";
import { REMOTION_PUBLIC } from "./_shared/paths.js";

const METRIC_KEY = "population-migration-inter-prefecture";
const MUNICIPALITY_METRIC = "population-migration-net-municipality";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "migration-flow");

interface PrefNetEntry {
  code: string;
  name: string;
  net: number;
}

/**
 * 引数で year が指定されなければ、local R2 (`.local/r2/app/stats/<metric>/`)
 * の `migration-flow-<year>.json` 群から最新を自動検出。production 環境では
 * year を明示的に渡すこと。
 */
function detectLatestYearFromLocalR2(metricKey: string): number | null {
  const dir = resolve(LOCAL_R2_ROOT, "app/stats", metricKey);
  if (!existsSync(dir)) return null;
  try {
    const files = readdirSync(dir);
    const years = files
      .map((f) => f.match(/^migration-flow-(\d{4})\.json$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => Number(m[1]));
    if (years.length === 0) return null;
    return Math.max(...years);
  } catch {
    return null;
  }
}

export async function exportMigrationFlow(year?: number): Promise<{
  files: number;
  skipped: string[];
}> {
  const skipped: string[] = [];

  const targetYear = year ?? detectLatestYearFromLocalR2(METRIC_KEY);
  if (!targetYear) {
    skipped.push(
      `migration-flow: no year specified and no local R2 snapshot found for ${METRIC_KEY}`,
    );
    return { files: 0, skipped };
  }

  const flowPayload = readLocalMigrationFlow(METRIC_KEY, targetYear);
  if (!flowPayload || flowPayload.rows.length === 0) {
    skipped.push(
      `R2 has no migration-flow data for ${METRIC_KEY} year=${targetYear}`,
    );
    return { files: 0, skipped };
  }

  const prefs = loadPrefectures();
  const prefName = new Map(prefs.map((p) => [p.code, p.name]));

  mkdirSync(FEATURE_DIR, { recursive: true });

  // 既存規約: ファイル名 / focusCode フィールドは 2-digit ("01"〜"47")。R2 内部は 5-digit。
  const to2 = (code5: string) => code5.slice(0, 2);

  // per-focus files (focus = toPrefCode)
  const byFocus = new Map<string, typeof flowPayload.rows>();
  for (const f of flowPayload.rows) {
    const arr = byFocus.get(f.toPrefCode) ?? [];
    arr.push(f);
    byFocus.set(f.toPrefCode, arr);
  }

  let wrote = 0;
  for (const [focusCode5, partners] of byFocus) {
    const file = buildMigrationFocusFile({ focusCode5, year: targetYear, rows: partners, prefNames: prefName });
    const focusCode2 = file.focusCode;
    writeFileSync(
      resolve(FEATURE_DIR, `${focusCode2}.json`),
      JSON.stringify(file),
    );
    wrote++;
  }

  // pref-net-{year}.json (47 県の net 昇順, 2-digit code)
  const prefNet: PrefNetEntry[] = prefs
    .filter((p) => {
      const n = Number(p.code.slice(0, 2));
      return n >= 1 && n <= 47;
    })
    .map((p) => {
      const partners = byFocus.get(p.code) ?? [];
      const net = partners
        .filter((x) => x.fromPrefCode !== p.code)
        .reduce((sum, x) => sum + (x.net ?? 0), 0);
      return { code: to2(p.code), name: p.name, net };
    })
    .sort((a, b) => a.net - b.net);

  writeFileSync(
    resolve(FEATURE_DIR, `pref-net-${targetYear}.json`),
    JSON.stringify({ year: targetYear, entries: prefNet }, null, 2),
  );
  wrote++;

  // municipalities — 別 metric, 別フォルダ
  const muniPayload = readLocalStatsValues(MUNICIPALITY_METRIC, "city");
  if (!muniPayload || muniPayload.rows.length === 0) {
    skipped.push(
      `R2 has no city stats for ${MUNICIPALITY_METRIC} — using existing apps/remotion/public/migration-flow/municipalities/ snapshot (see TS-config TODO)`,
    );
  } else {
    const muniRows = muniPayload.rows.filter(
      (r) => Number(r.yearCode) === targetYear,
    );
    if (muniRows.length > 0) {
      const muniDir = resolve(FEATURE_DIR, "municipalities");
      mkdirSync(muniDir, { recursive: true });
      const byPref = new Map<string, typeof muniRows>();
      for (const r of muniRows) {
        const prefCode = r.areaCode.slice(0, 2);
        const arr = byPref.get(prefCode) ?? [];
        arr.push(r);
        byPref.set(prefCode, arr);
      }
      for (const [prefCode, cities] of byPref) {
        writeFileSync(
          resolve(muniDir, `${prefCode}.json`),
          JSON.stringify({
            prefCode,
            year: targetYear,
            cities: cities.map((c) => ({
              code: c.areaCode,
              name: c.areaName,
              netRate: c.value,
            })),
          }),
        );
        wrote++;
      }
    } else {
      skipped.push(
        `R2 city stats for ${MUNICIPALITY_METRIC} has no rows for year=${targetYear}`,
      );
    }
  }

  return { files: wrote, skipped };
}
