import "server-only";

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { extractArticleChartBases } from "./article-survey-taxonomy";

type SourceFetcher = (key: string) => Promise<unknown | null>;

const RANKING_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 散布図 source.json が示す 2 指標 (昇順)。記録するフィールドは kind ごとに違う
 * (語彙の正典は .claude/scripts/lib/chart-provenance.mjs の CHART_SOURCE_KIND_SPECS)。
 * "a + b" のような合成キーや同一キーは 2 指標の関係を表さないので返さない。
 */
export function extractChartMetricPair(source: unknown): [string, string] | null {
  if (!isRecord(source)) return null;
  const keys =
    source.kind === "correlation"
      ? [source.base, source.pair]
      : source.kind === "scatter"
        ? [source.xKey, source.yKey]
        : source.kind === "composite" && isRecord(source.xMetric) && isRecord(source.yMetric)
          ? [source.xMetric.rankingKey, source.yMetric.rankingKey]
          : null;
  if (!keys) return null;
  const [a, b] = keys;
  if (typeof a !== "string" || typeof b !== "string") return null;
  if (!RANKING_KEY_RE.test(a) || !RANKING_KEY_RE.test(b) || a === b) return null;
  return a < b ? [a, b] : [b, a];
}

/**
 * 記事が散布図で扱う 2 指標ペア。exporter が snapshot へ焼き、ランキングページが
 * 「この 2 指標の関係を解説した記事」を引く。本文のタグに依存しない (相関記事は tags が空)。
 */
export async function resolveArticleMetricPairs(
  input: { slug: string; content: string },
  fetchSource: SourceFetcher = fetchFromR2AsJson,
): Promise<Array<[string, string]>> {
  const pairs = await Promise.all(
    extractArticleChartBases(input.content).map(async (base) =>
      extractChartMetricPair(
        await fetchSource(`app/blog/${input.slug}/data/${base}.source.json`),
      ),
    ),
  );
  const unique = new Map<string, [string, string]>();
  for (const pair of pairs) if (pair) unique.set(pair.join("|"), pair);
  return [...unique.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, pair]) => pair);
}
