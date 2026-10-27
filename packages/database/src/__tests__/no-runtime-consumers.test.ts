import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * このパッケージの Drizzle schema は永続 DB 時代の型の残置で、型ソース / テスト用としてだけ残す
 * (CLAUDE.md・docs/01_技術設計/02_データアーキテクチャ.md)。metric・カテゴリ・都道府県の現在の正本は
 * data-configs / area にあり、ここの型は正本と食い違う (例: metrics.ts と MetricConfig)。
 * 本番コードがここから型や値を引くと、正本と別の第 3 の定義に依存することになるので、それを止める。
 */

const REPO_ROOT = resolve(__dirname, "../../../..");
/** テスト基盤からの利用だけを許す */
const ALLOWED = new Set(["apps/web/src/config/test.setup.tsx"]);
const IMPORT_REGEX = "from +[\"']@stats47/database|import\\( *[\"']@stats47/database";
const TEST_FILE = /(^|\/)(__tests__|__mocks__|tests)\/|\.(test|spec)\.[cm]?[jt]sx?$/;

function grepFiles(pathspecs: string[]): string[] {
  try {
    const out = execFileSync("git", ["grep", "-l", "-E", IMPORT_REGEX, "--", ...pathspecs], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    return out.split("\n").filter(Boolean);
  } catch (error) {
    // git grep は一致 0 件で exit 1 を返す
    if ((error as { status?: number }).status === 1) return [];
    throw error;
  }
}

function runtimeConsumers(): string[] {
  return grepFiles([
    ":(glob)apps/*/src/**",
    ":(glob)apps/*/app/**",
    ":(glob)packages/*/src/**",
    ":(exclude)packages/database/**",
  ]).filter((file) => !ALLOWED.has(file) && !TEST_FILE.test(file));
}

describe("@stats47/database の利用範囲", () => {
  it("本番コード (apps / packages の src・app) は @stats47/database を import しない", () => {
    expect(runtimeConsumers()).toEqual([]);
  });

  it("検出は許可済みのテスト基盤の dynamic import に当たる (pathspec と正規表現が効いている)", () => {
    expect(grepFiles(["apps/web/src/config/test.setup.tsx"])).toEqual([
      "apps/web/src/config/test.setup.tsx",
    ]);
  });
});
