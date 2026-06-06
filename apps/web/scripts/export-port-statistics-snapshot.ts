/**
 * ports + 港湾統計 を R2 snapshot 化する (完全DBレス: docs/01_技術設計/19_完全DBレス設計.md)。
 *
 * 入力 (D1 廃止):
 *   - port master = git TS `packages/area/src/data/ports.json` (PortMetaRow[], administrator 込み)
 *   - 港湾観測値  = R2 app/stats/<port-metric>/ports.json (readStatsValues, listMetricKeysByEntity("port"))
 *
 * Outputs:
 *   - app/ports/all.json (全 port メタ)
 *   - app/port-statistics/years.json (年一覧, 降順)
 *   - app/port-statistics/by-year/<year>.json (各年の統計)
 *   - app/port-statistics/by-port/<portCode>.json (各港の時系列)
 *
 * Usage:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' npx tsx apps/web/scripts/export-port-statistics-snapshot.ts
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { listMetricKeysByEntity } from "@stats47/data-configs";
import { saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";

import {
  PORTS_SNAPSHOT_KEY,
  PORT_STATS_YEARS_KEY,
  portStatsByPortKey,
  portStatsByYearKey,
  type PortMetaRow,
  type PortStatRow,
  type PortStatsByPortSnapshot,
  type PortStatsByYearSnapshot,
  type PortStatsYearsSnapshot,
  type PortsSnapshot,
} from "../src/features/port-statistics/lib/snapshot-types";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/** git TS port master (administrator 含む完全マスタ) を読む。 */
function loadPortMaster(): PortMetaRow[] {
  const masterPath = path.resolve(
    __dirname,
    "../../../packages/area/src/data/ports.json",
  );
  const raw = JSON.parse(fs.readFileSync(masterPath, "utf-8")) as PortMetaRow[];
  return raw.map((p) => ({
    portCode: p.portCode,
    portName: p.portName,
    prefectureCode: p.prefectureCode,
    prefectureName: p.prefectureName,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    portGrade: p.portGrade ?? null,
    administrator: p.administrator ?? null,
  }));
}

// snapshot 互換の旧 metric_key へ: "port-ships-total" を "ships_total" に変換する
function toSnapshotMetricKey(metricKey: string): string {
  return metricKey.replace(/^port-/, "").split("-").join("_");
}

async function main() {
  const generatedAt = new Date().toISOString();

  // 1. ports/all.json (git TS master)
  const portsMeta = loadPortMaster();
  const portsSnapshot: PortsSnapshot = { generatedAt, ports: portsMeta };
  await saveToR2(PORTS_SNAPSHOT_KEY, JSON.stringify(portsSnapshot), {
    contentType: "application/json; charset=utf-8",
  });
  const withAdmin = portsMeta.filter((p) => p.administrator).length;
  console.log(`ports: ${portsMeta.length} (administrator ${withAdmin})`);

  // 2. 港湾観測値を R2 から読み込み (metric ごと)
  const portMetricKeys = listMetricKeysByEntity("port");
  const allStats: Array<{
    portCode: string;
    year: string;
    metricKey: string;
    value: number;
    unit: string;
  }> = [];

  let metricsRead = 0;
  for (const key of portMetricKeys) {
    const payload = await readStatsValues(key, "port");
    if (!payload || payload.rows.length === 0) continue;
    metricsRead++;
    const snapshotMetricKey = toSnapshotMetricKey(key);
    for (const r of payload.rows) {
      if (r.value == null) continue;
      allStats.push({
        portCode: r.areaCode,
        year: r.yearCode,
        metricKey: snapshotMetricKey,
        value: Number(r.value),
        unit: r.unit ?? "",
      });
    }
  }
  console.log(`✅ port stats: ${metricsRead}/${portMetricKeys.length} metrics, ${allStats.length} obs`);

  const byYear = new Map<string, PortStatRow[]>();
  const byPort = new Map<
    string,
    Array<{ year: string; metricKey: string; value: number; unit: string }>
  >();
  const yearSet = new Set<string>();

  for (const s of allStats) {
    yearSet.add(s.year);
    const yearArr = byYear.get(s.year) ?? [];
    yearArr.push({ portCode: s.portCode, metricKey: s.metricKey, value: s.value, unit: s.unit });
    byYear.set(s.year, yearArr);

    const portArr = byPort.get(s.portCode) ?? [];
    portArr.push({ year: s.year, metricKey: s.metricKey, value: s.value, unit: s.unit });
    byPort.set(s.portCode, portArr);
  }

  const years = [...yearSet].sort((a, b) => (a < b ? 1 : -1)); // 降順
  const yearsSnapshot: PortStatsYearsSnapshot = { generatedAt, years };
  await saveToR2(PORT_STATS_YEARS_KEY, JSON.stringify(yearsSnapshot), {
    contentType: "application/json; charset=utf-8",
  });
  console.log(`✅ years.json: ${years.length} 件 (${years[years.length - 1]}〜${years[0]})`);

  // 3. by-year (saveToR2 はローカル FS への同期書込なので throttle 不要)
  const yearEntries = [...byYear.entries()];
  await Promise.all(
    yearEntries.map(([year, rows]) => {
      const snapshot: PortStatsByYearSnapshot = { generatedAt, year, rows };
      return saveToR2(portStatsByYearKey(year), JSON.stringify(snapshot), {
        contentType: "application/json; charset=utf-8",
      });
    }),
  );
  console.log(`✅ by-year: ${yearEntries.length} files`);

  // 4. by-port
  const portEntries = [...byPort.entries()];
  await Promise.all(
    portEntries.map(([portCode, rows]) => {
      const snapshot: PortStatsByPortSnapshot = { generatedAt, portCode, rows };
      return saveToR2(portStatsByPortKey(portCode), JSON.stringify(snapshot), {
        contentType: "application/json; charset=utf-8",
      });
    }),
  );
  console.log(`✅ by-port: ${portEntries.length} files`);

  console.log(
    `📊 合計: ports=${portsMeta.length} stats=${allStats.length} year-files=${yearEntries.length} port-files=${portEntries.length}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
