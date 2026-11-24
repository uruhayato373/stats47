import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MiniDistributionBars } from "../MiniDistributionBars";

const bin = (x0: number, x1: number, count: number, extra: Partial<{ isOverflow: boolean; isUnderflow: boolean }> = {}) => ({
  x0,
  x1,
  count,
  isOverflow: false,
  isUnderflow: false,
  ...extra,
});

describe("MiniDistributionBars", () => {
  it("棒の下に横軸の最小と最大を単位つきで書く (軸の無い棒だけでは何の分布か読めない)", () => {
    render(<MiniDistributionBars bins={[bin(0, 10, 5), bin(10, 20, 3), bin(20, 30, 1)]} unit="％" />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("裾を畳んだビンは「以上」「未満」と書く (左端 1 本だけ高い分布でも右の裾の範囲が分かる)", () => {
    render(
      <MiniDistributionBars
        bins={[bin(0, 100, 1, { isUnderflow: true }), bin(100, 1000, 900), bin(20000, 50000, 3, { isOverflow: true })]}
        unit="世帯"
      />,
    );
    expect(screen.getByText("100世帯 未満")).toBeInTheDocument();
    expect(screen.getByText("2万世帯 以上")).toBeInTheDocument();
  });

  it("ビンが無ければ何も描かない", () => {
    const { container } = render(<MiniDistributionBars bins={[]} unit="人" />);
    expect(container).toBeEmptyDOMElement();
  });
});
