import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(import.meta.dirname, '../ThemePageLayout.tsx'),
  'utf8'
);

describe('ThemePageLayout — 狭幅の読む順序', () => {
  it('ページ見出しをスコープ・切替・全指標ナビより先に描画する', () => {
    const headerIndex = source.indexOf('{THEME_HEROES[theme.themeKey] ?');
    const scopeIndex = source.indexOf('<StatisticsScopeNav');
    const controlsIndex = source.indexOf('aria-label="テーマと地域"');
    const pageNavIndex = source.indexOf('aria-label="このページの内容"');

    expect(headerIndex).toBeGreaterThan(-1);
    expect(scopeIndex).toBeGreaterThan(headerIndex);
    expect(controlsIndex).toBeGreaterThan(scopeIndex);
    expect(pageNavIndex).toBeGreaterThan(controlsIndex);
  });

  it('全指標・出典調査は狭幅で初期展開しない', () => {
    const detailsTag = source.match(/<details[^>]*>/)?.[0];

    expect(detailsTag).toBeDefined();
    expect(detailsTag).not.toMatch(/\sopen(?:=|\s|>)/);
  });
});
