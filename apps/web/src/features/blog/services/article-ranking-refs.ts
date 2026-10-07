import "server-only";

import { METRICS_REGISTRY } from "@stats47/data-configs";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { extractBlogChartSourceReferences } from "@stats47/ranking";

import { blogR2Key } from "../r2-key";
import type { SnapshotRankingRef } from "../types/snapshot";

import { extractArticleChartBases } from "./article-survey-taxonomy";

type SourceFetcher = (key: string) => Promise<unknown | null>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** source.json の `year` (4 桁)。無い・読めないときは undefined。 */
function chartYear(source: unknown): string | undefined {
  if (!isRecord(source)) return undefined;
  const year = typeof source.year === "number" ? String(source.year) : source.year;
  return typeof year === "string" && /^\d{4}$/.test(year) ? year : undefined;
}

/**
 * 1 枚の図が使う指標と、その図に描いた年。指標は source.json の参照 (rankingKey・xKey/yKey・
 * app/ranking/<key>/ など。抽出の正典は extractBlogChartSourceReferences) のうち、
 * 実在する metric だけを採る。
 */
export function extractChartRankingRefs(source: unknown): SnapshotRankingRef[] {
  const year = chartYear(source);
  return extractBlogChartSourceReferences(source)
    .rankingKeys.filter((key) => key in METRICS_REGISTRY)
    .map((rankingKey) => (year ? { rankingKey, year } : { rankingKey }));
}

function extractBodyRankingKeys(content: string): string[] {
  return [...content.matchAll(/\]\(\/ranking\/([a-z0-9-]+)\/?(?:[?#][^)]*)?\)/g)]
    .map((match) => match[1]!)
    .filter((key) => key in METRICS_REGISTRY);
}

/**
 * 記事が使う指標と、図に描いた年。exporter が snapshot の `rankingRefs` に焼く。
 *
 * 2 つの用途がある。① 指標 → 記事の逆引き (ランキング・エリア・テーマから記事への回遊)。
 * ② 図の年と指標の最新年の比較 (新しい年が取り込まれたあとに古い年のままの記事を見つける)。
 * 同じ指標を複数の年で描いた記事は、最も古い年を残す (②で見落とさないため)。本文のリンクだけの指標は年を持たない。
 */
export async function resolveArticleRankingRefs(
  input: { slug: string; content: string },
  fetchSource: SourceFetcher = fetchFromR2AsJson,
): Promise<SnapshotRankingRef[]> {
  const perChart = await Promise.all(
    extractArticleChartBases(input.content).map(async (base) =>
      extractChartRankingRefs(await fetchSource(blogR2Key(input.slug, `data/${base}.source.json`))),
    ),
  );
  const byKey = new Map<string, SnapshotRankingRef>();
  for (const ref of perChart.flat()) {
    const prev = byKey.get(ref.rankingKey);
    if (!prev || (ref.year && (!prev.year || ref.year < prev.year))) byKey.set(ref.rankingKey, ref);
  }
  for (const rankingKey of extractBodyRankingKeys(input.content)) {
    if (!byKey.has(rankingKey)) byKey.set(rankingKey, { rankingKey });
  }
  return [...byKey.values()].sort((a, b) => a.rankingKey.localeCompare(b.rankingKey));
}
