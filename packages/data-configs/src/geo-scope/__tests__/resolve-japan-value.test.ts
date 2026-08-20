import { describe, expect, it } from "vitest";

import { resolveJapanValue, type AreaValueRow } from "../resolve-japan-value";
import { JAPAN_NATIONAL_AREA_CODE } from "../types";

/**
 * `resolveJapanValue` の回帰test (GEO-SCOPE-SEPARATION-01 WP1)。
 *
 * doc 43 §9 の陰性対照 (総人口の47県平均が日本人口にならない / 率の47県平均が全国率に
 * ならない) を、この pure resolver 単体で固定する。unsupported / unknown は
 * 常に失敗を返し、値 (0 を含む) を作らないことも同時に固定する。
 */

/** 47 都道府県コード列 (01000〜47000)。 */
const PREF_CODES = Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);

function prefRows(values: number[]): AreaValueRow[] {
  return PREF_CODES.map((areaCode, i) => ({ areaCode, value: values[i] ?? null }));
}

describe("resolveJapanValue", () => {
  describe("official", () => {
    it("00000 行があればその値を採用する", () => {
      const rows: AreaValueRow[] = [
        { areaCode: JAPAN_NATIONAL_AREA_CODE, value: 123_802_000 },
        ...prefRows(PREF_CODES.map(() => 1_000_000)),
      ];
      const result = resolveJapanValue(rows, { status: "official" });
      expect(result).toEqual({ ok: true, value: 123_802_000, sourceMode: "official" });
    });

    it("★総人口の47県平均が日本人口にならない: 00000 行が無いとき47県平均へ暗黙に落ちない", () => {
      // 47 県の値を人口っぽい実数にする (合計 123,802,000 相当 / 47 = 平均 2,634,085)。
      // 平均は日本の総人口とは全く違う値になるため、resolver が黙ってこれを採用してはならない。
      const rows = prefRows(PREF_CODES.map(() => 2_634_085));
      const result = resolveJapanValue(rows, { status: "official" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("00000");
      }
    });

    it("00000 行の値が非有限数なら失敗する (NaN/Infinity を全国値にしない)", () => {
      const rows: AreaValueRow[] = [{ areaCode: JAPAN_NATIONAL_AREA_CODE, value: Number.NaN }];
      const result = resolveJapanValue(rows, { status: "official" });
      expect(result.ok).toBe(false);
    });
  });

  describe("derived-additive", () => {
    it("47県全件が揃えば合計を返す", () => {
      const rows = prefRows(PREF_CODES.map(() => 100));
      const result = resolveJapanValue(rows, {
        status: "derived-additive",
        recipeKey: "sum-47-pref",
      });
      expect(result).toEqual({ ok: true, value: 4700, sourceMode: "derived-additive" });
    });

    it("1県でも欠測があれば部分合計を返さず失敗する (漏れなく覆う、が満たせない)", () => {
      const values = PREF_CODES.map(() => 100);
      values[10] = undefined as unknown as number; // 1 県だけ欠測
      const rows = prefRows(values);
      const result = resolveJapanValue(rows, {
        status: "derived-additive",
        recipeKey: "sum-47-pref",
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("derived-ratio", () => {
    it("★率の47県平均が全国率にならない: この汎用resolverは常に失敗を返す (専用recipeでのみ算出)", () => {
      // 47 県の率を単純平均すると全国率っぽい値が作れてしまうが、人口で加重されないため
      // 誤りである (doc 43 §4 rule 3)。resolveJapanValue はこの計算を一切持たない。
      const rows = prefRows(PREF_CODES.map(() => 29.3));
      const result = resolveJapanValue(rows, {
        status: "derived-ratio",
        recipeKey: "aging-rate",
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("unsupported", () => {
    it("★県固有指標 (unsupported) は理由付きで常に失敗し、0 を作らない", () => {
      const rows: AreaValueRow[] = [{ areaCode: JAPAN_NATIONAL_AREA_CODE, value: 0 }];
      const result = resolveJapanValue(rows, {
        status: "unsupported",
        reason: "都道府県固有の相対指標のため日本全体には適用できない",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("unsupported");
      }
    });
  });

  describe("unknown", () => {
    it("分類未確定 (unknown) は常に失敗する (推測で値を作らない)", () => {
      const rows: AreaValueRow[] = [{ areaCode: JAPAN_NATIONAL_AREA_CODE, value: 42 }];
      const result = resolveJapanValue(rows, { status: "unknown" });
      expect(result.ok).toBe(false);
    });
  });
});
