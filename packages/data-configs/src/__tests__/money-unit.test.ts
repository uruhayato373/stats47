import { describe, expect, it } from "vitest";

import {
  checkCombinationUnitsAgree,
  checkMoneyUnitScale,
  moneyUnitExponent,
  resolvePinnedSourceUnit,
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

describe("resolvePinnedSourceUnit", () => {
  it("pin された軸が 1 つだけ単位を持つなら確定する (社会・人口統計体系の実形)", () => {
    // tab(観測値) は単位を持たず cat01(指標) だけが持つ。cat01 を 1 コードに pin してあるので確定する
    expect(resolvePinnedSourceUnit([null, "千円"])).toEqual({ kind: "ok", unit: "千円" });
  });

  it("同じ単位が複数の軸から取れても確定する", () => {
    expect(resolvePinnedSourceUnit(["百万円", "百万円"])).toEqual({
      kind: "ok",
      unit: "百万円",
    });
  });

  it("前後の空白を無視する (e-Stat の @unit は空白を含むことがある)", () => {
    expect(resolvePinnedSourceUnit([" 千円 "])).toEqual({ kind: "ok", unit: "千円" });
  });

  it("異なる単位が混ざるときは決めない — 推測で選ぶと 10^k ズレを作り直す", () => {
    expect(resolvePinnedSourceUnit(["千円", "％"])).toEqual({
      kind: "ambiguous",
      units: ["千円", "％"],
    });
  });

  it("どの軸も単位を宣言していなければ none (取れなかったことを整合に混ぜない)", () => {
    expect(resolvePinnedSourceUnit([]).kind).toBe("none");
    expect(resolvePinnedSourceUnit([null, undefined, ""]).kind).toBe("none");
  });

  it("解決した単位はそのまま checkMoneyUnitScale の入力になる (実際の欠陥 2 件を再現)", () => {
    // 0000010107 書籍・雑誌小売業年間商品販売額: 原単位 百万円 に対し config は 円
    const resolved = resolvePinnedSourceUnit([null, "百万円"]);
    expect(resolved.kind).toBe("ok");
    const v = checkMoneyUnitScale({
      sourceUnit: resolved.kind === "ok" ? resolved.unit : null,
      configUnit: "円",
      declaredScale: 1,
    });
    expect(v.kind).toBe("mismatch");
    if (v.kind === "mismatch") expect(v.expectedScale).toBe(1_000_000);
  });
});
