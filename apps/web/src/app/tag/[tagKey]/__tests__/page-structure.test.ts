import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const PAGE = readFileSync(
  path.resolve(process.cwd(), 'src/app/tag/[tagKey]/page.tsx'),
  'utf8'
);

describe('tag page article cards', () => {
  // 2026-09-24 の週次 UI 検査: 記事タイトルの直上に slug (例 general-households-prefecture-gap)
  // が表示されていた。slug は URL にだけ使い、読者向けの本文には出さない。
  it('記事の slug を画面の文字として描画しない', () => {
    expect(PAGE).toContain('href={`/blog/${article.slug}`}');
    expect(PAGE).not.toMatch(/>\s*\{article\.slug\}\s*</);
  });
});
