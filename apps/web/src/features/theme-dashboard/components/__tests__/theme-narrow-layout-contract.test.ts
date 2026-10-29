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
  it('ページ見出しをスコープ・切替・全指標ナビより先に描画する', () => {
    const headerIndex = source.indexOf('THEME_HEROES[theme.themeKey] ?');
    const scopeIndex = source.indexOf('<StatisticsScopeNav');
    const controlsIndex = source.indexOf('aria-label="テーマと地域"');
    const pageNavIndex = source.indexOf('label="このページの内容"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(scopeIndex).toBeGreaterThan(headerIndex);
    expect(controlsIndex).toBeGreaterThan(scopeIndex);
    expect(pageNavIndex).toBeGreaterThan(controlsIndex);
  });

  // 2026-10-29: テーマの切替は今のテーマ名のボタン 1 つ (ThemeSwitcher が Sheet を開き、テーマ一覧への出口も Sheet に置く)。
  // 切替行に Select とテーマ一覧ボタンを並べると、見出しの下が操作で埋まって主要データを押し下げていた。
  it('左レール (2 本目のナビ列) を作らず、切替行にはテーマ (Sheet) と地域だけを置く', () => {
    expect(source).not.toMatch(/\bleftRail\b/);
    expect(source).not.toContain('LEFT_RAIL_NARROW_ONLY_CLASS');
    expect(source).not.toContain('ThemeSideNav');

    const controlsIndex = source.indexOf('aria-label="テーマと地域"');
    const pageNavIndex = source.indexOf('label="このページの内容"');
    const controls = source.slice(controlsIndex, pageNavIndex);
    expect(controls).toContain('<ThemeSwitcher');
    expect(controls).toContain('<PrefectureSelect');
    expect(controls).not.toContain('href="/themes"');
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
