/**
 * theme読了位置のアフィリエイト配置契約。
 * 4件グリッド直下に5件目だけを300x250で置く二段配置は、同じ広告群を別ブロックに見せ、
 * 末尾1件だけを過度に強調していた。themeは比較体験優先のため単一ブロックに固定する。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const LAYOUT_SRC = readFileSync(
  resolve(import.meta.dirname, "../ThemePageLayout.tsx"),
  "utf8",
);

describe("theme affiliate layout", () => {
  it("読了位置は3列の単一ブロックにし、独立した5件目を置かない", () => {
    expect(LAYOUT_SRC).toContain('variant="three-up"');
    expect(LAYOUT_SRC).not.toContain('position="theme-end"');
    expect(LAYOUT_SRC).not.toContain("themeEndBanner");
    expect(LAYOUT_SRC).not.toContain("nativeBanners[4]");
  });
});
