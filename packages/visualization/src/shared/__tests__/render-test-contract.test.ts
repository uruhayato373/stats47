import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DETERMINISTIC_RENDER_ENV,
  OPT_IN_RENDER_TEST_FILES,
  prepareSvgForDeterministicRender,
  renderTestExcludes,
} from "./helpers/render-test-contract";

describe("opt-in render suite inventory", () => {
  it("既存9 filesを固定し、全fileが実在する", () => {
    expect(OPT_IN_RENDER_TEST_FILES).toHaveLength(9);
    for (const file of OPT_IN_RENDER_TEST_FILES) {
      expect(existsSync(resolve(__dirname, "../../..", file)), file).toBe(true);
    }
  });

  it("RUN_RENDER_TESTS未設定では9 filesを除外し、opt-in時だけ全件を開く", () => {
    expect(renderTestExcludes(false)).toEqual(OPT_IN_RENDER_TEST_FILES);
    expect(renderTestExcludes(true)).toEqual([]);
  });
});

describe("deterministic render environment contract", () => {
  it("timezone / locale / viewport / DPRを固定する", () => {
    expect(DETERMINISTIC_RENDER_ENV).toEqual({
      timezone: "UTC",
      language: "C",
      locale: "en-US",
      viewportWidth: 1920,
      viewportHeight: 1080,
      devicePixelRatio: 1,
    });
  });

  it("repo内の固定fontをSVGへ埋め込み、入力内容は保持する", () => {
    const svg = prepareSvgForDeterministicRender('<svg viewBox="0 0 10 10"><text>東京1</text></svg>');
    expect(svg).toContain("font-family:'Stats47Render'");
    expect(svg).toContain("data:font/woff2;base64,");
    expect(svg).toContain("<text>東京1</text>");
    expect(createHash("sha256").update(svg).digest("hex")).toHaveLength(64);
  });

  it("PNG等の非SVG入力は変更しない", () => {
    expect(prepareSvgForDeterministicRender("not-svg")).toBe("not-svg");
  });
});
