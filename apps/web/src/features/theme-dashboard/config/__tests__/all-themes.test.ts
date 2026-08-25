import { describe, it, expect } from 'vitest';

import { ALL_THEMES } from '../all-themes';
import {
  HALF_WIDTH_SECTIONS,
  THEME_SECTION_REGISTRY,
} from '../theme-section-registry';

describe('ALL_THEMES', () => {
  it('テーマが1つ以上定義されている', () => {
    expect(ALL_THEMES.length).toBeGreaterThan(0);
  });

  it('全テーマが themeKey を持つ', () => {
    for (const theme of ALL_THEMES) {
      expect(theme.themeKey).toBeDefined();
      expect(typeof theme.themeKey).toBe('string');
      expect(theme.themeKey.length).toBeGreaterThan(0);
    }
  });

  it('全テーマが title を持つ（冗長な「ダッシュボード」サフィックスは付けない）', () => {
    for (const theme of ALL_THEMES) {
      expect(theme.title).toBeDefined();
      expect(theme.title.length).toBeGreaterThan(0);
      // h1 はテーマ名のみ。eyebrow が「テーマダッシュボード」を示すため
      // title に「の統計ダッシュボード」を焼き込まない (重複排除)。
      expect(theme.title).not.toContain('ダッシュボード');
    }
  });

  it('全テーマが rankingKeys を持つ', () => {
    for (const theme of ALL_THEMES) {
      expect(theme.rankingKeys.length).toBeGreaterThan(0);
    }
  });

  it('全テーマが defaultRankingKey を持つ', () => {
    for (const theme of ALL_THEMES) {
      expect(theme.defaultRankingKey).toBeDefined();
      expect(theme.rankingKeys).toContain(theme.defaultRankingKey);
    }
  });

  it('themeKey が重複していない', () => {
    const keys = ALL_THEMES.map((t) => t.themeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('市区町村テーマを47都道府県テーマ一覧へ混在させない', () => {
    expect(ALL_THEMES.map((theme) => theme.themeKey)).not.toContain(
      'local-finance-city'
    );
  });
});

/**
 * 埋め込み section の対応関係。
 *
 * ★`ThemePageLayout` は registry に無いキーを filter で黙って落とす。EMBEDDED_SECTIONS
 * (all-themes.ts) 側の typo は例外も警告も出さず「セクションが丸ごと消える」だけなので、
 * ここで対応関係を機械固定する。
 */
describe('埋め込み section の registry 整合', () => {
  it('embeddedSections の全キーが THEME_SECTION_REGISTRY に実在する', () => {
    const unknown = ALL_THEMES.flatMap((t) =>
      (t.embeddedSections ?? [])
        .filter((k) => !THEME_SECTION_REGISTRY[k])
        .map((k) => `${t.themeKey}: ${k}`)
    );
    expect(unknown).toEqual([]);
  });

  it('HALF_WIDTH_SECTIONS の全キーが THEME_SECTION_REGISTRY に実在する', () => {
    const unknown = [...HALF_WIDTH_SECTIONS].filter(
      (k) => !THEME_SECTION_REGISTRY[k]
    );
    expect(unknown).toEqual([]);
  });

  it('人口移動と通勤移動を意味の異なるテーマへ分離する', () => {
    const population = ALL_THEMES.find(
      (theme) => theme.themeKey === 'population-dynamics'
    );
    const labor = ALL_THEMES.find(
      (theme) => theme.themeKey === 'labor-mobility'
    );

    expect(population?.embeddedSections).toContain('migration-flow');
    expect(population?.embeddedSections).not.toContain('commute-flow');
    expect(labor?.embeddedSections).toContain('commute-flow');
    expect(labor?.embeddedSections).not.toContain('migration-flow');
  });
});
