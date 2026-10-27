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
        /<SectionHeader\s+title="注目のランキング"[\s\S]*?\/>([\s\S]*?)<\/HorizontalCardCarouselSection>/
      )?.[1] ?? '';

    expect(featuredSection).toContain('<FeaturedRankings');
    expect(featuredSection).toContain('trackHomeEvents={false}');
    expect(featuredSection).not.toContain('<Link');
    expect(PAGE).not.toContain('HOME_FEATURED_PROMINENCE');
    expect(PAGE).not.toContain('FEATURED_STRIP_LIMIT');
  });

  it('サイドバーと重複するカテゴリ別の索引を本文に置かない', () => {
    expect(PAGE).not.toContain('title="カテゴリ別のランキング"');
    expect(PAGE).not.toContain('RANKING_PROMINENCE_CATEGORIES');
  });

  it('build時のR2欠落でカードを固定しない', () => {
    expect(PAGE).toContain("export const dynamic = 'force-dynamic'");
  });
});
