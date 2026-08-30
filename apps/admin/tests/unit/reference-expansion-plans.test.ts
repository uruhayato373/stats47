import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  parseReferenceBlogDraft,
  parseReferenceThemePlans,
  referenceExpansionPlans,
} from '@/lib/server/reference-expansion-plans';
import { JAPAN_ZUE_PILOT_ITEMS } from '../../../../packages/data-configs/src/evidence-inventory/japan-zue/pilot';
import { JAPAN_ZUE_MANUAL_OVERRIDES } from '../../../../packages/data-configs/src/evidence-inventory/japan-zue/policy';

describe('reference expansion plans', () => {
  it('backlogのmarker内だけをテーマ企画として読む', () => {
    const plans = parseReferenceThemePlans(`
<!-- reference-theme-plans:start -->
| metricKey | title | targetTheme | status | hypothesis |
| --- | --- | --- | --- | --- |
| sample-metric | サンプル | local-economy | draft | 仮説 |
| blocked-metric | 停止中 | population-dynamics | blocked | 再開待ち |
<!-- reference-theme-plans:end -->
`);

    expect(plans).toEqual([
      expect.objectContaining({ id: 'theme:sample-metric', status: 'draft' }),
      expect.objectContaining({
        id: 'theme:blocked-metric',
        status: 'blocked',
      }),
    ]);
  });

  it('published falseかつmarker付きの複数指標記事だけを下書きとして読む', () => {
    const plan = parseReferenceBlogDraft(
      `---
title: 横断分析
slug: cross-analysis
published: false
referenceSourcePlan: true
planSummary: "2指標の関係を検証する"
---
[指標A](/ranking/metric-a) と [指標B](/ranking/metric-b)
`,
      'fixture/cross-analysis/article.md'
    );

    expect(plan).toMatchObject({
      id: 'blog:cross-analysis',
      status: 'draft',
      metricKeys: ['metric-a', 'metric-b'],
    });
  });

  it('参考文献のtheme未統合指標を企画表が全件カバーする', () => {
    const root = path.resolve(process.cwd(), '../..');
    const inventory = JSON.parse(
      fs.readFileSync(
        path.join(
          root,
          '.claude/state/source-inventory/japan-zue/2025-26/inventory.json'
        ),
        'utf8'
      )
    ) as {
      items: Array<{
        mapping?: { metricKeys?: string[]; contentRoles?: string[] };
      }>;
    };
    const stateThemeKeys = [
      ...new Set(
        inventory.items
          .filter((item) => item.mapping?.contentRoles?.includes('theme'))
          .flatMap((item) => item.mapping?.metricKeys ?? [])
      ),
    ];
    const manualThemeKeys = JAPAN_ZUE_PILOT_ITEMS.filter(
      (item) =>
        item.placements.includes('theme') &&
        Object.hasOwn(JAPAN_ZUE_MANUAL_OVERRIDES, item.evidenceId)
    ).flatMap((item) => [...item.metricKeys]);
    const referenceThemeKeys = [
      ...new Set([...stateThemeKeys, ...manualThemeKeys]),
    ];
    const integratedText = [
      'packages/data-configs/src/theme-catalog',
      'packages/types/src/indicator-sets',
    ]
      .flatMap((rel) =>
        fs
          .readdirSync(path.join(root, rel))
          .filter((file) => file.endsWith('.ts'))
          .map((file) => fs.readFileSync(path.join(root, rel, file), 'utf8'))
      )
      .join('\n');
    const expectedMissing = referenceThemeKeys.filter(
      (key) =>
        !integratedText.includes(`"${key}"`) &&
        !integratedText.includes(`'${key}'`)
    );
    const plans = referenceExpansionPlans(root);
    const themePlans = plans.filter((plan) => plan.kind === 'theme');
    const blogPlans = plans.filter((plan) => plan.kind === 'blog');

    expect(themePlans.map((plan) => plan.metricKeys[0]).sort()).toEqual(
      expectedMissing.sort()
    );
    expect(themePlans).toHaveLength(22);
    expect(themePlans.filter((plan) => plan.status === 'blocked')).toHaveLength(
      3
    );
    expect(blogPlans).toHaveLength(4);
    for (const plan of blogPlans) {
      expect(
        plan.metricKeys.every((key) => referenceThemeKeys.includes(key))
      ).toBe(true);
    }
  });
});
