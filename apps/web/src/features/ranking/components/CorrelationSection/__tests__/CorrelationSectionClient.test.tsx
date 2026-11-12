import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CorrelationSectionClient } from "../CorrelationSectionClient";

function item(rankingKey: string, title: string, populationAdjustedR: number) {
    return {
        rankingKey,
        title,
        populationAdjustedR,
    };
}

describe("CorrelationSectionClient", () => {
  it("正負それぞれ10件を2列の共通表で表示し、解説記事を持たない", () => {
    const { container } = render(<CorrelationSectionClient groups={{
      positive: Array.from({ length: 10 }, (_, i) => item("p-" + i, "正の指標" + i, 0.9 - i / 100)),
      negative: Array.from({ length: 10 }, (_, i) => item("n-" + i, "負の指標" + i, -0.9 + i / 100)),
    }} />);
    for (const name of ["正の相関", "負の相関"]) {
      const table = screen.getByRole("table", { name });
      expect(within(table).getAllByRole("row")).toHaveLength(11);
      expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    }
    expect(container.querySelectorAll('a[href^="/ranking/"]')).toHaveLength(20);
    expect(container.querySelectorAll('a[href^="/blog/"]')).toHaveLength(0);
    expect(screen.queryByText("解説")).toBeNull();
  });
  it("片方だけなら空の表や2列を作らない", () => {
    const { container } = render(<CorrelationSectionClient groups={{ positive: [item("a", "指標A", 0.8)], negative: [] }} />);
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "負の相関" })).toBeNull();
    expect(container.querySelector('[class*="@md:grid-cols-2"]')).toBeNull();
  });
  it("相関がなければ節全体を省略する", () => {
    const { container } = render(<CorrelationSectionClient groups={{ positive: [], negative: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
