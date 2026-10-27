import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * ブラウザ向けの部品や、他ページへ埋め込む部品が読む入口から、重い依存へ値の import がつながらないことを固定する。
 * 2026-10-21 に 8GB の Mac で、ランキング詳細の初回コンパイルが 171 秒・県ページが 20,399 モジュールになっていた。
 * 原因は入口 (barrel) 経由で全指標 registry (2,600 件超) と GIS の原典処理 (unzipper など) が入ることだった。
 * テーマ切替は全テーマの指標定義 (all-themes) をブラウザへ持ち込んでいた。
 * 型だけの import はビルドで消えるので数えない。"use server" のファイルはブラウザへ入らないので辿らない。
 */
const WEB_ROOT = path.resolve(__dirname, "../..");
const REPO_ROOT = path.resolve(WEB_ROOT, "../..");
// TypeScript の解決結果は Windows でも "/" 区切りなので、比較はすべて "/" にそろえて行う
// (path.join の "\\" と比べると Windows では一致せず、陽性対照が落ち、node_modules も除外できなかった。2026-10-27)
const toPosix = (file: string) => file.replaceAll("\\", "/");
const REGISTRY = "packages/data-configs/src/registry.ts";
// 全テーマの指標定義。本番ビルドで 324KB のチャンクになり、テーマ切替が読むと各テーマページへ入っていた。
const ALL_THEMES = "theme-dashboard/config/all-themes.ts";
const GIS_PROCESSING_PACKAGES = new Set(["unzipper", "shapefile", "proj4", "topojson-server", "topojson-simplify"]);

const parsed = ts.parseJsonConfigFileContent(
  ts.readConfigFile(path.join(WEB_ROOT, "tsconfig.json"), ts.sys.readFile).config,
  ts.sys,
  WEB_ROOT,
);
const host = ts.createCompilerHost(parsed.options);

function valueImportSpecifiers(file: string): string[] {
  const source = ts.sys.readFile(file) ?? "";
  if (/^\s*(['"])use server\1/.test(source.trimStart().slice(0, 40))) return [];
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];
  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      if (clause?.isTypeOnly) return;
      const named = clause?.namedBindings;
      const onlyTypes = !clause?.name && named !== undefined && ts.isNamedImports(named)
        && named.elements.length > 0 && named.elements.every((element) => element.isTypeOnly);
      if (onlyTypes) return;
      specifiers.push((node.moduleSpecifier as ts.StringLiteral).text);
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly) {
      specifiers.push((node.moduleSpecifier as ts.StringLiteral).text);
    }
  });
  return specifiers;
}

/** 入口から値の import をたどり、重い依存に届いた経路を返す (届かなければ null)。 */
function findHeavyDependency(entry: string): string[] | null {
  const start = path.join(REPO_ROOT, entry);
  const parent = new Map<string, string>();
  const seen = new Set([start]);
  const queue = [start];
  const chainTo = (file: string, last: string) => {
    const chain = [last];
    let cursor: string | undefined = file;
    while (cursor) { chain.unshift(path.relative(REPO_ROOT, cursor)); cursor = parent.get(cursor); }
    return chain;
  };
  while (queue.length > 0) {
    const file = queue.shift() as string;
    for (const specifier of valueImportSpecifiers(file)) {
      const packageName = specifier.match(/^(@[^/]+\/[^/]+|[^./][^/]*)/)?.[1];
      if (packageName && GIS_PROCESSING_PACKAGES.has(packageName)) return chainTo(file, packageName);
      const resolved = ts.resolveModuleName(specifier, file, parsed.options, host).resolvedModule?.resolvedFileName;
      if (!resolved || toPosix(resolved).includes("/node_modules/") || resolved.endsWith(".d.ts")) continue;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      parent.set(resolved, file);
      if (toPosix(resolved).endsWith(REGISTRY) || toPosix(resolved).endsWith(ALL_THEMES)) return chainTo(file, path.relative(REPO_ROOT, resolved));
      queue.push(resolved);
    }
  }
  return null;
}

const LIGHT_ENTRIES = [
  "packages/data-configs/src/theme-catalog/index.ts",
  "apps/web/src/features/geo-analysis/area.ts",
  "apps/web/src/features/geo-analysis/embedded.ts",
  "apps/web/src/features/ranking/widgets.ts",
  "apps/web/src/features/theme-dashboard/components/ThemeSwitcher.tsx",
  "apps/web/src/features/theme-dashboard/components/ThemeSideNav.tsx",
];

describe("ブラウザ向け・埋め込み用の入口", () => {
  it.each(LIGHT_ENTRIES)("%s から全指標 registry・全テーマ定義・GIS 原典処理に届かない", (entry) => {
    expect(findHeavyDependency(entry)).toBeNull();
  }, 60_000);

  it("registry 版の解析と GIS の pipeline 入口は届く (検査が経路をたどれていることの確認)", () => {
    expect(findHeavyDependency("packages/data-configs/src/theme-catalog/registry-checks.ts")).not.toBeNull();
    expect(findHeavyDependency("packages/gis/src/mlit-ksj/index.ts")).not.toBeNull();
  }, 60_000);
});
