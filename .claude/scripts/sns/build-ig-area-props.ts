#!/usr/bin/env tsx
/**
 * build-ig-area-props.ts — 1都道府県の候補プールから、Instagram「地域」カルーセル
 * (火・土枠。正典 .claude/rules/sns-content-standards.md §2-3c「地域 (県の全国 1 位・47 位)」) の
 * props JSON をデータ層だけ決定的に生成する。Remotion スライドの見た目はここでは作らない
 * (別途デザイン検討中)。
 *
 * 候補プール: `app/areas/<code>/profile.json` (全指標 ~2,000本の機械採掘) は使わない。
 * 人手キュレーション済みの AREA_DATABOOK_TEMPLATE (packages/data-configs、read-only import) の
 * rankingKey だけを候補にする。各キーは app/ranking/<key>/values.json の最新パーティションから
 * その県の順位・値を読み、47県そろっている & 値が非nullのものだけを使う。
 *
 * データ源: R2 公開 URL のみ (認証不要)。
 *   app/ranking/<key>/item.json (readerLabel・subtitle・出典・カテゴリ・家計調査判定)
 *   app/ranking/<key>/values.json (最新年・順位・値・margin 算出用)
 * 選定ロジック (順位しきい値・年フィルタ・重複ラベル排除・家族排除・出典/カテゴリ上限・margin優先) は
 * lib/ig-area-props.ts の純粋関数。「強み/弱み」とは書かない。
 * 家計調査由来の指標には都道府県庁所在市 (東京都のみ都区部) の値である旨を明記する。
 *
 * fail-closed: どちらかのグループが3件未満、または出典・年が欠落した項目があれば
 * 非ゼロ終了しファイルを書かない。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-ig-area-props.ts 46 [--top 5] [--min-year 2019] [--out <path>]
 *
 * 出力既定: .local/r2/sns/area-carousel/<5桁prefCode>/instagram/props.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { AREA_DATABOOK_TEMPLATE } from "../../../packages/data-configs/src/area-databook/template.ts";
import { PREF_CAPITAL_COORDS } from "../../../packages/migration-flow/src/lib/pref-capitals.ts";
import {
  type AreaCarouselGroup,
  type Candidate,
  type GroupCaps,
  type GroupDirection,
  type SelectionState,
  buildCoverHook,
  buildCoverTeaser,
  buildQualifiedLabel,
  buildScopeNote,
  buildSubtitleQualifier,
  classifyRank,
  computeMargin,
  createGroupCaps,
  createSelectionState,
  extractCuratedRankingKeys,
  normalizePrefCode,
  selectCandidates,
  toAreaCarouselItem,
  validateGroup,
} from "./lib/ig-area-props.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const DEFAULT_TOP = 5;
const DEFAULT_MIN_YEAR = 2019;
const TOP_GROUP_TITLE = "全国トップクラス";
const BOTTOM_GROUP_TITLE = "全国では下位";

// ─── CLI ───
function parseArgs() {
  const argv = process.argv.slice(2);
  const positional = argv.filter((v) => !v.startsWith("--"));
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  if (!positional[0]) {
    console.error("✗ 都道府県コードを指定してください (例: 46 または 46000)");
    process.exit(1);
  }
  return {
    prefCodeArg: positional[0],
    top: val("--top") ? Number(val("--top")) : DEFAULT_TOP,
    minYear: val("--min-year") ? Number(val("--min-year")) : DEFAULT_MIN_YEAR,
    out: val("--out"),
  };
}

// ─── R2 fetch ───
interface RankingItemPayload {
  item: {
    readerLabel?: string;
    title?: string;
    rankingName?: string;
    subtitle?: string;
    categoryKey?: string;
    sourceConfig?: {
      source?: { name?: string };
      recipe?: { kind?: string };
    };
    attribution?: {
      compilation?: { name?: string } | null;
      originalSurveys?: { name?: string }[];
    };
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

interface ItemMeta {
  label: string;
  subtitle?: string;
  source: string;
  category: string;
  isKakei: boolean;
}

async function fetchItemMeta(rankingKey: string, sourceKeys: Set<string>): Promise<ItemMeta | null> {
  const url = `${PUBLIC_URL}/app/ranking/${rankingKey}/item.json`;
  try {
    const payload = await fetchJson<RankingItemPayload>(url);
    sourceKeys.add(url);
    const item = payload.item;
    const label = item.readerLabel || item.title || item.rankingName || "";
    const source =
      item.sourceConfig?.source?.name ||
      item.attribution?.compilation?.name ||
      item.attribution?.originalSurveys?.[0]?.name ||
      "";
    const category = item.categoryKey || "";
    const isKakei = item.sourceConfig?.recipe?.kind === "kakei-chousa";
    return { label, subtitle: item.subtitle, source, category, isKakei };
  } catch (err) {
    console.error(`  ⚠ item.json 取得失敗、候補から除外: ${rankingKey} (${(err as Error).message})`);
    return null;
  }
}

interface LatestPartitionRow {
  year: number;
  rank: number;
  value: number;
  unit: string;
  areaName: string;
  rows: { rank: number; value: number }[];
}

/** 最新パーティションを取得し、47県そろっている & 対象県が非null の場合だけ行を返す。 */
async function fetchLatestPartitionRow(
  rankingKey: string,
  prefCode5: string,
  minYear: number,
  sourceKeys: Set<string>,
): Promise<LatestPartitionRow | null> {
  const url = `${PUBLIC_URL}/app/ranking/${rankingKey}/values.json`;
  let payload: RankingValuesPayload;
  try {
    payload = await fetchJson<RankingValuesPayload>(url);
    sourceKeys.add(url);
  } catch (err) {
    console.error(`  ⚠ values.json 取得失敗、候補から除外: ${rankingKey} (${(err as Error).message})`);
    return null;
  }
  if (!payload.partitions || payload.partitions.length === 0) return null;
  const latest = [...payload.partitions].sort((a, b) => Number(b.yearCode) - Number(a.yearCode))[0];
  const year = Number(latest.yearCode);
  if (!Number.isFinite(year) || year < minYear) return null; // 最新年が古いキーはプールから除外
  const rows = latest.values.filter(
    (v): v is { areaCode: string; areaName?: string; rank: number; value: number; unit?: string } =>
      typeof v.rank === "number" && typeof v.value === "number",
  );
  if (rows.length !== 47) return null; // 47県そろっていない (欠測・部分集計) キーは使わない
  const own = rows.find((r) => r.areaCode === prefCode5);
  if (!own) return null;
  return {
    year,
    rank: own.rank,
    value: own.value,
    unit: own.unit ?? "",
    areaName: own.areaName ?? "",
    rows: rows.map((r) => ({ rank: r.rank, value: r.value })),
  };
}

interface CandidatePools {
  top: Candidate[];
  bottom: Candidate[];
  areaName: string;
}

async function buildCandidatePools(
  poolKeys: string[],
  prefCode5: string,
  minYear: number,
  sourceKeys: Set<string>,
): Promise<CandidatePools> {
  const top: Candidate[] = [];
  const bottom: Candidate[] = [];
  let areaName = "";

  await Promise.all(
    poolKeys.map(async (rankingKey) => {
      const [meta, valueRow] = await Promise.all([
        fetchItemMeta(rankingKey, sourceKeys),
        fetchLatestPartitionRow(rankingKey, prefCode5, minYear, sourceKeys),
      ]);
      if (!meta || !meta.label || !meta.source || !meta.category) return;
      if (!valueRow) return;
      if (!areaName && valueRow.areaName) areaName = valueRow.areaName;
      const direction: GroupDirection | null = classifyRank(valueRow.rank);
      if (!direction) return; // トップ10でも下位10でもない中位順位は対象外
      const order = direction === "top" ? "asc" : "desc";
      const margin = computeMargin(valueRow.rows, valueRow.rank, order);
      const qualifier = buildSubtitleQualifier(meta.subtitle, meta.isKakei);
      const label = buildQualifiedLabel(meta.label, qualifier);
      const candidate: Candidate = {
        rankingKey,
        label,
        subtitle: meta.subtitle,
        value: valueRow.value,
        unit: valueRow.unit,
        rank: valueRow.rank,
        year: valueRow.year,
        source: meta.source,
        category: meta.category,
        isKakei: meta.isKakei,
        margin,
      };
      if (direction === "top") top.push(candidate);
      else bottom.push(candidate);
    }),
  );

  return { top, bottom, areaName };
}

function buildGroup(
  title: string,
  candidates: Candidate[],
  direction: GroupDirection,
  need: number,
  state: SelectionState,
  caps: GroupCaps,
  scopeNoteText: string,
): AreaCarouselGroup {
  const picked = selectCandidates(candidates, need, direction, state, caps);
  return { title, items: picked.map((c) => toAreaCarouselItem(c, scopeNoteText)) };
}

async function main() {
  const { prefCodeArg, top, minYear, out } = parseArgs();
  const { pref2, pref5 } = normalizePrefCode(prefCodeArg);
  const capital = PREF_CAPITAL_COORDS[pref2];
  if (!capital) {
    console.error(`✗ 県庁所在地が見つかりません: ${pref2}`);
    process.exit(1);
  }
  const scopeNoteText = buildScopeNote(pref2, capital.name);

  const poolKeys = extractCuratedRankingKeys(AREA_DATABOOK_TEMPLATE);
  console.error(`→ 候補プール: ${poolKeys.length}件 (AREA_DATABOOK_TEMPLATE)`);

  const sourceKeys = new Set<string>();
  const { top: topCandidates, bottom: bottomCandidates, areaName } = await buildCandidatePools(
    poolKeys,
    pref5,
    minYear,
    sourceKeys,
  );
  if (!areaName) {
    console.error(`✗ 県名を取得できませんでした (候補が全滅): ${pref5}`);
    process.exit(1);
  }
  console.error(`→ ${areaName}: トップ10候補 ${topCandidates.length}件 / 下位10候補 ${bottomCandidates.length}件`);

  const state = createSelectionState();
  const topGroup = buildGroup(TOP_GROUP_TITLE, topCandidates, "top", top, state, createGroupCaps(), scopeNoteText);
  const bottomGroup = buildGroup(
    BOTTOM_GROUP_TITLE,
    bottomCandidates,
    "bottom",
    top,
    state,
    createGroupCaps(),
    scopeNoteText,
  );

  const errors = [
    ...validateGroup(topGroup.title, topGroup.items),
    ...validateGroup(bottomGroup.title, bottomGroup.items),
  ];
  if (errors.length > 0) {
    console.error("✗ fail-closed: 出力条件を満たしていません (ファイルは書きません):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const teaser = buildCoverTeaser(topGroup.items);

  const props = {
    areaCode: pref5,
    prefCode: pref2,
    areaName,
    coverHook: buildCoverHook(areaName),
    teaser,
    canonicalUrl: `https://stats47.jp/areas/${pref5}`,
    groups: [topGroup, bottomGroup],
    generatedAt: new Date().toISOString(),
    sourceKeys: [...sourceKeys].sort(),
  };

  const outPath = out ?? join(PROJECT_ROOT, ".local/r2/sns/area-carousel", pref5, "instagram/props.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(props, null, 2)}\n`, "utf-8");
  console.error(`✓ 書き出し: ${outPath}`);
  console.error(`  ${topGroup.title}: ${topGroup.items.length}件 / ${bottomGroup.title}: ${bottomGroup.items.length}件`);
}

main().catch((err) => {
  console.error(`✗ ${(err as Error).message}`);
  process.exit(1);
});
