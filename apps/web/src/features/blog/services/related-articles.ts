import "server-only";

import { readArticleSummariesByTagKeyFromR2 } from "../repositories/blog-snapshot-reader";

export interface RelatedArticleSummary {
  slug: string;
  title: string;
  description: string | null;
}

interface GetRelatedArticlesOptions {
  /** 返す最大件数 */
  limit?: number;
  /** 各タグから取得する件数（既定は limit と同じ） */
  perTag?: number;
}

/**
 * 複数タグから関連記事を集約する共有ロジック（Phase 3 / カード重複統合）。
 *
 * ranking サイドバー / area プロフィール / theme ダッシュボードで各々が
 * 「タグ群を並列取得 → slug で重複除去 → 上限カット」を別実装していたのを 1 本化した。
 * プレゼン（RailCard / section-grid / SurfaceCard-grid）は呼び出し側が担い、
 * 本関数は **データ集約のみ** を責務とする（presentation は共有しない＝文脈ごとに正当に異なる）。
 */
export async function getRelatedArticleSummaries(
  tagKeys: string[],
  { limit = 5, perTag }: GetRelatedArticlesOptions = {},
): Promise<RelatedArticleSummary[]> {
  if (tagKeys.length === 0) return [];

  const batches = await Promise.all(
    tagKeys.map((tagKey) =>
      readArticleSummariesByTagKeyFromR2(tagKey, perTag ?? limit),
    ),
  );

  const seen = new Set<string>();
  const result: RelatedArticleSummary[] = [];
  for (const batch of batches) {
    for (const article of batch) {
      if (seen.has(article.slug) || result.length >= limit) continue;
      seen.add(article.slug);
      result.push(article);
    }
    if (result.length >= limit) break;
  }
  return result;
}
