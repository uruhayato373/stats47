import { describe, expect, it } from "vitest";

import { filterActiveRefreshTargets } from "../../scripts/page-data-batch";
import type { MetricConfig } from "../types";

const active = { key: "active", isActive: true } as MetricConfig;
const inactive = { key: "inactive", isActive: false } as MetricConfig;
const legacyActive = { key: "legacy-active" } as MetricConfig;

describe("page-data-batch の全量更新対象", () => {
  it("全量更新では退役済み metric を除外する", () => {
    expect(filterActiveRefreshTargets([active, inactive, legacyActive], false).map((c) => c.key)).toEqual([
      "active",
      "legacy-active",
    ]);
  });

  it("--metric 明示時は退役済み metric も個別診断できる", () => {
    expect(filterActiveRefreshTargets([inactive], true).map((c) => c.key)).toEqual(["inactive"]);
  });
});
