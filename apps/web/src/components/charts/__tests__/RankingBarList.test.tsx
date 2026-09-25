/**
 * RankingBarList の桁揃え回帰テスト (2026-07-31)。
 *
 * 本番のランキングページで「2,309」と「2,285.4」が同じリストに混在していた。
 * 原因は `maximumFractionDigits` だけを指定していたこと — **44.0 は number では 44** なので、
 * max 指定だけでは整数値の小数が消える。桁数は 1 つの値では決まらずデータセット全体で決まる。
 *
 * 両方向を固定する: 小数を持つデータでは整数値も揃い、整数だけのデータには小数を付けない。
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { barGeometry, RankingBarList } from "../RankingBarList";

const items = (values: number[]) =>
  values.map((value, i) => ({ key: `k${i}`, label: `県${i}`, value, rank: i + 1 }));

/** 値セル (w-20 or w-auto の tabular-nums span) のテキストだけを拾う。 */
const valueTexts = (container: HTMLElement) =>
  [...container.querySelectorAll("span.tabular-nums")]
    .map((el) => el.textContent ?? "")
    .filter((t) => /^[0-9]/.test(t));

describe("RankingBarList の桁揃え", () => {
  it("★小数を含むデータでは整数値も揃う (2,309 → 2,309.0)", () => {
    const { container } = render(
      <RankingBarList items={items([2309, 2285.4, 2278.1])} valueMaximumFractionDigits={1} />,
    );
    const texts = valueTexts(container);
    expect(texts).toContain("2,309.0");
    const decimals = new Set(texts.map((t) => (t.split(".")[1] ?? "").length));
    expect(decimals.size).toBe(1);
  });

  it("★整数だけのデータに余計な .0 を付けない", () => {
    const { container } = render(
      <RankingBarList items={items([2309, 2285, 2278])} valueMaximumFractionDigits={1} />,
    );
    expect(valueTexts(container).every((t) => !t.includes("."))).toBe(true);
  });

  it("★上限を超える桁は上限で頭打ちにする (呼び元の意図を尊重する)", () => {
    const { container } = render(
      <RankingBarList items={items([1.234, 2])} valueMaximumFractionDigits={1} />,
    );
    expect(valueTexts(container)).toEqual(["1.2", "2.0"]);
  });

  it("上限を渡さなければ整数表示 (既定の挙動を変えない)", () => {
    const { container } = render(<RankingBarList items={items([2309.6, 2285.4])} />);
    expect(valueTexts(container).every((t) => !t.includes("."))).toBe(true);
  });

  it("単位は値の後ろに出る", () => {
    render(<RankingBarList items={items([2309, 2285.4])} unit="時間" valueMaximumFractionDigits={1} />);
    expect(screen.getAllByText("時間").length).toBeGreaterThan(0);
  });
});

/**
 * 負の値を含む指標の棒 (2026-09-25)。
 *
 * 棒の長さを絶対値で決めていたため、人口増減率 -18.7 の秋田県の棒が 2 位 (正の小さな値) より
 * 長く右へ伸び、値の大小を逆に読ませていた。0 を基準に正は右・負は左へ伸ばす。
 */
describe("barGeometry (0 基準の棒)", () => {
  it("すべて正の値なら従来どおり左端から伸びる", () => {
    expect(barGeometry(50, { min: 0, max: 100 })).toEqual({ leftPercent: 0, widthPercent: 50, zeroPercent: 0 });
  });

  it("負の値は 0 の位置から左へ伸びる", () => {
    const scale = { min: -20, max: 5 };
    const neg = barGeometry(-18.7, scale);
    const pos = barGeometry(2, scale);
    expect(neg.zeroPercent).toBeCloseTo(80);
    expect(neg.leftPercent + neg.widthPercent).toBeCloseTo(neg.zeroPercent);
    expect(pos.leftPercent).toBeCloseTo(pos.zeroPercent);
  });

  it("棒の長さは値の差に比例し、負の大きな値が正の小さな値より右へ長く伸びない", () => {
    const scale = { min: -20, max: 5 };
    const neg = barGeometry(-18.7, scale);
    expect(neg.leftPercent).toBeLessThan(neg.zeroPercent);
    expect(neg.widthPercent).toBeCloseTo((18.7 / 25) * 100);
  });

  it("目盛りの幅が 0 なら棒を描かない", () => {
    expect(barGeometry(0, { min: 0, max: 0 })).toEqual({ leftPercent: 0, widthPercent: 0, zeroPercent: 0 });
  });
});

describe("RankingBarList の 0 基準線", () => {
  it("負の値を含むと 0 の基準線を出し、正の値だけなら出さない", () => {
    const withNeg = render(<RankingBarList items={items([3, -18.7])} />);
    expect(withNeg.getAllByTestId("ranking-bar-zero-line").length).toBe(2);
    withNeg.unmount();
    const allPos = render(<RankingBarList items={items([3, 1])} />);
    expect(allPos.queryAllByTestId("ranking-bar-zero-line").length).toBe(0);
  });
});
