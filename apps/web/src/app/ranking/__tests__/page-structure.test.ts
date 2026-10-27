import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const PAGE = readFileSync(
  path.resolve(process.cwd(), 'src/app/ranking/page.tsx'),
  'utf8'
);

describe('ranking index featured cards', () => {
  it('独自の簡易カードではなく共通の地図付きランキングを使う', () => {
    const featuredSection =
      PAGE.match(
        /<HorizontalCardCarouselFrame\s+title="注目のランキング"[\s\S]*?>([\s\S]*?)<\/HorizontalCardCarouselFrame>/
      )?.[1] ?? '';

    expect(featuredSection).toContain('<FeaturedRankings');
    expect(featuredSection).toContain('trackHomeEvents={false}');
    expect(featuredSection).not.toContain('<Link');
    expect(PAGE).not.toContain('HOME_FEATURED_PROMINENCE');
    expect(PAGE).not.toContain('FEATURED_STRIP_LIMIT');
  });

  it('390px でもカテゴリから探せるよう、件数付きのカテゴリ索引と全ランキングへの入口を本文に置く', () => {
    // サイドバーは 390px で Sheet に畳まれるので、本文に索引が無いとカテゴリから探せない
    expect(PAGE).toContain('<RailCategoryList');
    expect(PAGE).toContain('count: category.count');
    expect(PAGE).toContain("href: '/search?type=ranking'");
    expect(PAGE).toContain('trackingSurface="ranking_category"');
  });

  it('metadata と本文のカテゴリ数を同じ生成物から数える (17 の直書きをしない)', () => {
    expect(PAGE).toContain('const CATEGORY_COUNT = CATEGORY_INDEX.length');
    expect(PAGE).not.toMatch(/全17カテゴリ|・ 17 カテゴリ/);
  });

  it('build時のR2欠落でカードを固定しない', () => {
    expect(PAGE).toContain("export const dynamic = 'force-dynamic'");
  });
});
