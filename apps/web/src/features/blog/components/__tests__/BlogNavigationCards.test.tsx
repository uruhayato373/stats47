import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  BlogListToolbar,
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

    const popularTag = screen.getByRole('link', {
      name: '「タグ12」の記事を12件見る',
    });

    expect(popularTag).toHaveAttribute('href', '/tag/タグ12');
    // 幅に関係なく同じ高さの Badge (画面幅で高さを変える sm:min-h-* を持たない)
    expect(popularTag).toHaveAttribute('data-slot', 'badge');
    // 高さは Badge の lyra の h-5。呼び出し側の h-7 は lyra に負けて効かない (CSS で読んでいた頃から同じ。! で勝たせる)
    expect(popularTag).toHaveClass('h-5');
    expect(popularTag.className).not.toMatch(/sm:min-h-|snap-start/);
    expect(popularTag.closest('[data-nav-surface]')).toHaveAttribute(
      'data-nav-surface',
      'blog_sidebar'
    );
    expect(screen.getByRole('link', { name: 'タグ一覧を見る' })).toHaveAttribute(
      'href',
      '/blog/tags'
    );
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

    // RailCard の開閉はテンプレートの Collapsible (Base UI) になった。開閉つきのカードを数える
    expect(
      container.querySelectorAll('[data-slot="collapsible-trigger"]')
    ).toHaveLength(3);
    expect(
      screen.getByRole('link', { name: /人気記事その1/ })
    ).toBeInTheDocument();
  });

  it('ブログ一覧では検索とタグを一覧の上の操作行に 1 回だけ描き、レールには重ねない', () => {
    render(
      <>
        <BlogListToolbar tags={TAGS} />
        <BlogNavigationCards {...PROPS} includeSearchAndTags={false} />
      </>
    );

    // 検索欄とタグはそれぞれ 1 つだけ (狭い幅用の写しを隠して置かない)
    expect(screen.getAllByRole('search')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: '「タグ12」の記事を12件見る' })).toHaveLength(1);
    expect(screen.queryByRole('region', { name: '記事検索' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '人気のタグ' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'ブログ記事を検索' })).toHaveAttribute('name', 'q');
    expect(
      screen.getByRole('link', { name: '「タグ12」の記事を12件見る' }).closest('[data-nav-surface]')
    ).toHaveAttribute('data-nav-surface', 'blog_sidebar');
  });
});
