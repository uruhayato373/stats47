import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GenderPairedKpiGrid } from "../GenderPairedKpiGrid";

/**
 * 男女 KPI の可読性契約。
 *
 * 経緯: 2026-08-05 の Lighthouse mobile 監査で、固定色 `#3b82f6` (白地 contrast 3.68) と
 * `#ec4899` (同 3.53) が本文文字に必要な 4.5:1 を満たしていなかった。単色では light と
 * dark の両立が不可能 (濃色は dark 地で 2 前後まで落ちる) なため、light / dark で
 * 明度を分ける。生 hex の任意値クラスへ戻す変更はここで落ちる。
 *
 * 2026-10-28: 男女それぞれを数値タイル (StatTile) 1 枚にし、県データブックの他の数値と同じ
 * RankedValueGrid の線の格子で並べる (旧: 1 枚の表面に男 | 項目名 | 女 の行)。
 */

const PAIRS = [
  { label: "平均初婚年齢", maleKey: "marriage-age-male", femaleKey: "marriage-age-female" },
];

const DATABOOK = {
  metrics: {
    "marriage-age-male": { value: 31.2, rank: 12, unit: "歳", year: "2020年" },
    "marriage-age-female": { value: 29.6, rank: 20, unit: "歳", year: "2022年" },
  },
  // 本テストが読むのは metrics だけ
} as unknown as Parameters<typeof GenderPairedKpiGrid>[0]["databook"];

function markup() {
  return renderToStaticMarkup(
    <GenderPairedKpiGrid
      pairs={PAIRS as unknown as Parameters<typeof GenderPairedKpiGrid>[0]["pairs"]}
      databook={DATABOOK}
    />,
  );
}

describe("GenderPairedKpiGrid", () => {
  it("生 hex の任意値クラスを使わない", () => {
    const html = markup();
    expect(html).not.toContain("#3b82f6");
    expect(html).not.toContain("#ec4899");
    expect(html).not.toMatch(/text-\[#/);
  });

  it("light / dark それぞれで 4.5:1 を満たす明度クラスを当てる", () => {
    const html = markup();
    expect(html).toContain("text-blue-700");
    expect(html).toContain("dark:text-blue-400");
    expect(html).toContain("text-pink-700");
    expect(html).toContain("dark:text-pink-400");
  });

  it("男女を色以外でも判別できる (WCAG 1.4.1)", () => {
    const html = markup();
    expect(html).toContain("男性");
    expect(html).toContain("女性");
  });

  it("値と全国順位を維持する", () => {
    const html = markup();
    expect(html).toContain("31.2");
    expect(html).toContain("29.6");
    expect(html).toContain("12位");
    expect(html).toContain("20位");
  });

  it("男女を 1 枚ずつの数値タイルにし、線の格子に 2 列で並べる (男性が左)", () => {
    const html = markup();
    expect(html.match(/data-slot-kind="stat-tile"/g)).toHaveLength(2);
    expect(html).toContain('data-slot="panel-grid"');
    expect(html).toContain("@sm:grid-cols-2");
    expect(html.indexOf("男性")).toBeLessThan(html.indexOf("女性"));
  });

  // 2026-09-25 UI 全面点検: 数値だけではいつの値か分からなかった。年は男女それぞれのタイルに出す
  it("年を男女それぞれに添える (年が違っても取り違えない)", () => {
    const html = markup();
    expect(html).toContain("2020年");
    expect(html).toContain("2022年");
  });
});
