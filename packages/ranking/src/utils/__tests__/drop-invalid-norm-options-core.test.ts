import { describe, expect, test } from "vitest";
import {
  dropNormOptionsOfType,
  invalidNormTypeForKey,
} from "../drop-invalid-norm-options-core";

const CONFIG_WITH_BOTH = `import type { MetricConfig } from "../types";

export const totalPopulation: MetricConfig = {
  "key": "total-population",
  "unit": "人",
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
`;

const CONFIG_WITH_ONLY_INVALID = `export const x: MetricConfig = {
  "key": "habitable-area",
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｈａ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
};
`;

describe("invalidNormTypeForKey", () => {
  test("population family は per_population", () => {
    expect(invalidNormTypeForKey("total-population")).toBe("per_population");
    expect(invalidNormTypeForKey("total-population-male")).toBe("per_population");
  });

  test("area family は per_area", () => {
    expect(invalidNormTypeForKey("habitable-area")).toBe("per_area");
    expect(
      invalidNormTypeForKey("total-area-excluding-northern-territories-and-takeshima"),
    ).toBe("per_area");
  });

  test("household family は per_household", () => {
    expect(invalidNormTypeForKey("households")).toBe("per_household");
    expect(invalidNormTypeForKey("general-households")).toBe("per_household");
  });

  test("denominator 系でない key は null (通常 metric を巻き込まない)", () => {
    expect(invalidNormTypeForKey("beer-consumption-expenditure")).toBeNull();
    expect(invalidNormTypeForKey("population-density")).toBeNull();
  });
});

describe("dropNormOptionsOfType", () => {
  test("対象 type だけ削除し、他 option (人口密度=per_area) は保持する", () => {
    const r = dropNormOptionsOfType(CONFIG_WITH_BOTH, "per_population");
    expect(r.dropped).toBe(1);
    expect(r.remaining).toBe(1);
    expect(r.source).not.toContain('"per_population"');
    expect(r.source).toContain('"per_area"');
    expect(r.source).toContain('"label": "面積100km²あたり"');
    // 配列構造が壊れていない (バランス確認)
    expect(r.source).toContain('"normalizationOptions": [');
    expect((r.source.match(/\{/g) || []).length).toBe((r.source.match(/\}/g) || []).length);
  });

  test("全 option が対象なら normalizationOptions プロパティごと消える", () => {
    const r = dropNormOptionsOfType(CONFIG_WITH_ONLY_INVALID, "per_area");
    expect(r.dropped).toBe(1);
    expect(r.remaining).toBe(0);
    expect(r.source).not.toContain("normalizationOptions");
    // calculation 自体は残り、構文が壊れていない
    expect(r.source).toContain('"isCalculated": false');
    expect(r.source).toContain('"calculation": {');
    expect((r.source.match(/\{/g) || []).length).toBe((r.source.match(/\}/g) || []).length);
  });

  test("対象 type が無ければソース不変 (冪等)", () => {
    const r = dropNormOptionsOfType(CONFIG_WITH_BOTH, "per_household");
    expect(r.dropped).toBe(0);
    expect(r.source).toBe(CONFIG_WITH_BOTH);
  });

  test("normalizationOptions を持たない config はソース不変", () => {
    const src = 'export const x = {\n  "key": "a",\n};\n';
    const r = dropNormOptionsOfType(src, "per_population");
    expect(r.dropped).toBe(0);
    expect(r.source).toBe(src);
  });

  test("一度 apply した結果に再適用しても変化しない (冪等)", () => {
    const first = dropNormOptionsOfType(CONFIG_WITH_BOTH, "per_population");
    const second = dropNormOptionsOfType(first.source, "per_population");
    expect(second.dropped).toBe(0);
    expect(second.source).toBe(first.source);
  });
});
