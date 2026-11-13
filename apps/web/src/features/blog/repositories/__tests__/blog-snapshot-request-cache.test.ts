// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 同じリクエストの中では blog snapshot (app/blog/all.json) を 1 回だけ読むことを固定する (CF-RENDER-CPU-01)。
 *
 * 記事のページは 1 回の描画で読み取りの関数を 6 つ以上呼ぶ (記事・タグ・関連記事の題・使う指標・人気記事…)。
 * どれも snapshot 全体を取り、JSON を解析し、終了記事の除外とタグの正規化を全記事にかけるので、
 * 関数の数だけ同じ仕事を繰り返していた。React の cache() でリクエストごとに 1 回にまとめる。
 * モジュールに持ち続けると再配信した直後の古い索引を返すので、次のリクエストでは必ず読み直す。
 *
 * vitest が読む React (クライアント用) の cache() は記憶を持たない素通しなので、
 * 「同じリクエストの間だけ、関数と引数ごとに結果を覚える」という同じ約束の代役に差し替える。
 */
const { readSnapshot, requestCache, startRequest } = vi.hoisted(() => {
  let memo = new Map<unknown, Map<string, unknown>>();
  return {
    readSnapshot: vi.fn(),
    startRequest: () => {
      memo = new Map();
    },
    requestCache:
      <A extends unknown[], R>(fn: (...args: A) => R) =>
      (...args: A): R => {
        const byArgs = memo.get(fn) ?? new Map<string, unknown>();
        memo.set(fn, byArgs);
        const key = JSON.stringify(args);
        if (!byArgs.has(key)) byArgs.set(key, fn(...args));
        return byArgs.get(key) as R;
      },
  };
});

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: requestCache,
}));
vi.mock('server-only', () => ({}));
vi.mock('@stats47/r2-storage/server', () => ({
  createSnapshotReader: () => readSnapshot,
}));
vi.mock('../../config/popular-articles', () => ({
  POPULAR_BLOG_ARTICLE_SLUGS: ['a2', 'a1'],
}));

import * as reader from '../blog-snapshot-reader';

function article(slug: string, publishedAt: string) {
  return {
    slug,
    title: `${slug} のタイトル`,
    seoTitle: null,
    description: null,
    filePath: `blog/${slug}.md`,
    published: true,
    publishedAt,
    format: 'md',
    hasCharts: false,
    ogImageType: null,
    proofreadAt: null,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    tags: [{ tagKey: 'population' }],
    rankingRefs: [{ rankingKey: 'total-population' }],
  };
}

const snapshotOf = (...slugs: string[]) => ({
  generatedAt: '2026-11-14T00:00:00.000Z',
  tagMeta: [],
  articles: slugs.map((slug, index) => article(slug, `2026-0${index + 1}-01`)),
});

beforeEach(() => {
  startRequest();
  readSnapshot.mockReset().mockResolvedValue(snapshotOf('a1', 'a2', 'a3'));
});

describe('同じリクエストの中の blog snapshot の読み込み', () => {
  it('記事のページが呼ぶ読み取りを並べても、snapshot は 1 回しか読まない', async () => {
    const [found, tags, titles, rankingKeys, popular, usingMetric] = await Promise.all([
      reader.readArticleBySlugFromR2('a1'),
      reader.readTagKeysForArticleFromR2('a1'),
      reader.readArticleTitlesBySlugsFromR2(['a2']),
      reader.readRankingKeysForArticleFromR2('a1'),
      reader.readPopularArticlesFromR2('a1', 10),
      reader.readArticlesUsingRankingKeysFromR2(['total-population'], { excludeSlug: 'a1' }),
    ]);

    expect(readSnapshot).toHaveBeenCalledTimes(1);
    // まとめて読んでも、それぞれの読み取りが返す内容は変わらない
    expect(found?.slug).toBe('a1');
    expect(tags).toEqual([{ tagKey: '人口' }]);
    expect(titles).toEqual({ a2: 'a2 のタイトル' });
    expect(rankingKeys).toEqual(['total-population']);
    expect(popular.map((row) => row.slug)).toEqual(['a2']);
    expect(usingMetric.map((row) => row.slug)).toEqual(['a3', 'a2']);
  });

  it('並べ替えをする読み取りの後でも、共有した snapshot の記事の順は変わらない', async () => {
    // 新しい順に並べ替える読み取り (一覧) が、共有した配列そのものを書き換えていないこと
    expect((await reader.readLatestArticlesFromR2(10)).map((row) => row.slug)).toEqual(['a3', 'a2', 'a1']);
    expect((await reader.readNavigationArticlesFromR2()).map((row) => row.slug)).toEqual(['a1', 'a2', 'a3']);
    expect(readSnapshot).toHaveBeenCalledTimes(1);
  });

  it('次のリクエストでは読み直し、再配信した索引を返す (モジュールに持ち越さない)', async () => {
    expect(await reader.readArticleBySlugFromR2('a4')).toBeNull();

    startRequest();
    readSnapshot.mockResolvedValue(snapshotOf('a1', 'a2', 'a3', 'a4'));

    expect((await reader.readArticleBySlugFromR2('a4'))?.slug).toBe('a4');
    expect(readSnapshot).toHaveBeenCalledTimes(2);
  });
});
