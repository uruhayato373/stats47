import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT_LAYOUT_PATH = existsSync(
  resolve(process.cwd(), "src/app/layout.tsx"),
)
  ? resolve(process.cwd(), "src/app/layout.tsx")
  : resolve(process.cwd(), "apps/web/src/app/layout.tsx");
const ROOT_LAYOUT_SOURCE = readFileSync(ROOT_LAYOUT_PATH, "utf8");
const GLOBAL_ERROR_PATH = existsSync(
  resolve(process.cwd(), "src/app/global-error.tsx"),
)
  ? resolve(process.cwd(), "src/app/global-error.tsx")
  : resolve(process.cwd(), "apps/web/src/app/global-error.tsx");
const GLOBAL_ERROR_SOURCE = readFileSync(GLOBAL_ERROR_PATH, "utf8");

function getBodyOpeningTag(source: string): string | undefined {
  return source.match(/^\s*<body[\s\S]*?>/m)?.[0];
}

describe("AdSense ad intents opt-out contract", () => {
  it("root body excludes all pages from ad intent text replacement", () => {
    const bodyOpeningTag = getBodyOpeningTag(ROOT_LAYOUT_SOURCE);

    expect(bodyOpeningTag).toContain("google-anno-skip");
  });

  it("global error body keeps the opt-out when the root layout fails", () => {
    const bodyOpeningTag = getBodyOpeningTag(GLOBAL_ERROR_SOURCE);

    expect(bodyOpeningTag).toContain("google-anno-skip");
  });
});
