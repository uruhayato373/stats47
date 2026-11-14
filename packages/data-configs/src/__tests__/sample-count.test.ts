import { describe, expect, it } from "vitest";

import { applySampleCounts, sampleCountKey, type SampleCountedRow } from "../sample-count";
import { listAllMetrics } from "../registry";

const spec = { cdTab: "13,45", factor: 10, minimum: 10 };

describe("applySampleCounts (DATA-WAGE-TEACHER-COVERAGE-01)", () => {
  it("表の十人単位を人に直し、10 人未満の県・年だけを参考値にする", () => {
    const rows = [
      { areaCode: "03000", yearCode: "2021", value: 650 },
      { areaCode: "04000", yearCode: "2021", value: 600 },
      { areaCode: "05000", yearCode: "2021", value: 500 },
    ];
    // 0.9 十人 = 9 人 (参考値) / 1 十人 = 10 人 (下限ちょうどは順位に残す)
    const counts = new Map([[sampleCountKey("03000", "2021000000"), 0.9], [sampleCountKey("04000", "2021"), 1]]);
    expect(applySampleCounts(rows, counts, spec)).toEqual([
      { areaCode: "03000", yearCode: "2021", value: 650, sampleCount: 9, reference: true },
      { areaCode: "04000", yearCode: "2021", value: 600, sampleCount: 10 },
      // 人数が取れない行は「少ない」と読み替えない
      { areaCode: "05000", yearCode: "2021", value: 500, sampleCount: null },
    ]);
  });

  it("値が欠測の行は人数が 0 でも参考値にしない (値も順位も出ない)", () => {
    const counts = new Map([[sampleCountKey("03000", "2021"), 0]]);
    expect(applySampleCounts<SampleCountedRow>([{ areaCode: "03000", yearCode: "2021", value: null }], counts, spec)[0]?.reference).toBeUndefined();
  });

  it("賃金構造基本統計の職種別の表 (0003445758) の全指標が推計の人数と共通の注記を宣言している", () => {
    const wage = listAllMetrics().filter((m) => m.source.kind === "estat" && m.source.statsDataId === "0003445758");
    expect(wage.length).toBe(40);
    for (const metric of wage) {
      expect(metric.source.kind === "estat" && metric.source.sampleCount, metric.key).toEqual(spec);
      expect(metric.note, metric.key).toContain("推計が10人未満の県・年は順位から外して参考値として示す");
    }
  });
});
