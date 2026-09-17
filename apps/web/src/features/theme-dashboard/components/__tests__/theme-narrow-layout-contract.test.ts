import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(import.meta.dirname, '../ThemePageLayout.tsx'),
  'utf8'
);

describe('ThemePageLayout — 狭幅の読む順序', () => {
  it('ページ見出しをスコープ・切替・全指標ナビより先に描画する', () => {
    const headerIndex = source.indexOf('THEME_HEROES[theme.themeKey] ?');
    const scopeIndex = source.indexOf('<StatisticsScopeNav');
    const controlsIndex = source.indexOf('aria-label="テーマと地域"');
    const pageNavIndex = source.indexOf('aria-label="このページの内容"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(scopeIndex).toBeGreaterThan(headerIndex);
    expect(controlsIndex).toBeGreaterThan(scopeIndex);
    expect(pageNavIndex).toBeGreaterThan(controlsIndex);
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
