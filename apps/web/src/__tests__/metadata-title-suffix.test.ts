import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { generateRootMetadata } from "@/lib/metadata/root-metadata";
import { formatOgpTitle } from "@/lib/metadata/site-title";

import { SITE_NAME } from "@/config/site";

/**
 * `<title>` のサイト名接尾辞は root layout の `title.template` (`%s | ${SITE_NAME}` = 「統計で見る都道府県」) だけが付ける。
 *
 * ページが自分で ` | stats47` を書くと、template と重なり「X | stats47 | 統計で見る都道府県」になる
 * (2026-10-26 に /geo・/blog・/search・/products など 20 ページで実測)。
 * OGP の title には template が効かないので、接尾辞が要るときは `formatOgpTitle()` を使う。
 */

const SRC = path.resolve(process.cwd(), "src");

/** 文字列リテラルの末尾がサイト名の接尾辞になっている書き方 (`| stats47'`・`| ${SITE_NAME}\``・`| stats47地域分析'`) */
const SUFFIX_LITERAL = /\|\s*(?:stats47[^'"`\s|]*|\$\{\s*SITE_NAME\s*\})\s*['"`]/i;

/** 接尾辞を組み立てる正規の場所 */
const ALLOWED = new Set(["src/lib/metadata/root-metadata.ts", "src/lib/metadata/site-title.ts"]);

function listSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (["node_modules", ".next", "__tests__"].includes(entry)) continue;
      out.push(...listSources(abs));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(abs);
  }
  return out;
}

describe("metadata title のサイト名接尾辞", () => {
  it("root の template が `%s | SITE_NAME` で、OGP には template を持たない", () => {
    const metadata = generateRootMetadata();
    expect(metadata.title).toMatchObject({ template: `%s | ${SITE_NAME}` });
    // openGraph.title が文字列なので子ページの openGraph.title には template が効かない。
    // ページ側で接尾辞を付ける場合は formatOgpTitle() を使う。
    expect(typeof metadata.openGraph?.title).toBe("string");
    expect(formatOgpTitle("ブログ")).toBe("ブログ | stats47");
  });

  it("app/features/lib/components のソースに手書きの ` | stats47` 接尾辞がない", () => {
    const offenders: string[] = [];
    for (const dir of ["app", "features", "lib", "components"]) {
      for (const file of listSources(path.join(SRC, dir))) {
        const rel = path.relative(path.resolve(SRC, ".."), file).split(path.sep).join("/");
        if (ALLOWED.has(rel)) continue;
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (SUFFIX_LITERAL.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
          });
      }
    }
    expect(offenders, "title には接尾辞を書かない。OGP には formatOgpTitle() を使う").toEqual([]);
  });

  it("検出パターン自体が接尾辞を捕まえる (検査の検査)", () => {
    expect(SUFFIX_LITERAL.test("title: 'GISを探す | stats47',")).toBe(true);
    expect(SUFFIX_LITERAL.test("const t = `${x} | ${SITE_NAME}`;")).toBe(true);
    expect(SUFFIX_LITERAL.test("title: `${a} | stats47地域分析`,")).toBe(true);
    expect(SUFFIX_LITERAL.test('title: "検索 | Stats47",')).toBe(true);
    // description 中の「| stats47 ブログ」は接尾辞ではない
    expect(SUFFIX_LITERAL.test("`${article.title} | stats47 ブログ`")).toBe(false);
  });
});
