// @vitest-environment node
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import { describe, expect, it } from "vitest";

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

  // 2026-11-12 オーナー決定: テーマは 1 つのページの種類。地方財政の専用ページという特例をやめ、全テーマを
  // [themeSlug] → ThemePageLayout で描く。専用ページを足すと、カタログの設定が読まれない dead config が再び生まれる
  it("テーマに専用ページ (app/themes/<slug>/page.tsx) を作らない", () => {
    expect(bespokeThemeSlugs()).toEqual([]);
  });

  it("地方財政の決算カードと財政の流れの章が、共通の埋め込みの章として届く", () => {
    const theme = ALL_THEMES.find((t) => t.themeKey === "local-finance");
    expect(theme?.embeddedSections).toEqual(["finance-overview", "finance-sustainability", "finance-flow"]);
    const placed = (THEME_CATALOGS["local-finance"].sections ?? []).flatMap((section) => section.embeddedSectionKeys ?? []);
    expect(placed.sort()).toEqual(["finance-flow", "finance-overview", "finance-sustainability"]);
  });
});
