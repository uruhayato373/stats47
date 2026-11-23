import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * パンくずを Shell (PageShell / ArticleShell) に渡すページは、見出しも Shell の header に渡す。
 *
 * 本文の格子 (PanelGrid) は、パンくずの直後のセルの上の線を消して、パンくずと見出しを 1 つの区画に見せる。
 * 見出しを本文の中に置くと、パンくずの直後が本文の列 (display: contents) になって指定が効かず、
 * パンくずと見出しの間に線が出る (2026-11-23 に調査のページとブログの記事ページで直した)。
 */
const APP_DIR = path.resolve(__dirname, "../app");

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return pageFiles(full);
    return name === "page.tsx" ? [full] : [];
  });
}

describe("パンくずを渡すページは見出しも Shell の header に渡す", () => {
  const pages = pageFiles(APP_DIR).filter((file) => /<(?:Article|Page)Shell\b[\s\S]*?\bbreadcrumb=\{/.test(readFileSync(file, "utf8")));

  it("対象のページが見つかる (検査が空振りしていない)", () => {
    expect(pages.length).toBeGreaterThanOrEqual(3);
  });

  it.each(pages.map((file) => [path.relative(APP_DIR, file), file]))("%s", (_name, file) => {
    const source = readFileSync(file, "utf8");
    expect(source, "breadcrumb を渡す Shell に header が無い (パンくずと見出しの間に線が出る)").toMatch(/\bheader=\{/);
  });
});
