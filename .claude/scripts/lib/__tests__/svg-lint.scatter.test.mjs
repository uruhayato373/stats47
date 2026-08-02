/**
 * lintScatterQuality の対照テスト (mutation testing)。
 * 実行: node --test .claude/scripts/lib/__tests__/svg-lint.scatter.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  lintScatterData,
  lintScatterParity,
  lintScatterQuality,
} from '../svg-lint.mjs';

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
const GOOD_DATA = {
  expectedPointCount: 2,
  points: [
    { areaCode: '01000', label: '北海道', x: 10, y: 8 },
    { areaCode: '13000', label: '東京都', x: 15, y: 3 },
  ],
};

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

describe('lintScatterData — 元データ破損を公開前に止める', () => {
  it('有限数・一意な識別子・明示した件数が揃えば通る', () => {
    assert.deepEqual(lintScatterData(NAME, GOOD_DATA), {
      errors: [],
      warnings: [],
    });
  });

  it('x/yが欠けた点を検出する', () => {
    const broken = {
      ...GOOD_DATA,
      points: [{ areaCode: '01000', label: '北海道' }],
    };
    const result = lintScatterData(NAME, broken);
    assert.ok(result.errors.some((error) => /有限数の x\/y/.test(error)));
  });

  it('暗黙に47件未満へ減ったデータを検出する', () => {
    const broken = {
      points: [{ areaCode: '01000', label: '北海道', x: 10, y: 8 }],
    };
    const result = lintScatterData(NAME, broken);
    assert.ok(
      result.errors.some(
        (error) => /点数が 1 件/.test(error) && /期待値は 47 件/.test(error)
      )
    );
  });

  it('都道府県識別子の重複を検出する', () => {
    const broken = {
      ...GOOD_DATA,
      points: [
        GOOD_DATA.points[0],
        { ...GOOD_DATA.points[1], areaCode: '01000' },
      ],
    };
    const result = lintScatterData(NAME, broken);
    assert.ok(result.errors.some((error) => /識別子が重複/.test(error)));
  });

  it('秘匿値の除外は件数・理由・データ非包含が一致すると通る', () => {
    const points = Array.from({ length: 45 }, (_, index) => ({
      areaCode: String(index + 1).padStart(2, '0') + '000',
      label: `都道府県${index + 1}`,
      x: index,
      y: index * 2,
    }));
    assert.deepEqual(
      lintScatterData(
        NAME,
        { points },
        {
          excludedAreas: ['高知県', '沖縄県'],
          exclusionReason: '原表で秘匿値のため',
        }
      ),
      { errors: [], warnings: [] }
    );
  });

  it('excludedAreasに理由がなければ検出する', () => {
    const result = lintScatterData(NAME, GOOD_DATA, {
      expectedPointCount: 2,
      excludedAreas: [],
    });
    assert.ok(result.errors.some((error) => /exclusionReason/.test(error)));
  });

  it('calculated散布図に計算式がなければ検出する', () => {
    const result = lintScatterData(NAME, GOOD_DATA, {
      kind: 'calculated',
      inputs: [{ rankingKey: 'metric-a' }],
    });
    assert.ok(result.errors.some((error) => /formula/.test(error)));
  });
});

describe('lintScatterParity — JSONとSVGの描画点数を一致させる', () => {
  it('一致すれば通る', () => {
    assert.deepEqual(lintScatterParity(NAME, goodSvg(), GOOD_DATA), {
      errors: [],
      warnings: [],
    });
  });

  it('SVGから点が欠けたら検出する', () => {
    const brokenSvg = goodSvg().replace(
      '<circle cx="200" cy="200" fill="#64748b" stroke="#475569"><title>東京都：X=15 Y=3</title></circle>',
      ''
    );
    const result = lintScatterParity(NAME, brokenSvg, GOOD_DATA);
    assert.ok(
      result.errors.some((error) => /JSON=2 件 \/ SVG=1 件/.test(error))
    );
  });
});
