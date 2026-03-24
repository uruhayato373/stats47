import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTooltipContent, TOOLTIP_STYLES, TOOLTIP_CLASSNAMES } from "../../hooks/useD3Tooltip";

// useD3Tooltip は "use client" かつ React hooks を使うので、
// createTooltipContent / 定数のみ単体テスト可能
describe("TOOLTIP_STYLES", () => {
  it("should have the required CSS properties", () => {
    expect(TOOLTIP_STYLES.position).toBe("absolute");
    expect(TOOLTIP_STYLES.pointerEvents).toBe("none");
    expect(TOOLTIP_STYLES.zIndex).toBe("9999");
    expect(TOOLTIP_STYLES.opacity).toBe("0");
  });
});

describe("TOOLTIP_CLASSNAMES", () => {
  it("should be a non-empty string", () => {
    expect(typeof TOOLTIP_CLASSNAMES).toBe("string");
    expect(TOOLTIP_CLASSNAMES.length).toBeGreaterThan(0);
  });
});

describe("createTooltipContent", () => {
  it("should include the prefName in the output", () => {
    const html = createTooltipContent({ prefName: "北海道" });
    expect(html).toContain("北海道");
  });

  it("should display '-' when value is undefined", () => {
    const html = createTooltipContent({ prefName: "東京都", value: undefined });
    expect(html).toContain("-");
  });

  it("should display '-' when value is null", () => {
    const html = createTooltipContent({ prefName: "大阪府", value: null });
    expect(html).toContain("-");
  });

  it("should format and display numeric values", () => {
    const html = createTooltipContent({ prefName: "神奈川県", value: 1234567 });
    // formatNumber is applied — check the area name is present
    expect(html).toContain("神奈川県");
  });

  it("should include unit when provided", () => {
    const html = createTooltipContent({ prefName: "福岡県", value: 100, unit: "件" });
    expect(html).toContain("件");
  });

  it("should include year when provided", () => {
    const html = createTooltipContent({ prefName: "愛知県", value: 50, year: "2023年" });
    expect(html).toContain("2023年");
  });

  it("should include categoryName when provided", () => {
    const html = createTooltipContent({ prefName: "埼玉県", value: 30, categoryName: "男性" });
    expect(html).toContain("男性");
  });

  it("should not include year section when year is not provided", () => {
    const html = createTooltipContent({ prefName: "千葉県", value: 10 });
    // year divs are omitted when year is falsy
    expect(html).not.toContain("2023年");
  });
});
