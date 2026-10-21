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

/** 1 つの指標を見せるページの種別。ページの key がそのまま指標キー。 */
const SINGLE_METRIC_KINDS: ReadonlySet<string> = new Set(['ranking', 'municipality-ranking']);
/** 複数の指標を束ねるページの種別。 */
const METRIC_GROUP_KINDS: ReadonlySet<string> = new Set(['theme', 'municipality-theme']);

function metricKeysOf(page: ContentPage | undefined): readonly string[] {
  if (!page) return [];
  return SINGLE_METRIC_KINDS.has(page.kind) ? [page.key] : page.rankingKeys ?? [];
}

/** 指標が一致したときの関係。都道府県版と市区町村版の同じ指標は sameMetric で結ぶ。 */
function metricRelation(page: ContentPage, source: ContentPage | undefined): ContentRelation {
  const fromSingleMetric = source !== undefined && SINGLE_METRIC_KINDS.has(source.kind);
  if (SINGLE_METRIC_KINDS.has(page.kind)) return fromSingleMetric ? 'sameMetric' : 'uses';
  if (METRIC_GROUP_KINDS.has(page.kind)) return 'contains';
  return fromSingleMetric ? 'explains' : 'sharedMetric';
}

/**
 * 公開状態と意味のある関係を先に検査し、タグ一致は補助として使う。
 * 同点は、記事の指標の絞り込み → 呼び出し側が並べた kinds の順 → 不変 ID の順で切る。
 */
export function selectContentRecommendations(
  pages: readonly ContentPage[], links: readonly ContentLink[], context: ContentContext,
): ContentRecommendation[] {
  const source = pages.find(page => page.id === context.sourceId);
  const sourceKeys = new Set(context.rankingKeys ?? metricKeysOf(source));
  const sourceTags = new Set(context.tagIds ?? source?.tagIds ?? []);
  const outgoing = new Map(links.filter(edge => edge.from === context.sourceId).map(edge => [edge.to, edge.relation]));
  const exclusions: Record<string, readonly string[]> = CONTENT_NAVIGATION.excludedArticleTagIdsByKind;
  const excludedTags = new Set(exclusions[source?.kind ?? ''] ?? []);
  const scored: Array<ContentRecommendation & { score: number; focus: number }> = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (!page.published || page.id === context.sourceId || !context.kinds.includes(page.kind) || seen.has(page.id)) continue;
    // 県の特徴から制作手順へは自動で誘導しない。編集者がIDで明示した関係は優先する。
    if (page.kind === 'blog' && !outgoing.has(page.id) && page.tagIds?.some(id => excludedTags.has(id))) continue;
    seen.add(page.id);
    let relation = outgoing.get(page.id);
    const matched = metricKeysOf(page).filter(key => sourceKeys.has(key)).length;
    if (!relation && matched > 0) relation = metricRelation(page, source);
    if (!relation && page.kind === 'blog' && page.tagIds?.some(id => sourceTags.has(id))) relation = 'tag';
    if (!relation) continue;
    const policy = CONTENT_NAVIGATION.relations[relation];
    // 同点の切り方: その記事が元ページの指標にどれだけ絞っているか (一致数 ÷ 記事が使う指標数)。
    // 県の食文化記事のように多くの指標を使う記事が、品目そのものの記事を ID 順で押し出すのを防ぐ (RELATED-ARTICLES-TIEBREAK-01)。
    const focus = page.kind === 'blog' && page.rankingKeys?.length ? matched / page.rankingKeys.length : 0;
    scored.push({ ...page, relation, reason: policy.label, score: policy.priority + Math.min(matched, 10), focus });
  }
  const kindOrder = (page: ContentPage) => context.kinds.indexOf(page.kind);
  return scored.sort((a, b) => b.score - a.score || b.focus - a.focus || kindOrder(a) - kindOrder(b) || a.id.localeCompare(b.id))
    .slice(0, context.limit ?? CONTENT_NAVIGATION.limit)
    .map(({ score: _score, focus: _focus, ...page }) => page);
}
