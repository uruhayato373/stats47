import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  BlogNavigationCards,
  selectPopularBlogTags,
} from '../BlogNavigationCards';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const TAGS = Array.from({ length: 12 }, (_, index) => ({
  tagKey: `タグ${index + 1}`,
  articleCount: index + 1,
}));

const PROPS = {
  tags: TAGS,
  popularArticles: [{ slug: 'popular-one', title: '人気記事その1' }],
  categories: [{ categoryKey: 'population', categoryName: '人口・世帯' }],
  themes: [{ themeKey: 'population-dynamics', title: '人口動態' }],
  prefectures: [{ prefCode: '01000', prefName: '北海道' }],
};

describe('BlogNavigationCards', () => {
  it('6種類の導線をそれぞれ独立したカードにする', () => {
    render(<BlogNavigationCards {...PROPS} />);

    for (const title of [
      '記事検索',
      '人気のタグ',
      'よく読まれている記事',
      'カテゴリから探す',
      'テーマから探す',
      '都道府県から探す',
    ]) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    }
  });

  it('記事数の多いタグを10件まで表示する', () => {
    render(<BlogNavigationCards {...PROPS} />);

    expect(
      screen.getByRole('link', { name: '「タグ12」の記事を12件見る' })
    ).toHaveAttribute('href', '/tag/タグ12');
    expect(
      screen.queryByRole('link', { name: '「タグ2」の記事を2件見る' })
    ).not.toBeInTheDocument();
  });

  it('入力配列を変更せず人気順を決定する', () => {
    const source = [
      { tagKey: '少ない', articleCount: 1 },
      { tagKey: '多い', articleCount: 5 },
    ];

    expect(selectPopularBlogTags(source).map((tag) => tag.tagKey)).toEqual([
      '多い',
      '少ない',
    ]);
    expect(source.map((tag) => tag.tagKey)).toEqual(['少ない', '多い']);
  });

  it('モバイルでは長い3カードだけを個別に折りたたむ', () => {
    const { container } = render(
      <BlogNavigationCards {...PROPS} variant="mobile" />
    );

    expect(container.querySelectorAll('details')).toHaveLength(3);
    expect(
      screen.getByRole('link', { name: /人気記事その1/ })
    ).toBeInTheDocument();
  });
});
