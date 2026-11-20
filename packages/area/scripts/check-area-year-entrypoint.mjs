#!/usr/bin/env node
/** Guard executable sources/configs, including tests/workflows, using exact-file occurrence ceilings.
 * --init creates the baseline once; migrations must remove/shrink entries afterwards.
 * HEAD/parent/merge-base constrain growth; --base adds an explicit review base.
 * Credential files are excluded before reading the git tracked/nonignored source inventory.
 */
import ts from "typescript";
import { PREF_NAMES } from "../mirror/prefectures.cjs";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, lstatSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const ALLOWLIST = ".claude/config/area-year-entrypoint-baseline.json";
const ENTRY = new Set([
  "packages/area/src/index.ts",
  "packages/area/mirror/prefectures.cjs",
  "packages/estat-api/src/stats-data/utils/extract-year-code.ts",
  "packages/estat-api/mirror/year-code.mjs",
  "packages/area/src/utils/area-code.ts",
  // この検査の定義と固定用の入力 (違反の形を書いた文字列を持つので数えない)
  "packages/area/scripts/check-area-year-entrypoint.mjs",
  "packages/area/src/__tests__/area-year-entrypoint.test.ts",
]);
// version 1 の 4 種 (関数名と県名配列)。version 2 で地域コードの自前の変換・判定・定数の書き方を足した。
const V1_LITERALS = ["prefCheck", "cityCheck", "yearCheck", "prefectureNames"];
// prefSlice: 先頭 2 桁を切る / pref5Build: 5 桁を組む / prefRegex: 県コードの正規表現・endsWith("000")
// nationalLiteral: "00000" / pref2Compare: 2 桁の県コードとの比較 / prefCount47: 県の数 47 との比較・定数
// prefArrayGen: Array.from({ length: 47 }) / topoPrefCode: TopoJSON の N03_007
const V2_LITERALS = ["prefSlice", "pref5Build", "prefRegex", "nationalLiteral", "pref2Compare", "prefCount47", "prefArrayGen", "topoPrefCode"];
const LITERALS = [...V1_LITERALS, ...V2_LITERALS];
const VERSION = 2;
// prefSlice・pref5Build・pref2Compare は同じ行に地域コードの語があるときだけ数える。メッシュコード・版番号の行は数えない。
const AREA_CONTEXT = /code|area|pref|city|muni|N03|地域|県/i;
const NOT_AREA_CONTEXT = /mesh|version/i;
const PREF_REGEX_FORM = /\\d\{2\}000|\[0-9\]\{2\}000|\(0\[1-9\]\|\[1-3\]|4\[0-7\]/;
const PREF_2DIGIT = /^(0[1-9]|[1-3]\d|4[0-7])$/;
const COUNT_CONST_NAME = /(COUNT|_PREFS?|PREFECTURES?)/;
const names = new Set(PREF_NAMES.flatMap((name) => [name, name.replace(/[都府県]$/, "")]));

export function isSource(path) {
  if (/^\.env(?:\.|$)/.test(basename(path))) return false;
  if (/(?:^|\/)(?:node_modules|\.git)\//.test(path) || /^(?:\.agents|\.codex)\//.test(path)) return false;
  return /\.[cm]?[jt]sx?$/.test(path);
}

/** 種類ごとの件数 (ファイルごとの基準と比べる値)。 */
export function literalCounts(text, path = "source.ts") {
  const counts = Object.fromEntries(LITERALS.map((key) => [key, 0]));
  for (const { key } of literalHits(text, path)) counts[key]++;
  return counts;
}

/** 種類と行番号の一覧。件数が基準を超えたときに、どの行かを調べるために使う。 */
export function literalHits(text, path = "source.ts") {
  const hits = [];
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lines = text.split("\n");
  const hit = (key, node) => hits.push({ key, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
  const lineOf = (node) => lines[source.getLineAndCharacterOfPosition(node.getStart(source)).line] ?? "";
  const inArea = (node) => { const line = lineOf(node); return AREA_CONTEXT.test(line) && !NOT_AREA_CONTEXT.test(line); };
  const notMeshOrVersion = (node) => !NOT_AREA_CONTEXT.test(lineOf(node));
  const isNum = (node, value) => ts.isNumericLiteral(node) && node.text === String(value);
  const isStr = (node) => ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
  function visit(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isVariableDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
      const name = node.name.getText(source);
      if (name === 'isPrefCode5') hit("prefCheck", node);
      if (name === 'isCityCode5') hit("cityCheck", node);
      if (name === 'to4') hit("yearCheck", node);
    }
    if (ts.isArrayLiteralExpression(node) && node.elements.length === 47) {
      const found = new Set();
      function collect(child) {
        if (ts.isStringLiteralLike(child) && names.has(child.text)) found.add(child.text.replace(/[都府県]$/, ''));
        ts.forEachChild(child, collect);
      }
      collect(node);
      if (found.size === 47) hit("prefectureNames", node);
    }
    // 全国コード "00000" の直書き
    if (isStr(node) && node.text === "00000" && notMeshOrVersion(node)) hit("nationalLiteral", node);
    // TopoJSON の都道府県コード N03_007 (識別子でもキー文字列でも)
    if ((ts.isIdentifier(node) || isStr(node)) && node.text === "N03_007") hit("topoPrefCode", node);
    // 県コードの正規表現 (リテラル・new RegExp("..."))
    if (ts.isRegularExpressionLiteral(node) && PREF_REGEX_FORM.test(node.text) && notMeshOrVersion(node)) hit("prefRegex", node);
    if (ts.isNewExpression(node) && node.expression.getText(source) === "RegExp" && node.arguments?.[0] && isStr(node.arguments[0])
      && PREF_REGEX_FORM.test(node.arguments[0].text) && notMeshOrVersion(node)) hit("prefRegex", node);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const args = node.arguments;
      // endsWith("000") で県コードかを判定
      if (method === "endsWith" && args.length === 1 && isStr(args[0]) && args[0].text === "000" && notMeshOrVersion(node)) hit("prefRegex", node);
      // code.slice(0, 2) など先頭 2 桁を切る
      if (["slice", "substring", "substr"].includes(method) && args.length >= 2 && isNum(args[0], 0) && isNum(args[1], 2) && inArea(node)) hit("prefSlice", node);
      // padStart(5) / padEnd(5) / padStart(2, "0") で桁を揃える
      if ((method === "padStart" || method === "padEnd") && args.length >= 1 && inArea(node)
        && (isNum(args[0], 5) || (method === "padStart" && isNum(args[0], 2) && args[1] && isStr(args[1]) && args[1].text === "0"))) hit("pref5Build", node);
      // startsWith("13") など 2 桁の県コードとの比較
      if (method === "startsWith" && args.length >= 1 && isStr(args[0]) && PREF_2DIGIT.test(args[0].text) && inArea(node)) hit("pref2Compare", node);
      // Array.from({ length: 47 })
      if (method === "from" && node.expression.expression.getText(source) === "Array" && args[0] && ts.isObjectLiteralExpression(args[0])
        && args[0].properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText(source) === "length" && isNum(p.initializer, 47))) hit("prefArrayGen", node);
    }
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      // `${pref}000` ではなく pref + "000" で 5 桁を組む
      if (op === ts.SyntaxKind.PlusToken && ((isStr(node.right) && node.right.text === "000") || (isStr(node.left) && node.left.text === "000")) && inArea(node)) hit("pref5Build", node);
      if ([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(op)) {
        const sides = [node.left, node.right];
        if (sides.some((side) => isNum(side, 47)) && notMeshOrVersion(node)) hit("prefCount47", node);
        if (sides.some((side) => isStr(side) && PREF_2DIGIT.test(side.text)) && inArea(node)) hit("pref2Compare", node);
      }
    }
    // `${pref}000` のテンプレート
    if (ts.isTemplateExpression(node) && node.templateSpans.some((span) => span.literal.text.startsWith("000")) && inArea(node)) hit("pref5Build", node);
    // const PREFECTURE_COUNT = 47
    if (ts.isVariableDeclaration(node) && node.initializer && isNum(node.initializer, 47) && COUNT_CONST_NAME.test(node.name.getText(source))) hit("prefCount47", node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return hits;
}

/**
 * 比べる元の基準を、元の commit から今の作業ツリーまでの改名 (git の -M 判定) に合わせて読み替える。
 * 改名したファイルの行は、新しいパスの「追加」ではなく元のパスの行の引き継ぎとして比べる (2026-11-19 に部品を packages へ移したとき、
 * 改名が追加とみなされて縮小専用の比較が落ちた)。
 */
export function followRenames(previous, renames) {
  if (!previous) return previous;
  const next = { ...previous };
  for (const [from, to] of renames) {
    if (next[from] && !next[to]) next[to] = next[from];
  }
  return next;
}

/** 改名に加え、元のパスに薄い入口だけを残した移動も拾う (-B で書き換えを分け、コピーの行として出る) */
function renamesSince(git, base) {
  try {
    return git(["diff", "--name-status", "-M", "-B", base, "--"]).split("\n")
      .map((line) => line.split("\t"))
      .filter((cols) => cols.length === 3 && /^[RC]/.test(cols[0]))
      .map((cols) => [cols[1], cols[2]]);
  } catch { return []; }
}

export function auditSources(files, exceptions, previous, previousVersion = VERSION) {
  const errors = [];
  if (previous) {
    // 古い版 (version 1) の基準には新しい種類の列が無い。その版との比較は持っていた種類だけで行い、
    // 載っていなかったファイルは件数 0 だったものとして扱う (版を上げる 1 回だけの橋渡し)。
    const legacy = previousVersion < VERSION;
    const keys = legacy ? V1_LITERALS : LITERALS;
    for (const [path, rule] of Object.entries(exceptions)) {
      const old = previous[path] ?? (legacy ? Object.fromEntries(keys.map((key) => [key, 0])) : undefined);
      if (!old || keys.some((key) => rule[key] > old[key])) errors.push(`${path}: allowlist may only shrink`);
    }
  }
  const seen = new Set();
  for (const { path, text } of files) {
    if (!isSource(path) || ENTRY.has(path)) continue;
    const counts = literalCounts(text, path);
    const rule = exceptions[path];
    if (!LITERALS.some((key) => counts[key])) continue;
    seen.add(path);
    if (!rule || !rule.reason?.trim() || LITERALS.some((key) => counts[key] > rule[key])) {
      errors.push(`${path}: entrypoint literals outside approved limits (${JSON.stringify(counts)})`);
    }
    if (rule && LITERALS.some((key) => counts[key] < rule[key])) errors.push(`${path}: shrink stale allowlist counts`);
  }
  for (const [path, rule] of Object.entries(exceptions)) {
    if (!seen.has(path)) errors.push(`${path}: remove unused allowlist entry`);
    if (!rule.reason?.trim() || LITERALS.some((key) => !Number.isInteger(rule[key]) || rule[key] < 0)) errors.push(`${path}: invalid exception`);
  }
  return errors;
}

export function sourceInventory(root = ROOT) {
  const paths = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return [...new Set(paths.split("\0").filter(Boolean))].filter(isSource).filter((path) =>
    existsSync(resolve(root, path)) && lstatSync(resolve(root, path)).isFile()).map((path) => ({ path, text: readFileSync(resolve(root, path), "utf8") }));
}

export function main(args = process.argv.slice(2)) {
  const init = args.length === 1 && args[0] === "--init";
  if (!init && args.length && (args.length !== 2 || args[0] !== "--base" || args[1].startsWith("-"))) {
    throw new Error("Usage: check-area-year-entrypoint.mjs [--init | --base ref]");
  }
  if (init) {
    if (existsSync(resolve(ROOT, ALLOWLIST))) throw new Error("Baseline already exists; --init refuses to overwrite it");
    const exceptions = {};
    for (const { path, text } of sourceInventory().sort((a, b) => a.path.localeCompare(b.path))) {
      if (ENTRY.has(path)) continue;
      const counts = literalCounts(text, path);
      if (LITERALS.some((key) => counts[key])) {
        exceptions[path] = { ...counts, reason: "既存の名称配列。表示順・fixture・固有データとの対応を維持するため、この段では残置" };
      }
    }
    writeFileSync(resolve(ROOT, ALLOWLIST), JSON.stringify({
      version: VERSION,
      policy: "縮小専用。パス・出現数の追加は禁止。HEAD・親commit・origin/developとのmerge-baseからの増加を検査する。--baseで比較基準を追加できる。",
      exceptions,
    }, null, 2) + "\n", { flag: "wx" });
    console.log(`Initialized ${ALLOWLIST}: ${Object.keys(exceptions).length} entries`);
    return;
  }
  const exceptions = JSON.parse(readFileSync(resolve(ROOT, ALLOWLIST), "utf8")).exceptions;
  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const bases = new Set(["HEAD", "HEAD^"]);
  try { bases.add(git(["merge-base", "HEAD", "origin/develop"])); } catch { /* Offline checkouts may have no remote ref. */ }
  const previous = [];
  for (const base of bases) {
    // First introduction has no prior manifest. Once present, malformed baselines fail closed.
    try { git(["cat-file", "-e", `${base}:${ALLOWLIST}`]); } catch { continue; }
    const doc = JSON.parse(git(["show", `${base}:${ALLOWLIST}`]));
    previous.push({ ...doc, exceptions: followRenames(doc.exceptions, renamesSince(git, base)) });
  }
  if (args.length) {
    const doc = JSON.parse(git(["show", `${args[1]}:${ALLOWLIST}`]));
    previous.push({ ...doc, exceptions: followRenames(doc.exceptions, renamesSince(git, args[1])) });
  }
  const files = sourceInventory();
  const errors = [...new Set([undefined, ...previous].flatMap((baseline) =>
    auditSources(files, exceptions, baseline?.exceptions, baseline?.version ?? 1)))];
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  console.log(JSON.stringify({ checked: files.length, exceptions: Object.keys(exceptions).length, pass: errors.length === 0, failures: errors.length }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
