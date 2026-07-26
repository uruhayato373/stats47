import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const PAGE = readFileSync(
  path.resolve(process.cwd(), 'src/app/category/[categoryKey]/page.tsx'),
  'utf8'
);

describe('category page featured ranking cards', () => {
  it('homeと同じカードmodel resolverと共通componentだけを使う', () => {
    const featuredSection =
      PAGE.match(
        /\{\/\* 注目ランキング \*\/\}([\s\S]*?)\{\/\* 全件テーブル \*\/\}/
      )?.[1] ?? '';

    expect(PAGE).toContain('buildFeaturedRankingCardModel({');
    expect(featuredSection).toContain('<FeaturedRankingCard');
    expect(featuredSection).toContain('model={item.model}');
    expect(featuredSection).toContain(
      'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
    );
    expect(featuredSection).not.toContain('fitHeight');
    expect(featuredSection).not.toContain('topAreaName=');
    expect(featuredSection).not.toContain('tileMapSvg=');
  });

  it('全件readから派生値と地図を作り、1位batchを重複取得しない', () => {
    expect(PAGE).toContain('values: valuesResult.data');
    expect(PAGE).not.toContain('readTopRankingValuesBatchFromR2');
  });

  it('独立した情報セクションの見出しに連番を表示しない', () => {
    const sectionHeaders = Array.from(
      PAGE.matchAll(/<SectionHeader\b([\s\S]*?)\/>/g),
      (match) => match[1]
    );

    expect(sectionHeaders.length).toBeGreaterThan(0);
    expect(sectionHeaders.every((props) => !/\bnumber=/.test(props))).toBe(
      true
    );
  });
});
