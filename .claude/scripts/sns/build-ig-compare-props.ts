#!/usr/bin/env tsx
/**
 * build-ig-compare-props.ts — 2都道府県の候補プールから、Instagram「県どうしの比較」
 * カルーセル (金枠。正典 .claude/rules/sns-content-standards.md §2-3c「県どうしの比較」) の
 * props JSON をデータ層だけ決定的に生成する。Remotion スライドの見た目は
 * `apps/remotion/src/features/compare-carousel-instagram/` が担う (`@/features/ig-series` 共通デザイン)。
 *
 * 候補プール: build-ig-area-props.ts と同じく人手キュレーション済みの AREA_DATABOOK_TEMPLATE
 * (packages/data-configs、read-only import) の rankingKey だけを候補にする。各キーは
 * app/ranking/<key>/values.json の最新パーティションから両地域の値・順位を読み、47県そろっている &
 * 両地域とも値が非nullのものだけを使う。選定ロジック (対決の見どころ度=margin降順・重複ラベル/
 * 同一家族/出典・カテゴリ上限の除外) は lib/ig-compare-props.ts の純粋関数。
 *
 * データ源: R2 公開 URL のみ (認証不要)。
 *   app/ranking/<key>/item.json (readerLabel・subtitle・出典・カテゴリ・家計調査判定)
 *   app/ranking/<key>/values.json (最新年・順位・値)
 *
 * fail-closed: 対決が5件未満・7件超、または出典・年・数値が欠落した項目があれば
 * 非ゼロ終了しファイルを書かない。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-ig-compare-props.ts 13 27 [--count 6] [--min-year 2019] [--out <path>]
 *
 * 出力既定: .local/r2/sns/compare-carousel/<areaA5>-vs-<areaB5>/instagram/props.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getMaxDecimalPlaces } from "@stats47/utils";

import { AREA_DATABOOK_TEMPLATE } from "../../../packages/data-configs/src/area-databook/template.ts";
import { PREF_CAPITAL_COORDS } from "../../../packages/migration-flow/src/lib/pref-capitals.ts";
import {
  type CompareDuelItem,
  type DuelCandidate,
  buildCompareScopeNote,
  buildCoverQuestion,
  extractCuratedRankingKeys,
  normalizePrefCode,
  selectDuelCandidates,
  tallyWins,
  toDuelItem,
  validateDuelItems,
  MAX_DUEL_ITEMS,
  MIN_DUEL_ITEMS,
} from "./lib/ig-compare-props.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const DEFAULT_COUNT = 6;
const DEFAULT_MIN_YEAR = 2019;

function parseArgs() {
  const argv = process.argv.slice(2);
  const positional = argv.filter((v) => !v.startsWith("--"));
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  if (!positional[0] || !positional[1]) {
    console.error("✗ 2つの都道府県コードを指定してください (例: 13 27 または 13000 27000)");
    process.exit(1);
  }
  const count = val("--count") ? Number(val("--count")) : DEFAULT_COUNT;
  if (!Number.isInteger(count) || count < MIN_DUEL_ITEMS || count > MAX_DUEL_ITEMS) {
    console.error(`✗ --count は ${MIN_DUEL_ITEMS}〜${MAX_DUEL_ITEMS} の整数で指定してください`);
    process.exit(1);
  }
  return {
    areaAArg: positional[0],
    areaBArg: positional[1],
    count,
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
    categoryKey?: string;
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

interface DuelPair {
  year: number;
  unit: string;
  a: { value: number; rank: number; areaName: string };
  b: { value: number; rank: number; areaName: string };
}

/** 最新パーティションを取得し、47県そろっている & 両地域が非null の場合だけ両地域分の行を返す。 */
async function fetchLatestDuelPair(
  rankingKey: string,
  prefCode5A: string,
  prefCode5B: string,
  minYear: number,
  sourceKeys: Set<string>,
): Promise<DuelPair | null> {
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
  if (!Number.isFinite(year) || year < minYear) return null;
  const rows = latest.values.filter(
    (v): v is { areaCode: string; areaName?: string; rank: number; value: number; unit?: string } =>
      typeof v.rank === "number" && typeof v.value === "number",
  );
  if (rows.length !== 47) return null; // 47県そろっていない (欠測・部分集計) キーは使わない
  const rowA = rows.find((r) => r.areaCode === prefCode5A);
  const rowB = rows.find((r) => r.areaCode === prefCode5B);
  if (!rowA || !rowB) return null;
  return {
    year,
    unit: rowA.unit ?? "",
    a: { value: rowA.value, rank: rowA.rank, areaName: rowA.areaName ?? "" },
    b: { value: rowB.value, rank: rowB.rank, areaName: rowB.areaName ?? "" },
  };
}

async function buildCandidatePool(
  poolKeys: string[],
  prefCode5A: string,
  prefCode5B: string,
  minYear: number,
  sourceKeys: Set<string>,
): Promise<{ candidates: DuelCandidate[]; areaAName: string; areaBName: string }> {
  const candidates: DuelCandidate[] = [];
  let areaAName = "";
  let areaBName = "";

  await Promise.all(
    poolKeys.map(async (rankingKey) => {
      const [meta, pair] = await Promise.all([
        fetchItemMeta(rankingKey, sourceKeys),
        fetchLatestDuelPair(rankingKey, prefCode5A, prefCode5B, minYear, sourceKeys),
      ]);
      if (!meta || !meta.label || !meta.source || !meta.category) return;
      if (!pair) return;
      if (!areaAName && pair.a.areaName) areaAName = pair.a.areaName;
      if (!areaBName && pair.b.areaName) areaBName = pair.b.areaName;
      candidates.push({
        rankingKey,
        rawLabel: meta.label,
        subtitle: meta.subtitle,
        unit: pair.unit,
        year: pair.year,
        source: meta.source,
        category: meta.category,
        isKakei: meta.isKakei,
        a: { value: pair.a.value, rank: pair.a.rank },
        b: { value: pair.b.value, rank: pair.b.rank },
      });
    }),
  );

  return { candidates, areaAName, areaBName };
}

async function main() {
  const { areaAArg, areaBArg, count, minYear, out } = parseArgs();
  const { pref2: prefA2, pref5: prefA5 } = normalizePrefCode(areaAArg);
  const { pref2: prefB2, pref5: prefB5 } = normalizePrefCode(areaBArg);
  if (prefA5 === prefB5) {
    console.error("✗ 同じ都道府県は比較できません");
    process.exit(1);
  }
  const capitalA = PREF_CAPITAL_COORDS[prefA2];
  const capitalB = PREF_CAPITAL_COORDS[prefB2];
  if (!capitalA || !capitalB) {
    console.error(`✗ 県庁所在地が見つかりません: ${prefA2} / ${prefB2}`);
    process.exit(1);
  }

  const poolKeys = extractCuratedRankingKeys(AREA_DATABOOK_TEMPLATE);
  console.error(`→ 候補プール: ${poolKeys.length}件 (AREA_DATABOOK_TEMPLATE)`);

  const sourceKeys = new Set<string>();
  const { candidates, areaAName, areaBName } = await buildCandidatePool(
    poolKeys,
    prefA5,
    prefB5,
    minYear,
    sourceKeys,
  );
  if (!areaAName || !areaBName) {
    console.error(`✗ 県名を取得できませんでした (候補が全滅): ${prefA5} / ${prefB5}`);
    process.exit(1);
  }
  console.error(`→ ${areaAName} vs ${areaBName}: 対決候補 ${candidates.length}件`);

  const picked = selectDuelCandidates(candidates, count);
  const scopeNoteText = buildCompareScopeNote(prefA2, capitalA.name, prefB2, capitalB.name);
  const items: CompareDuelItem[] = picked.map((c) => {
    const precision = getMaxDecimalPlaces([c.a.value, c.b.value]);
    return toDuelItem(c, precision, scopeNoteText);
  });

  const errors = validateDuelItems(items);
  if (errors.length > 0) {
    console.error("✗ fail-closed: 出力条件を満たしていません (ファイルは書きません):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const summary = tallyWins(items);

  const props = {
    areaACode: prefA5,
    areaBCode: prefB5,
    areaAName,
    areaBName,
    coverQuestion: buildCoverQuestion(areaAName, areaBName),
    items,
    summary,
    canonicalUrl: `https://stats47.jp/compare?areas=${prefA5},${prefB5}`,
    generatedAt: new Date().toISOString(),
    sourceKeys: [...sourceKeys].sort(),
  };

  const outDir = out ?? join(PROJECT_ROOT, ".local/r2/sns/compare-carousel", `${prefA5}-vs-${prefB5}`, "instagram");
  mkdirSync(outDir, { recursive: true });
  const propsPath = join(outDir, "props.json");
  writeFileSync(propsPath, `${JSON.stringify(props, null, 2)}\n`, "utf-8");
  console.error(`✓ 書き出し: ${propsPath}`);
  console.error(`  次は render-ig-compare-carousel.ts でスライド画像 + caption.txt を書き出す`);
  console.error(`  対決 ${items.length}件 / ${areaAName} ${summary.aWins}勝 - ${summary.bWins}勝 ${areaBName}`);
}

main().catch((err) => {
  console.error(`✗ ${(err as Error).message}`);
  process.exit(1);
});
