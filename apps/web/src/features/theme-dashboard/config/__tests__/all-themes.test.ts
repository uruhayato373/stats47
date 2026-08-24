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

  it('半幅 section を持つテーマは 2 件以上ある (1 件だと 2 カラムの右が空く)', () => {
    // 1 件のテーマがあっても ThemePageLayout が全幅へ戻すので壊れはしないが、
    // 意図せず 1 件だけになった構成を検知するために件数を可視化しておく。
    for (const theme of ALL_THEMES) {
      const half = (theme.embeddedSections ?? []).filter((k) =>
        HALF_WIDTH_SECTIONS.has(k)
      );
      if (half.length > 0) expect(half.length).toBeGreaterThanOrEqual(2);
    }
  });
});
