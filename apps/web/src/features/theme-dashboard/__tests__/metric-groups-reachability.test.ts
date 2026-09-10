import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import { describe, expect, it } from "vitest";

import { splitLocalFinanceSections, validateLocalFinanceSections } from '@/features/local-finance-dashboard/lib/finance-sections';

import { ALL_THEMES } from '../config/all-themes';

/**
 * `metricGroups` を定義したテーマが、それを実際に描くページ経路に乗っているかの検査。
 *
 * ★2026-08-06 に踏んだ: local-finance に metricGroups を書いたが、このテーマだけ
 * bespoke ページ (`app/themes/local-finance/page.tsx`) を持っていて `[themeSlug]` →
 * ThemePageLayout → ThemeMetricsDashboard を通らないため、**設定が誰にも読まれない
 * dead config** になっていた。型検査も validator も通ってしまい、dev で実際に HTML を
 * 見て初めてタイルが 0 枚だと分かった。
 *
 * 同じ形の失敗は今日 1 度目撃している (`MetricConfig.tags` が 2,295 config すべてで
 * 未記入のまま型・builder・描画だけ揃っていた)。「宣言されているが誰も読まない SSOT」を
 * 機械で止める。
 *
 * bespoke ページの一覧はハードコードせず**ファイルシステムから導出**する
 * (新しい bespoke ページを足したら自動的に検査対象に入る)。
 */

const THEMES_DIR = path.resolve(__dirname, "../../../app/themes");

/** `app/themes/<slug>/page.tsx` を持つ = `[themeSlug]` を迂回する bespoke ページ */
function bespokeThemeSlugs(): string[] {
  return readdirSync(THEMES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "[themeSlug]")
    .filter((e) => existsSync(path.join(THEMES_DIR, e.name, "page.tsx")))
    .map((e) => e.name);
}

describe("metricGroups の到達性", () => {
  it('汎用ページの章に指定した埋め込みがサーバー生成対象へ届く', () => {
    const missing: string[] = [];
    for (const theme of ALL_THEMES) {
      if (theme.themeKey === 'local-finance') continue;
      for (const section of THEME_CATALOGS[theme.themeKey]?.sections ?? []) {
        for (const key of section.embeddedSectionKeys ?? []) {
          if (!theme.embeddedSections?.includes(key)) missing.push(`${theme.themeKey}/${section.key}/${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('追加章の全指標が画面のカード選択対象へ届く', () => {
    const missing: string[] = [];
    for (const theme of ALL_THEMES) {
      const catalog = THEME_CATALOGS[theme.themeKey];
      if (!catalog) continue;
      const visible = new Set(theme.tabIndicators?.map((item) => item.rankingKey));
      for (const group of catalog.metricGroups ?? []) {
        if (!group.key.startsWith('candidate-')) continue;
        for (const key of group.rankingKeys) {
          if (!visible.has(key)) missing.push(`${theme.themeKey}/${group.key}/${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
    expect(ALL_THEMES.find((theme) => theme.themeKey === 'local-finance')?.tabIndicators)
      .toEqual(expect.arrayContaining([expect.objectContaining({ rankingKey: 'per-capita-total-expenditure-pref-municipal' })]));
  });

  it("補足ダッシュボードを持たない bespoke ページに metricGroups を定義しない", () => {
    const bespoke = new Set(bespokeThemeSlugs());
    // 検査そのものが空振りしていないことを確かめる (bespoke が 0 件なら意味がない)
    expect(bespoke.size).toBeGreaterThan(0);

    const dead = Object.entries(THEME_CATALOGS)
      .filter(([key, c]) => bespoke.has(key) && key !== 'local-finance' && (c.metricGroups?.length ?? 0) > 0)
      .map(([key]) => key);

    expect(dead).toEqual([]);
  });

  it("local-finance が bespoke ページとして検出できている (検査の前提の固定)", () => {
    expect(bespokeThemeSlugs()).toContain("local-finance");
  });

  it('地方財政に未使用の図を数えず、実際の専用ブロックと章が一致する', () => {
    const catalog = THEME_CATALOGS['local-finance'];
    expect(catalog.charts).toEqual([]);
    const { dedicated, supplementary } = splitLocalFinanceSections(catalog.sections ?? []);
    expect(validateLocalFinanceSections(dedicated)).toEqual([]);
    expect(supplementary.flatMap((section) => section.metricGroupKeys).sort())
      .toEqual(catalog.metricGroups!.map((group) => group.key).sort());
    expect(supplementary).toHaveLength(5);
    expect(dedicated).toHaveLength(3);
    const donations = supplementary.find((section) => section.key === 'candidate-125');
    expect(donations?.metricGroupKeys).toHaveLength(7);
    expect(donations?.description).toContain('県内市区町村の課税分');
  });

  it('専用章と補足指標を混ぜた定義や空の補足章を拒否する', () => {
    const sections = structuredClone(THEME_CATALOGS['local-finance'].sections!);
    sections[0].metricGroupKeys = ['supplement'];
    expect(() => splitLocalFinanceSections(sections)).toThrow('metricGroupKeys');
    sections[0].metricGroupKeys = [];
    sections.push({ key: 'empty', title: '空', metricGroupKeys: [] });
    expect(() => splitLocalFinanceSections(sections)).toThrow('補足章');
  });

  it('専用ブロックの配置漏れ・未知キー・未使用の汎用図を検出する', () => {
    const sections = structuredClone(THEME_CATALOGS['local-finance'].sections!);
    sections[0].embeddedSectionKeys = ['unknown'];
    sections[0].chartKeys = ['unused-chart'];
    expect(validateLocalFinanceSections(sections)).toEqual(expect.arrayContaining([
      expect.stringContaining('finance-overview'),
      expect.stringContaining('unknown'),
      expect.stringContaining('chartKeys'),
    ]));
  });
});
