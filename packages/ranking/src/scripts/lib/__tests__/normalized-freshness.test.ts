import { describe, expect, it } from "vitest";

import { checkFreshness } from "../normalized-freshness";

const NOW = Date.parse("2026-11-14T00:00:00.000Z");
const KEY = "sample-metric";
const ARTIFACT = "values-per-population.json";

describe("checkFreshness (正規化 snapshot の鮮度)", () => {
  /**
   * values.json の generatedAt は「中身が最後に変わった生成の時刻」(前回配信と同じ中身なら引き継ぐ)。
   * 年次の統計は数か月変わらないので、毎週作り直される正規化 snapshot のほうが新しいのが正常な状態。
   * 差の絶対値で見ると、中身が 8 日変わらなかった指標がすべて鮮度違反になる。
   */
  it("values.json より正規化 snapshot のほうが新しいのは違反にしない", () => {
    expect(
      checkFreshness(KEY, ARTIFACT, "2026-06-01T03:00:00.000Z", "2026-11-09T03:00:00.000Z", NOW),
    ).toEqual([]);
  });

  it("values.json が変わったのに正規化 snapshot が 8 日を超えて古いままなら relative で違反にする", () => {
    expect(
      checkFreshness(KEY, ARTIFACT, "2026-11-09T03:00:00.000Z", "2026-10-30T03:00:00.000Z", NOW),
    ).toEqual([{ key: KEY, artifact: ARTIFACT, ageDays: 10, kind: "relative" }]);
  });

  it("正規化 snapshot が 8 日以内の古さなら違反にしない", () => {
    expect(
      checkFreshness(KEY, ARTIFACT, "2026-11-09T03:00:00.000Z", "2026-11-02T03:00:00.000Z", NOW),
    ).toEqual([]);
  });

  it("正規化 snapshot が現在から 30 日を超えて古ければ、values.json も同じだけ古くても absolute で違反にする", () => {
    expect(
      checkFreshness(KEY, ARTIFACT, "2026-09-01T03:00:00.000Z", "2026-09-01T02:00:00.000Z", NOW),
    ).toEqual([{ key: KEY, artifact: ARTIFACT, ageDays: 74, kind: "absolute" }]);
  });

  it("時刻が無い・読めないときは relative を判定しない", () => {
    expect(checkFreshness(KEY, ARTIFACT, undefined, "2026-11-09T03:00:00.000Z", NOW)).toEqual([]);
    expect(checkFreshness(KEY, ARTIFACT, "壊れた値", "2026-11-09T03:00:00.000Z", NOW)).toEqual([]);
  });
});
