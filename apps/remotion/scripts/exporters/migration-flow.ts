import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REMOTION_PUBLIC, openD1 } from "./_shared/d1-client.js";
import { loadPrefectures } from "./_shared/load-prefectures.js";
import {
  LOCAL_R2_ROOT,
  readLocalMigrationFlow,
  readLocalStatsValues,
} from "./_shared/local-r2-reader.js";

const METRIC_KEY = "population-migration-inter-prefecture";
const MUNICIPALITY_METRIC = "population-migration-net-municipality";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "migration-flow");

interface PartnerEntry {
  code: string;
  name: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface FocusFile {
  focusCode: string;
  focusName: string;
  year: number;
  source: string;
  partners: PartnerEntry[];
  totals: { inflow: number; outflow: number; net: number };
}

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

  const db = openD1();
  try {
    const prefs = loadPrefectures(db);
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
      const focusCode2 = to2(focusCode5);
      const focusName = prefName.get(focusCode5) ?? focusCode5;
      const partnerEntries: PartnerEntry[] = partners
        .filter((p) => p.fromPrefCode !== focusCode5)
        .map((p) => ({
          code: to2(p.fromPrefCode),
          name: prefName.get(p.fromPrefCode) ?? p.fromPrefCode,
          inflow: p.inflow ?? 0,
          outflow: p.outflow ?? 0,
          net: p.net ?? 0,
        }))
        .sort((a, b) => a.code.localeCompare(b.code));

      const totals = partnerEntries.reduce(
        (acc, p) => {
          acc.inflow += p.inflow;
          acc.outflow += p.outflow;
          acc.net += p.net;
          return acc;
        },
        { inflow: 0, outflow: 0, net: 0 },
      );

      const file: FocusFile = {
        focusCode: focusCode2,
        focusName,
        year: targetYear,
        source: "e-Stat 住民基本台帳人口移動報告 (統計表 0003423613)",
        partners: partnerEntries,
        totals,
      };
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
  } finally {
    db.close();
  }
}
