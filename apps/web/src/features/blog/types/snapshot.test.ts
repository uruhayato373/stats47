import { describe, expect, it } from 'vitest';

import {
  buildMetricPairArticleIndex,
  buildSurveyArticleIndex,
  parseBlogSnapshot,
  type SnapshotArticle,
} from './snapshot';

function article(
  slug: string,
  published: boolean,
  surveyIds?: string[]
): SnapshotArticle {
  return {
    slug,
    title: slug,
    seoTitle: null,
    description: null,
    filePath: `blog/${slug}/article.md`,
    format: 'md',
    hasCharts: false,
    published,
    publishedAt: null,
    ogImageType: null,
    proofreadAt: null,
    createdAt: null,
    updatedAt: null,
    tags: [],
    surveyIds,
  };
}

describe('buildSurveyArticleIndex', () => {
  it('公開記事だけを調査別に重複なく逆引きできる形へ変換する', () => {
    expect(
      buildSurveyArticleIndex([
        article('b', true, ['census', 'census']),
        article('a', true, ['census', 'school-basic-survey']),
        article('draft', false, ['census']),
      ])
    ).toEqual({
      census: ['a', 'b'],
      'school-basic-survey': ['a'],
    });
  });
});

describe('buildMetricPairArticleIndex', () => {
  const withPairs = (slug: string, published: boolean, metricPairs: Array<[string, string]>) => ({
    ...article(slug, published),
    metricPairs,
  });

  it('公開記事のペアを両方向から引ける形にし、下書きを含めない', () => {
    expect(
      buildMetricPairArticleIndex([
        withPairs('b', true, [['income', 'savings']]),
        withPairs('a', true, [['income', 'savings'], ['income', 'rent']]),
        withPairs('draft', false, [['income', 'savings']]),
        article('no-pairs', true),
      ])
    ).toEqual({
      income: { rent: ['a'], savings: ['a', 'b'] },
      rent: { income: ['a'] },
      savings: { income: ['a', 'b'] },
    });
  });
});

describe('parseBlogSnapshot metric pairs', () => {
  const base = { generatedAt: '2026-09-23T00:00:00.000Z', tagMeta: [] };

  it('記事のペアと逆引き索引をそのまま通す', () => {
    const parsed = parseBlogSnapshot({
      ...base,
      articles: [{ ...article('a', true), metricPairs: [['income', 'savings']] }],
      metricPairArticleIndex: { income: { savings: ['a'] }, savings: { income: ['a'] } },
    });
    expect(parsed.articles[0].metricPairs).toEqual([['income', 'savings']]);
    expect(parsed.metricPairArticleIndex?.income).toEqual({ savings: ['a'] });
  });

  it('壊れたペア・索引は配信境界で拒否する', () => {
    expect(() => parseBlogSnapshot({
      ...base,
      articles: [{ ...article('a', true), metricPairs: [['income']] }],
    })).toThrow('metricPairs');
    expect(() => parseBlogSnapshot({
      ...base,
      articles: [],
      metricPairArticleIndex: { income: ['a'] },
    })).toThrow('metricPairArticleIndex');
  });
});
