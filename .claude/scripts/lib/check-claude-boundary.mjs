#!/usr/bin/env node
/**
 * apps・packages・config が `.claude` を読んでいないかを数える (SCRIPTS-TO-PACKAGES-01・2026-11-19 オーナー判断)。
 *
 * 決まり: apps と packages は、本番コードもテストも `.claude` を import せず、ファイルとしても読まない。
 * 例外は、管理画面 (apps/admin) の本番コードがエージェントの運用の状態を表示のためにデータとして読むものだけ。
 *
 * 数えるもの (コメントは数えない。TypeScript の構文木で文字列だけを見る):
 *   - `.claude/` を含む文字列 (import の指定・require・vi.mock・パスの文字列)
 *   - `".claude"` だけの文字列 (path.join(root, ".claude", "todo") のような組み立て)
 *
 * 件数はファイルごとに .claude/config/claude-boundary-baseline.json の上限と比べる。基準は縮小専用で、
 * HEAD・親 commit・origin/develop との merge-base より増えたら失敗する (改名は元の行を引き継ぐ)。
 * --init は基準が無いときだけ作る。
 */
import ts from "typescript";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const BASELINE = ".claude/config/claude-boundary-baseline.json";
const SCOPES = ["apps/", "packages/", "config/"];

export function isSource(path) {
  if (!SCOPES.some((scope) => path.startsWith(scope))) return false;
  if (/(?:^|\/)node_modules\//.test(path)) return false;
  return /\.(?:[cm]?[jt]sx?)$/.test(path) && !/\.d\.(?:m|c)?ts$/.test(path);
}

/** ファイルの中で `.claude` を指す文字列の数と、その行番号 */
export function claudeHits(text, path = "source.ts") {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lines = [];
  function visit(node) {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const value = node.text;
      if (value === ".claude" || /(?:^|[/\\])\.claude(?:[/\\]|$)/.test(value)) {
        lines.push(source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return lines;
}

export function followRenames(previous, renames) {
  if (!previous) return previous;
  const next = { ...previous };
  for (const [from, to] of renames) {
    if (next[from] && !next[to]) next[to] = next[from];
  }
  return next;
}

/** 今の件数を基準と比べる。errors は人に読ませる 1 行ずつ */
export function audit(files, baseline, previous) {
  const errors = [];
  const seen = new Set();
  for (const { path, text } of files) {
    const count = claudeHits(text, path).length;
    if (!count) continue;
    seen.add(path);
    const rule = baseline[path];
    if (!rule) errors.push(`${path}: .claude を ${count} か所で読んでいる (基準に無い)。@stats47/ops などパッケージの部品を読むか、管理画面はカタログ (config/datasets.mjs) から引く`);
    else if (count > rule.count) errors.push(`${path}: .claude を読む箇所が増えた (${rule.count} → ${count})`);
    else if (count < rule.count) errors.push(`${path}: 減った分だけ基準を縮める (${rule.count} → ${count})`);
  }
  for (const [path, rule] of Object.entries(baseline)) {
    if (!seen.has(path)) errors.push(`${path}: もう読んでいないので基準から外す`);
    if (!rule.reason?.trim() || !Number.isInteger(rule.count) || rule.count < 1) errors.push(`${path}: 基準の行が不正 (count と reason が要る)`);
  }
  if (previous) {
    for (const [path, rule] of Object.entries(baseline)) {
      const old = previous[path];
      if (!old || rule.count > old.count) errors.push(`${path}: 基準は縮小専用 (行の追加・件数の増加は禁止)`);
    }
  }
  return errors;
}

function sourceFiles() {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return [...new Set(out.split("\0").filter(Boolean))].filter(isSource)
    .filter((path) => existsSync(resolve(ROOT, path)) && lstatSync(resolve(ROOT, path)).isFile())
    .map((path) => ({ path, text: readFileSync(resolve(ROOT, path), "utf8") }));
}

function renamesSince(git, base) {
  try {
    return git(["diff", "--name-status", "-M", base, "--"]).split("\n")
      .map((line) => line.split("\t"))
      .filter((cols) => cols.length === 3 && cols[0].startsWith("R"))
      .map((cols) => [cols[1], cols[2]]);
  } catch { return []; }
}

export function main(args = process.argv.slice(2)) {
  const files = sourceFiles();
  if (args[0] === "--init") {
    if (existsSync(resolve(ROOT, BASELINE))) throw new Error("基準は既にある。--init は上書きしない");
    const entries = {};
    for (const { path, text } of files.sort((a, b) => a.path.localeCompare(b.path))) {
      const count = claudeHits(text, path).length;
      if (count) entries[path] = { count, reason: "2026-11-19 の基準づくりの時点で残っていた読み。理由を書いて減らす" };
    }
    writeFileSync(resolve(ROOT, BASELINE), JSON.stringify({
      policy: "縮小専用。apps・packages・config は .claude を読まない。例外は管理画面の本番コードが運用の状態をデータとして読むものだけ",
      files: entries,
    }, null, 2) + "\n", { flag: "wx" });
    console.log(`基準を作った: ${Object.keys(entries).length} ファイル`);
    return;
  }
  const baseline = JSON.parse(readFileSync(resolve(ROOT, BASELINE), "utf8")).files;
  const git = (a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const bases = new Set(["HEAD", "HEAD^"]);
  try { bases.add(git(["merge-base", "HEAD", "origin/develop"])); } catch { /* remote の無い checkout */ }
  const previous = [];
  for (const base of bases) {
    try { git(["cat-file", "-e", `${base}:${BASELINE}`]); } catch { continue; }
    previous.push(followRenames(JSON.parse(git(["show", `${base}:${BASELINE}`])).files, renamesSince(git, base)));
  }
  const errors = [...new Set([undefined, ...previous].flatMap((p) => audit(files, baseline, p)))];
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  console.log(JSON.stringify({ checked: files.length, files: Object.keys(baseline).length, pass: errors.length === 0, failures: errors.length }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
