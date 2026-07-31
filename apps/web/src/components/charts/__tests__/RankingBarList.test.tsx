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

import { RankingBarList } from "../RankingBarList";

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
