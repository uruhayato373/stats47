import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `/blog` 一覧の snapshot 読み込み回数と pagination 判定を固定する。
 *
 * 個別 reader を並べると同一リクエスト内で full snapshot を 3 回取得していた
 * (記事 + meta + 次ページ判定)。module cache は re-push 直後の stale を招くため
 * 追加せず、1 回 load して必要なものを全部返す形にしている。
 */

const loadSnapshot = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@stats47/r2-storage/server', () => ({
  createSnapshotReader: () => loadSnapshot,
}));

function article(
  slug: string,
  publishedAt: string,
  published = true,
  surveyIds?: string[]
) {
  return {
    slug,
    title: `${slug} のタイトル`,
    seoTitle: null,
    description: null,
    filePath: `blog/${slug}.md`,
    published,
    publishedAt,
    format: 'md',
    hasCharts: false,
    ogImageType: null,
    proofreadAt: null,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    tags: [{ tagKey: 'population' }],
    ...(surveyIds ? { surveyIds } : {}),
  };
}

/** 公開 5 件 (新しい順に a5..a1) + 未公開 1 件 */
const SNAPSHOT = {
  generatedAt: '2026-07-29T00:00:00.000Z',
  tagMeta: [{ tagKey: 'population', articleCount: 5 }],
  articles: [
    article('a1', '2026-01-01'),
    article('a2', '2026-02-01'),
    article('draft', '2026-06-01', false),
    article('a3', '2026-03-01'),
    article('a4', '2026-04-01'),
    article('a5', '2026-05-01'),
  ],
};

async function importReader() {
  return import('../blog-snapshot-reader');
}

beforeEach(() => {
  vi.resetModules();
  loadSnapshot.mockReset();
  loadSnapshot.mockResolvedValue(SNAPSHOT);
});

describe('readBlogIndexPageFromR2', () => {
  it.each([
    'airport-count-vs-wind-power-plant-count-facility',
    'dam-count-prefecture-gap',
    'dam-count-vs-road-expressway-length',
  ])('旧索引の終了記事 %s を一覧・タグ・調査・詳細の全導線から除く', async (slug) => {
    loadSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      articles: [...SNAPSHOT.articles, article(slug, '2026-09-06', true, ['mlit-ksj'])],
      tagMeta: [{ tagKey: 'population', articleCount: 6 }],
      surveyArticleIndex: { 'mlit-ksj': [slug] },
    });
    const reader = await importReader();
    expect((await reader.readBlogIndexPageFromR2(10, 0)).articles.map((a) => a.slug)).not.toContain(slug);
    expect((await reader.readArticlesByTagKeyFromR2('population')).map((a) => a.slug)).not.toContain(slug);
    expect(await reader.readArticleSummariesBySurveyIdFromR2('mlit-ksj')).toEqual([]);
    expect(await reader.readArticleBySlugFromR2(slug)).toBeNull();
    expect(await reader.readArticleTitlesBySlugsFromR2([slug, 'a1'])).toEqual({ a1: 'a1 のタイトル' });
    expect(await reader.readAllTagsWithCountFromR2()).toEqual([{ tag: 'population', tagKey: 'population', count: 5 }]);
  });

  it('1 リクエストにつき snapshot を 1 回だけ読む', async () => {
    const { readBlogIndexPageFromR2 } = await importReader();

    await readBlogIndexPageFromR2(2, 0);

    expect(loadSnapshot).toHaveBeenCalledTimes(1);
  });

  it('未公開を除き公開日の新しい順に返す', async () => {
    const { readBlogIndexPageFromR2 } = await importReader();

    const { articles } = await readBlogIndexPageFromR2(10, 0);

    expect(articles.map((a) => a.slug)).toEqual(['a5', 'a4', 'a3', 'a2', 'a1']);
  });

  it('個別 reader と同じ記事列を返す', async () => {
    const { readBlogIndexPageFromR2, readLatestArticlesFromR2 } =
      await importReader();

    const aggregate = await readBlogIndexPageFromR2(2, 2);
    const individual = await readLatestArticlesFromR2(2, 2);

    expect(aggregate.articles).toEqual(individual);
  });

  it('先頭・途中・最終ページで hasNextPage を正しく判定する', async () => {
    const { readBlogIndexPageFromR2 } = await importReader();

    const first = await readBlogIndexPageFromR2(2, 0);
    const middle = await readBlogIndexPageFromR2(2, 2);
    const last = await readBlogIndexPageFromR2(2, 4);

    expect(first.articles.map((a) => a.slug)).toEqual(['a5', 'a4']);
    expect(first.hasNextPage).toBe(true);
    expect(middle.articles.map((a) => a.slug)).toEqual(['a3', 'a2']);
    expect(middle.hasNextPage).toBe(true);
    expect(last.articles.map((a) => a.slug)).toEqual(['a1']);
    expect(last.hasNextPage).toBe(false);
  });

  it('ちょうど割り切れる最終ページでは次ページなしとする', async () => {
    const { readBlogIndexPageFromR2 } = await importReader();

    const page = await readBlogIndexPageFromR2(5, 0);

    expect(page.articles).toHaveLength(5);
    expect(page.hasNextPage).toBe(false);
  });

  it('meta は記事と同じ snapshot 由来', async () => {
    const { readBlogIndexPageFromR2, readBlogSnapshotMetaFromR2 } =
      await importReader();

    const { meta } = await readBlogIndexPageFromR2(2, 0);

    expect(meta).toEqual(await readBlogSnapshotMetaFromR2());
    expect(meta.generatedAt).toBe(SNAPSHOT.generatedAt);
  });

  it('読み込み失敗は throw し、page 側の fallback に委ねる', async () => {
    const { readBlogIndexPageFromR2 } = await importReader();
    loadSnapshot.mockRejectedValueOnce(new Error('R2 unavailable'));

    await expect(readBlogIndexPageFromR2(2, 0)).rejects.toThrow(
      'R2 unavailable'
    );
  });
});

describe('readArticleSummariesBySurveyIdFromR2', () => {
  it('公開記事だけを surveyId で逆引きし、新しい順と limit を守る', async () => {
    loadSnapshot.mockResolvedValueOnce({
      ...SNAPSHOT,
      articles: [
        article('old', '2026-01-01', true, ['kakei-chousa']),
        article('new', '2026-05-01', true, ['kakei-chousa']),
        article('other', '2026-06-01', true, ['school-basic-survey']),
        article('draft', '2026-07-01', false, ['kakei-chousa']),
      ],
    });
    const { readArticleSummariesBySurveyIdFromR2 } = await importReader();

    const articles = await readArticleSummariesBySurveyIdFromR2(
      'kakei-chousa',
      1
    );

    expect(articles.map((article) => article.slug)).toEqual(['new']);
  });

  it('旧 snapshot の surveyIds 欠落を安全に空配列として扱う', async () => {
    const { readArticleSummariesBySurveyIdFromR2 } = await importReader();

    await expect(
      readArticleSummariesBySurveyIdFromR2('kakei-chousa')
    ).resolves.toEqual([]);
  });

  it('v2 snapshot は逆引き索引を優先し、記事行の再走査契約に依存しない', async () => {
    loadSnapshot.mockResolvedValueOnce({
      ...SNAPSHOT,
      schemaVersion: 2,
      articles: [article('indexed', '2026-08-01', true)],
      surveyArticleIndex: { 'city-planning-survey': ['indexed'] },
    });
    const { readArticleSummariesBySurveyIdFromR2 } = await importReader();

    await expect(
      readArticleSummariesBySurveyIdFromR2('city-planning-survey')
    ).resolves.toEqual([
      { slug: 'indexed', title: 'indexed のタイトル', description: null },
    ]);
  });
});
