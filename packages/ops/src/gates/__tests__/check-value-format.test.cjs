/**
 * check-value-format の対照テスト。
 *
 * **全 PASS は「ガードが何も見ていない」と区別がつかない**ので、両方向を固定する:
 *   - 実際に起きていた 2 つの実バグ形を検出すること
 *   - 正しく書かれたコード・座標整形・対象外の層で誤検知しないこと
 *
 * 誤検知を出すガードは運用で無効化されるため、非検出側の方が重要。
 */

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { inspectSource, isValueRenderingFile } = require("../check-value-format.cjs");

const F = "apps/web/src/features/ranking/components/X.tsx";

describe("inspectSource — 検出する", () => {
  it("★maximumFractionDigits の単独指定 (旧 formatRankingValue の実バグ)", () => {
    const found = inspectSource(F, `return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });`);
    assert.equal(found.length, 1);
    assert.equal(found[0].code, "max-fraction-digits-only");
  });

  it("★素の toLocaleString(\"ja-JP\") (旧 RankingDataTable の実バグ)", () => {
    // ★ロケールは大文字を含む。除外正規表現を [a-z-] にすると**この実バグを見逃す**
    const found = inspectSource(F, `{row.getValue("value").toLocaleString("ja-JP")}`);
    assert.equal(found.length, 1);
    assert.equal(found[0].code, "bare-tolocalestring");
  });

  it("引数なしの toLocaleString も検出する", () => {
    assert.equal(inspectSource(F, `{displayValue.toLocaleString()}`).length, 1);
  });

  it("★派生値のフォーマッタも検出される (baseline で扱う対象)", () => {
    // build-national-average-series.ts の formatSigned。変化率なので実害は無いが、
    // 「変化率を整形する」意図は呼び出し元にしかなく、行の近傍からは機械的に判別できない。
    // → 近傍キーワードで推測せず baseline に固定する、が本ガードの設計判断
    const src = [
      "function formatSigned(value) {",
      "  const rounded = Math.round(value * 10) / 10;",
      '  return `${Math.abs(rounded).toLocaleString("ja-JP", {',
      "    maximumFractionDigits: 1,",
      "  })}`;",
      "}",
    ].join("\n");
    const found = inspectSource("apps/web/src/features/ranking/lib/x.ts", src);
    assert.ok(found.length >= 1, "検出されること (baseline が受け止める)");
  });
});

describe("inspectSource — 検出しない (誤検知を出さない)", () => {
  it("★min と max を両方指定していれば通す (規約どおり)", () => {
    const src = `new Intl.NumberFormat("ja-JP", { minimumFractionDigits: p, maximumFractionDigits: p })`;
    assert.equal(inspectSource(F, src).length, 0);
  });

  it("★共有ユーティリティ経由は通す", () => {
    assert.equal(inspectSource(F, `return formatValueWithPrecision(value, precision);`).length, 0);
  });

  it("★座標・寸法の toFixed は対象外 (表示値ではない)", () => {
    const src = `\`<rect x="\${x.toFixed(1)}" y="\${y.toFixed(1)}"/>\``;
    assert.equal(inspectSource("packages/svg-builder/src/charts/x.ts", src).length, 0);
  });

  it("コメント行は見ない (規約の説明文が自分を検出しない)", () => {
    const src = `// 旧実装は maximumFractionDigits だけを指定していた`;
    assert.equal(inspectSource(F, src).length, 0);
  });

  it("★規約の実装本体 (packages/utils) は対象外", () => {
    const src = `new Intl.NumberFormat("ja-JP", { maximumFractionDigits: precision })`;
    assert.equal(inspectSource("packages/utils/src/number/format.ts", src).length, 0);
  });

  it("テストファイルは対象外", () => {
    const src = `expect(v.toLocaleString("ja-JP")).toBe("44");`;
    assert.equal(inspectSource("apps/web/src/features/ranking/x.test.ts", src).length, 0);
  });

  it("観測値を描画しない層は見ない", () => {
    assert.equal(inspectSource("apps/web/src/features/ads/x.tsx", `{n.toLocaleString()}`).length, 0);
  });
});

describe("isValueRenderingFile", () => {
  it("観測値を描画する層だけを対象にする", () => {
    assert.equal(isValueRenderingFile("packages/svg-builder/src/charts/bar-chart.ts"), true);
    assert.equal(isValueRenderingFile("apps/web/src/features/ranking/components/X.tsx"), true);
    assert.equal(isValueRenderingFile("apps/web/src/components/charts/MiniCharts.tsx"), true);
  });

  it("無関係な層・ビルド成果物は見ない", () => {
    assert.equal(isValueRenderingFile("apps/web/src/features/ads/x.tsx"), false);
    assert.equal(isValueRenderingFile("packages/svg-builder/dist/x.js"), false);
    assert.equal(isValueRenderingFile("README.md"), false);
  });
});
