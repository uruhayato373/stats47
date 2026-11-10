/**
 * ブログの記事台帳 (カタログ id: blog.articles) の更新と、台帳からページ索引の行を作る関数。
 *
 * 流れは一本: R2 の app/blog/all.json → 台帳へ upsert → 台帳からページ索引 (content.pages の blog)。
 * R2 を読まない実行は台帳だけからページ索引を作る。形の契約は台帳と同じ場所の JSON Schema。
 */
import type { ContentPage } from '@stats47/data-configs/content';

export type BlogArticleStatus = 'published' | 'unpublished' | 'gone';

export interface BlogArticleRecord {
  slug: string;
  title: string | null;
  status: BlogArticleStatus;
  publishedAt: string | null;
  updatedAt: string | null;
  rankingKeys: string[];
  tagIds: string[];
  r2Path: string | null;
}

export interface BlogArticleLedger {
  schemaVersion: 1;
  articles: BlogArticleRecord[];
}

/** R2 の app/blog/all.json の articles[] のうち、台帳が読む項目 */
export interface BlogSnapshotArticle {
  slug: string;
  title: string;
  published: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
  filePath?: string | null;
  tags: { tagKey: string }[];
  rankingRefs?: { rankingKey: string }[];
}

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HAS_UTC_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * snapshot の日付を暦日 (YYYY-MM-DD) にそろえる。時差付きの日時は日本時間の暦日にする
 * (all.json の updatedAt は暦日と UTC の日時が混ざっている)。
 */
export function toCalendarDate(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (CALENDAR_DATE.test(value)) return value;
  if (HAS_UTC_OFFSET.test(value)) {
    const time = Date.parse(value);
    if (!Number.isNaN(time))
      return new Date(time + JST_OFFSET_MS).toISOString().slice(0, 10);
  }
  const head = value.slice(0, 10);
  if (CALENDAR_DATE.test(head)) return head;
  throw new Error(`日付として読めない値: ${value}`);
}

const bySlug = (a: BlogArticleRecord, b: BlogArticleRecord) =>
  a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;

const emptyRecord = (
  slug: string,
  status: BlogArticleStatus
): BlogArticleRecord => ({
  slug,
  title: null,
  status,
  publishedAt: null,
  updatedAt: null,
  rankingKeys: [],
  tagIds: [],
  r2Path: null,
});

/**
 * R2 の一覧を台帳へ upsert する。
 *   - 一覧にある記事は、一覧の内容で記録を作り直す。410 の一覧にある slug は状態を gone にする
 *   - 一覧から消えた記事の記録は消さない。状態を gone にし、本文の所在を外す (題・日付・指標・タグは最後の値を残す)
 *   - 410 の一覧・未公開の一覧にあって台帳に無い slug は、状態だけを持つ記録として足す
 * 一覧が空のときは止める (全記事を gone にしない)。
 */
export function upsertBlogArticleLedger(input: {
  previous: BlogArticleLedger | undefined;
  snapshot: readonly BlogSnapshotArticle[];
  goneSlugs: ReadonlySet<string>;
  unpublishedSlugs: ReadonlySet<string>;
  tagIdsOf: (tagKeys: string[]) => string[];
}): BlogArticleLedger {
  const { previous, snapshot, goneSlugs, unpublishedSlugs, tagIdsOf } = input;
  if (snapshot.length === 0)
    throw new Error('blog snapshot が 0 件です。記事台帳を更新しません。');
  const records = new Map<string, BlogArticleRecord>();
  for (const article of snapshot) {
    if (records.has(article.slug))
      throw new Error(`blog snapshot の slug が重複: ${article.slug}`);
    records.set(article.slug, {
      slug: article.slug,
      title: article.title,
      status: goneSlugs.has(article.slug)
        ? 'gone'
        : article.published
          ? 'published'
          : 'unpublished',
      publishedAt: toCalendarDate(article.publishedAt),
      updatedAt: toCalendarDate(article.updatedAt),
      rankingKeys: (article.rankingRefs ?? []).map((ref) => ref.rankingKey),
      tagIds: tagIdsOf(article.tags.map((tag) => tag.tagKey)),
      r2Path: article.filePath ?? null,
    });
  }
  for (const record of previous?.articles ?? []) {
    if (records.has(record.slug)) continue;
    records.set(record.slug, { ...record, status: 'gone', r2Path: null });
  }
  for (const slug of goneSlugs)
    if (!records.has(slug)) records.set(slug, emptyRecord(slug, 'gone'));
  for (const slug of unpublishedSlugs)
    if (!records.has(slug)) records.set(slug, emptyRecord(slug, 'unpublished'));
  return { schemaVersion: 1, articles: [...records.values()].sort(bySlug) };
}

/**
 * 台帳からページ索引の行を作る。索引に載せるのは本文が R2 にある記事 (r2Path を持つ記録) で、
 * 公開中として扱うのは状態が published で、旧 slug の転送表に載っていないものだけ。
 */
export function blogPagesFromLedger(
  ledger: BlogArticleLedger,
  options: { redirectedSlugs: ReadonlySet<string> }
): ContentPage[] {
  return ledger.articles
    .filter((record) => record.r2Path !== null)
    .map((record) => {
      if (record.title === null)
        throw new Error(`本文の所在がある記事に題が無い: ${record.slug}`);
      return {
        id: `blog:${record.slug}`,
        kind: 'blog',
        key: record.slug,
        title: record.title,
        href: `/blog/${record.slug}`,
        published:
          record.status === 'published' &&
          !options.redirectedSlugs.has(record.slug),
        rankingKeys: record.rankingKeys,
        tagIds: record.tagIds,
      };
    });
}

export function serializeBlogArticleLedger(ledger: BlogArticleLedger): string {
  return JSON.stringify(ledger, null, 2) + '\n';
}
