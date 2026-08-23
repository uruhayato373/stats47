import "server-only";

import { METRICS_REGISTRY } from "@stats47/data-configs";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import {
  getSurveyTaxonomyEntries,
  resolveBlogChartSurveyTaxonomy,
  resolveSurveyTaxonomy,
} from "@stats47/ranking";

type SourceFetcher = (key: string) => Promise<unknown | null>;

export function extractArticleChartBases(content: string): string[] {
  return [...new Set(
    [...content.matchAll(/\]\(data\/([^)]+?)\.svg(?:[?#][^)]*)?\)/g)].map((match) => match[1]),
  )];
}

function extractArticleRankingKeys(content: string): string[] {
  return [...new Set(
    [...content.matchAll(/\]\(\/ranking\/([a-z0-9-]+)\/?(?:[?#][^)]*)?\)/g)]
      .map((match) => match[1]),
  )];
}

/**
 * 記事本文の図表 source.json と ranking 内部リンクから出典調査を派生する。
 * snapshot に surveyIds が焼かれていれば追加 R2 read なし、旧 snapshot だけ fallback 監査する。
 */
export async function resolveArticleSurveyTaxonomy(
  input: { slug: string; content: string; snapshotSurveyIds?: readonly string[] },
  fetchSource: SourceFetcher = fetchFromR2AsJson,
) {
  if (input.snapshotSurveyIds && input.snapshotSurveyIds.length > 0) {
    return getSurveyTaxonomyEntries(input.snapshotSurveyIds);
  }

  const rankingResolution = resolveSurveyTaxonomy(
    { metricKeys: extractArticleRankingKeys(input.content) },
    METRICS_REGISTRY,
  );
  const bases = extractArticleChartBases(input.content);
  const chartResults = await Promise.all(
    bases.map(async (base) => {
      const source = await fetchSource(`app/blog/${input.slug}/data/${base}.source.json`);
      return resolveBlogChartSurveyTaxonomy(source, METRICS_REGISTRY);
    }),
  );
  const ids = [
    ...rankingResolution.surveys.map((survey) => survey.id),
    ...chartResults.flatMap((result) => result.surveys.map((survey) => survey.id)),
  ];
  return getSurveyTaxonomyEntries(ids);
}

/** exporter が snapshot へ焼く最小表現。 */
export async function resolveArticleSurveyIds(
  input: { slug: string; content: string },
  fetchSource: SourceFetcher = fetchFromR2AsJson,
): Promise<string[]> {
  const surveys = await resolveArticleSurveyTaxonomy(input, fetchSource);
  return surveys.map((survey) => survey.id);
}
