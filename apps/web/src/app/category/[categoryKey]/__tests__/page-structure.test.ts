import { readFileSync } from 'node:fs';
import path from 'node:path';

import { listCategories } from '@stats47/data-configs/categories';
import { describe, expect, it } from 'vitest';

import { CATEGORY_BLOG_TAG_KEYS } from '@/config/category-blog-tag-keys';

const PAGE = readFileSync(
  path.resolve(process.cwd(), 'src/app/category/[categoryKey]/page.tsx'),
  'utf8'
);

describe('category page featured ranking cards', () => {
  it('homeと同じカードmodel resolver・carousel・共通componentを使う', () => {
    const featuredSection =
      PAGE.match(
        /\{\/\* 注目ランキング \*\/\}([\s\S]*?)\{\/\* 全件テーブル \*\/\}/
      )?.[1] ?? '';

    expect(PAGE).toContain('buildFeaturedRankingCardModel({');
    expect(featuredSection).toContain('<FeaturedRankingCard');
    expect(featuredSection).toContain('model={item.model}');
    expect(featuredSection).toContain('<HorizontalCardCarousel');
    expect(featuredSection).not.toContain('fitHeight');
    expect(featuredSection).not.toContain('topAreaName=');
    expect(featuredSection).not.toContain('tileMapSvg=');
  });

  it('PageShellの左レールでカテゴリ関連記事を本文に表示する', () => {
    expect(PAGE).toContain('const leftRail = (');
    expect(PAGE).toContain('<PageShell leftRail={leftRail}');
    expect(PAGE).not.toContain('lg:grid-cols-[264px_minmax(0,1fr)]');
    expect(PAGE).toContain('listArticlesByTagKey(blogTagKey, 8)');
    expect(PAGE).toContain('surface="category_blog"');
    expect(PAGE).toContain('title={`${category.categoryName}の新着ブログ`}');
    expect(PAGE).not.toContain('<HeroBanner');
    expect(PAGE).not.toContain('<RightRailWidgets');
    expect(PAGE).toContain('<PrefectureNavigator');
    expect(PAGE).toContain('surface="category"');
    expect(PAGE).not.toContain('REGIONS.map');
    expect(PAGE).not.toContain('prefMap');
  });

  it('パンくずと簡潔な見出しをメイン領域に置く', () => {
    expect(PAGE).toContain('<Breadcrumbs');
    expect(PAGE).toContain('<PageHeader');
    expect(PAGE).toContain(
      '`${category.categoryName}に関する都道府県ランキングを、地図やグラフで比較できます。`'
    );
    expect(PAGE).not.toContain('eyebrow="カテゴリ"');
    expect(PAGE).not.toContain(
      'stats={`全${rankingItems.length}件のランキング`}'
    );
  });

  it('全カテゴリに関連記事タグを明示する', () => {
    const mappedCategoryKeys = Object.keys(CATEGORY_BLOG_TAG_KEYS).sort();
    const categoryKeys = listCategories()
      .map((category) => category.categoryKey)
      .sort();

    expect(mappedCategoryKeys).toEqual(categoryKeys);
  });

  it('全件readから派生値と地図を作り、1位batchを重複取得しない', () => {
    expect(PAGE).toContain('values: valuesResult.data');
    expect(PAGE).not.toContain('readTopRankingValuesBatchFromR2');
  });

  it('独立した情報セクションの見出しに連番を表示しない', () => {
    const sectionHeaders = Array.from(
      PAGE.matchAll(/<SectionHeader\b([\s\S]*?)\/>/g),
      (match) => match[1]
    );

    expect(sectionHeaders.length).toBeGreaterThan(0);
    expect(sectionHeaders.every((props) => !/\bnumber=/.test(props))).toBe(
      true
    );
  });
});
