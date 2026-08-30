import { describe, expect, it } from "vitest";

import {
  buildDerivedAdditiveJapanSeriesRows,
  buildJapanSeriesRows,
} from "../build-japan-series";

function prefectureRows(valueFor: (prefectureNumber: number) => number | null) {
  return Array.from({ length: 47 }, (_, index) => {
    const prefectureNumber = index + 1;
    return {
      areaCode: `${String(prefectureNumber).padStart(2, "0")}000`,
      yearCode: "2024",
      yearName: "2024年",
      value: valueFor(prefectureNumber),
      unit: "駅",
    };
  });
}

describe("buildJapanSeriesRows", () => {
  it("正常系: 実数値の年が全て rows に入る", () => {
    const result = buildJapanSeriesRows(
      [
        { yearCode: "2020", yearName: "2020年", value: 15.31, unit: "校" },
        { yearCode: "2021", yearName: "2021年", value: 15.2, unit: "校" },
      ],
      "校",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([
        { yearCode: "2020", yearName: "2020年", value: 15.31, unit: "校" },
        { yearCode: "2021", yearName: "2021年", value: 15.2, unit: "校" },
      ]);
      expect(result.rejectedYears).toEqual([]);
    }
  });

  it("★実例の回帰固定: 全年が value=null (e-Stat の '-' が変換で null 化) なら 0 行かつ理由付きで拒否 (推測で埋めない)", () => {
    // in-pref-university-entrance-ratio-by-highschool-origin の実例 (2026-08-20 実測)。
    const nationalRows = Array.from({ length: 42 }, (_, i) => ({
      yearCode: `${1980 + i}`,
      yearName: `${1980 + i}年度`,
      value: null,
      unit: "％",
    }));
    const result = buildJapanSeriesRows(nationalRows, "％");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([]);
      expect(result.rejectedYears).toHaveLength(42);
    }
  });

  it("00000 行が1件も無ければ ok:false で理由を返す", () => {
    const result = buildJapanSeriesRows([], "校");
    expect(result).toEqual({ ok: false, reason: expect.stringContaining("00000") });
  });

  it("★単位不一致は全体を停止する (1年だけ捨てて残りを書かない)", () => {
    const result = buildJapanSeriesRows(
      [
        { yearCode: "2020", yearName: "2020年", value: 100, unit: "館" },
        { yearCode: "2021", yearName: "2021年", value: 200, unit: "千円" }, // 不一致
      ],
      "館",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("単位不一致");
    }
  });

  it("一部の年だけ欠測 (null) なら、その年だけ rejectedYears に回り他の年は活かす", () => {
    const result = buildJapanSeriesRows(
      [
        { yearCode: "2019", yearName: "2019年", value: 10, unit: "館" },
        { yearCode: "2020", yearName: "2020年", value: null, unit: "館" },
        { yearCode: "2021", yearName: "2021年", value: 12, unit: "館" },
      ],
      "館",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows.map((r) => r.yearCode)).toEqual(["2019", "2021"]);
      expect(result.rejectedYears.map((r) => r.yearCode)).toEqual(["2020"]);
    }
  });

  it("★全半角ゆれ (NFKC) は不一致とみなさない (WP6 実例回帰: road-total-length-with-expressway)", () => {
    // config.unit='km' (半角) / e-Stat unit='ｋｍ' (全角、2005年) が誤って
    // unsupported 判定されていた実例 (2026-08-20 WP6 実測)。
    const result = buildJapanSeriesRows(
      [
        { yearCode: "2005", yearName: "2005年度", value: 100, unit: "ｋｍ" },
        { yearCode: "2006", yearName: "2006年度", value: 105, unit: "km" },
      ],
      "km",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rejectedYears).toEqual([]);
      // 出力の unit は config 側 (expectedUnit) の表記に統一される
      expect(result.rows.every((r) => r.unit === "km")).toBe(true);
    }
  });

  it("NFKC 正規化しても異なる単位 (プレースホルダ '‐' 等) は引き続き不一致として停止する", () => {
    const result = buildJapanSeriesRows(
      [{ yearCode: "1980", yearName: "1980年", value: null, unit: "‐" }],
      "人口千対",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("単位不一致");
    }
  });

  it("unit 未指定 (undefined) の行は不一致とみなさない (e-Stat が unit を返さない場合の緩和)", () => {
    const result = buildJapanSeriesRows(
      [{ yearCode: "2020", yearName: "2020年", value: 10 }],
      "館",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([{ yearCode: "2020", yearName: "2020年", value: 10, unit: "館" }]);
    }
  });
});

describe("buildDerivedAdditiveJapanSeriesRows", () => {
  it("47都道府県の有限値を同一年で合計する", () => {
    const result = buildDerivedAdditiveJapanSeriesRows(
      prefectureRows((prefectureNumber) => prefectureNumber),
      "駅",
    );

    expect(result).toEqual({
      ok: true,
      rows: [{ yearCode: "2024", yearName: "2024年", value: 1128, unit: "駅" }],
      rejectedYears: [],
    });
  });

  it("1県でも欠測ならその年を0埋めせず拒否する", () => {
    const result = buildDerivedAdditiveJapanSeriesRows(
      prefectureRows((prefectureNumber) => (prefectureNumber === 47 ? null : 1)),
      "駅",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([]);
      expect(result.rejectedYears[0]?.reason).toContain("46/47");
    }
  });

  it("都道府県コード重複はartifact全体を停止する", () => {
    const rows = prefectureRows(() => 1);
    rows[46] = { ...rows[46], areaCode: "01000" };

    const result = buildDerivedAdditiveJapanSeriesRows(rows, "駅");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("重複");
  });

  it("単位不一致はartifact全体を停止する", () => {
    const rows = prefectureRows(() => 1);
    rows[0] = { ...rows[0], unit: "人" };

    const result = buildDerivedAdditiveJapanSeriesRows(rows, "駅");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("単位不一致");
  });
});
