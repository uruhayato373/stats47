import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REMOTION_PUBLIC, openD1, tableExists } from "./_shared/d1-client.js";
import { loadPrefectures } from "./_shared/load-prefectures.js";

const METRIC_KEY = "population-migration-inter-prefecture";
const MUNICIPALITY_METRIC = "population-migration-net-municipality";
const FEATURE_DIR = resolve(REMOTION_PUBLIC, "migration-flow");

interface FlowRow {
  fromPrefCode: string;
  toPrefCode: string;
  yearCode: string;
  inflow: number | null;
  outflow: number | null;
  net: number | null;
}

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

export function exportMigrationFlow(year?: number): {
  files: number;
  skipped: string[];
} {
  const skipped: string[] = [];
  const db = openD1();
  try {
    if (!tableExists(db, "stats_migration_flow")) {
      skipped.push(
        "stats_migration_flow table not found (Phase 3 で migration を当ててから再実行)",
      );
      return { files: 0, skipped };
    }

    const targetYear =
      year ??
      Number(
        (
          db
            .prepare(
              `SELECT MAX(CAST(year_code AS INTEGER)) AS y FROM stats_migration_flow WHERE metric_key = ?`,
            )
            .get(METRIC_KEY) as { y: number | null } | undefined
        )?.y ?? 0,
      );

    if (!targetYear) {
      skipped.push("no rows in stats_migration_flow for metric");
      return { files: 0, skipped };
    }

    const prefs = loadPrefectures(db);
    const prefName = new Map(prefs.map((p) => [p.code, p.name]));

    const flows = db
      .prepare(
        `SELECT from_pref_code AS fromPrefCode, to_pref_code AS toPrefCode,
                year_code AS yearCode, inflow, outflow, net
         FROM stats_migration_flow
         WHERE metric_key = ? AND CAST(year_code AS INTEGER) = ?`,
      )
      .all(METRIC_KEY, targetYear) as FlowRow[];

    mkdirSync(FEATURE_DIR, { recursive: true });

    // 既存規約: ファイル名 / focusCode フィールドは 2-digit ("01"〜"47")。D1 内部は 5-digit。
    const to2 = (code5: string) => code5.slice(0, 2);

    // per-focus files
    const byFocus = new Map<string, FlowRow[]>();
    for (const f of flows) {
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
    if (tableExists(db, "stats_city")) {
      const muniRows = db
        .prepare(
          `SELECT area_code AS areaCode, area_name AS areaName, value
           FROM stats_city
           WHERE metric_key = ? AND CAST(year_code AS INTEGER) = ?`,
        )
        .all(MUNICIPALITY_METRIC, targetYear) as Array<{
        areaCode: string;
        areaName: string;
        value: number | null;
      }>;

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
        skipped.push(`stats_city metric "${MUNICIPALITY_METRIC}" has no rows`);
      }
    }

    return { files: wrote, skipped };
  } finally {
    db.close();
  }
}
