import { describe, expect, it } from "vitest";

import { classifyIngestShape } from "../../scripts/page-data-batch";
import { hasShapeError, summarizeShape, type ShapeRow } from "../shape-gate";

const NOW = new Date("2026-08-26T00:00:00Z");

function percentRows(max: number): ShapeRow[] {
  return [
    { areaCode: "07548", yearCode: "2015", value: max },
    { areaCode: "13101", yearCode: "2015", value: 2_998.5 },
  ];
}

describe("page-data-batch の正当な形状例外", () => {
  it("通勤者比率の市区町村値は観測済み最大値まで書き込みを止めない", () => {
    const violations = classifyIngestShape({
      key: "commuter-ratio-from-other-municipalities",
      entity: "city",
      summary: summarizeShape(percentRows(9_640)),
      unit: "％",
      priorSummary: null,
      now: NOW,
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].allowedBy?.disposition).toBe("legitimate");
    expect(hasShapeError(violations)).toBe(false);
  });

  it("日雇受給率は公式計算式と一致する1545.5％まで書き込みを止めない", () => {
    const violations = classifyIngestShape({
      key: "employment-insurance-daily-receipt-rate",
      entity: "prefecture",
      summary: summarizeShape([
        { areaCode: "07000", yearCode: "1994", value: 1_545.5 },
        { areaCode: "22000", yearCode: "1997", value: 1_500 },
      ]),
      unit: "％",
      priorSummary: null,
      now: NOW,
    });

    expect(violations).toHaveLength(2);
    expect(violations.find((v) => v.check === "percent-out-of-range")?.allowedBy?.disposition).toBe(
      "legitimate",
    );
    expect(hasShapeError(violations)).toBe(false);
  });

  it("観測済み最大値を超える悪化と別metricは引き続き停止する", () => {
    const worsened = classifyIngestShape({
      key: "commuter-ratio-from-other-municipalities",
      entity: "city",
      summary: summarizeShape(percentRows(9_641)),
      unit: "％",
      priorSummary: null,
      now: NOW,
    });
    const unrelated = classifyIngestShape({
      key: "unrelated-percent-metric",
      entity: "city",
      summary: summarizeShape(percentRows(9_640)),
      unit: "％",
      priorSummary: null,
      now: NOW,
    });

    expect(hasShapeError(worsened)).toBe(true);
    expect(hasShapeError(unrelated)).toBe(true);
  });
});
