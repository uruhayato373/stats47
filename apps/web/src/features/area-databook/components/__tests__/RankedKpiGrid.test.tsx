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
  it("定義リストの中で、指標 1 つをカード 1 枚に描く", () => {
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
    expect(html.match(/border-card-outline/g)).toHaveLength(1);
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

  // 2026-10-28 数値タイル: 線の格子 (PanelGrid) に数値タイル (StatTile) を並べる。格子の地は線の色なので、
  // 最終行の空きマスは白いセルで埋める。列数は幅で 1 → 2 → 3 と変わるので、幅ごとに必要な数だけ出す。
  it("指標の数だけ数値タイルを線の格子に並べ、最終行の空きマスは幅ごとに白いセルで埋める", () => {
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
    expect(html.match(/data-slot-kind="stat-tile"/g)).toHaveLength(4);
    expect(html).toContain('data-slot="panel-grid"');
    // 4 枚: 2 列では空きマス 0、3 列では 2。埋めるセルは 3 列のときだけ出す
    const fillers = [...html.matchAll(/<div aria-hidden="true" data-cell="flush" class="([^"]*)"/g)].map((m) => m[1]);
    expect(fillers).toHaveLength(2);
    for (const className of fillers) {
      expect(className.split(" ")).toEqual(expect.arrayContaining(["hidden", "@md:block"]));
      expect(className).not.toContain("@sm:block");
    }
  });

  // 2026-09-25 UI 全面点検: 県データブックの数値カード約 50 個に年が無く、いつの値か分からなかった。
  it("値には年を添え、全国平均と並べるときも年を先に出す", () => {
    const withYear = {
      metrics: {
        population: { value: 1_157_000, rank: 31, year: "2023年", unit: "人", nationalAvg: 2_600_000 },
      },
    } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"];
    const plain = renderToStaticMarkup(
      <RankedKpiGrid metrics={[metric("population", "人口")]} databook={withYear} />,
    );
    expect(plain).toContain("2023年");
    const withAvg = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={[{ ...metric("population", "人口"), compareNationalAvg: true }]}
        databook={withYear}
      />,
    );
    // 何の平均かを書く。欄の無い旧版は 47 都道府県の単純平均として表示する (AREA-NATIONAL-AVG-SIMPLE-MEAN-01)
    expect(withAvg).toMatch(/2023年 ・ 47都道府県平均 2,600,000/);
    const official = {
      metrics: {
        population: { value: 1_157_000, rank: 31, year: "2023年", unit: "人", nationalAvg: 2_660_000, nationalAvgKind: "national" },
      },
    } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"];
    const withNational = renderToStaticMarkup(
      <RankedKpiGrid metrics={[{ ...metric("population", "人口"), compareNationalAvg: true }]} databook={official} />,
    );
    expect(withNational).toMatch(/2023年 ・ 全国 2,660,000/);
  });
});

