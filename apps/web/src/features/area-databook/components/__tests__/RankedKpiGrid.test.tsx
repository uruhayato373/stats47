import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RankedKpiGrid } from "../RankedKpiGrid";

const metric = (rankingKey: string, shortLabel: string) => ({
  rankingKey,
  shortLabel,
});

const databook = {
  metrics: {
    population: { value: 1_157_000, rank: 31, unit: "人", nationalAvg: 0 },
  },
} as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"];

describe("RankedKpiGrid", () => {
  it("指標ごとのカードを作らず、1つの高密度な定義リストにまとめる", () => {
    const html = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={[metric("population", "人口")]}
        databook={databook}
        columns={4}
      />,
    );

    expect(html).toContain("<dl");
    expect(html).toContain("人口");
    expect(html).toContain("1,157,000");
    expect(html).toContain("31位");
    expect(html.match(/shadow-sm/g)).toHaveLength(1);
    expect(html).toContain("grid-cols-1");
    expect(html).not.toContain("@md:grid-cols-4");
  });

  it("本文幅844pxで4列指定が発動する", () => {
    const metrics = [
      metric("a", "A"),
      metric("b", "B"),
      metric("c", "C"),
      metric("d", "D"),
    ];
    const html = renderToStaticMarkup(
      <RankedKpiGrid metrics={metrics} databook={null} columns={4} />,
    );

    expect(html).toContain("@md:grid-cols-4");
    expect(html).not.toContain("@lg:grid-cols-4");
  });
});
