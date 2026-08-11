/**
 * 正典 (TS) と鏡 (.mjs) のパリティテスト。
 *
 * ★二重実装のドリフトこそが 44 箇所の独立実装を生んだ原因。鏡は自動生成しているが、
 * 「生成器が壊れて古い鏡が残る」ことはありうるので、**両方に同じ入力を流して
 * 完全一致を確認する**。片方だけ直しても気づける状態を作る。
 *
 * .claude/scripts/** は素の node 実行のため TS を import できず鏡が必要
 * (svg-builder の gate test が svg-lint.mjs を import している前例と同じ形)。
 */
import { describe, expect, it } from "vitest";
// @ts-expect-error — 生成された鏡 (JS・型定義なし)。パリティ確認のため意図的に import する
import * as mirror from "../../../../../.claude/scripts/lib/unit-semantics.mjs";
import { KNOWN_UNIT_SAMPLES, conversionFactor, parseUnit, sameDimension } from "../unit-semantics";

/** 両実装に流す入力。実測語彙 + 解釈できない形 + 境界を混ぜる。 */
const UNITS: readonly (string | null | undefined)[] = [
  "円", "千円", "万円", "十万円", "百万円", "千万円", "億円", "兆円",
  "％", "%", "‰",
  "人", "千人", "万人", "人（人口10万対）", "人口千対", "人口10万対",
  "世帯", "件", "戸", "台", "店", "校", "所", "か所", "箇所", "施設", "事業所",
  "社", "園", "局", "棟", "冊", "頭", "胎", "学級", "加入", "延数", "人泊",
  "g", "kg", "t", "トン", "ml", "l", "km", "cm", "ha", "ｈａ", "m2", "ｍ2", "m3", "kl",
  "時間", "分", "日", "年", "歳", "℃", "指数", "（全国=100）",
  // 解釈できないもの (null が返ることの一致も見る)
  "学級･講座", "kg/日", "（件/百万時間）", "台/12h", "謎の単位", "", "  ",
  null, undefined,
];

describe("正典と鏡のパリティ", () => {
  it("★parseUnit の結果が完全一致する", () => {
    for (const u of UNITS) {
      expect({ input: u, result: mirror.parseUnit(u) }).toEqual({ input: u, result: parseUnit(u) });
    }
  });

  it("★conversionFactor の結果が完全一致する (全組み合わせ)", () => {
    const mismatches: string[] = [];
    for (const a of UNITS) {
      for (const b of UNITS) {
        const canon = conversionFactor(a, b);
        const mirr = mirror.conversionFactor(a, b);
        if (canon !== mirr) mismatches.push(`${String(a)} → ${String(b)}: 正典 ${canon} / 鏡 ${mirr}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("sameDimension の結果が完全一致する", () => {
    for (const a of UNITS) {
      for (const b of UNITS) {
        expect(mirror.sameDimension(a, b)).toBe(sameDimension(a, b));
      }
    }
  });

  it("語彙サンプルも一致する", () => {
    expect([...mirror.KNOWN_UNIT_SAMPLES]).toEqual([...KNOWN_UNIT_SAMPLES]);
  });
});
