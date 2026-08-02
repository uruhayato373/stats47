import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

const readSource = (relativePath: string) =>
  readFileSync(resolve(PROJECT_ROOT, relativePath), "utf8");

describe("right rail scroll contract", () => {
  it("ArticleShell uses page scroll instead of an independent rail scroll", () => {
    const source = readSource(
      "apps/web/src/components/layout/ArticleShell.tsx",
    );

    expect(source).not.toContain("overflow-y-auto");
    expect(source).not.toContain("max-h-[calc(100vh");
    expect(source).toContain(
      'className="hidden w-[360px] shrink-0 lg:flex lg:flex-col lg:gap-3"',
    );
  });

  it("RightRailWidgets cannot opt into an independent rail scroll", () => {
    const source = readSource(
      "apps/web/src/components/rail/RightRailWidgets.tsx",
    );

    expect(source).not.toContain("stickyScroll");
    expect(source).not.toContain("overflow-y-auto");
    expect(source).not.toContain("max-h-[calc(100vh");
  });

  it("area profile rail cards use their natural height", () => {
    const source = readSource(
      "apps/web/src/features/area-profile/components/AreaProfileSidebar.tsx",
    );

    expect(source).not.toContain("overflow-y-auto");
    expect(source).not.toContain("max-h-[40vh]");
  });
});
