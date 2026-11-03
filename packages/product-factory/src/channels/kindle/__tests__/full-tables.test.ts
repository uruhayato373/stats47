import { describe, expect, it } from "vitest";

import { fullTableMarkdown, insertBeforeSources, tableFromFigureData, yearSuffixOf } from "../full-tables";

const PREFS = Array.from({ length: 47 }, (_, i) => `県${String(i + 1).padStart(2, "0")}`);

describe("full-tables (章末の全 47 都道府県の表)", () => {
  it("図の元データから 47 県の表を作り、同じ値は同じ順位にする", () => {
    const data = { label: "かに消費支出額", year: "2024", unit: "円", rankingKey: "crab-consumption-expenditure",
      data: PREFS.map((name, i) => ({ areaName: name, value: i === 2 ? 5000 : 5000 - i })) };
    const table = tableFromFigureData(data, null);
    expect(table?.rows).toHaveLength(47);
    const md = fullTableMarkdown(table!);
    expect(md).toContain("### 全47都道府県の値：かに消費支出額（2024年・円）");
    expect(md).toContain("県庁所在市（東京都は区部）");
    expect(md).toContain("| 1 | 県01 | 5,000 |");
    expect(md).toContain("| 1 | 県03 | 5,000 |");
    expect(md).toContain("| 3 | 県02 | 4,999 |");
    // 12 行ずつ 4 つの表に分け、2 つ目からは何の表のつづきかと単位を書く (Kindle は表の見出し行を繰り返さない)
    expect(md.match(/\| 順位 \| 都道府県 \| 値（円） \|/g)).toHaveLength(4);
    expect(md).toContain("#### かに消費支出額（2024年・円）のつづき・13〜24番目");
    expect(md).toContain("#### かに消費支出額（2024年・円）のつづき・37〜47番目");
  });

  it("47 県そろわない・年が無い・県名が重複するデータは表にしない (図と別の値を並べない)", () => {
    expect(tableFromFigureData({ label: "x", year: "2024", data: PREFS.slice(0, 10).map((n) => ({ areaName: n, value: 1 })) }, null)).toBeNull();
    expect(tableFromFigureData({ label: "x", data: PREFS.map((n) => ({ areaName: n, value: 1 })) }, null)).toBeNull();
    expect(tableFromFigureData({ label: "x", year: "2024", data: [...PREFS.slice(1), "県02"].map((n) => ({ areaName: n, value: 1 })) }, null)).toBeNull();
    // 年・ラベルは source.json で補える
    expect(tableFromFigureData({ data: PREFS.map((n) => ({ areaName: n, value: 1 })) }, { year: "2023", label: "y", unit: "%" })?.year).toBe("2023");
  });

  it("表は本文の出典の見出しの前に入れ、見出しが無ければ末尾に足す", () => {
    expect(insertBeforeSources("本文\n\n## データ出典\n\n- e-Stat", "### 表")).toBe("本文\n\n### 表\n\n## データ出典\n\n- e-Stat");
    expect(insertBeforeSources("本文", "### 表")).toBe("本文\n\n### 表\n");
    expect(insertBeforeSources("本文", "")).toBe("本文");
  });
  it("指標の定義が年度なら見出しも年度にする (書籍版で年度に直した図と食い違わせない)", () => {
    expect(yearSuffixOf("active-job-opening-ratio")).toBe("年度");
    expect(yearSuffixOf("crab-consumption-expenditure")).toBe("年");
    expect(yearSuffixOf(null)).toBe("年");
  });
});

describe("normalizeUnit", () => {
  it("全角英数を半角に、外側の括弧を外す", async () => {
    const { normalizeUnit } = await import("../full-tables");
    expect(normalizeUnit("Ｍｗｈ")).toBe("Mwh");
    expect(normalizeUnit("（件/百万時間）")).toBe("件/百万時間");
    expect(normalizeUnit("（全国=100）")).toBe("全国=100");
    expect(normalizeUnit("円")).toBe("円");
  });
});
