#!/usr/bin/env tsx
/**
 * KSJ 由来ランキングの正典 `app/stats/<metric>/values.json` を再生成する。
 *
 * ## なぜ要るか
 *
 * この値を書く工程は 2026-05-27 の D1 → R2 移行以降どこにも無かった。旧
 * `register-ksj-rankings.ts` は使い捨て SQLite に書くだけで配信に届かず、しかも県の
 * 帰属を**最寄りの県庁所在地**で決めていた (`findNearestPref`)。距離は行政境界と
 * 無関係なので、2026-08-17 の実測では原子炉の無い京都府に 8 基が計上され、
 * 八丈島(東京都)の地熱が神奈川県に付き、秋田・福島が 0 になっていた。
 *
 * 本 script は完全DBレス準拠で SQLite を経由せず、
 * datasets.ts (git TS SSOT) → R2 の KSJ topojson → `.local/r2/app/stats/<key>/values.json`
 * を決定的に作る。R2 への反映は既存の publisher (`diff-push-r2`) が行う。
 *
 * ## 使い方
 *
 *   npx tsx packages/gis/src/mlit-ksj/scripts/generate-ksj-stats-values.ts \
 *     --metric nuclear-power-plant-count,geothermal-power-plant-count
 *
 *   --metric <keys>      対象を限定する (未指定なら datasets.ts の ranking 対象すべて)
 *   --out <dir>          出力先 (既定 .local/r2)
 *   --compare            現在の配信値との差分を表示する (R2 公開 URL を読む)
 *   --coastline-km <km>  海岸線・埋立地のずれの許容距離 (既定 5)。0 で無効
 *
 * 県を決められない feature が 1 件でもあれば **書かずに終了する**。推測で別の県へ
 * 計上しない (旧実装の失敗がまさにそれだった)。
 *
 * 正典: `.claude/rules/gis-data.md` / `packages/gis/src/mlit-ksj/prefecture-assign.ts`
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { METRICS_REGISTRY, buildRecipe } from "@stats47/data-configs";
import type { StatsValuesPayload } from "@stats47/stats-r2/types";
import * as topojsonClient from "topojson-client";

import { GIS_DATASETS } from "../datasets";
import { KSJ_CODE_CONFIG } from "../registry";
import {
  buildStatsPayload,
  countByPrefecture,
  type KsjPointFeature,
} from "../ksj-stats-core";
import {
  DEFAULT_COASTLINE_TOLERANCE_KM,
  PREF_NAME_BY_CODE,
  createPrefectureLocator,
  type PrefectureLocator,
} from "../prefecture-assign";

const PUBLIC_R2 = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const PREF_TOPOJSON = "packages/gis/data/geoshape/prefecture.topojson";

interface Target {
  readonly metricKey: string;
  readonly dataId: string;
  readonly version: string;
  readonly unit: string;
  readonly yearCode: string;
  readonly filename?: string;
  readonly filenamePattern?: string;
  readonly dedupeByProperties?: readonly string[];
}

function parseArgs(argv: readonly string[]) {
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const tol = get("--coastline-km");
  return {
    metrics: get("--metric")?.split(",").map((s) => s.trim()).filter(Boolean),
    outDir: get("--out") ?? ".local/r2",
    compare: argv.includes("--compare"),
    coastlineToleranceKm: tol !== undefined ? Number(tol) : DEFAULT_COASTLINE_TOLERANCE_KM,
  };
}

function collectTargets(only?: readonly string[]): Target[] {
  const targets: Target[] = [];
  for (const ds of GIS_DATASETS) {
    if (!ds.isRankingTarget || !ds.rankingConfig || !ds.latestVersion) continue;
    for (const rc of ds.rankingConfig) {
      if (only && !only.includes(rc.rankingKey)) continue;
      targets.push({
        metricKey: rc.rankingKey,
        dataId: ds.dataId,
        version: ds.latestVersion,
        unit: rc.unit,
        yearCode: rc.yearCode,
        filename: rc.filename,
        filenamePattern: rc.filenamePattern,
        dedupeByProperties: rc.dedupeByProperties,
      });
    }
  }
  return targets;
}

/** KSJ topojson を R2 から取り、ローカルミラーに置いて返す */
async function fetchKsjTopology(
  dataId: string,
  version: string,
  file: string,
): Promise<unknown> {
  const key = `gis/mlit-ksj/${dataId}/${version}/${file}`;
  const local = path.join(".local/r2", key);
  if (fs.existsSync(local)) {
    return JSON.parse(fs.readFileSync(local, "utf-8"));
  }
  const res = await fetch(`${PUBLIC_R2}/${key}`);
  if (!res.ok) throw new Error(`R2 から取得できません: ${key} (HTTP ${res.status})`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, text);
  return JSON.parse(text);
}

/** R2 prefix のファイル一覧。公開 URL は list できないのでローカルミラーを使う */
function listMirroredFiles(dataId: string, version: string): string[] {
  const dir = path.join(".local/r2/gis/mlit-ksj", dataId, version);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".topojson"));
}

/** MultiPoint 等も代表点 1 つに落として数える (KSJ の施設点は基本 Point) */
function toFeatures(topology: unknown): KsjPointFeature[] {
  const t = topology as { objects: Record<string, unknown> };
  const objectKey = Object.keys(t.objects)[0];
  const fc = topojsonClient.feature(
    topology as never,
    t.objects[objectKey] as never,
  ) as unknown as {
    features: Array<{
      geometry: { type: string; coordinates: unknown } | null;
      properties: Record<string, unknown> | null;
    }>;
  };
  return fc.features.map((f) => ({
    properties: f.properties,
    coord: representativePoint(f.geometry),
  }));
}

function representativePoint(
  geometry: { type: string; coordinates: unknown } | null,
): [number, number] | null {
  if (!geometry?.coordinates) return null;
  const c = geometry.coordinates as never;
  const firstPair = (v: unknown): [number, number] | null => {
    if (!Array.isArray(v)) return null;
    if (typeof v[0] === "number" && typeof v[1] === "number") {
      return [v[0], v[1]];
    }
    return firstPair(v[0]);
  };
  return firstPair(c);
}

async function readCurrentPayload(
  metricKey: string,
): Promise<StatsValuesPayload | null> {
  const res = await fetch(
    `${PUBLIC_R2}/app/stats/${metricKey}/values.json`,
  ).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as StatsValuesPayload;
}

function diffLines(
  before: StatsValuesPayload | null,
  after: StatsValuesPayload,
): string[] {
  if (!before) return ["  (現在の配信値を取得できず差分は出せません)"];
  const beforeByArea = new Map(before.rows.map((r) => [r.areaCode, r.value]));
  const lines: string[] = [];
  for (const r of after.rows) {
    const prev = beforeByArea.get(r.areaCode) ?? null;
    if (prev === r.value) continue;
    lines.push(`  ${r.areaName}: ${prev ?? "—"} → ${r.value}`);
  }
  return lines.length > 0 ? lines : ["  (差分なし)"];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const targets = collectTargets(args.metrics);
  if (targets.length === 0) {
    console.error("対象がありません (--metric の指定を確認してください)");
    process.exit(1);
  }

  let locator: PrefectureLocator | null = null;
  const getLocator = (): PrefectureLocator => {
    if (!locator) {
      locator = createPrefectureLocator(
        JSON.parse(fs.readFileSync(PREF_TOPOJSON, "utf-8")),
      );
    }
    return locator;
  };

  const generatedAt = new Date().toISOString();
  let failed = 0;

  for (const t of targets) {
    console.log(`\n[${t.metricKey}] ${t.dataId}/${t.version}`);

    const config = METRICS_REGISTRY[t.metricKey];
    if (!config) {
      console.error(`  ✗ metric config が見つかりません: ${t.metricKey}`);
      failed++;
      continue;
    }

    const source = KSJ_CODE_CONFIG.get(t.dataId)?.prefectureSource ?? null;
    const files = listMirroredFiles(t.dataId, t.version).filter((f) => {
      if (t.filename) return f === t.filename;
      if (t.filenamePattern) return f.includes(t.filenamePattern);
      return true;
    });
    if (files.length === 0) {
      console.error(
        `  ✗ .local/r2/gis/mlit-ksj/${t.dataId}/${t.version}/ に該当ファイルがありません。` +
          ` 先に R2 から同期してください`,
      );
      failed++;
      continue;
    }

    const features: KsjPointFeature[] = [];
    for (const file of files) {
      const topo = await fetchKsjTopology(t.dataId, t.version, file);
      features.push(...toFeatures(topo));
    }

    // 属性の宣言があってもポリゴンは常に渡す (欠測行だけ空間結合で埋める)
    const result = countByPrefecture(features, {
      source,
      locator: getLocator(),
      dedupeBy: t.dedupeByProperties,
      coastlineToleranceKm: args.coastlineToleranceKm,
    });

    console.log(
      `  feature ${features.length} 件 → 属性 ${result.resolvedByAttribute} / 空間結合 ${result.resolvedByPolygon}` +
        (result.resolvedByCoastline > 0 ? ` / 海岸線許容 ${result.resolvedByCoastline}` : "") +
        ` / 未解決 ${result.unresolved.length}` +
        (t.dedupeByProperties ? ` / 重複排除 ${result.deduped}` : ""),
    );

    if (result.unresolved.length > 0) {
      console.error(
        `  ✗ 県を決められない feature が ${result.unresolved.length} 件あります。書き込みを中止します`,
      );
      for (const u of result.unresolved.slice(0, 5)) {
        console.error(`     coord=${JSON.stringify(u.coord)} props=${JSON.stringify(u.properties).slice(0, 160)}`);
      }
      failed++;
      continue;
    }

    const payload = buildStatsPayload({
      metricKey: t.metricKey,
      unit: t.unit,
      yearCode: t.yearCode,
      countsByPref: result.countsByPref,
      generatedAt,
      recipe: buildRecipe(config),
    });

    const top = [...result.countsByPref.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([c, v]) => `${PREF_NAME_BY_CODE[c]}=${v}`)
      .join(" / ");
    console.log(`  上位: ${top}`);

    if (args.compare) {
      const before = await readCurrentPayload(t.metricKey);
      console.log("  現在の配信値との差分:");
      for (const line of diffLines(before, payload)) console.log(line);
    }

    const outPath = path.join(
      args.outDir,
      "app/stats",
      t.metricKey,
      "values.json",
    );
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload));
    console.log(`  → ${outPath}`);
  }

  if (failed > 0) {
    console.error(`\n=== ${failed} 件が失敗しました ===`);
    process.exit(1);
  }
  console.log(`\n=== ${targets.length} 件を生成しました ===`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
