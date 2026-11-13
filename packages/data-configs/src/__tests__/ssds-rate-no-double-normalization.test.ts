import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "../registry";

const REPO_ROOT = resolve(__dirname, "../../../..");

/** e-Stat の項目名の末尾の括弧が「…当たり」なら、その項目は SSDS が算式で割り終えた率である */
const RATE_NAME = /[（(][^（）()]*(?:当たり|あたり)[^（）()]*[）)]\s*$/;

type Cat01Name = { code: string; name: string };
const cat01Names = new Map<string, Map<string, string>>();

/** data/estat/meta の控えから、統計表の cat01 コードと公式の項目名の対応を読む。控えが欠けていれば空 */
function officialNames(statsDataId: string): Map<string, string> {
  const hit = cat01Names.get(statsDataId);
  if (hit) return hit;
  const names = new Map<string, string>();
  const file = resolve(REPO_ROOT, "data/estat/meta", `${statsDataId}.json`);
  if (existsSync(file)) {
    const meta = JSON.parse(readFileSync(file, "utf8"));
    const dim = meta.dimensions?.find((d: { id: string }) => d.id === "cat01");
    // 一部だけの標本では「無い」を証拠にできないので、全件が揃った控えだけ使う
    if (dim && dim.sampleValues?.length === dim.valueCount) {
      for (const { code, name } of dim.sampleValues as Cat01Name[]) names.set(code, name);
    }
  }
  cat01Names.set(statsDataId, names);
  return names;
}

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
    if (typeof code !== "string" || !code.startsWith("#") || typeof statsDataId !== "string") continue;
    const name = officialNames(statsDataId).get(code);
    if (!name || !RATE_NAME.test(name)) continue;
    checked.push(key);
    const options = config.calculation?.normalizationOptions ?? [];
    if (options.length > 0) violations.push(`${key} (${code} ${name}): ${options.map(({ type }) => type).join(",")}`);
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
