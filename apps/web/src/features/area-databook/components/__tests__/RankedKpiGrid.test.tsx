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
      />,
    );

    expect(html).toContain("<dl");
    expect(html).toContain("人口");
    // 6 桁以上の値はランキングのページと同じ表示単位に寄せる (2026-11-14。旧: 1,157,000人)
    expect(html).toContain("115.7");
    expect(html).toContain("万人");
    expect(html).not.toContain("1,157,000");
    expect(html).toContain("31位");
    expect(html.match(/border-card-outline/g)).toHaveLength(1);
    // スマホの幅でも 2 列 (2026-11-14)
    expect(html).toContain("grid-cols-2");
    expect(html).not.toContain("grid-cols-1");
    // 1 枚でも 4 列の 1 マスの幅にそろえる (2026-10-29「幅を 4 列にそろえる」)
    expect(html).toContain("@md:grid-cols-4");
  });

  // 2026-09-25 UI 全面点検: 県のページの数値タイルが「113,685,917百万円」と書いていた (UNIT-NOTATION-FORMAT-01)。
  // 値と比較の値 (全国の値・47 都道府県平均) は同じタイルの中で 1 つの単位にそろえる
  it("桁の多い金額を表示単位に寄せ、比較の値も同じ単位で書く", () => {
    const html = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={[{ rankingKey: "gdp-test", shortLabel: "県内総生産", compareNationalAvg: true }]}
        databook={
          {
            metrics: {
              "gdp-test": { value: 113_685_917, rank: 1, unit: "百万円", year: "2021年度", nationalAvg: 12_345_678, nationalAvgKind: "prefecture-mean" },
            },
          } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"]
        }
      />,
    );
    expect(html).toContain("113.7");
    expect(html).toContain("兆円");
    expect(html).toContain("47都道府県平均 12.3兆円");
    expect(html).not.toContain("百万円");
  });

  it("割合や小さい値は今までどおりの桁で書き、単位の表記だけ半角にする", () => {
    const html = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={[{ rankingKey: "rate-test", shortLabel: "高齢化率", compareNationalAvg: true }]}
        databook={
          {
            metrics: {
              "rate-test": { value: 29.12, rank: 20, unit: "％", year: "2024年", nationalAvg: 28.6, nationalAvgKind: "national" },
            },
          } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"]
        }
      />,
    );
    expect(html).toContain("29.1");
    expect(html).toContain("全国 28.6%");
    expect(html).not.toContain("％");
  });

  it("本文幅844pxで4列指定が発動する", () => {
    const metrics = [
      metric("a", "A"),
      metric("b", "B"),
      metric("c", "C"),
      metric("d", "D"),
    ];
    const html = renderToStaticMarkup(
      <RankedKpiGrid metrics={metrics} databook={null} />,
    );

    expect(html).toContain("@md:grid-cols-4");
    expect(html).not.toContain("@md:grid-cols-3");
  });

  // 2026-09-24 週次 UI 検査: 値の無い指標が「—」の箱で並び、最終行の空きマスが灰色の箱に見えた。
  it("観測値の無い指標は項目ごと出さない", () => {
    const html = renderToStaticMarkup(
      <RankedKpiGrid
        metrics={[metric("population", "人口"), metric("crime-rate", "犯罪率")]}
        databook={databook}
      />,
    );
    expect(html).toContain("人口");
    expect(html).not.toContain("犯罪率");
    expect(html).not.toContain("—");
  });

  // 数値タイルの格子 (StatTileGrid): 列の数は本文の幅で 2 → 4 列 (3 列は使わない。スマホの幅でも 2 列。2026-11-14)。最終行の空きマスは
  // 幅ごとに白いセルで埋める (線の格子は空きマスが灰色に見えるため)。
  it("指標の数だけ数値タイルを数値タイルの格子に並べ、最終行の空きマスは幅ごとに白いセルで埋める", () => {
    const keys = ["a", "b", "c", "d", "e"];
    const full = {
      metrics: Object.fromEntries(
        keys.map((k) => [k, { value: 1, rank: 1, unit: "人", nationalAvg: 0 }]),
      ),
    } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"];
    const html = renderToStaticMarkup(
      <RankedKpiGrid metrics={keys.map((k) => metric(k, k.toUpperCase()))} databook={full} />,
    );
    expect(html.match(/data-slot-kind="stat-tile"/g)).toHaveLength(5);
    expect(html).toContain('data-slot-kind="stat-tile-grid"');
    // 5 枚: 2 列では空きマス 1、4 列では 3。2 列の幅では 1 つだけ、4 列の幅では 3 つ見せる
    const fillers = [...html.matchAll(/<div aria-hidden="true" data-cell="flush" class="([^"]*)"/g)].map((m) => m[1]);
    expect(fillers).toHaveLength(3);
    expect(fillers[0].split(" ")).toEqual(expect.arrayContaining(["block", "@md:block"]));
    expect(fillers[0].split(" ")).not.toContain("hidden");
    for (const className of fillers.slice(1)) {
      expect(className.split(" ")).toEqual(expect.arrayContaining(["hidden", "@md:block"]));
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
    expect(withAvg).toMatch(/2023年 ・ 47都道府県平均 260\.0万人/);
    const official = {
      metrics: {
        population: { value: 1_157_000, rank: 31, year: "2023年", unit: "人", nationalAvg: 2_660_000, nationalAvgKind: "national" },
      },
    } as unknown as Parameters<typeof RankedKpiGrid>[0]["databook"];
    const withNational = renderToStaticMarkup(
      <RankedKpiGrid metrics={[{ ...metric("population", "人口"), compareNationalAvg: true }]} databook={official} />,
    );
    expect(withNational).toMatch(/2023年 ・ 全国 266\.0万人/);
  });
});

