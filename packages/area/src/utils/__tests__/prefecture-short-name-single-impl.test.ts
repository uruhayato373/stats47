import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 都道府県名の短縮 (接尾辞の 都/道/府/県 を落とす) は `@stats47/area` の `prefectureShortName` が単一実装。
 * 北海道を「北海」にする実装としない実装が混在していた (2026-10-26 時点で 7 通り) ため、
 * `.replace(/[都府県]$/, ...)` 形のリテラル実装が新しく増えたら fail する。
 *
 * KNOWN_LOCAL_IMPLEMENTATIONS は移行が済んでいない既存箇所 (縮小専用)。移行したら行を消す。
 * 検出はリテラルの正規表現形だけを見る (別の書き方は拾えない)。対象は TypeScript (`@stats47/area` を import できる層) で、
 * 素の node で動く `.claude/scripts` 配下の `.mjs` は TS を import できないため対象外 (同種の実装が残る。backlog 起票対象)。
 */
const REPO_ROOT = resolve(__dirname, "../../../../..");
const SCAN_ROOTS = ["apps", "packages", ".claude/scripts"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".open-next", "__tests__", "public", "out", ".turbo"]);
const LOCAL_SHORT_NAME_RE = /replace\(\s*\/(?:\[都道?府県\]|\(都\|(?:道\|)?府\|県\))\$\//;

const SINGLE_IMPL = "packages/area/src/utils/prefecture-short-name.ts";
const KNOWN_LOCAL_IMPLEMENTATIONS: readonly string[] = [
  ".claude/scripts/blog/generate-article-charts.ts",
  ".claude/scripts/blog/regenerate-tile-maps.ts",
  "apps/web/src/features/ads/constants/furusato-nozei.ts",
  "packages/product-factory/src/channels/kindle/ai-content-composer.ts",
  "packages/product-factory/src/text/fact-claims.ts",
  "packages/svg-builder/src/charts/bar-chart.ts",
];

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts)$/.test(name) && !/\.test\.|\.spec\./.test(name)) out.push(full);
  }
}

describe("都道府県の短縮名は単一実装", () => {
  it("prefectureShortName 以外に .replace(/[都府県]$/) 形の局所実装が増えていない (縮小専用)", () => {
    const files: string[] = [];
    for (const root of SCAN_ROOTS) walk(join(REPO_ROOT, root), files);
    const found = files
      .filter((f) => LOCAL_SHORT_NAME_RE.test(readFileSync(f, "utf8")))
      .map((f) => relative(REPO_ROOT, f).split("\\").join("/"))
      .filter((f) => f !== SINGLE_IMPL)
      .sort();
    expect(found).toEqual([...KNOWN_LOCAL_IMPLEMENTATIONS].sort());
  }, 60000);

  it("単一実装そのものは検出パターンに一致する (検査が何も見ていない状態でないことの確認)", () => {
    expect(LOCAL_SHORT_NAME_RE.test(readFileSync(join(REPO_ROOT, SINGLE_IMPL), "utf8"))).toBe(true);
  });
});
