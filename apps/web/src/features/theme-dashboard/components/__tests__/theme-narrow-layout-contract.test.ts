import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(import.meta.dirname, '../ThemePageLayout.tsx'),
  'utf8'
);

const switcherSource = readFileSync(
  resolve(import.meta.dirname, '../ThemeSwitcher.tsx'),
  'utf8'
);

const regionNavSource = readFileSync(
  resolve(import.meta.dirname, '../ThemeRegionNav.tsx'),
  'utf8'
);

const navSource = readFileSync(
  resolve(import.meta.dirname, '../../../../components/navigation/StatisticsScopeNav.tsx'),
  'utf8'
);

const localFinanceSource = readFileSync(
  resolve(import.meta.dirname, '../../../../app/themes/local-finance/page.tsx'),
  'utf8'
);

describe('地方財政 (bespoke ページ) — ページ内ナビの位置', () => {
  it('ページ内ナビは h1 (header) の後に置き、幅で隠す代替 UI を持たない', () => {
    const shellIndex = localFinanceSource.indexOf('<PageShell');
    const headerIndex = localFinanceSource.indexOf('header={<ThemeAreaHeader', shellIndex);
    const leftRailIndex = localFinanceSource.indexOf('leftRail={', shellIndex);
    expect(headerIndex).toBeGreaterThan(shellIndex);
    expect(leftRailIndex).toBeGreaterThan(headerIndex);
    expect(localFinanceSource).not.toContain('NarrowBehavior');
    expect(localFinanceSource).not.toContain('NARROW_ONLY');
  });
});

describe('ThemePageLayout — 狭幅の読む順序', () => {
  // 2026-10-31 (IA-REGION-THEME-01): 地域単位のリンク・テーマのボタン・県の Select を並べた帯をやめ、パンくずの各段と
  // 右端のアイコンから Sheet で選ぶ形にした。読む順は「パンくず (今いる地域とテーマ) → 題名 → 章のリンク」
  it('パンくず (地域・テーマの選択) → ページ見出し → 章のリンクの順に描画する', () => {
    const regionNavIndex = source.indexOf('<ThemeRegionNav');
    const headerIndex = source.indexOf('THEME_HEROES[theme.themeKey] ?');
    const pageNavIndex = source.indexOf('label="このページの内容"');

    expect(regionNavIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeGreaterThan(regionNavIndex);
    expect(pageNavIndex).toBeGreaterThan(headerIndex);
  });

  it('左レール (2 本目のナビ列) も、見出しの下の操作の帯も作らない。テーマと地域はパンくずとアイコンの Sheet で選ぶ', () => {
    expect(source).not.toMatch(/\bleftRail\b/);
    expect(source).not.toContain('LEFT_RAIL_NARROW_ONLY_CLASS');
    expect(source).not.toContain('ThemeSideNav');
    // 旧の帯 (「47都道府県」が意味違いで 2 回出ていた)
    expect(source).not.toContain('<StatisticsScopeNav');
    expect(source).not.toContain('<PrefectureSelect');
    expect(source).not.toContain('aria-label="テーマと地域"');

    // テーマの Sheet はパンくずの段と題名の横のアイコンの両方から開く。テーマ一覧への出口は Sheet に置く
    expect(regionNavSource).toContain('trigger="crumb"');
    expect(regionNavSource).toContain('trigger="icon"');
    expect(regionNavSource).toContain('<SheetContent');
    expect(switcherSource).toContain('<SheetContent');
    expect(switcherSource).toContain('href="/themes"');
  });

  it('ページ内の章リンクは狭い幅でも 1 行に保ち、はみ出す分は右端のフェード付きの横スクロールにする (2026-10-28 リンク列)', () => {
    const pageNavIndex = source.indexOf('label="このページの内容"');
    const frameTag = source.slice(
      source.lastIndexOf('<', pageNavIndex),
      source.indexOf('>', pageNavIndex)
    );
    // 横スクロールとフェードは共通のリンク列 (LinkRowFrame) が持つ。タブの見た目 (TabsList) にしない
    expect(frameTag).toContain('<LinkRowFrame');
    expect(frameTag).not.toContain('flex-wrap');
    expect(source).not.toContain('TABS_LINK');
    expect(navSource).toContain("'overflow-x-auto [scrollbar-width:none]'");
    expect(navSource).toContain('bg-linear-to-l from-background');
    expect(navSource).not.toContain('cn-tabs');
  });

  // 2026-10-29: 関連記事は h1 の直下では主要データを押し下げるので、ダッシュボードを読み終えた位置 (ページの最後) へ移した
  it('関連記事はダッシュボードと全指標・出典調査の後ろ (ページの最後) に置く', () => {
    const dashboardIndex = source.indexOf('<ThemeDashboardClient');
    const relatedIndex = source.indexOf('<ThemeRelatedArticles');
    const catalogIndex = source.indexOf('title="全指標・出典調査"');
    expect(dashboardIndex).toBeGreaterThan(-1);
    expect(catalogIndex).toBeGreaterThan(dashboardIndex);
    expect(relatedIndex).toBeGreaterThan(catalogIndex);
  });

  it('全指標・出典調査は狭幅で初期展開しない', () => {
    // レール UI 契約統一 (2026-09-17) で自前の <details> を RailCard の
    // collapsible (既定閉・details/summary は共通部品側が持つ) へ置き換えた。
    // ここでは「その RailCard に defaultOpen が付いていないこと」で初期閉を固定する。
    const cardIndex = source.indexOf('title="全指標・出典調査"');
    expect(cardIndex).toBeGreaterThan(-1);

    const cardTagEnd = source.indexOf('>', cardIndex);
    const cardOpenTag = source.slice(
      source.lastIndexOf('<RailCard', cardIndex),
      cardTagEnd
    );
    expect(cardOpenTag).toContain('collapsible');
    expect(cardOpenTag).not.toContain('defaultOpen');
  });
});
