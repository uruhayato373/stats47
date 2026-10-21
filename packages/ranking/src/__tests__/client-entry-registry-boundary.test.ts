import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * `@stats47/ranking` はクライアント部品からも読まれる入口。ここから data-configs の全指標 registry
 * (指標定義 2,600 件超) に届くと、開発ビルドがランキング詳細のブラウザ向けに全件をコンパイルし、
 * 8GB の Mac で初回表示が最大 171 秒かかった (2026-10-21)。値の import だけをたどって確かめる
 * (型だけの import はビルドで消えるので数えない)。
 */
const PACKAGE_ROOT = path.resolve(__dirname, "../..");
const CONFIG_PATH = path.join(PACKAGE_ROOT, "tsconfig.json");
const REGISTRY_SUFFIX = path.join("data-configs", "src", "registry.ts");

function valueImportSpecifiers(file: string): string[] {
  const source = ts.sys.readFile(file) ?? "";
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

function pathToRegistry(entry: string): string[] | null {
  const parsed = ts.parseJsonConfigFileContent(
    ts.readConfigFile(CONFIG_PATH, ts.sys.readFile).config,
    ts.sys,
    PACKAGE_ROOT,
  );
  const host = ts.createCompilerHost(parsed.options);
  const parent = new Map<string, string>();
  const seen = new Set([entry]);
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    for (const specifier of valueImportSpecifiers(file)) {
      const resolved = ts.resolveModuleName(specifier, file, parsed.options, host).resolvedModule?.resolvedFileName;
      if (!resolved || resolved.includes(`${path.sep}node_modules${path.sep}`) || resolved.endsWith(".d.ts")) continue;
      if (seen.has(resolved)) continue;
      seen.add(resolved);
      parent.set(resolved, file);
      if (resolved.endsWith(REGISTRY_SUFFIX)) {
        const chain = [resolved];
        let cursor = parent.get(resolved);
        while (cursor) { chain.unshift(cursor); cursor = parent.get(cursor); }
        return chain.map((step) => path.relative(PACKAGE_ROOT, step));
      }
      queue.push(resolved);
    }
  }
  return null;
}

describe("@stats47/ranking のクライアント入口", () => {
  it("値の import をたどっても data-configs の全指標 registry に届かない", () => {
    expect(pathToRegistry(path.join(PACKAGE_ROOT, "src", "index.ts"))).toBeNull();
  }, 60_000);

  it("調査分類の入口は registry に届く (検査が経路をたどれていることの確認)", () => {
    expect(pathToRegistry(path.join(PACKAGE_ROOT, "src", "survey", "index.ts"))).not.toBeNull();
  }, 60_000);
});
