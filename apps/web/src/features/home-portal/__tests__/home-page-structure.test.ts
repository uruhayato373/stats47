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
const FEATURED_RANKINGS = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/components/FeaturedRankings/index.tsx'
  ),
  'utf8'
);
// ポータルカードの比率・セルのクラスは @stats47/components のパネル部品が持つ (2026-10-28 に apps/web から移した)
const SURFACE_CARD = readFileSync(
  path.resolve(process.cwd(), '../../packages/components/src/surface/surface.tsx'),
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

  it('本文の余白は main の p-4 だけに任せ、PageShell や注目ランキングで二重に足さない', () => {
    // h1 は PageShell の header に渡し、右レールより上に全幅で置く
    expect(PAGE).toContain('<PageShell rightRail={rightRail} header={header}>');
    expect(PAGE).not.toMatch(/<PageShell[^>]*className=/);
    expect(FEATURED_RANKINGS).not.toContain('SHELL_WIDTH_CLASS');
  });

  it('見出しの右端は文字の矢印ではなく共通の SectionIndexLink とカルーセルの矢印を置く', () => {
    expect(PAGE).not.toContain('→');
    expect(FEATURED_RANKINGS).not.toContain('&rarr;');
    expect(PAGE).toContain('<SectionIndexLink href="/ranking">');
    // 矢印は節のカード見出し (HorizontalCardCarouselFrame) の右端が描く
    expect(PAGE.match(/<HorizontalCardCarouselFrame\b/g)).toHaveLength(3);
    expect(CARD_CAROUSEL).toMatch(/headerAction=\{\s*<>\s*<HorizontalCardCarouselControls \/>/);
    // 矢印の操作だけの行をカード列の上に作らない
    expect(CARD_CAROUSEL).not.toContain('mb-2 justify-end');
    expect(CARD_CAROUSEL).not.toContain('from-background');
  });

  it('PageHeader (単一 h1) から始まり、重複する本文検索を置かない', () => {
    expect(PAGE).toContain('PageHeader');
    expect(PAGE).not.toContain('type="search"');
    expect(PAGE).not.toContain('role="search"');
    // PageHeader は 1 回だけ (ページ唯一の h1)
    const pageHeaderUses = PAGE.match(/<PageHeader/g) ?? [];
    expect(pageHeaderUses).toHaveLength(1);
  });

  it('本文にランキング・ブログ・テーマ・都道府県を順に並べる', () => {
    const order = [
      '<FeaturedRankings limit',
      '新着ブログ',
      '知りたいことから探す',
      '都道府県から探す',
    ];
    let cursor = -1;
    for (const marker of order) {
      const idx = PAGE.indexOf(marker);
      expect(idx, `${marker} が見つからない`).toBeGreaterThan(-1);
      expect(idx, `${marker} の順序が不正`).toBeGreaterThan(cursor);
      cursor = idx;
    }
  });

  // 2026-10-30: 右レールで広告同士が続かないよう、運営者プロフィールを本文から右レールの AdSense と PR の間へ移した
  it('右レールは AdSense の後に運営者プロフィールを置く', () => {
    const rail = PAGE.slice(PAGE.indexOf('const rightRail'), PAGE.indexOf('</RailStack>'));
    const ad = rail.indexOf('<RailAdSlot');
    const profile = rail.indexOf('<OperatorProfileCard');
    expect(ad).toBeGreaterThan(-1);
    expect(profile).toBeGreaterThan(ad);
  });

  it('サイドバーと重複するカテゴリ一覧を置かず、広告をPageShellの右レールへ渡す', () => {
    expect(PAGE).not.toContain('leftRail');
    expect(PAGE).not.toContain('RailCategoryList');
    expect(PAGE).not.toContain('カテゴリから探す');
    expect(PAGE).toMatch(/const rightRail = \(\s*<RailStack>/);
    expect(PAGE).toContain('<PageShell rightRail={rightRail}');
    expect(PAGE).not.toContain('lg:grid-cols-[264px_minmax(0,1fr)]');
    expect(PAGE).not.toContain('<PortalCategoryGrid');
    expect(PAGE).toContain('showHeader={false} embedded');
    expect(PAGE).not.toContain('overflow-y-auto');
    expect(PAGE).not.toContain('lg:max-h-');
    expect(PAGE).not.toContain('lg:sticky');
  });

  it('全幅広告を置かず、右レールの広告へ集約する', () => {
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

  it('比較対象カード3種は固定比率を持たず、カード見出しの下では枠のないセルになる', () => {
    // カード全体の固定比率は 390px で地図・値を潰し、ブログ画像を帯にした (2026-10-28 に撤去)
    expect(SURFACE_CARD).not.toContain('aspect-[1.47/1]');
    expect(SURFACE_CARD).toContain(
      'export const PORTAL_CARD_ASPECT_CLASS = "aspect-video"'
    );
    expect(SURFACE_CARD).toContain('in-data-[carousel=cells]:border-0');
    expect(CARD_CAROUSEL).toContain("data-carousel={framed ? 'cells' : 'cards'}");
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
