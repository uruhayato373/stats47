/**
 * lintScatterQuality の対照テスト (mutation testing)。
 * 実行: node --test .claude/scripts/lib/__tests__/svg-lint.scatter.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { lintScatterQuality } from '../svg-lint.mjs';

const NAME = 'sample-scatter.svg';

function goodSvg() {
  return [
    '<svg viewBox="0 0 720 720" width="720" height="720">',
    '<rect x="80" y="56" width="600" height="600" class="svg-plot svg-plot-border"/>',
    '<circle cx="100" cy="100" fill="#64748b" stroke="#475569"><title>北海道：X=10 Y=8</title></circle>',
    '<circle cx="200" cy="200" fill="#64748b" stroke="#475569"><title>東京都：X=15 Y=3</title></circle>',
    '</svg>',
  ].join('');
}

const run = (svg) => lintScatterQuality(NAME, svg);

describe('lintScatterQuality — 現行デザインは通る', () => {
  it('正方形・単色・凡例なしで error も warning も出ない', () => {
    assert.deepEqual(run(goodSvg()), { errors: [], warnings: [] });
  });

  it('scatter でないファイルは検査しない', () => {
    assert.deepEqual(
      lintScatterQuality(
        'sample-ranking.svg',
        '<svg viewBox="0 0 960 404"></svg>'
      ),
      { errors: [], warnings: [] }
    );
  });
});

describe('lintScatterQuality — 不変量ごとに壊すと検出する', () => {
  const cases = [
    {
      name: '横長キャンバス',
      mutate: (svg) =>
        svg.replace('viewBox="0 0 720 720"', 'viewBox="0 0 960 624"'),
      expected: /キャンバス/,
    },
    {
      name: '横長プロット領域',
      mutate: (svg) =>
        svg.replace('width="600" height="600"', 'width="700" height="500"'),
      expected: /プロット領域/,
    },
    {
      name: '地域別の複数色',
      mutate: (svg) =>
        svg.replace(
          '<circle cx="200" cy="200" fill="#64748b" stroke="#475569">',
          '<circle cx="200" cy="200" fill="#42a5f5" stroke="#ffffff">'
        ),
      expected: /複数色/,
    },
    {
      name: '地域凡例',
      mutate: (svg) =>
        svg.replace('</svg>', '<!-- 凡例 --><text>北海道・東北</text></svg>'),
      expected: /地域凡例/,
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      const result = run(testCase.mutate(goodSvg()));
      assert.ok(
        result.errors.some((error) => testCase.expected.test(error)),
        `期待した error が出ていない: ${JSON.stringify(result.errors)}`
      );
    });
  }
});
