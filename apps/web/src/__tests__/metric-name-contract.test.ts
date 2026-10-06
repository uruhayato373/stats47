import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 指標名は `@stats47/ranking` の `metricDisplayName` (名前 + 分母・内訳) か `metricShortName`
 * (補足を別の場所に出す部品用) で組み立てる (SUBTITLE-DROP-SITEWIDE-01)。
 *
 * `readerLabel ?? title` を直書きすると subtitle (分母・内訳) が落ち、人口当たりの値が総数に見える
 * (2026-09-27: 「図書館数 27館」が人口100万人当たりだった)。直書きを 0 件に保つ。
 */

const SRC = path.resolve(process.cwd(), "src");
const DIRECT_FALLBACK = /readerLabel\s*\?\?/;

function listSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (["node_modules", ".next", "__tests__"].includes(entry)) continue;
      out.push(...listSources(abs));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(abs);
    }
  }
  return out;
}

describe("指標名の組み立て", () => {
  it("readerLabel ?? … の直書きが無い", () => {
    const offenders = listSources(SRC)
      .filter((file) => DIRECT_FALLBACK.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file));
    expect(offenders).toEqual([]);
  });

  it("検査が直書きを検出できる (検査の感度)", () => {
    expect(DIRECT_FALLBACK.test("title: item.readerLabel ?? item.title,")).toBe(true);
    expect(DIRECT_FALLBACK.test("title: metricDisplayName(item),")).toBe(false);
  });
});
