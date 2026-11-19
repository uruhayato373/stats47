#!/usr/bin/env node
/**
 * スクリプトを別の場所へ移し、相対パスの読みと旧パスの言及を機械的に付け替える (SCRIPTS-TO-PACKAGES-02)。
 *
 *   node .claude/scripts/lib/move-script.mjs <map.json>          # 何が変わるかを表示するだけ
 *   node .claude/scripts/lib/move-script.mjs <map.json> --apply  # 実際に移す
 *
 * map.json: { "moves": [ { "from": ".claude/scripts/lib/x.mjs", "to": "packages/ops/src/a/x.mjs", "keepEntry": false } ] }
 *   keepEntry: 元のパスに薄い入口を置き直す予定のファイル (workflow・品質ゲートの台帳が名指しするパスは変えない)。
 *   bridge:    元のパスに 1 行の橋渡し (テストの require・部品の再エクスポート) を置き直す予定のファイル。
 *              main の workflow の定義が名指しする間だけ置き、リリース後に消す。旧パスの言及は書き換える。
 *   origin/main の workflow が名指しするパスは、keepEntry か bridge を付けない限り移さない (定期実行は main の定義で動く)。
 *              旧パスの言及は書き換えず、基準の JSON のキーだけを新しいパスへ移す。入口のファイル自体は作らない。
 *
 * やること (どれも決定的。判断が要る箇所は最後の一覧に出すだけで、触らない):
 *   1. git mv
 *   2. 移したファイルの中の相対パスの文字列 (import・require・path.resolve の引数) を、新しい場所からの相対パスに付け替える
 *   3. ほかのファイルが移したファイルを相対パスで読んでいる箇所を、新しい相対パスに書き換える
 *   4. リポジトリ直下からのパスの文字列 (package.json・workflow・基準のキー・規則・スキル・docs) を置き換える
 *   5. 残った言及・移したファイルの `.claude` の文字列・ROOT を求める式を一覧にする
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, lstatSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CODE = /\.(?:[cm]?[jt]sx?|sh)$/;
const TEXT = /\.(?:[cm]?[jt]sx?|sh|json|ya?ml|md|toml)$/;
/** 当時のパスを記録した履歴と、機械が書く記録は書き換えない */
const HISTORY = [".claude/memory/", ".claude/state/", ".claude/todo/", "data/", "node_modules/"];
const BASELINE = /^\.claude\/config\/[\w-]+-baseline\.json$/;
const REL_LITERAL = /(["'`])(\.{1,2}\/[^"'`\n$]*?)\1/g;
const EXTENSIONS = ["", ".mjs", ".cjs", ".js", ".ts", ".mts", ".tsx"];

const posix = (p) => p.split(path.sep).join("/");
const relativeSpec = (fromFile, target) => {
  const rel = path.posix.relative(path.posix.dirname(fromFile), target);
  return rel.startsWith(".") ? rel : `./${rel}`;
};

/**
 * 1 ファイルの中の相対パスの文字列を付け替える。
 * @param {string} text
 * @param {string} oldFile  移す前のパス (移さないファイルなら今のパス)
 * @param {string} newFile  移した後のパス (移さないファイルなら oldFile と同じ)
 * @param {Map<string, string>} moved  旧パス → 新パス
 * @param {(repoPath: string) => boolean} exists  移す前のリポジトリにそのパスがあるか
 */
export function rewriteRelative(text, oldFile, newFile, moved, exists) {
  const selfMoved = oldFile !== newFile;
  return text.replace(REL_LITERAL, (whole, quote, spec, offset) => {
    const [bare, suffix = ""] = spec.split(/(?=[?#])/);
    // "../" のような点と斜線だけの文字列は、パスの組み立て (__dirname・import.meta) の行でだけ付け替える。
    // リンクや import の検査が比べる文字列 (startsWith("../") など) を壊さないため
    if (/^(?:\.\.?\/?)+$/.test(bare)) {
      const line = text.slice(text.lastIndexOf("\n", offset) + 1, text.indexOf("\n", offset) >>> 0);
      if (!/__dirname|import\.meta|new URL\(/.test(line)) return whole;
    }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(oldFile), bare));
    const ext = EXTENSIONS.find((e) => moved.has(resolved + e));
    if (ext !== undefined) {
      const target = moved.get(resolved + ext);
      const next = relativeSpec(newFile, ext ? target.slice(0, -ext.length) : target);
      return `${quote}${next}${suffix}${quote}`;
    }
    // 移したファイル自身の読みは、指す先が実在するときだけ付け替える (実行場所からの相対パスや glob は触らない)
    if (!selfMoved || !EXTENSIONS.some((e) => exists(resolved + e))) return whole;
    const trailing = bare.endsWith("/") ? "/" : "";
    return `${quote}${relativeSpec(newFile, resolved)}${trailing}${suffix}${quote}`;
  });
}

/** リポジトリ直下からのパスの文字列を置き換える。keepEntry は基準の JSON のキーだけ */
export function replaceRepoPaths(text, file, moves) {
  let next = text;
  for (const { from, to, keepEntry } of moves) {
    if (keepEntry && !BASELINE.test(file)) continue;
    next = keepEntry ? next.split(`"${from}"`).join(`"${to}"`) : next.split(from).join(to);
  }
  return next;
}

/** 移したファイルの中で、人が確かめる行 (ROOT を求める式と .claude の文字列) */
export function reviewLines(text) {
  return text.split("\n").flatMap((line, index) => {
    if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return [];
    // 点と斜線だけの文字列 ("..", "../../..") は ROOT を求める式の一部。複数行に分かれていても出す
    const root = /["'`](?:\.\.?\/?)+["'`]/.test(line);
    const claude = /["'`][^"'`]*\.claude(?:[/"'`]|$)/.test(line);
    return root || claude ? [`${index + 1}: ${line.trim().slice(0, 140)}`] : [];
  });
}

function trackedFiles(root) {
  const out = execFileSync("git", ["-c", "core.quotepath=off", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return [...new Set(out.split("\0").filter(Boolean))].filter((file) => {
    if (!TEXT.test(file) || file.includes("node_modules/") || HISTORY.some((dir) => file.startsWith(dir))) return false;
    const abs = path.join(root, file);
    return existsSync(abs) && lstatSync(abs).isFile();
  });
}

/**
 * 定期実行の workflow は main の定義で動き、中で develop のコードを使う。main の定義が旧パスを名指ししている
 * ファイルを入口も橋渡しも置かずに移すと、次のリリースまで定期実行が落ちる (2026-11-19 に 3 本で起きた)。
 * @param {{ from: string, keepEntry?: boolean, bridge?: boolean }[]} moves
 * @param {string} mainWorkflowText  origin/main の .github/workflows/ を連結した本文
 * @returns {string[]} 止める理由 (空なら移してよい)
 */
export function blockedByMainWorkflows(moves, mainWorkflowText) {
  return moves
    .filter(({ from, keepEntry, bridge }) => !keepEntry && !bridge && mainWorkflowText.includes(from))
    .map(({ from }) => `${from}: origin/main の workflow が名指ししている。keepEntry: true (本体に入口を置く) か bridge: true (テスト・部品に 1 行の橋渡しを置く) を指定する`);
}

function mainWorkflowText(root) {
  try {
    const names = execFileSync("git", ["ls-tree", "--name-only", "origin/main", ".github/workflows/"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
    return names.map((name) => execFileSync("git", ["show", `origin/main:${name}`], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })).join("\n");
  } catch {
    throw new Error("origin/main の workflow を読めない。git fetch origin main をしてから実行する");
  }
}

export function main(args = process.argv.slice(2)) {
  const rootFlag = args.indexOf("--root");
  const root = rootFlag >= 0 ? path.resolve(args[rootFlag + 1]) : fileURLToPath(new URL("../../../", import.meta.url));
  const mapFile = args.find((arg, index) => !arg.startsWith("--") && (rootFlag < 0 || index !== rootFlag + 1));
  if (!mapFile) throw new Error("usage: move-script.mjs <map.json> [--apply] [--root <dir>]");
  const apply = args.includes("--apply");
  const { moves } = JSON.parse(readFileSync(mapFile, "utf8"));
  for (const { from, to } of moves) {
    if (!existsSync(path.join(root, from))) throw new Error(`移す元が無い: ${from}`);
    if (existsSync(path.join(root, to))) throw new Error(`移す先に既にある: ${to}`);
  }
  const blocked = blockedByMainWorkflows(moves, mainWorkflowText(root));
  if (blocked.length) throw new Error(`main の定義が名指しするパスを移そうとしている:\n${blocked.join("\n")}`);
  const moved = new Map(moves.map(({ from, to }) => [posix(from), posix(to)]));
  const exists = (repoPath) => existsSync(path.join(root, repoPath));
  const files = trackedFiles(root);
  const changes = [];
  for (const file of files) {
    const before = readFileSync(path.join(root, file), "utf8");
    const target = moved.get(file) ?? file;
    let after = CODE.test(file) ? rewriteRelative(before, file, target, moved, exists) : before;
    after = replaceRepoPaths(after, file, moves);
    if (after !== before) changes.push({ file, target, after });
  }
  console.log(`移すファイル ${moves.length} / 書き換えるファイル ${changes.length}`);
  for (const { file, target } of changes) console.log(`  ${target === file ? file : `${file} → ${target}`}`);
  if (!apply) { console.log("(表示だけ。--apply で実行する)"); return; }

  for (const { from, to } of moves) {
    mkdirSync(path.dirname(path.join(root, to)), { recursive: true });
    execFileSync("git", ["mv", from, to], { cwd: root });
  }
  for (const { target, after } of changes) writeFileSync(path.join(root, target), after);

  console.log("\n== 確かめる行 (ROOT を求める式・.claude の文字列)");
  for (const { to } of moves) {
    const lines = reviewLines(readFileSync(path.join(root, to), "utf8"));
    if (lines.length) console.log(`${to}\n${lines.map((line) => `  ${line}`).join("\n")}`);
  }
  console.log("\n== 旧パスの名前が残っている箇所 (入口を残すファイルの名指しは残ってよい)");
  for (const { from, keepEntry } of moves) {
    let hits = "";
    try {
      hits = execFileSync("git", ["-c", "core.quotepath=off", "grep", "-n", "-F", from, "--", ".", ":!.claude/memory", ":!.claude/state", ":!.claude/todo", ":!data"], { cwd: root, encoding: "utf8" }).trim();
    } catch { /* 0 件 */ }
    if (hits) console.log(`${from}${keepEntry ? " (入口を残す)" : ""}\n${hits.split("\n").slice(0, 12).map((line) => `  ${line.slice(0, 170)}`).join("\n")}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
