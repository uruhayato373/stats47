/**
 * 県・市区町村の「特徴」を 1 系統に保つ契約 (AREA-HIGHLIGHTS-SSOT-01 step 5)。
 *
 * 選定関数 (select-area-highlights.ts) 以外で、次のことをしていないかをソースから検査する。
 *  - strengths / weaknesses の直接切り出し (slice / filter / 添字)
 *  - databook.json の highlight メタの直接参照 (選定を経ずに並べる)
 *  - 順位しきい値の直書き (rank <= 5 など)
 *  - 県の profile.json の読み込み (Web は databook.json だけを読む)
 *  - 同じ値の二重計算 (SNS が values.json から順位・決定力を再計算する)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../../../..");

/** 「特徴」を描く・使う面。ここに新しい利用者を足したら対象に加える。 */
const CONSUMER_ROOTS = [
  "apps/web/src/features/area-profile",
  "apps/web/src/features/ogp/AreaOgp.tsx",
  "apps/web/src/app/areas/[areaCode]/page.tsx",
  "apps/web/src/app/areas/[areaCode]/cities/[cityCode]/page.tsx",
  ".claude/scripts/sns/lib/ig-area-props.ts",
  ".claude/scripts/sns/build-ig-area-props.ts",
];

function listFiles(rel: string): string[] {
  const abs = join(REPO, rel);
  if (statSync(abs).isFile()) return [abs];
  return readdirSync(abs, { recursive: true, encoding: "utf8" })
    .map((f) => join(abs, f))
    .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("__tests__"));
}

/** コメントの説明文 (「values.json は使わない」等) に反応しないよう、コメントを除いて検査する。 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const files = CONSUMER_ROOTS.flatMap(listFiles).map((path) => ({
  path: relative(REPO, path),
  text: stripComments(readFileSync(path, "utf8")),
}));

function offenders(pattern: RegExp): string[] {
  return files.filter((f) => pattern.test(f.text)).map((f) => f.path);
}

describe("県の「特徴」の 1 系統契約", () => {
  it("対象ファイルを読めている (パス変更で検査が空振りしない)", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("strengths / weaknesses を選定関数以外で切り出さない", () => {
    expect(offenders(/\b(strengths|weaknesses)\s*(\??\.\s*(slice|filter|sort|find|at)\b|\[\d)/)).toEqual([]);
    // 市区町村の strengths は selectCityHighlights に渡すだけ
    expect(offenders(/\.weaknesses\b/)).toEqual([]);
  });

  it("databook.json の highlight メタを選定関数以外で直接読まない", () => {
    expect(offenders(/\.highlight\??\./)).toEqual([]);
  });

  it("順位のしきい値を直書きしない", () => {
    expect(offenders(/\brank\w*\s*[<>]=?\s*\d+/i)).toEqual([]);
  });

  it("Web は県の profile.json を読まない", () => {
    expect(offenders(/readAreaProfileFromR2|getAreaProfileAction|areaProfileKeyPath|profile\.json`/)).toEqual([]);
  });

  it("順位・決定力を values.json から再計算しない (databook.json の焼き込み値だけを使う)", () => {
    expect(offenders(/values\.json|computeMargin|classifyRank|detectRankDirection/)).toEqual([]);
  });

  it("市区町村の型と R2 パスを Web で独自定義しない", () => {
    expect(offenders(/interface CityProfileData|cities\/\$\{[^}]+\}\/profile\.json/)).toEqual([]);
  });
});
