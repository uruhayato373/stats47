import { describe, expect, it } from "vitest";

import { adsenseCoverage } from "../../lib/server/revenue";

/**
 * 収益の計測範囲の AdSense 行は、週次 CSV (history.csv) の最新週が新しいときだけ「計測中」にする (CONTENT-FOLLOWUP-01)。
 * 以前は定数の "measured" を返していたので、週次の取得が止まってもゲート表の AdSense 行は通過のままだった。
 * 週次の取得は土曜に前の週 (月〜日) を記録するので、最新週の日曜から次の土曜の取得までは 13 日ある。
 */
describe("adsenseCoverage", () => {
  // 2026-W44 は 10-26 (月)〜11-01 (日)。11-07 (土) に記録され、次は 11-14 (土) に W45 が記録される
  const at = (iso: string) => Date.parse(`${iso}T12:00:00+09:00`);

  it("次の土曜の取得までは計測中のまま", () => {
    expect(adsenseCoverage("2026-W44", at("2026-11-07")).state).toBe("measured");
    expect(adsenseCoverage("2026-W44", at("2026-11-14")).state).toBe("measured");
  });

  it("土曜の取得が抜けて最新週が古くなったら未計測に戻し、最新週と止まっていることを書く", () => {
    const row = adsenseCoverage("2026-W44", at("2026-11-15"));
    expect(row.state).toBe("unmeasured");
    expect(row.note).toContain("2026-W44");
    expect(row.note).toContain("停止中");
  });

  it("週次 CSV が読めない・空なら未計測", () => {
    expect(adsenseCoverage(null, at("2026-11-14")).state).toBe("unmeasured");
    expect(adsenseCoverage("壊れた週", at("2026-11-14")).state).toBe("unmeasured");
  });
});
