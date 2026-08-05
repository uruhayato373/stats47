import { describe, expect, it } from "vitest";

import {
  checkCombinationUnitsAgree,
  checkMoneyUnitScale,
  moneyUnitExponent,
} from "../money-unit";

/**
 * 金額単位ラダー判定の感度と非感度を両方向で固定する。
 *
 * 全 PASS は「ゲートが何も見ていない」状態と区別がつかないので、
 * (a) 正当なデータで発火しないこと (b) 実際の欠陥で発火すること を両方テストする。
 */

describe("moneyUnitExponent", () => {
  it("金額族を 10 の指数へ写す", () => {
    expect(moneyUnitExponent("円")).toBe(0);
    expect(moneyUnitExponent("千円")).toBe(3);
    expect(moneyUnitExponent("万円")).toBe(4);
    expect(moneyUnitExponent("百万円")).toBe(6);
    expect(moneyUnitExponent("億円")).toBe(8);
  });

  it("前後の空白を無視する (e-Stat の @unit は空白を含むことがある)", () => {
    expect(moneyUnitExponent(" 千円 ")).toBe(3);
  });

  it("金額族外は null (倍率の有無が文字列から確定できないため判定しない)", () => {
    // ★「十人」は倍率つきだが金額ではない。同型のバグは起こりうるが族を広げない
    for (const u of ["人", "十人", "％", "%", "時間", "歳", "年", "件", "", "  "]) {
      expect(moneyUnitExponent(u), u).toBeNull();
    }
    expect(moneyUnitExponent(null)).toBeNull();
    expect(moneyUnitExponent(undefined)).toBeNull();
  });
});

describe("checkMoneyUnitScale — 発火しないケース", () => {
  it("原単位と同じ unit を宣言なしで使う (nurse-salary の実形)", () => {
    // 賃金構造基本統計 tab10 @unit=千円 / config unit=千円 / 変換なし
    const v = checkMoneyUnitScale({
      sourceUnit: "千円",
      configUnit: "千円",
      declaredScale: 1,
    });
    expect(v.kind).toBe("ok");
  });

  it("千円 → 万円 を 0.1 で宣言してあれば通る (本修正後の年収系)", () => {
    const v = checkMoneyUnitScale({
      sourceUnit: "千円",
      configUnit: "万円",
      declaredScale: 0.1,
    });
    expect(v).toEqual({ kind: "ok", expectedScale: 0.1 });
  });

  it("円 → 百万円 (10^-6) も浮動小数誤差で落ちない", () => {
    const v = checkMoneyUnitScale({
      sourceUnit: "円",
      configUnit: "百万円",
      declaredScale: 1e-6,
    });
    expect(v.kind).toBe("ok");
  });

  it("金額族外はスキップする — 誤検知を出さないことが最優先", () => {
    expect(
      checkMoneyUnitScale({ sourceUnit: "十人", configUnit: "人", declaredScale: 1 }).kind,
    ).toBe("skip");
    expect(
      checkMoneyUnitScale({ sourceUnit: "千円", configUnit: "世帯", declaredScale: 1 }).kind,
    ).toBe("skip");
  });

  it("原単位が取れなければスキップ (@unit を持たない表がある)", () => {
    for (const s of [null, undefined, "", "   "]) {
      expect(
        checkMoneyUnitScale({ sourceUnit: s, configUnit: "万円", declaredScale: 1 }).kind,
        String(s),
      ).toBe("skip");
    }
  });
});

describe("checkMoneyUnitScale — 発火するケース", () => {
  it("千円の値に万円ラベルを付けた実際の欠陥を検出する", () => {
    // 2026-08-05 に見つかった年収系 39 件の状態 (修正前)
    const v = checkMoneyUnitScale({
      sourceUnit: "千円",
      configUnit: "万円",
      declaredScale: 1,
    });
    expect(v).toEqual({
      kind: "mismatch",
      sourceUnit: "千円",
      configUnit: "万円",
      declaredScale: 1,
      expectedScale: 0.1,
    });
  });

  it("換算の向きを逆にした場合も検出する", () => {
    const v = checkMoneyUnitScale({
      sourceUnit: "千円",
      configUnit: "万円",
      declaredScale: 10,
    });
    expect(v.kind).toBe("mismatch");
  });

  it("桁が 1 つずれた宣言を検出する", () => {
    const v = checkMoneyUnitScale({
      sourceUnit: "円",
      configUnit: "万円",
      declaredScale: 0.001, // 正しくは 0.0001
    });
    expect(v.kind).toBe("mismatch");
    if (v.kind === "mismatch") expect(v.expectedScale).toBeCloseTo(1e-4, 12);
  });
});

describe("checkCombinationUnitsAgree", () => {
  it("同一単位の線形結合は通る (年収 = tab08 千円 ×12 + tab12 千円 ×1)", () => {
    expect(checkCombinationUnitsAgree(["千円", "千円"])).toEqual({ kind: "ok" });
  });

  it("単位が混ざる結合は検出する (千円と十人は足せない)", () => {
    expect(checkCombinationUnitsAgree(["千円", "十人"])).toEqual({
      kind: "mismatch",
      units: ["千円", "十人"],
    });
  });

  it("比較できる単位が 2 つ未満ならスキップする", () => {
    expect(checkCombinationUnitsAgree(["千円"]).kind).toBe("skip");
    expect(checkCombinationUnitsAgree([null, "千円"]).kind).toBe("skip");
    expect(checkCombinationUnitsAgree([]).kind).toBe("skip");
  });
});
