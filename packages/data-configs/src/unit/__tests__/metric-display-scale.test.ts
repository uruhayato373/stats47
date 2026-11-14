import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { checkAuthoredDisplays, LEDGER_PATH, type DisplayUnitLedger } from "../../../scripts/build-chart-display-units";
import { METRICS_REGISTRY } from "../../registry";
import { formatChartValue, resolveChartDisplayScale } from "../chart-display-scale";
import { auditAuthoredDisplay, displayUnitKeepsDenominator, resolveMetricDisplayScale } from "../metric-display-scale";

/** 47 県の可処分所得 (円) の両端。定義は「万円」で出すと決めている。 */
const INCOME = [639_358, 396_090];
/** 事業税 (千円) の両端。定義に表示単位が無ければ、図の規則が億円へ寄せる。 */
const BUSINESS_TAX = [1_544_976_077, 14_040_236];

describe("the one display scale every surface reads", () => {
  it("uses the metric's own display when it names a unit, and never stacks the chart rule on top of it", () => {
    const scale = resolveMetricDisplayScale({ unit: "円", display: { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万円" } }, INCOME);
    expect(scale).toEqual({ unit: "万円", factor: 0.0001, decimals: 1, reason: "authored" });
    // 639,358 円は 63.9 万円。定義の係数だけが 1 回掛かる (図の規則が重なると 0.0064 万円になる)
    expect(formatChartValue(INCOME[0], scale)).toBe("63.9");
  });

  it("falls back to the chart rule when the definition names no display unit", () => {
    const scale = resolveMetricDisplayScale({ unit: "千円", display: { conversionFactor: 1, decimalPlaces: 0 } }, BUSINESS_TAX);
    expect(scale).toEqual(resolveChartDisplayScale("千円", BUSINESS_TAX));
    expect(scale).toMatchObject({ unit: "億円", factor: 0.00001, reason: "rescaled" });
    // A metric with no display at all reads the same rule.
    expect(resolveMetricDisplayScale({ unit: "千円" }, BUSINESS_TAX)).toEqual(scale);
  });

  it("is a fixed point: values already shown in the resolved unit are not converted again", () => {
    for (const metric of [
      { unit: "円", display: { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万円" } },
      { unit: "千円", display: null },
    ]) {
      const values = metric.unit === "円" ? INCOME : BUSINESS_TAX;
      const first = resolveMetricDisplayScale(metric, values);
      const again = resolveMetricDisplayScale({ unit: first.unit, display: null }, values.map((v) => v * first.factor));
      expect(again.factor).toBe(1);
      expect(again.unit).toBe(first.unit);
    }
  });

  it("writes cubic metres one way whether the definition says ｍ3 or m3", () => {
    const fullWidth = resolveMetricDisplayScale({ unit: "ｍ3" }, [120, 3]);
    const halfWidth = resolveMetricDisplayScale({ unit: "m3" }, [120, 3]);
    expect(fullWidth.unit).toBe("m³");
    expect(halfWidth.unit).toBe("m³");
    expect(resolveMetricDisplayScale({ unit: "千m3", display: { conversionFactor: 0.001, decimalPlaces: 0, displayUnit: "百万m3" } }, [1_550_325]).unit).toBe("百万m³");
  });
});

describe("a display unit may not drop what the value is measured per", () => {
  it("accepts units that keep the denominator or have none", () => {
    expect(displayUnitKeepsDenominator("m3/日", "万m3/日")).toBe(true);
    expect(displayUnitKeepsDenominator("ｍ3／日", "万m3/日")).toBe(true);
    expect(displayUnitKeepsDenominator("千円", "億円")).toBe(true);
    expect(displayUnitKeepsDenominator("学級･講座", "学級")).toBe(true);
  });

  it("rejects 「m³/日 → m³」 and 「台/12h → 台」: the number would read as a stock, not a rate", () => {
    expect(displayUnitKeepsDenominator("ｍ3／日", "m3")).toBe(false);
    expect(displayUnitKeepsDenominator("台/12h", "台")).toBe(false);
    expect(displayUnitKeepsDenominator("千台･km/12h", "千台･km")).toBe(false);
    expect(displayUnitKeepsDenominator("円", "円/月")).toBe(false);
  });
});

describe("an authored display is audited against the latest values", () => {
  const range = (max: number, minNonZeroAbs: number, unit: string) => {
    const rule = resolveChartDisplayScale(unit, [max, minNonZeroAbs]);
    return { max, minNonZeroAbs, ruleFactor: rule.factor, ruleDecimals: rule.decimals, ruleRescales: rule.reason === "rescaled" };
  };

  it("passes a display that reads in five digits with the rule's decimals", () => {
    expect(auditAuthoredDisplay({ unit: "円", display: { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万円" } }, range(639_358, 396_090, "円"))).toEqual([]);
    // A deliberate unit the rule would not pick (MW instead of 万kW) is fine while it stays readable.
    expect(auditAuthoredDisplay({ unit: "kW", display: { conversionFactor: 0.001, decimalPlaces: 0, displayUnit: "MW" } }, range(5_287_065, 494_877, "kW"))).toEqual([]);
  });

  it("stops a unit that leaves seven or more digits (年金給付総額 was 243,603,259 万円)", () => {
    const problems = auditAuthoredDisplay({ unit: "千円", display: { conversionFactor: 0.1, decimalPlaces: 0, displayUnit: "万円" } }, range(2_436_032_586, 121_806_481, "千円"));
    expect(problems).toEqual([expect.stringMatching(/^\[display-digits\]/)]);
  });

  it("stops decimals that differ from the chart rule (港湾の入港船舶総トン数: page 1 桁, 型の画像 0 桁)", () => {
    const problems = auditAuthoredDisplay({ unit: "総トン", display: { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万総トン" } }, range(399_226_920, 3_203_855, "総トン"));
    expect(problems).toEqual([expect.stringMatching(/^\[display-decimals\].*0 桁/)]);
    // 新設住宅着工戸数: 12.9 万戸を整数で出すと 47 県が 0〜13 に潰れる
    expect(auditAuthoredDisplay({ unit: "戸", display: { conversionFactor: 0.0001, decimalPlaces: 0, displayUnit: "万戸" } }, range(129_570, 2_110, "戸"))).toContainEqual(expect.stringMatching(/^\[display-decimals\].*1 桁/));
  });

  it("stops a display that rounds the smallest prefecture to zero when the rule would not", () => {
    // 400 人 reads 0.0 万人; the rule keeps it visible by staying at 人 (six digits allowed for this reason).
    const problems = auditAuthoredDisplay({ unit: "人", display: { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万人" } }, range(700_000, 400, "人"));
    expect(problems).toEqual([expect.stringMatching(/^\[display-hides-min\]/)]);
    // When every unit hides the smallest prefecture the chart writes 「0.1未満」, so the definition is not at fault.
    expect(auditAuthoredDisplay({ unit: "人", display: { conversionFactor: 0.0001, decimalPlaces: 0, displayUnit: "万人" } }, range(10_500_000, 4_000, "人"))).toEqual([]);
  });

  it("leaves a renamed unit (factor 1, the rule does not rescale) to the data's own decimals", () => {
    expect(auditAuthoredDisplay({ unit: "学級･講座", display: { conversionFactor: 1, decimalPlaces: 1, displayUnit: "学級" } }, range(23_259.6, 95.5, "学級･講座"))).toEqual([]);
  });

  it("has nothing to check before the ledger has values", () => {
    expect(auditAuthoredDisplay({ unit: "トン", display: { conversionFactor: 0.0001, decimalPlaces: 1, displayUnit: "万トン" } }, { max: null, minNonZeroAbs: null, ruleFactor: 1, ruleDecimals: null, ruleRescales: false })).toEqual([]);
  });
});

describe("the committed definitions against the committed ledger", () => {
  const committed = JSON.parse(readFileSync(resolve(LEDGER_PATH), "utf8")) as DisplayUnitLedger;

  it("every authored display unit passes the audit", () => {
    expect(checkAuthoredDisplays(committed, Object.values(METRICS_REGISTRY))).toEqual([]);
  });

  it("every authored display unit keeps the unit's denominator", () => {
    const dropped = Object.values(METRICS_REGISTRY)
      .filter((m) => m.display?.displayUnit && !displayUnitKeepsDenominator(m.unit, m.display.displayUnit))
      .map((m) => `${m.key}: ${m.unit} → ${m.display?.displayUnit}`);
    expect(dropped).toEqual([]);
  });

  it("reports the metric by key when a definition drifts from the ledger", () => {
    const drifted = Object.values(METRICS_REGISTRY).map((m) =>
      m.key === "disposable-income-worker-households" ? { ...m, display: { conversionFactor: 0.0001, decimalPlaces: 0, displayUnit: "万円" } } : m);
    expect(checkAuthoredDisplays(committed, drifted)).toEqual([expect.stringMatching(/^\[display-decimals\] disposable-income-worker-households/)]);
  });
});
