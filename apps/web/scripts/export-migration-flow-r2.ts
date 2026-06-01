/**
 * 人口移動フロー per-prefecture JSON を R2 (app/migration-flow/) に出力する exporter。
 *
 * - per-pref O-D: R2 観測値 `app/stats/population-migration-inter-prefecture/migration-flow-{year}.json`
 *   を `readMigrationFlow` で読み、focus 形式 (partners/totals) に集約 → `.local/r2/app/migration-flow/{NN}.json`
 * - municipalities: R2 に観測値が無い legacy snapshot のため、既存
 *   `apps/remotion/public/migration-flow/municipalities/{NN}.json` (Remotion 用に残す canonical snapshot)
 *   をそのまま `.local/r2/app/migration-flow/municipalities/{NN}.json` に seed
 *
 * R2 反映: diff-push-r2 --prefix app/migration-flow (CI)。
 *
 * 実行: R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *   npx tsx apps/web/scripts/export-migration-flow-r2.ts
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { readMigrationFlow } from "@stats47/stats-r2/readers";

const METRIC_KEY = "population-migration-inter-prefecture";
const REPO_ROOT = resolve(__dirname, "../../..");
const OUT_DIR = resolve(REPO_ROOT, ".local/r2/app/migration-flow");
const MUNI_SRC_DIR = resolve(REPO_ROOT, "apps/remotion/public/migration-flow/municipalities");
const MUNI_OUT_DIR = resolve(OUT_DIR, "municipalities");
const PREF_NET_SRC = resolve(REPO_ROOT, "apps/remotion/public/migration-flow");

function loadPrefNames(): Map<string, string> {
  const raw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
  ) as Array<{ prefCode: string; prefName: string }>;
  return new Map(raw.map((p) => [p.prefCode, p.prefName]));
}

interface FocusFile {
  focusCode: string;
  focusName: string;
  year: number;
  source: string;
  partners: { code: string; name: string; inflow: number; outflow: number; net: number }[];
  totals: { inflow: number; outflow: number; net: number };
}

async function resolveLatestYear(): Promise<number> {
  // 引数 or 最新年を探索 (新しい順に試す)
  const argYear = process.argv.find((a) => /^--year=\d{4}$/.test(a));
  if (argYear) return Number(argYear.split("=")[1]);
  for (let y = 2026; y >= 2018; y--) {
    const p = await readMigrationFlow(METRIC_KEY, y);
    if (p && p.rows.length) return y;
  }
  throw new Error("migration-flow 観測値が見つかりません (R2)");
}

async function main(): Promise<void> {
  const year = await resolveLatestYear();
  const payload = await readMigrationFlow(METRIC_KEY, year);
  if (!payload) throw new Error(`no migration-flow data for ${year}`);
  console.log(`migration-flow year=${year} rows=${payload.rows.length}`);

  const prefNames = loadPrefNames();
  mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, "0");
    const area = `${code}000`;
    // focus F の partner = toPrefCode === F の行 (inflow=partner→F, outflow=F→partner)
    const partners = payload.rows
      .filter((r) => r.toPrefCode === area && r.fromPrefCode !== area)
      .map((r) => ({
        code: r.fromPrefCode.slice(0, 2),
        name: prefNames.get(r.fromPrefCode) ?? "",
        inflow: r.inflow,
        outflow: r.outflow,
        net: r.net,
      }))
      .sort((a, b) => b.inflow - a.inflow);
    const ti = partners.reduce((s, p) => s + p.inflow, 0);
    const to = partners.reduce((s, p) => s + p.outflow, 0);
    const focus: FocusFile = {
      focusCode: code,
      focusName: prefNames.get(area) ?? area,
      year,
      source: `e-Stat 住民基本台帳人口移動報告 (統計表 0003423613)`,
      partners,
      totals: { inflow: ti, outflow: to, net: ti - to },
    };
    writeFileSync(resolve(OUT_DIR, `${code}.json`), JSON.stringify(focus));
    written++;
  }
  console.log(`✅ per-pref: wrote ${written} to ${OUT_DIR}`);

  // municipalities: legacy snapshot を seed
  if (existsSync(MUNI_SRC_DIR)) {
    mkdirSync(MUNI_OUT_DIR, { recursive: true });
    let muni = 0;
    for (let i = 1; i <= 47; i++) {
      const code = String(i).padStart(2, "0");
      const src = resolve(MUNI_SRC_DIR, `${code}.json`);
      if (existsSync(src)) {
        copyFileSync(src, resolve(MUNI_OUT_DIR, `${code}.json`));
        muni++;
      }
    }
    console.log(`✅ municipalities: seeded ${muni} to ${MUNI_OUT_DIR}`);
  } else {
    console.warn(`⚠️ municipalities snapshot not found at ${MUNI_SRC_DIR}`);
  }

  // pref-net (注目県の純移動一覧、あれば seed)
  const prefNetSrc = resolve(PREF_NET_SRC, `pref-net-${year}.json`);
  if (existsSync(prefNetSrc)) {
    copyFileSync(prefNetSrc, resolve(OUT_DIR, `pref-net-${year}.json`));
    console.log(`✅ pref-net-${year}.json seeded`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
