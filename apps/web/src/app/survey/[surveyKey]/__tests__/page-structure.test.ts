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
