import fs from 'node:fs';
import path from 'node:path';

import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

import {
  blogPagesFromLedger,
  serializeBlogArticleLedger,
  toCalendarDate,
  upsertBlogArticleLedger,
  type BlogArticleLedger,
  type BlogSnapshotArticle,
} from '../blog-article-ledger';

const ROOT = path.resolve(__dirname, '../../../../..');
const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));

const article = (
  slug: string,
  overrides: Partial<BlogSnapshotArticle> = {}
): BlogSnapshotArticle => ({
  slug,
  title: `${slug} の題`,
  published: true,
  publishedAt: '2026-09-01',
  updatedAt: null,
  filePath: `blog/${slug}/article.md`,
  tags: [{ tagKey: '家計調査' }],
  rankingRefs: [{ rankingKey: 'total-population' }],
  ...overrides,
});

const tagIdsOf = (keys: string[]) => keys.map((key) => `tag:${key.length}`);
const NONE: ReadonlySet<string> = new Set();

const upsert = (
  snapshot: BlogSnapshotArticle[],
  options: {
    previous?: BlogArticleLedger;
    gone?: string[];
    unpublished?: string[];
  } = {}
) =>
  upsertBlogArticleLedger({
    previous: options.previous,
    snapshot,
    goneSlugs: new Set(options.gone ?? []),
    unpublishedSlugs: new Set(options.unpublished ?? []),
    tagIdsOf,
  });

describe('記事台帳の upsert', () => {
  it('R2 の一覧の記事を slug の昇順で記録し、公開の状態を写す', () => {
    const ledger = upsert([
      article('b-article', { published: false }),
      article('a-article', { updatedAt: '2026-11-09' }),
    ]);

    expect(ledger.articles.map((record) => record.slug)).toEqual([
      'a-article',
      'b-article',
    ]);
    expect(ledger.articles[0]).toEqual({
      slug: 'a-article',
      title: 'a-article の題',
      status: 'published',
      publishedAt: '2026-09-01',
      updatedAt: '2026-11-09',
      rankingKeys: ['total-population'],
      tagIds: ['tag:4'],
      r2Path: 'blog/a-article/article.md',
    });
    expect(ledger.articles[1]!.status).toBe('unpublished');
  });

  it('R2 の一覧から消えた記事の記録を消さず、状態を gone にして本文の所在を外す', () => {
    const first = upsert([article('kept'), article('removed')]);

    const second = upsert([article('kept')], { previous: first });

    const removed = second.articles.find((record) => record.slug === 'removed');
    expect(removed).toMatchObject({
      status: 'gone',
      r2Path: null,
      title: 'removed の題',
      publishedAt: '2026-09-01',
      rankingKeys: ['total-population'],
    });
    expect(second.articles).toHaveLength(2);
  });

  it('消えた記事が R2 の一覧に戻ると、一覧の状態と所在に戻る', () => {
    const first = upsert([article('kept'), article('back')]);
    const second = upsert([article('kept')], { previous: first });

    const third = upsert([article('kept'), article('back')], {
      previous: second,
    });

    expect(third).toEqual(first);
  });

  it('410 の一覧にある slug は、R2 の一覧で公開中でも gone にする', () => {
    const ledger = upsert([article('withdrawn')], { gone: ['withdrawn'] });

    expect(ledger.articles[0]).toMatchObject({
      status: 'gone',
      r2Path: 'blog/withdrawn/article.md',
    });
  });

  it('410 の一覧・未公開の一覧にあって台帳に無い slug を、状態だけの記録として足す', () => {
    const ledger = upsert([article('live')], {
      gone: ['BarChartRace'],
      unpublished: ['draft-only'],
    });

    expect(
      ledger.articles.map((record) => [record.slug, record.status, record.title])
    ).toEqual([
      ['BarChartRace', 'gone', null],
      ['draft-only', 'unpublished', null],
      ['live', 'published', 'live の題'],
    ]);
  });

  it('同じ入力で 2 回 upsert しても結果が変わらない', () => {
    const snapshot = [article('one'), article('two', { published: false })];
    const first = upsert(snapshot, { gone: ['old'] });

    const second = upsert(snapshot, { previous: first, gone: ['old'] });

    expect(serializeBlogArticleLedger(second)).toBe(
      serializeBlogArticleLedger(first)
    );
  });

  it('一覧が 0 件のときは止める (全記事を gone にしない)', () => {
    const previous = upsert([article('live')]);

    expect(() => upsert([], { previous })).toThrow(/0 件/);
  });

  it('一覧の slug が重複していたら止める', () => {
    expect(() => upsert([article('dup'), article('dup')])).toThrow(/重複/);
  });
});

describe('日付の暦日化', () => {
  it('暦日はそのまま、時差付きの日時は日本時間の暦日にする', () => {
    expect(toCalendarDate('2026-09-05')).toBe('2026-09-05');
    expect(toCalendarDate('2026-05-28T11:39:53.464Z')).toBe('2026-05-28');
    // UTC 15 時以降は日本時間で翌日
    expect(toCalendarDate('2026-05-28T15:00:00.000Z')).toBe('2026-05-29');
    expect(toCalendarDate('2026-03-27 10:39:04')).toBe('2026-03-27');
    expect(toCalendarDate(null)).toBeNull();
    expect(toCalendarDate(undefined)).toBeNull();
  });

  it('日付として読めない値は止める', () => {
    expect(() => toCalendarDate('昨日')).toThrow(/日付として読めない/);
  });
});

describe('台帳からページ索引の行を作る', () => {
  it('本文が R2 にある記録だけを載せ、published の記事だけを公開中にする', () => {
    const ledger = upsert(
      [
        article('live'),
        article('hidden', { published: false }),
        article('withdrawn'),
        article('renamed'),
      ],
      { gone: ['withdrawn', 'never-listed'] }
    );

    const pages = blogPagesFromLedger(ledger, {
      redirectedSlugs: new Set(['renamed']),
    });

    expect(pages.map((page) => [page.id, page.published])).toEqual([
      ['blog:hidden', false],
      ['blog:live', true],
      ['blog:renamed', false],
      ['blog:withdrawn', false],
    ]);
    expect(pages[1]).toEqual({
      id: 'blog:live',
      kind: 'blog',
      key: 'live',
      title: 'live の題',
      href: '/blog/live',
      published: true,
      rankingKeys: ['total-population'],
      tagIds: ['tag:4'],
    });
  });

  it('R2 の一覧から消えた記事はページ索引から外れる', () => {
    const first = upsert([article('kept'), article('removed')]);
    const second = upsert([article('kept')], { previous: first });

    const pages = blogPagesFromLedger(second, { redirectedSlugs: NONE });

    expect(pages.map((page) => page.id)).toEqual(['blog:kept']);
  });
});

describe('リポジトリの記事台帳', () => {
  const ledger = readJson('data/blog/ledger/articles.json') as BlogArticleLedger;

  it('upsert の結果が台帳の JSON Schema に合う', () => {
    const ajv = new Ajv({ allErrors: true });
    ajv.addSchema(
      readJson('config/schema/common.schema.json'),
      'common.schema.json'
    );
    const validate = ajv.compile(
      readJson('data/blog/ledger/articles.schema.json')
    );
    const built = upsert(
      [article('live', { updatedAt: '2026-05-28T11:39:53.464Z' })],
      { gone: ['BarChartRace'] }
    );
    // tagIdsOf はテスト用の関数なので、Schema が求める ID の形に直す
    const shaped = {
      ...built,
      articles: built.articles.map((record) => ({
        ...record,
        tagIds: record.tagIds.map(() => 'tag:t-0123456789ab'),
      })),
    };

    expect(validate(shaped), ajv.errorsText(validate.errors)).toBe(true);
    expect(validate(ledger), ajv.errorsText(validate.errors)).toBe(true);
    expect(
      validate({
        ...shaped,
        articles: [{ ...shaped.articles[1], title: null }],
      })
    ).toBe(false);
  });

  it('台帳から作った行が、コミットしてあるブログのページ索引と一致する', async () => {
    const { BLOG_SLUG_REDIRECTS } = await import(
      '../../../src/config/blog-redirects'
    );
    const committed = readJson('data/content/pages/blog.json').pages;

    const pages = blogPagesFromLedger(ledger, {
      redirectedSlugs: new Set(Object.keys(BLOG_SLUG_REDIRECTS)),
    }).sort((a, b) => a.id.localeCompare(b.id));

    expect(pages).toEqual(committed);
  });

  it('台帳の slug が重複せず、昇順に並んでいる', () => {
    const slugs = ledger.articles.map((record) => record.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(
      [...slugs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    );
  });
});
