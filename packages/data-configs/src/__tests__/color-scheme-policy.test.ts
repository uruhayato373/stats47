/**
 * 配色決定規則の順序を固定する (2026-07-31)。
 *
 * 順序が入れ替わると「既存 255 件の色が変わる」「極性を入れても何も変わらない」の
 * どちらかが起きる。どちらも見た目には分かりにくいので、順序そのものをテストで固定する。
 */
import { describe, expect, it } from "vitest";

import { resolveColorScheme } from "../color-scheme-policy";
import { METRIC_POLARITY } from "../metric-polarity";

// 挿入順ではなく「higher-is-worse であること」で選ぶ (先頭に別の極性が入っても壊れない)
const worseKey = Object.keys(METRIC_POLARITY).find(
  (k) => METRIC_POLARITY[k].polarity === "higher-is-worse",
)!;

describe("resolveColorScheme の決定順序", () => {
  it("1. Blues 以外の明示指定は最優先 (既存 255 件を壊さない)", () => {
    expect(resolveColorScheme({ key: "x", explicit: "interpolateGreens" })).toEqual({
      scheme: "interpolateGreens",
      reason: "explicit",
    });
    // 短縮名でも同じ結果になる (表記の非対称を持ち込まない)
    expect(resolveColorScheme({ key: "x", explicit: "Greens" }).scheme).toBe("interpolateGreens");
  });

  it("★明示 Blues は「選択」として扱わない (全 config に焼かれた既定値だから)", () => {
    // Blues を deliberate 扱いすると極性を入れても何も変わらず、カタログが飾りになる
    const d = resolveColorScheme({ key: worseKey, explicit: "interpolateBlues" });
    expect(d.scheme).toBe("interpolateReds");
    expect(d.reason).toBe("polarity");
  });

  it("2. diverging は明示 Blues より優先される", () => {
    expect(
      resolveColorScheme({ key: "x", explicit: "interpolateBlues", colorSchemeType: "diverging" }),
    ).toEqual({ scheme: "interpolateRdBu", reason: "diverging" });
  });

  it("3. 極性 higher-is-worse → Reds", () => {
    expect(resolveColorScheme({ key: worseKey }).reason).toBe("polarity");
    expect(resolveColorScheme({ key: worseKey }).scheme).toBe("interpolateReds");
  });

  it("4. category の topical 色 (良し悪しを主張しない配色)", () => {
    expect(resolveColorScheme({ key: "unknown-key", category: "agriculture" })).toEqual({
      scheme: "interpolateGreens",
      reason: "category",
    });
    expect(resolveColorScheme({ key: "unknown-key", category: "landweather" }).scheme).toBe(
      "interpolateOranges",
    );
  });

  it("5. 何も無ければ既定 Blues", () => {
    expect(resolveColorScheme({ key: "unknown-key" })).toEqual({
      scheme: "interpolateBlues",
      reason: "default",
    });
    // 極性が同居しない category は topical 色を持たない (推定しない)
    expect(resolveColorScheme({ key: "unknown-key", category: "safetyenvironment" }).reason).toBe(
      "default",
    );
  });

  it("未知のスキーム名は明示扱いしない (既定へ落とす)", () => {
    expect(resolveColorScheme({ key: "unknown-key", explicit: "interpolateNope" }).reason).toBe(
      "default",
    );
  });

  it("★mutation: 順序 1 と 3 を入れ替えると既存の明示指定が上書きされる", () => {
    // 極性を明示より先に見た場合の姿 (= 既存 255 件の色が変わる)
    const wrongOrder = (key: string, explicit: string) =>
      METRIC_POLARITY[key] ? "interpolateReds" : explicit;
    expect(wrongOrder(worseKey, "interpolateGreens")).toBe("interpolateReds");
    // 正しい順序では明示が勝つ
    expect(resolveColorScheme({ key: worseKey, explicit: "interpolateGreens" }).scheme).toBe(
      "interpolateGreens",
    );
  });
});
