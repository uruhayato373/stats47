/**
 * client-graph-audit の純粋な部分。
 *
 * "use client" のファイルから値の import をたどり、重い依存 (全指標 registry・全テーマ定義・GIS の原典処理) に
 * 届く経路を持つファイルを数える。型だけの import はビルドで消えるので辿らず、"use server" のファイルは
 * ブラウザへ入らないので辿らない。境界テスト (apps/web の client-bundle-boundary.test.ts など) は列挙した入口しか
 * 見ないため、新しい入口や部品から同じ経路ができても気づけない。この検査は全 "use client" ファイルを対象にする。
 */
import path from "node:path";

import ts from "typescript";

/** 全指標 registry。2,600 件超の指標定義をブラウザへ持ち込む。 */
export const REGISTRY_SUFFIX = "packages/data-configs/src/registry.ts";
/** 全テーマの指標定義。本番ビルドで 324KB のチャンクになる。 */
export const ALL_THEMES_SUFFIX = "theme-dashboard/config/all-themes.ts";
/** GIS の原典処理。ブラウザ向けには入れない。 */
export const GIS_PROCESSING_PACKAGES = ["unzipper", "shapefile", "proj4", "topojson-server", "topojson-simplify"];

/** TypeScript の解決結果は Windows でも "/" 区切りなので、比較はすべて "/" にそろえて行う。 */
const toPosix = (file) => file.replaceAll("\\", "/");

const DIRECTIVE_PREFIX = /^\s*(?:\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(['"])use (client|server)\1/;

/** ファイル先頭のディレクティブ ("use client" / "use server") を返す。無ければ null。 */
export function fileDirective(source) {
  const match = DIRECTIVE_PREFIX.exec(source);
  return match ? match[2] : null;
}

/** 値として import / re-export されるモジュール指定子 (型だけの import は除く)。 */
export function valueImportSpecifiers(sourceFile) {
  const specifiers = [];
  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      if (clause?.isTypeOnly) return;
      const named = clause?.namedBindings;
      const onlyTypes = !clause?.name && named !== undefined && ts.isNamedImports(named)
        && named.elements.length > 0 && named.elements.every((element) => element.isTypeOnly);
      if (onlyTypes) return;
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly) {
      specifiers.push(node.moduleSpecifier.text);
    }
  });
  return specifiers;
}

const SOURCE_EXTENSION = /\.(?:ts|tsx)$/;
const SKIPPED_PATH = /(?:^|\/)(?:node_modules|__tests__|\.next|\.open-next|dist|coverage)\//;
const SKIPPED_FILE = /\.(?:test|spec|stories)\.(?:ts|tsx)$|\.d\.ts$/;

/**
 * @param {object} options
 * @param {string} options.repoRoot
 * @param {string} options.tsconfigPath  import の解決に使う tsconfig (apps/web のもの)
 * @param {string[]} options.files        走査する候補ファイルの絶対パス
 * @param {(file: string) => string | undefined} [options.readFile]
 * @param {string[]} [options.heavyPackages]
 * @returns {{ scanned: number, clientFiles: string[], offenders: { file: string, chain: string[], target: string }[] }}
 */
export function auditClientGraph({
  repoRoot,
  tsconfigPath,
  files,
  readFile = ts.sys.readFile,
  heavyPackages = GIS_PROCESSING_PACKAGES,
}) {
  const heavySet = new Set(heavyPackages);
  const parsed = ts.parseJsonConfigFileContent(
    ts.readConfigFile(tsconfigPath, ts.sys.readFile).config,
    ts.sys,
    path.dirname(tsconfigPath),
  );
  const host = ts.createCompilerHost(parsed.options);
  const relative = (file) => toPosix(path.relative(repoRoot, file));

  const candidates = files
    .map(toPosix)
    .filter((file) => SOURCE_EXTENSION.test(file) && !SKIPPED_PATH.test(`${relative(file)}`) && !SKIPPED_FILE.test(file));

  // node: 絶対パス (ファイル) か "pkg:<name>" (重い外部パッケージ)。edges は値の import だけ。
  const edges = new Map();
  const heavyTargets = new Map();
  const clientFiles = [];
  const parseCache = new Map();

  function importsOf(file) {
    if (parseCache.has(file)) return parseCache.get(file);
    const source = readFile(file) ?? "";
    const directive = fileDirective(source);
    const specifiers = directive === "server"
      ? []
      : valueImportSpecifiers(ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true));
    const entry = { directive, specifiers };
    parseCache.set(file, entry);
    return entry;
  }

  function expand(start) {
    const queue = [start];
    while (queue.length > 0) {
      const file = queue.shift();
      if (edges.has(file)) continue;
      const out = [];
      edges.set(file, out);
      for (const specifier of importsOf(file).specifiers) {
        const packageName = specifier.match(/^(@[^/]+\/[^/]+|[^./][^/]*)/)?.[1];
        if (packageName && heavySet.has(packageName)) {
          const node = `pkg:${packageName}`;
          heavyTargets.set(node, packageName);
          out.push(node);
          continue;
        }
        const resolved = ts.resolveModuleName(specifier, file, parsed.options, host).resolvedModule?.resolvedFileName;
        if (!resolved || toPosix(resolved).includes("/node_modules/") || resolved.endsWith(".d.ts")) continue;
        out.push(resolved);
        const posix = toPosix(resolved);
        if (posix.endsWith(REGISTRY_SUFFIX) || posix.endsWith(ALL_THEMES_SUFFIX)) {
          // 重いファイルは終点。中身は辿らない。
          heavyTargets.set(resolved, relative(resolved));
          if (!edges.has(resolved)) edges.set(resolved, []);
          continue;
        }
        queue.push(resolved);
      }
    }
  }

  for (const file of candidates) {
    if (importsOf(file).directive !== "client") continue;
    clientFiles.push(file);
    expand(file);
  }

  // 各 "use client" ファイルから重い依存への最短経路を、構築済みの辺だけで求める。
  const offenders = [];
  for (const start of clientFiles) {
    const parent = new Map();
    const seen = new Set([start]);
    const queue = [start];
    let hit = null;
    if (heavyTargets.has(start)) hit = start;
    while (!hit && queue.length > 0) {
      const node = queue.shift();
      for (const next of edges.get(node) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        parent.set(next, node);
        if (heavyTargets.has(next)) { hit = next; break; }
        queue.push(next);
      }
    }
    if (!hit) continue;
    const chain = [];
    for (let cursor = hit; cursor !== undefined; cursor = parent.get(cursor)) {
      chain.unshift(cursor.startsWith("pkg:") ? heavyTargets.get(cursor) : relative(cursor));
    }
    offenders.push({ file: relative(start), chain, target: heavyTargets.get(hit) });
  }
  offenders.sort((left, right) => left.file.localeCompare(right.file));

  return { scanned: candidates.length, clientFiles: clientFiles.map(relative).sort(), offenders };
}

/**
 * 検出結果を baseline (許容する既存の経路を持つファイル) と比べる。
 * - added: baseline に無いのに届いているファイル (増加。これがあれば失敗)
 * - stale: baseline にあるのに届かなくなったファイル (縮小できる。警告)
 * - blind: baseline が空でないのに 1 件も検出できない (経路をたどれていない疑い。失敗)
 */
export function compareWithBaseline({ offenders, clientFiles, baselineFiles }) {
  const baseline = new Set(baselineFiles);
  const current = new Set(offenders.map((offender) => offender.file));
  const added = offenders.filter((offender) => !baseline.has(offender.file));
  const stale = [...baseline].filter((file) => !current.has(file)).sort();
  const missingFromScan = stale.filter((file) => !clientFiles.includes(file));
  const blind = baseline.size > 0 && offenders.length === 0;
  return { added, stale, missingFromScan, blind };
}
