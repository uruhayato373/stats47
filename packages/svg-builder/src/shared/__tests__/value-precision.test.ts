/**
 * 値ラベルの小数桁を**データセット単位で揃える**規約のテスト。
 *
 * ## なぜ要るか (2026-07-31)
 *
 * `formatValueLabel` は `maximumFractionDigits` だけを指定していたため、同じ図の中で
 * `60.4` と `44` が混ざっていた。桁数は 1 つの値では決まらず**データセット全体で決まる**。
 *
 * 両方向を固定する:
 *   - 小数を持つ指標では、整数値も `44.0` と表示される (揃う)
 *   - 整数だけの指標に、余計な `.0` を付けない (過剰適用しない)
 */

import { describe, expect, it } from "vitest";

import { generateChoroplethSvg } from "../../charts/choropleth";
import { formatValueLabel, resolveValuePrecision } from "../axis";

// `resolveValuePrecision` 自体の単体テストは実体のある `packages/utils` 側にある。
// ここでは **svg-builder が re-export 越しに同じ実装を使っているか**だけを確かめる。
describe("resolveValuePrecision (@stats47/utils の re-export)", () => {
  it("★1 件でも小数があればその桁数を採る (44 も 44.0 にするため)", () => {
    expect(resolveValuePrecision([60.4, 54.9, 44, 24.4])).toBe(1);
  });

  it("★整数だけなら 0 (人口などに .0 を付けない)", () => {
    expect(resolveValuePrecision([110700, 98000, 44])).toBe(0);
  });
});

describe("formatValueLabel", () => {
  it("★桁数を固定する (44 → 44.0)", () => {
    expect(formatValueLabel(44, 1)).toBe("44.0");
    expect(formatValueLabel(60.4, 1)).toBe("60.4");
  });

  it("★precision=0 なら小数を付けない", () => {
    expect(formatValueLabel(110700, 0)).toBe("110,700");
    expect(formatValueLabel(44, 0)).toBe("44");
  });

  it("整数部は 3 桁区切りにする", () => {
    expect(formatValueLabel(1234567.8, 1)).toBe("1,234,567.8");
  });

  it("precision を超える桁は丸める", () => {
    expect(formatValueLabel(4.63, 1)).toBe("4.6");
  });
});

describe("データセット全体で揃うこと (回帰)", () => {
  it("★同じ図の中で桁数が混ざらない", () => {
    const values = [60.4, 54.9, 53.2, 44, 26.2, 24.8, 24.4];
    const p = resolveValuePrecision(values);
    const labels = values.map((v) => formatValueLabel(v, p));
    const decimals = new Set(labels.map((l) => (l.split(".")[1] ?? "").length));
    expect(decimals.size).toBe(1); // 全ラベルが同じ小数桁
    expect(labels).toContain("44.0");
  });
});

// ============================================================================
// レンダラへの配線 (2026-07-31)
//
// 桁数の解決を「共有ユーティリティに置いた」だけでは足りない。各チャートが
// **データセット全体から 1 度だけ解決して使っているか**を、実際に描画して確かめる。
// ============================================================================
describe("choropleth の既定フォーマット", () => {
  const CODES = ["01","02","03","04","05","06","07"];
  const render = (values: number[]) => {
    const items = values.map((v, i) => ({ code: CODES[i], name: `県${i}`, value: v }));
    return generateChoroplethSvg(items, { title: "t", unit: "人", showValue: true });
  };
  /**
   * **表示テキストだけ**を拾う (座標にも "44.0" のような文字列が現れるため、
   * 生 SVG を検索すると誤検出する)。
   */
  const labels = (svg: string) =>
    [...svg.matchAll(/>([^<>]+)</g)]
      .map((m) => m[1])
      // 上位リストの行頭順位 ("1. 宮崎県") は値ラベルではないので除く。
      // これを弾かないと "1." の "." を小数と誤認する
      .filter((t) => !/^\d+\.\s/.test(t))
      .filter((t) => /^[0-9][0-9,]*(\.[0-9]+)?[^0-9]*$/.test(t));

  it("★小数を含むデータでは整数値も .0 が付く (44 → 44.0)", () => {
    const ls = labels(render([60.4, 54.9, 53.2, 44, 26.2, 24.8, 24.4]));
    expect(ls.some((l) => l.startsWith("44.0"))).toBe(true);
    expect(ls.some((l) => /^44[^.0-9]/.test(l))).toBe(false); // "44人" は出ない
  });

  it("★同じ図の中で小数桁が混ざらない", () => {
    const ls = labels(render([60.4, 54.9, 53.2, 44, 26.2, 24.8, 24.4]));
    const decimals = new Set(
      ls.map((l) => (l.match(/\.([0-9]+)/)?.[1] ?? "").length),
    );
    expect(decimals.size).toBe(1);
  });

  it("★整数だけのデータに余計な .0 を付けない", () => {
    const ls = labels(render([110700, 98000, 87000, 44, 31000, 22000, 15000]));
    expect(ls.some((l) => l.startsWith("44") && !l.includes("."))).toBe(true);
    expect(ls.every((l) => !l.includes("."))).toBe(true);
    expect(ls.some((l) => l.startsWith("110,700"))).toBe(true); // 3 桁区切りは維持
  });
});
