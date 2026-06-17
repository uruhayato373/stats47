import { describe, it, expect } from "vitest";

import { generateDashboardPageMetadata } from "../generate-dashboard-metadata";

describe("generateDashboardPageMetadata", () => {
  it("カテゴリと地域コードを含むメタデータを返す", async () => {
    const result = await generateDashboardPageMetadata({
      category: "population",
      areaCode: "13000",
    });

    expect(result.title).toContain("population");
    expect(result.title).toContain("13000");
  });
});
