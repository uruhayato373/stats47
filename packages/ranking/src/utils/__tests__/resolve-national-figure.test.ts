import { describe, expect, it } from "vitest";

import { resolveNationalFigure } from "../resolve-national-figure";

/** 47 県分の行。県 i の値は valueOf(i) */
const makePrefectures = (valueOf: (i: number) => number) =>
  Array.from({ length: 47 }, (_, i) => ({
    areaCode: `${String(i + 1).padStart(2, "0")}000`,
    value: valueOf(i),
  }));

describe("resolveNationalFigure", () => {
  // 率の指標: 全国値は県値の合計とも単純平均とも一致しない (人口で重み付けされるため)
  const rateRows = makePrefectures((i) => 10 + i); // 単純平均 = 33
  const rateWithNational = [{ areaCode: "00000", value: 30.5 }, ...rateRows];

  it("公表の全国値 (00000) があれば単純平均ではなくそれを「全国値」として返す", () => {
    const figure = resolveNationalFigure(rateWithNational);
    expect(figure).toEqual({
      value: 30.5,
      kind: "national-value",
      label: "全国値",
      prefectureCount: null,
    });
  });

  it("全国値が 47 県の合計と一致する総数指標は「全国計」と呼び、平均として扱わない", () => {
    const totalRows = makePrefectures(() => 100); // 合計 4,700
    const figure = resolveNationalFigure([{ areaCode: "00000", value: 4700 }, ...totalRows]);
    expect(figure?.kind).toBe("national-total");
    expect(figure?.label).toBe("全国計");
    expect(figure?.value).toBe(4700);
  });

  it("全国値が無ければ単純平均を「47都道府県の単純平均」として返す", () => {
    const figure = resolveNationalFigure(rateRows);
    expect(figure).toEqual({
      value: 33,
      kind: "simple-mean",
      label: "47都道府県の単純平均",
      prefectureCount: 47,
    });
  });

  it("mutation: 同じデータから 00000 行だけを除くとラベルが全国値から単純平均に反転する", () => {
    const before = resolveNationalFigure(rateWithNational);
    const after = resolveNationalFigure(
      rateWithNational.filter((row) => row.areaCode !== "00000"),
    );
    expect(before?.label).toBe("全国値");
    expect(after?.label).toBe("47都道府県の単純平均");
    expect(after?.value).not.toBe(before?.value);
  });

  it("2 桁正規化後の全国コード 00 も全国行として扱う", () => {
    const rows = [{ areaCode: "00", value: 30.5 }, ...rateRows];
    expect(resolveNationalFigure(rows)?.kind).toBe("national-value");
  });

  it("県がそろわない年は母数を実数で書き、値が null の全国行は無視する", () => {
    const rows = [
      { areaCode: "00000", value: null },
      { areaCode: "13000", value: 100 },
      { areaCode: "14000", value: 200 },
    ];
    expect(resolveNationalFigure(rows)).toMatchObject({
      value: 150,
      kind: "simple-mean",
      label: "2都道府県の単純平均",
    });
  });

  it("市区町村コードは県の母数に含めない", () => {
    const rows = [
      { areaCode: "13000", value: 100 },
      { areaCode: "13101", value: 99999 },
    ];
    expect(resolveNationalFigure(rows)?.value).toBe(100);
  });

  it("値が 1 つも無ければ null", () => {
    expect(resolveNationalFigure([])).toBeNull();
  });
});
