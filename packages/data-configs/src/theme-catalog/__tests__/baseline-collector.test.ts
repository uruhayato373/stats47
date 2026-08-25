import { describe, expect, it } from 'vitest';

import { collectCatalogBaseline, measureChart } from '../baseline-collector';
import { THEME_CATALOGS } from '../index';
import type { CatalogChart, ThemeCatalog } from '../types';

/**
 * CROSS-PAGE-DATA-SSOT-01 WP0 — ベースラインの固定と境界テスト。
 *
 * ★狙い (2 方向を固定する):
 *   ① 実測ベースラインを lock する。生の estatParams / 生色 / 不正 e-Stat コードは
 *      **shrink-only (増やせない)**、型付き参照 (relatedRankingKeys) は **grow-only (減らせない)**。
 *      移行 (WP1-WP6) で数字が動いたら定数を更新する = 進捗を機械的に追える。
 *   ② collector が defect の注入で発火する (陰性対照)。生色を足す・生 estatParam を足す・
 *      `#` 付きコードを足す・型付き参照を外すと、対応する計測が動くことを固定する。
 *      ②が無いと ① の lock は「何も見ていない緑」と区別がつかない。
 *
 * 実測 (2026-08-24, THEME_CATALOGS 実行時オブジェクト):
 *   themes 20 / charts 107 / rawEstatParams chart 81 / relatedRankingKeys chart 83 /
 *   rawColorPlaces 0 / distinctColors 0。
 *
 * ※ `#` 前置の e-Stat コード (`#A0160102` 等) は 社会・人口統計体系テーブルの**実コード**で
 *   欠陥ではない (本番キャッシュで STATUS 0・正しく distinct フィルタを 3 テーブルで実測確認)。
 *   当初「不正コード」として計測していたが誤りだったので撤回した。色検出はこの `#`-code を
 *   hex と誤検出しないことだけをテストで守る (下の陰性対照)。
 */

/** 実測で確定したベースライン。移行で動いたらここを更新する (shrink/grow の向きを守る)。 */
const BASELINE = {
  themes: 20,
  charts: 107,
  chartsWithRawEstatParams: 84,
  // markdown-section 24 件を除く全 data-bound component が指標ハブを持つ。
  chartsWithRelatedRankingKeys: 83,
  // WP5 完了: 生色を color role へ全移行 (179 → 0)。以後 ratchet は「生色 0」を強制する。
  rawColorPlaces: 0,
  distinctColors: 0,
} as const;

const live = collectCatalogBaseline(Object.values(THEME_CATALOGS));

describe('baseline lock (ratchet)', () => {
  it('テーマ数・chart 数は記録値と一致する (テーマ追加時はここを更新)', () => {
    expect(live.themes).toBe(BASELINE.themes);
    expect(live.charts).toBe(BASELINE.charts);
  });

  it('componentType ごとの chart 数を固定する (chart 種別内訳の baseline)', () => {
    expect(live.chartsByType).toEqual({
      'line-chart': 62,
      'mixed-chart': 3,
      'composition-chart': 4,
      'donut-chart': 6,
      'cpi-profile': 1,
      'cpi-heatmap': 1,
      'kpi-card': 4,
      'markdown-section': 24,
      'pyramid-chart': 2,
    });
  });

  it('生 estatParams を持つ chart は shrink-only (増やさない)', () => {
    expect(live.chartsWithRawEstatParams).toBeLessThanOrEqual(
      BASELINE.chartsWithRawEstatParams
    );
  });

  it('生色の箇所数・色数は shrink-only (WP5 で 0 へ)', () => {
    expect(live.rawColorPlaces).toBeLessThanOrEqual(BASELINE.rawColorPlaces);
    expect(live.distinctColors.length).toBeLessThanOrEqual(
      BASELINE.distinctColors
    );
  });

  it('markdown以外の全83 componentが relatedRankingKeys を持つ', () => {
    expect(live.chartsWithRelatedRankingKeys).toBe(
      BASELINE.chartsWithRelatedRankingKeys
    );
  });
});

// ---- 陰性対照 (mutation): defect を注入すると計測が動くことを固定する ----

/** 最小 chart を組む (componentProps だけ差し替える)。 */
function chart(componentProps: Record<string, unknown>): CatalogChart {
  return {
    componentKey: 'k',
    componentType: 'line-chart',
    title: 't',
    componentProps,
    sortOrder: 0,
  };
}

/** 最小テーマ 1 件 (charts だけ意味を持つ)。 */
function theme(charts: CatalogChart[]): ThemeCatalog {
  return {
    key: 't',
    title: 't',
    description: '',
    category: 'population' as ThemeCatalog['category'],
    usage: 'dashboard' as ThemeCatalog['usage'],
    metrics: [],
    charts,
  };
}

describe('陰性対照 — 生色ロールの逸脱を検知する', () => {
  it('色キーに生色を足すと rawColorPlaces が増える', () => {
    const clean = measureChart(chart({ estatParams: [{ statsDataId: 'X' }] }));
    const dirty = measureChart(
      chart({
        estatParams: [{ statsDataId: 'X' }],
        seriesColors: ['#3b82f6', '#ef4444'],
      })
    );
    expect(clean.colors.length).toBe(0);
    expect(dirty.colors.length).toBe(2);
  });

  it('segments の color も数える', () => {
    const m = measureChart(
      chart({ statsDataId: 'X', segments: [{ code: 'A1', color: '#22c55e' }] })
    );
    expect(m.colors).toEqual(['#22c55e']);
  });

  it('e-Stat コード (cdCat01) の hex 風文字列を色と誤検出しない', () => {
    // 平コードも `#` 付きの実コード (#A0160102 等) も、色キーではないので色に数えない。
    const plain = measureChart(
      chart({ estatParams: [{ statsDataId: 'X', cdCat01: 'A01601' }] })
    );
    const hashed = measureChart(
      chart({ estatParams: [{ statsDataId: 'X', cdCat01: '#A0160102' }] })
    );
    expect(plain.colors.length).toBe(0);
    expect(hashed.colors.length).toBe(0);
  });
});

describe('陰性対照 — 生 estatParams を検知する', () => {
  it('estatParams を足すと hasRawEstatParams が立ち request が増える', () => {
    const before = measureChart(chart({ labels: ['a'] }));
    const after = measureChart(
      chart({ estatParams: [{ statsDataId: 'X' }, { statsDataId: 'Y' }] })
    );
    expect(before.hasRawEstatParams).toBe(false);
    expect(after.hasRawEstatParams).toBe(true);
    expect(after.estatRequests).toBe(2);
  });
});

describe('陰性対照 — 型付き参照の増減を検知する', () => {
  it('relatedRankingKeys を外すと集計が減る', () => {
    const withRef = collectCatalogBaseline([
      theme([{ ...chart({}), relatedRankingKeys: ['ranking-a'] }]),
    ]);
    const withoutRef = collectCatalogBaseline([theme([chart({})])]);
    expect(withRef.chartsWithRelatedRankingKeys).toBe(1);
    expect(withoutRef.chartsWithRelatedRankingKeys).toBe(0);
  });
});
