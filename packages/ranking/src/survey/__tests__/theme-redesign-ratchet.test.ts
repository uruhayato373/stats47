import { describe, expect, it } from 'vitest';
import { METRICS_REGISTRY } from '@stats47/data-configs';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import ratchet from '../../../../../.claude/config/survey-taxonomy-ratchet.json';
import { resolveThemeSurveyTaxonomy, type ThemeChartSurveyTaxonomy } from '../survey-taxonomy';

describe('theme redesign taxonomy population', () => {
  const adjustment = ratchet.themeBaselineAdjustment;
  const results = Object.values(THEME_CATALOGS).map((catalog) => resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY));
  const charts = new Map<string, ThemeChartSurveyTaxonomy>(results.flatMap((result) => result.charts.map((chart) => [`${result.themeKey}/${chart.componentKey}`, chart] as const)));

  it('limits the chart baseline correction to the recorded 34 removals and 10 additions', () => {
    expect(adjustment.previousResolvedCharts).toBe(82);
    expect(new Set(adjustment.removedResolvedChartKeys).size).toBe(34);
    expect(new Set(adjustment.addedResolvedChartKeys).size).toBe(10);
    for (const key of adjustment.removedResolvedChartKeys) expect(charts.has(key), key).toBe(false);
    for (const key of adjustment.addedResolvedChartKeys) expect(charts.get(key)?.status, key).toBe('resolved');
    // 下限がこの訂正より下がる場合は themeBaselineFollowUps に記録したものだけ (次の it が連鎖を検査する)
    expect([...charts.values()].filter((chart) => chart.status === 'resolved').length).toBeGreaterThanOrEqual(ratchet.theme.minResolvedCharts);
    expect(ratchet.theme.minCoveragePct).toBe(100);
    expect(ratchet.theme.maxMissingLineageCharts).toBe(0);
  });

  it('lowers the chart baseline after 2026-09-09 only by the recorded follow-up removals', () => {
    let expected = adjustment.previousResolvedCharts - adjustment.removedResolvedChartKeys.length + adjustment.addedResolvedChartKeys.length;
    for (const followUp of ratchet.themeBaselineFollowUps) {
      expect(followUp.previousResolvedCharts, followUp.date).toBeGreaterThanOrEqual(expected);
      for (const key of followUp.removedResolvedChartKeys) expect(charts.has(key), key).toBe(false);
      for (const key of followUp.addedResolvedChartKeys) expect(charts.get(key)?.status, key).toBe('resolved');
      expected = followUp.previousResolvedCharts - followUp.removedResolvedChartKeys.length + followUp.addedResolvedChartKeys.length;
    }
    // 下限は記録した後追いの分までしか下げない。週次監査 (survey-taxonomy-audit-weekly) が改善に合わせて引き上げるのは許す
    // (2026-10-11 の監査が 51→53 に上げ、等号の検査が PR を止めた)
    expect(ratchet.theme.minResolvedCharts).toBeGreaterThanOrEqual(expected);
  });

  it('lowers the metric-group baseline only by the recorded follow-up card merges', () => {
    const groups = new Map<string, ThemeChartSurveyTaxonomy>(results.flatMap((result) => result.metricGroups.map((group) => [`${result.themeKey}/${group.componentKey}`, group] as const)));
    const withGroups = ratchet.themeBaselineFollowUps.flatMap((followUp) =>
      followUp.previousResolvedMetricGroups === undefined
        ? []
        : [{
            previous: followUp.previousResolvedMetricGroups,
            removed: followUp.removedResolvedMetricGroupKeys ?? [],
            added: followUp.addedResolvedMetricGroupKeys ?? [],
          }],
    );
    expect(withGroups.length).toBeGreaterThan(0);
    for (const followUp of withGroups) {
      for (const key of followUp.removed) expect(groups.has(key), key).toBe(false);
      for (const key of followUp.added) expect(groups.get(key)?.status, key).toBe('resolved');
    }
    const last = withGroups[withGroups.length - 1]!;
    // 同上: 記録した統合の分より下げない。週次監査の引き上げ (438→457) は許す
    expect(ratchet.theme.minResolvedMetricGroups).toBeGreaterThanOrEqual(last.previous - last.removed.length + last.added.length);
  });

  it('protects source coverage on metric-group graphs including all three launch themes', () => {
    const groups = results.flatMap((result) => result.metricGroups);
    expect(groups.filter((group) => group.status === 'resolved').length).toBeGreaterThanOrEqual(ratchet.theme.minResolvedMetricGroups);
    expect(groups.filter((group) => ['unresolved', 'missing-lineage'].includes(group.status))).toEqual([]);
    expect(ratchet.theme.minResolvedMetricGroups).toBeGreaterThanOrEqual(88);
    expect(ratchet.theme.minMetricGroupCoveragePct).toBe(100);
    expect(ratchet.theme.maxMissingLineageMetricGroups).toBe(0);
    for (const key of ['construction-industry', 'waste-recycling', 'information-industry']) {
      const result = results.find((entry) => entry.themeKey === key)!;
      expect(result.metricGroups.length, key).toBeGreaterThan(0);
      expect(result.metricGroups.every((group) => group.status === 'resolved'), key).toBe(true);
    }
  });
});
