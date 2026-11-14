import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// 率の判定は指標の生成器と同じ部品を使う (手で同期する二重管理にしない)
// @ts-expect-error — 素の node 用の JS (型定義なし)。mirror-parity.test.ts と同じ形で意図的に import する
import { isOfficialRate } from "../../../../.claude/scripts/estat/lib/ssds-rate-name.mjs";
import { METRICS_REGISTRY } from "../registry";

const REPO_ROOT = resolve(__dirname, "../../../..");
const rateNameCache = new Map<string, Map<string, string>>();

/**
 * 社会・人口統計体系 (SSDS) の `#` 項目のうち、公式の項目名が分母 (人口10万人当たり・1事業所当たり等) を
 * 名乗るものは、算式で割り終えた率である。そこへ人口・面積の換算を選べると、率をさらに割る二重換算になる。
 * 分母の根拠は題名や key の接尾辞ではなく、e-Stat が公表する項目名だけを使う
 * (memory feedback_ssds_denominator_evidence、METRIC-CLINIC-PER-100K-UNIT-01)。
 */
function ssdsRatesWithNormalization() {
  const checked: string[] = [];
  const violations: string[] = [];
  for (const [key, config] of Object.entries(METRICS_REGISTRY)) {
    const source = config.source;
    if (source.kind !== "estat") continue;
    const code = (source as { cdCat01?: unknown }).cdCat01;
    const statsDataId = (source as { statsDataId?: unknown }).statsDataId;
    if (typeof code !== "string" || typeof statsDataId !== "string") continue;
    if (!isOfficialRate(REPO_ROOT, { statsDataId, cdCat01: code }, rateNameCache)) continue;
    checked.push(key);
    const options = config.calculation?.normalizationOptions ?? [];
    if (options.length > 0) violations.push(`${key} (${statsDataId} ${code}): ${options.map(({ type }) => type).join(",")}`);
  }
  return { checked, violations };
}

describe("SSDS の率は人口・面積の換算を重ねない", () => {
  it("公式の項目名が「…当たり」の # 項目は normalizationOptions を持たない", () => {
    const { violations } = ssdsRatesWithNormalization();
    expect(violations).toEqual([]);
  });

  it("検査が空振りしていない (対象の率が多数見つかり、一般診療所数も含む)", () => {
    const { checked } = ssdsRatesWithNormalization();
    expect(checked.length).toBeGreaterThan(150);
    expect(checked).toContain("general-clinic-count-per-100k");
  });

  it("# 項目でも名前が分母を名乗らない実数は換算の選択肢を保つ (取り違え防止)", () => {
    // 外国人人口の実数 A1700 は SSDS の # 項目ではなく、率 #A01601 と別系列
    expect(METRICS_REGISTRY["foreign-resident-count"].calculation?.normalizationOptions?.length).toBeGreaterThan(0);
  });
});
