import { describe, expect, it } from "vitest";

import { AREA_DATABOOK_TEMPLATE } from "../area-databook/template";
import { REFERENCE_PLACEMENT_DECISIONS } from "../evidence-inventory/placement-decisions";
import { JAPAN_CATALOGS } from "../geo-scope/japan-catalog";
import { METRICS_REGISTRY } from "../registry";

// 「載せない」と決めた記録が、採用済みの正本 (テンプレート・カタログ) と食い違うと、
// 管理画面の集計が採用済みの指標を見送り扱いにしたり、判断の根拠が実在しない指標を指したりする。
describe("参考文献の展開先の見送り記録", () => {
  const areaKeys = new Set(
    JSON.stringify(AREA_DATABOOK_TEMPLATE).match(/"rankingKey":"[^"]+"/g)?.map((m) => m.slice(14, -1)) ?? []
  );
  const japanKeys = new Set(Object.values(JAPAN_CATALOGS).flatMap((theme) => theme.metrics.map((m) => m.metricKey)));

  it("記録した指標はすべて実在し、理由が空でない", () => {
    for (const decision of REFERENCE_PLACEMENT_DECISIONS) {
      expect(METRICS_REGISTRY[decision.metricKey], decision.metricKey).toBeDefined();
      expect(decision.reason.trim().length, decision.metricKey).toBeGreaterThan(0);
    }
  });

  it("採用済みの指標を見送りとして記録していない", () => {
    for (const decision of REFERENCE_PLACEMENT_DECISIONS) {
      const adopted = decision.channel === "area" ? areaKeys : japanKeys;
      expect(adopted.has(decision.metricKey), `${decision.channel}:${decision.metricKey}`).toBe(false);
    }
  });

  it("同じ展開先・指標の記録は 1 件だけ", () => {
    const keys = REFERENCE_PLACEMENT_DECISIONS.map((d) => `${d.channel}:${d.metricKey}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
