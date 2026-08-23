import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

/**
 * home `/` のポータル構造を source レベルで検証する。
 * DOM render は R2 依存 (FeaturedRankings / listLatestArticles) のため、hero 不在と
 * セクション順・単一 h1 の不変条件は page.tsx のソースで担保する。
 */
const PAGE = readFileSync(
  path.resolve(process.cwd(), 'src/app/page.tsx'),
  'utf8'
);
const FEATURED_GRID = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/components/FeaturedRankings/FeaturedRankingGrid.tsx'
  ),
  'utf8'
);
const SURFACE_CARD = readFileSync(
  path.resolve(process.cwd(), 'src/components/surface/SurfaceCard.tsx'),
  'utf8'
);
const CARD_CAROUSEL = readFileSync(
  path.resolve(
    process.cwd(),
    'src/components/surface/HorizontalCardCarousel.tsx'
  ),
  'utf8'
);
const USE_CASE_GRID = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/home-portal/components/PortalUseCaseGrid.tsx'
  ),
  'utf8'
);

describe('home page structure (portal)', () => {
  it('暗色 hero と hero 画像参照が存在しない', () => {
    expect(PAGE).not.toContain('hero-home');
    expect(PAGE).not.toContain('bg-slate-900');
    expect(PAGE).not.toContain('SHELL_WIDTH_CLASS');
    // oversized display 見出し (home hero の h1) が無い
    expect(PAGE).not.toMatch(/text-4xl|text-5xl/);
  });

  it('PageHeader (単一 h1) から始まり、重複する本文検索を置かない', () => {
    expect(PAGE).toContain('PageHeader');
    expect(PAGE).not.toContain('type="search"');
    expect(PAGE).not.toContain('role="search"');
    // PageHeader は 1 回だけ (ページ唯一の h1)
    const pageHeaderUses = PAGE.match(/<PageHeader/g) ?? [];
    expect(pageHeaderUses).toHaveLength(1);
  });

  it('2ペイン内にカテゴリ・ランキング・ブログ・テーマ・都道府県・プロフィールを並べる', () => {
    const order = [
      'カテゴリから探す',
      '<FeaturedRankings limit',
      '新着ブログ',
      '知りたいことから探す',
      '都道府県から探す',
      '運営者プロフィール',
    ];
    let cursor = -1;
    for (const marker of order) {
      const idx = PAGE.indexOf(marker);
      expect(idx, `${marker} が見つからない`).toBeGreaterThan(-1);
      expect(idx, `${marker} の順序が不正`).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  it('desktopの左カテゴリ・右コンテンツ構造を維持する', () => {
    expect(PAGE).toContain('lg:grid-cols-[264px_minmax(0,1fr)]');
    expect(PAGE).toContain('<PortalCategoryGrid variant="sidebar" />');
    expect(PAGE).toContain('showHeader={false} embedded');
    expect(PAGE).not.toContain('overflow-y-auto');
    expect(PAGE).not.toContain('lg:max-h-');
    expect(PAGE).not.toContain('lg:sticky');
  });

  it('全幅広告を置かず、カテゴリ直下のrail広告へ集約する', () => {
    expect(PAGE).toContain('<RailAdSlot slot={RAIL_RECT} />');
    expect(PAGE).not.toContain('InContentAdSlot');
    expect(PAGE).not.toContain('FooterAdSlot');
  });

  it('直接遷移できる共通都道府県ナビを右コンテンツの全幅に置く', () => {
    expect(PAGE).toContain('const prefectures = fetchPrefectures()');
    expect(PAGE).toContain('<PrefectureNavigator');
    expect(PAGE).toContain('variant="embedded"');
    expect(PAGE).toContain('surface="home"');
    expect(PAGE).not.toContain('generatePrefectureOverviewSvg');
    expect(PAGE).not.toContain('PortalAreaEntry');
    expect(PAGE).not.toContain('PORTAL_CARD_ASPECT_CLASS');
    expect(PAGE).toContain('OperatorProfileCard');
  });

  it('ランキング・ブログ・テーマは共通の1行矢印carouselを使用する', () => {
    expect(FEATURED_GRID).toContain(
      '<HorizontalCardCarousel ariaLabel="注目ランキング">'
    );
    expect(PAGE).toContain('<HorizontalCardCarousel ariaLabel="新着ブログ">');
    expect(USE_CASE_GRID).toContain(
      '<HorizontalCardCarousel ariaLabel="知りたいことから探す">'
    );
    expect(CARD_CAROUSEL).toContain('grid-flow-col');
    expect(CARD_CAROUSEL).toContain('snap-x snap-mandatory');
    expect(CARD_CAROUSEL).toContain('sm:auto-cols-[calc((100%_-_0.75rem)/2)]');
    expect(CARD_CAROUSEL).toContain('lg:auto-cols-[calc((100%_-_1.5rem)/3)]');
    expect(CARD_CAROUSEL).toContain('xl:auto-cols-[calc((100%_-_2.25rem)/4)]');
    expect(CARD_CAROUSEL).toContain('<ChevronLeft');
    expect(CARD_CAROUSEL).toContain('<ChevronRight');
  });

  it('比較対象カード3種は共有SSOTの1.47:1を使用する', () => {
    expect(SURFACE_CARD).toContain(
      'export const PORTAL_CARD_ASPECT_CLASS = "aspect-[1.47/1]"'
    );
    expect(FEATURED_GRID).toContain('<FeaturedRankingCard');
    expect(FEATURED_GRID).toContain('model={item.model}');
  });

  it('新着ブログはcarousel用に8件取得する', () => {
    expect(PAGE).toContain('listLatestArticles(8)');
  });

  it('force-dynamic を維持する (R2 runtime read)', () => {
    expect(PAGE).toMatch(/export const dynamic = ['"]force-dynamic['"]/);
  });
});
