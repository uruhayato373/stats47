import { describe, expect, it } from 'vitest';

import { buildSurveyArticleIndex, type SnapshotArticle } from './snapshot';

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
