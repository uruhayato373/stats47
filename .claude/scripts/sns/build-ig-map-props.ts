#!/usr/bin/env tsx
/**
 * build-ig-map-props.ts — 1つの rankingKey から、Instagram「地図」カルーセル
 * (日枠。正典 .claude/rules/sns-content-standards.md §2-3c「地図カード / テーマ」) の
 * props JSON をデータ層だけ決定的に生成する。Remotion スライドの見た目は
 * `apps/remotion/src/features/map-carousel-instagram/` が担う (`@/features/ig-series` 共通デザイン)。
 *
 * データ源: R2 公開 URL のみ (認証不要)。
 *   app/ranking/<key>/item.json (readerLabel・subtitle・出典・家計調査判定)
 *   app/ranking/<key>/values.json (最新年・47都道府県の値・順位)
 *
 * 塗り分けの区切りは lib/ig-map-props.ts の computeQuantileBins (d3-scale の等分位) が
 * データから決定的に算出する。手動の閾値は指定しない。
 *
 * fail-closed: 47都道府県そろっていない、または出典・年が欠落していれば非ゼロ終了しファイルを書かない。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-ig-map-props.ts <rankingKey> [--min-year 2019] [--out <path>]
 *
 * 出力既定: .local/r2/sns/map-carousel/<rankingKey>/instagram/props.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getMaxDecimalPlaces } from "@stats47/utils";

import {
  type TileCandidate,
  buildMapCoverQuestion,
  buildMapScopeNote,
  buildMapTiles,
  computeTopBottom,
  validateMapData,
} from "./lib/ig-map-props.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const DEFAULT_MIN_YEAR = 2019;

function parseArgs() {
  const argv = process.argv.slice(2);
  const positional = argv.filter((v) => !v.startsWith("--"));
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  if (!positional[0]) {
    console.error("✗ rankingKey を指定してください (例: shochu-consumption-expenditure)");
    process.exit(1);
  }
  return {
    rankingKey: positional[0],
    minYear: val("--min-year") ? Number(val("--min-year")) : DEFAULT_MIN_YEAR,
    out: val("--out"),
  };
}

interface RankingItemPayload {
  item: {
    readerLabel?: string;
    title?: string;
    rankingName?: string;
    subtitle?: string;
    sourceConfig?: { source?: { name?: string }; recipe?: { kind?: string } };
    attribution?: { compilation?: { name?: string } | null; originalSurveys?: { name?: string }[] };
  };
}

interface RankingValuesPayload {
  partitions: {
    yearCode: string;
    values: { areaCode: string; areaName?: string; rank: number | null; value: number | null; unit?: string }[];
  }[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`取得失敗 (${res.status}): ${url}`);
  return (await res.json()) as T;
}

/** "01000" → "01" のように 5桁コードを2桁の都道府県コードへ正規化する */
function toPrefCode2(areaCode5: string): string {
  return areaCode5.slice(0, 2);
}

async function main() {
  const { rankingKey, minYear, out } = parseArgs();
  const sourceKeys = new Set<string>();

  const itemUrl = `${PUBLIC_URL}/app/ranking/${rankingKey}/item.json`;
  const valuesUrl = `${PUBLIC_URL}/app/ranking/${rankingKey}/values.json`;

  const itemPayload = await fetchJson<RankingItemPayload>(itemUrl).catch((err) => {
    console.error(`✗ item.json 取得失敗: ${(err as Error).message}`);
    process.exit(1);
  });
  sourceKeys.add(itemUrl);
  const item = itemPayload.item;
  const label = item.readerLabel || item.title || item.rankingName || "";
  const source =
    item.sourceConfig?.source?.name ||
    item.attribution?.compilation?.name ||
    item.attribution?.originalSurveys?.[0]?.name ||
    "";
  const isKakei = item.sourceConfig?.recipe?.kind === "kakei-chousa";
  if (!label || !source) {
    console.error(`✗ fail-closed: item.json に label/source がありません (${rankingKey})`);
    process.exit(1);
  }

  const valuesPayload = await fetchJson<RankingValuesPayload>(valuesUrl).catch((err) => {
    console.error(`✗ values.json 取得失敗: ${(err as Error).message}`);
    process.exit(1);
  });
  sourceKeys.add(valuesUrl);
  if (!valuesPayload.partitions || valuesPayload.partitions.length === 0) {
    console.error(`✗ fail-closed: values.json にデータがありません (${rankingKey})`);
    process.exit(1);
  }
  const latest = [...valuesPayload.partitions].sort((a, b) => Number(b.yearCode) - Number(a.yearCode))[0];
  const year = Number(latest.yearCode);
  if (!Number.isFinite(year) || year < minYear) {
    console.error(`✗ fail-closed: 最新年が minYear (${minYear}) より古いか不正です (${latest.yearCode})`);
    process.exit(1);
  }
  const rows = latest.values.filter(
    (v): v is { areaCode: string; areaName?: string; rank: number; value: number; unit?: string } =>
      typeof v.rank === "number" && typeof v.value === "number",
  );
  const unit = rows[0]?.unit ?? "";
  const candidates: TileCandidate[] = rows.map((r) => ({
    prefCode2: toPrefCode2(r.areaCode),
    areaName: r.areaName ?? "",
    value: r.value,
    rank: r.rank,
  }));

  const errors = validateMapData(candidates, source, year);
  if (errors.length > 0) {
    console.error("✗ fail-closed: 出力条件を満たしていません (ファイルは書きません):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const precision = getMaxDecimalPlaces(candidates.map((c) => c.value));
  const { tiles, legend } = buildMapTiles(candidates, precision);
  const { top5, bottom5 } = computeTopBottom(candidates);

  const props = {
    rankingKey,
    label,
    subtitle: item.subtitle,
    unit,
    year,
    source,
    scopeNote: buildMapScopeNote(isKakei),
    coverQuestion: buildMapCoverQuestion(label),
    precision,
    tiles,
    legend,
    top5,
    bottom5,
    canonicalUrl: `https://stats47.jp/ranking/${rankingKey}`,
    generatedAt: new Date().toISOString(),
    sourceKeys: [...sourceKeys].sort(),
  };

  const outDir = out ?? join(PROJECT_ROOT, ".local/r2/sns/map-carousel", rankingKey, "instagram");
  mkdirSync(outDir, { recursive: true });
  const propsPath = join(outDir, "props.json");
  writeFileSync(propsPath, `${JSON.stringify(props, null, 2)}\n`, "utf-8");
  console.error(`✓ 書き出し: ${propsPath}`);
  console.error(`  ${label}（${year}年）47都道府県 / 区分数 ${legend.length}`);
  console.error(`  次は render-ig-map-carousel.ts でスライド画像 + caption.txt を書き出す`);
}

main();
