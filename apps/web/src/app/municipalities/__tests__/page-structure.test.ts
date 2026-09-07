import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PAGE_SOURCE = readFileSync(
  resolve(import.meta.dirname, '../page.tsx'),
  'utf8'
);

describe('municipalities hub page structure', () => {
  it('文脈付きの右レールと画像付きテーマ導線を使う', () => {
    expect(PAGE_SOURCE).toContain('<PageShell rightRail={rightRail}>');
    expect(PAGE_SOURCE).toContain('layout="media"');
    expect(PAGE_SOURCE).toContain('<RailPrefectureCard');
    expect(PAGE_SOURCE).toContain('<RightRailWidgets');
    expect(PAGE_SOURCE).toContain('category-population-hero.webp');
  });

  it('狭幅では入口テーマを本文上部に表示する', () => {
    expect(PAGE_SOURCE).toContain('className="mb-6 xl:hidden"');
    expect(PAGE_SOURCE).toContain('horizontalOnMobile');
  });

  it('テーマカードは重複を除いた代表3指標へ要約する', () => {
    expect(PAGE_SOURCE).toContain('new Set(');
    expect(PAGE_SOURCE).toContain('metricTitles.slice(0, 3)');
    expect(PAGE_SOURCE).toContain('{metricTitles.length}指標');
  });
});
