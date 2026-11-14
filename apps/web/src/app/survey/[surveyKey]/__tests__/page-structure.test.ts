// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const PAGE = readFileSync(
  path.resolve(process.cwd(), 'src/app/survey/[surveyKey]/page.tsx'),
  'utf8',
);

describe('survey page featured ranking cards', () => {
  it('home/categoryと同じmodel resolverと共通componentだけを使う', () => {
    expect(PAGE).toContain('buildFeaturedRankingCardModel({');
    expect(PAGE).toContain('values: valuesResult.data');
    expect(PAGE).toContain('<FeaturedRankingCard');
    expect(PAGE).toContain('model={item.model}');
    expect(PAGE).not.toContain('topAreaName=');
    expect(PAGE).not.toContain('tileMapSvg=');
  });
});

describe('survey page header latest year', () => {
  it('最新年は指標の最新年の最大ではなく、調査の実施周期から出す (SURVEY-PAGES-01)', () => {
    expect(PAGE).toContain('surveyLatestYear(rankingItems, editorial?.surveyCycle)');
    // 全指標の最新年の最大を見出しに出すと、他の調査が原典の年 (人口推計の 2024 年など) が国勢調査の最新回に読める
    expect(PAGE).not.toMatch(/\.map\(\(i\) => parseLatestYear\(i\.latestYear\)\)\s*\.filter/);
  });
});
