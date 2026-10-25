import { describe, expect, it } from "vitest";
import { renderChoroplethSvg } from "../src/generators/svg-map";

describe("product map title", () => {
  it("wraps a long indicator and source within the image", () => {
    const title = "アクセサリー消費支出額（都道府県庁所在市の二人以上世帯の年間アクセサリー消費支出額）（2025）";
    const svg = renderChoroplethSvg(
      { width: 100, height: 100, shapes: [] },
      { paletteId: "test", breaks: [], bins: [] },
      { width: 620, title, footer: "出典：家計調査（二人以上の世帯）／stats47.jp" },
    );
    expect(svg).not.toContain(`>${title}</text>`);
    expect((svg.match(/font-size="20"/g) ?? []).length).toBeGreaterThan(1);
    expect(svg).toContain("アクセサリー消費支出額");
    expect(svg).toContain("stats47.jp");
  });
});
