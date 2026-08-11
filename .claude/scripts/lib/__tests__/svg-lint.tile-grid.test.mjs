/**
 * lintTileGridQuality の対照テスト (mutation testing)。
 * 実行: node --test .claude/scripts/lib/__tests__/svg-lint.tile-grid.test.mjs
 *
 * ★全 PASS は「ゲートが何も見ていない」状態と区別がつかない。不変量ごとに
 * **1 つだけ壊した検体**を作り、その不変量が実際に発火することを固定する。
 *
 * 2026-07-31 にタイルマップを 720×720 へ改訂した際、ゲート側は更新したが
 * 「旧デザインを実際に落とすか」を実測していなかった。本テストがその穴を埋める。
 *
 * 実データでの対照実験 (同日実施):
 *   旧 2 世代前 (600×700・docs/21 の 2 検体) → error 5 / 4
 *   旧 1 世代前 (780×560・本番 R2 の実物)   → error 2 (キャンバス + 旧見出し)
 *   現行 (720×720・svg-builder の実出力)    → error 0 / warning 0
 * ※ docs/21 は公開後に自動削除される ephemeral outbox なので、恒久テストは
 *    実ファイルに依存せず合成検体で不変量を固定する。generator の実出力が通ることは
 *    packages/svg-builder 側の vitest (choropleth.gate.test.ts) が担保する。
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { lintTileGridQuality } from "../svg-lint.mjs";

const NAME = "sample-tile-grid.svg";

/** 現行デザインの不変量をすべて満たす最小検体。 */
function goodSvg() {
  const tiles = Array.from(
    { length: 5 },
    (_, i) => `<rect x="${100 + i * 40}" y="200" width="39" height="39" rx="3" fill="rgb(200,60,60)"/>`,
  ).join("");
  return [
    '<svg viewBox="0 0 720 720" width="720" height="720" xmlns="http://www.w3.org/2000/svg">',
    '<defs><linearGradient id="choropleth-lg"><stop offset="0"/></linearGradient></defs>',
    tiles,
    // 上位 3 県 (見出しを持たず「1. 県名」の形)
    '<text x="20" y="60">1. 宮崎県</text><text x="20" y="80">2. 鹿児島県</text><text x="20" y="100">3. 熊本県</text>',
    // 凡例は右下
    '<rect x="520" y="660" width="160" height="10" fill="url(#choropleth-lg)"/>',
    "</svg>",
  ].join("");
}

const run = (svg) => lintTileGridQuality(NAME, svg);

describe("lintTileGridQuality — 現行デザインは通る", () => {
  it("★不変量をすべて満たす検体で error も warning も出ない", () => {
    const r = run(goodSvg());
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.warnings, []);
  });

  it("tile-grid でないファイルは検査しない (他チャートへの巻き込み防止)", () => {
    const r = lintTileGridQuality("sample-ranking.svg", '<svg viewBox="0 0 960 404"></svg>');
    assert.deepEqual(r.errors, []);
  });
});

describe("lintTileGridQuality — 不変量ごとに 1 つだけ壊す", () => {
  const cases = [
    {
      name: "★#1 キャンバスが 720×720 でない (旧 600×700 / 780×560)",
      mutate: (s) => s.replace('viewBox="0 0 720 720"', 'viewBox="0 0 780 560"'),
      expect: /キャンバスが/,
    },
    {
      name: "★#2 全面の背景 rect を敷いている (ページの地色と食い違う)",
      mutate: (s) => s.replace("<defs>", '<rect width="720" height="720" fill="#fff"/><defs>'),
      expect: /背景 rect/,
    },
    {
      name: "★#3 prefers-color-scheme を含む (OS とサイトのテーマが食い違うと SVG だけ反転)",
      mutate: (s) => s.replace("<defs>", "<style>@media (prefers-color-scheme:dark){}</style><defs>"),
      expect: /prefers-color-scheme/,
    },
    {
      name: "★#4 テーマ依存の svg-* class を使っている",
      mutate: (s) => s.replace("<text x=\"20\" y=\"60\">", '<text class="svg-title" x="20" y="60">'),
      expect: /svg-\* class/,
    },
    {
      name: "★#5 凡例が右下にない (左上は上位リストが使う)",
      mutate: (s) => s.replace('<rect x="520" y="660"', '<rect x="64" y="120"'),
      expect: /凡例が右下にない/,
    },
    {
      name: "★#5 凡例そのものが無い",
      mutate: (s) => s.replace(/<rect x="520"[^>]*>/, ""),
      expect: /グラデーションバーが見つからない/,
    },
    {
      name: "★#7 旧デザインの見出し (高い順/低い順) が残っている",
      mutate: (s) => s.replace('<text x="20" y="60">', '<text x="20" y="40">高い順</text><text x="20" y="60">'),
      expect: /旧デザインの見出し/,
    },
    {
      // 2026-08-11 の実測欠陥そのもの: 凡例の右端ラベルが x=704 から左揃えで
      // CJK 2 文字 (font-size 11 ≈ 22px) → 右端 726px > 720px で切れていた。
      name: "★#8 右端ラベルがキャンバスをはみ出す (実測欠陥の再現)",
      mutate: (s) =>
        s.replace("</svg>", '<text x="704" font-size="11">高い</text></svg>'),
      expect: /キャンバス右端をはみ出す/,
    },
    {
      name: "★#8 タイル内の値ラベルがはみ出す (凡例以外の text でも発火する)",
      mutate: (s) =>
        s.replace("</svg>", '<text x="690" y="300" font-size="12">12,345千円</text></svg>'),
      expect: /キャンバス右端をはみ出す/,
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const r = run(c.mutate(goodSvg()));
      assert.ok(
        r.errors.some((e) => c.expect.test(e)),
        `期待した error が出ていない。実際: ${JSON.stringify(r.errors)}`,
      );
    });
  }

  // ★誤検知しないことも同じ強さで固定する。誤検知を出すゲートは運用で無効化される。
  describe("#8 はみ出し検査は正当なテキストで発火しない", () => {
    const cases = [
      {
        name: "end 揃えの目盛りラベル (右端 = x なので収まる)",
        add: '<text x="698" y="684" font-size="10" text-anchor="end">31.8％</text>',
      },
      {
        name: "middle 揃えの中間ラベル",
        add: '<text x="600" y="684" font-size="10" text-anchor="middle">28.5％</text>',
      },
      {
        name: "右端ラベルを内側に寄せた現行の形 (右端 702px)",
        add: '<text x="680" font-size="11">高い</text>',
      },
      {
        name: "1px の超過は許容する (グリフ実測ではないため)",
        add: '<text x="709" y="300" font-size="11">あ</text>',
      },
    ];
    for (const c of cases) {
      it(c.name, () => {
        const r = run(goodSvg().replace("</svg>", `${c.add}</svg>`));
        assert.deepEqual(
          r.errors.filter((e) => /はみ出す/.test(e)),
          [],
          `誤検知した。実際: ${JSON.stringify(r.errors)}`,
        );
      });
    }
  });

  it("★#6 上位 3 県のリストが無い (warning — 旧デザインの疑い)", () => {
    const r = run(goodSvg().replace(/<text x="20"[^>]*>\d\. [^<]*<\/text>/g, ""));
    assert.ok(
      r.warnings.some((w) => /上位 3 県のリスト/.test(w)),
      `期待した warning が出ていない。実際: ${JSON.stringify(r.warnings)}`,
    );
  });
});
