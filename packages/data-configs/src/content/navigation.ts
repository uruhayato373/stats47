import { CONTENT_NAVIGATION, type ContentLink, type ContentPage, type ContentRelation } from './index';

export interface ContentRecommendation extends ContentPage {
  relation: ContentRelation;
  reason: string;
}
export interface ContentContext {
  sourceId: string;
  kinds: readonly string[];
  rankingKeys?: readonly string[];
  tagIds?: readonly string[];
  limit?: number;
}

/** 公開状態と意味のある関係を先に検査し、タグ一致は補助として使う。 */
export function selectContentRecommendations(
  pages: readonly ContentPage[], links: readonly ContentLink[], context: ContentContext,
): ContentRecommendation[] {
  const source = pages.find(page => page.id === context.sourceId);
  const sourceKeys = new Set(context.rankingKeys ?? (source?.kind === 'ranking' ? [source.key] : source?.rankingKeys ?? []));
  const sourceTags = new Set(context.tagIds ?? source?.tagIds ?? []);
  const outgoing = new Map(links.filter(edge => edge.from === context.sourceId).map(edge => [edge.to, edge.relation]));
  const exclusions: Record<string, readonly string[]> = CONTENT_NAVIGATION.excludedArticleTagIdsByKind;
  const excludedTags = new Set(exclusions[source?.kind ?? ''] ?? []);
  const scored: Array<ContentRecommendation & { score: number }> = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (!page.published || page.id === context.sourceId || !context.kinds.includes(page.kind) || seen.has(page.id)) continue;
    // 県の特徴から制作手順へは自動で誘導しない。編集者がIDで明示した関係は優先する。
    if (page.kind === 'blog' && !outgoing.has(page.id) && page.tagIds?.some(id => excludedTags.has(id))) continue;
    seen.add(page.id);
    let relation = outgoing.get(page.id);
    const matched = (page.kind === 'ranking' ? [page.key] : page.rankingKeys ?? []).filter(key => sourceKeys.has(key)).length;
    if (!relation && matched > 0) {
      relation = page.kind === 'ranking' ? 'uses' : page.kind === 'theme' ? 'contains' : source?.kind === 'ranking' ? 'explains' : 'sharedMetric';
    }
    if (!relation && page.kind === 'blog' && page.tagIds?.some(id => sourceTags.has(id))) relation = 'tag';
    if (!relation) continue;
    const policy = CONTENT_NAVIGATION.relations[relation];
    scored.push({ ...page, relation, reason: policy.label, score: policy.priority + Math.min(matched, 10) });
  }
  return scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, context.limit ?? CONTENT_NAVIGATION.limit)
    .map(({ score: _score, ...page }) => page);
}
