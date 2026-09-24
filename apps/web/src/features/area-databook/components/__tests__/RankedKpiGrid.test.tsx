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

  // 2026-09-24 週次 UI 検査: 値の無い指標が「—」の箱で並び、最終行の空きマスが灰色の箱に見えた。
  it("観測値の無い指標は項目ごと出さない", () => {
    const html = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={[metric("population", "人口"), metric("crime-rate", "犯罪率")]}
        databook={databook}
        columns={3}
      />,
    );
    expect(html).toContain("人口");
    expect(html).not.toContain("犯罪率");
    expect(html).not.toContain("—");
  });

  it("最終行の空きマスを段数ごとにカード地で埋める", () => {
    const full = {
      metrics: Object.fromEntries(
        ["a", "b", "c", "d"].map((k) => [
          k,
          { value: 1, rank: 1, unit: "人", nationalAvg: 0 },
        ]),
      ),
    } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"];
    const html = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={["a", "b", "c", "d"].map((k) => metric(k, k.toUpperCase()))}
        databook={full}
        columns={3}
      />,
    );
    // 4 件: 2 段では空き 0、3 段では空き 2
    const fillers = [...html.matchAll(/<div aria-hidden="true" class="([^"]*)"/g)].map(
      (m) => m[1],
    );
    expect(fillers).toHaveLength(2);
    for (const c of fillers) {
      expect(c).toContain("hidden");
      expect(c).toContain("bg-card");
      expect(c).toContain("@sm:hidden");
      expect(c).toContain("@md:block");
    }
  });
});
