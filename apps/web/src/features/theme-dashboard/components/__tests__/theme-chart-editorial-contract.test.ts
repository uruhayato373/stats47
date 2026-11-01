/**
 * Theme chart の編集責務を固定する回帰テスト。
 * 一般的な読み方を header に自動表示せず、固有注釈と指標ハブは footer に集約する。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const DASHBOARD_SRC = readFileSync(
  resolve(import.meta.dirname, '../ThemeMetricsDashboard.tsx'),
  'utf8'
);
const CHART_FOOTER_SRC = readFileSync(
  resolve(import.meta.dirname, '../../../../components/charts/ChartFooter.tsx'),
  'utf8'
);

describe('theme chart editorial contract', () => {
  it('Theme chart header に生成済み description を表示しない', () => {
    expect(DASHBOARD_SRC).not.toContain('description={chart.description}');
  });

  it('固有注釈と指標ハブ導線を footer に表示する', () => {
    expect(DASHBOARD_SRC).toContain(
      'annotation={resolveChartAnnotation(chart)}'
    );
    expect(DASHBOARD_SRC).toContain(
      'rankingLinks={resolveChartRankingLinks(chart)}'
    );
    // 先頭の指標ハブも「{短い名前}の定義・ランキング」(名前が引けないときだけ「指標の定義・ランキング」)
    expect(DASHBOARD_SRC).toContain('rankingLabel={primaryRankingLabel(chart.rankingLink');
    expect(CHART_FOOTER_SRC).toContain('const indicatorTargets = dedupeLinks');
    // 出典とランキングはボタン 1 つから開く Sheet (SourcesSheet) にまとめる (2026-10-30)
    expect(CHART_FOOTER_SRC).toContain('rankings: indicatorTargets');
    expect(CHART_FOOTER_SRC).toContain('<SourcesSheet');
    expect(CHART_FOOTER_SRC).not.toContain('MAX_SECONDARY_INDICATOR_LINKS');
  });
});
