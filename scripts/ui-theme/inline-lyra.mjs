#!/usr/bin/env node
/**
 * style-lyra.css (テンプレートの正本) の cn-* 規則を、部品のソースの className へ書き込む。
 *
 * なぜ要るか: これまで公開サイトは lyra の規則を CSS として読み (style-lyra.used.css)、同じ見た目を
 * ユーティリティと lyra の規則の 2 通りで CSS に出していた。規則の中身を部品の className へ移し、
 * lyra の CSS を読まないようにすると、全ページ共通の CSS が軽くなる (2026-10-28 CSS-3 オーナー決定)。
 *
 * 勝ち方は CSS で読んでいたときと同じにする。lyra はレイヤーの外にあり、部品の素のクラスにも呼び出し側の
 * className にも勝っていた (勝てるのは ! 付きだけ。テンプレートも呼び出し側で ! を付ける)。そのため:
 * - cn(…) の引数に cn-* を含む文字列があれば、その規則の @apply を最後の引数 `/* lyra *\/ "…"` として足す
 *   (className より後ろなので、tailwind-merge が lyra の値を残す)
 * - cva(…) の文字列に cn-* があれば、同じ variant の形で lyra だけの cva (`<名前>Lyra`) を
 *   `// lyra:begin` 〜 `// lyra:end` の間に書く。部品は「素のクラス → className → lyra」の順に合成する
 * - lyra に負けていた素のクラスのうち、tailwind-merge では消えないもの (hover: など variant 付き) は文字列から外す
 * cn-* の名前は目印として文字列に残す。
 *
 * 守ること:
 * - 正本 (style-lyra.css) と生成した部分は手で直さない。テンプレートを取り直したら部品を写し、このスクリプトを再実行する
 * - cn-* はソースに文字列として書く。`cn-${x}` や "cn-" + x のように組み立てると拾えない (テストが拒否する)
 *
 * 使い方:
 *   node scripts/ui-theme/inline-lyra.mjs          # 部品のソースを書き直す
 *   node scripts/ui-theme/inline-lyra.mjs --check  # 書き直さずに、書き込み漏れだけを調べる (漏れがあれば exit 1)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { cn } from "../../packages/components/src/lib/cn.ts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SOURCE_CSS = join(ROOT, "packages/ui-theme/style-lyra.css");
/** 見本サイトに合わせて lyra の値を置き換える差分 (正本 style-lyra.css は手で直さないので別に持つ) */
export const REFERENCE_CSS = join(ROOT, "packages/ui-theme/style-reference.css");

/** cn-* を探すソースの場所。apps/web/tailwind.config.ts の content と同じ 3 か所 */
export const SOURCE_DIRS = ["apps/web/src", "packages/components/src", "packages/visualization/src"];

/**
 * どこからも import されない atom (packages/components/src/atoms/ui/<name>.tsx)。index.ts の export * には
 * 残るが、描画されないので Tailwind の走査 (apps/web/tailwind.config.ts の content の "!" 除外) からもこの書き込みからも外す。
 * 使い始めたら両方から消す (テストが apps/web/tailwind.config.ts の content の除外との一致と importer 0 件を確かめる)。
 */
export const UNUSED_ATOMS = ["accordion", "alert", "alert-dialog", "dialog", "progress", "switch", "textarea"];
const UNUSED_ATOM_FILES = new Set(
  UNUSED_ATOMS.map((name) => join(ROOT, "packages/components/src/atoms/ui", `${name}.tsx`))
);

const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|mdx)$/;
/** テストは書き換えない */
const IGNORED_DIR = new Set(["node_modules", "__tests__", "__mocks__", ".next"]);
const IGNORED_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

/** 組み立てられた cn-*: `cn-${…}` / "cn-" + … / `cn-` で終わる文字列 */
const DYNAMIC_CN = /(?<![A-Za-z0-9_-])cn-(?:\$\{|["'`]\s*\+|["'`])/g;
const LYRA_ARG = "/* lyra */";

export function listSourceFiles(root = ROOT, dirs = SOURCE_DIRS) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIR.has(entry.name)) walk(join(dir, entry.name));
        continue;
      }
      const file = join(dir, entry.name);
      if (!SOURCE_EXT.test(entry.name) || IGNORED_FILE.test(entry.name)) continue;
      if (root === ROOT && UNUSED_ATOM_FILES.has(file)) continue;
      files.push(file);
    }
  };
  for (const dir of dirs) walk(join(root, dir));
  return files.sort();
}

/**
 * 正本を規則名 → @apply の中身に分ける。
 * 正本は `.style-lyra {` の中に 2 スペース字下げの `.cn-x {` … `}` が並び、本文は `@apply …;` だけを持つ。
 * それ以外の形が来たら黙って落とさず例外にする (テンプレートの取り直しで形が変わったことに気づくため)。
 */
export function parseLyra(css, root = ".style-lyra") {
  const lines = css.split("\n");
  if (lines[0] !== `${root} {`) throw new Error(`style-lyra.css の 1 行目が \`${root} {\` ではない`);
  const rules = new Map();
  let i = 1;
  let closed = false;
  while (i < lines.length) {
    const line = lines[i];
    if (line === "}") {
      closed = true;
      i += 1;
      break;
    }
    if (line === "" || /^  \/\*.*\*\/$/.test(line)) {
      i += 1;
      continue;
    }
    const head = /^  \.(cn-[a-z0-9]+(?:-[a-z0-9]+)*) \{$/.exec(line);
    if (!head) throw new Error(`style-lyra.css ${i + 1} 行目を解釈できない: ${line}`);
    const classes = [];
    i += 1;
    while (i < lines.length && lines[i] !== "  }") {
      // 正本の最後の規則 (cn-menu-translucent) は末尾の ; を持たない
      const apply = /^    @apply (.+?);?$/.exec(lines[i]);
      if (!apply) throw new Error(`style-lyra.css ${i + 1} 行目: 規則 ${head[1]} の中が @apply ではない`);
      classes.push(apply[1].trim());
      i += 1;
    }
    if (i >= lines.length) throw new Error(`style-lyra.css: 規則 ${head[1]} が閉じていない`);
    if (rules.has(head[1])) throw new Error(`style-lyra.css: 規則 ${head[1]} が 2 回ある`);
    rules.set(head[1], classes.join(" "));
    i += 1;
  }
  if (!closed) throw new Error("style-lyra.css の外側の `}` が無い");
  if (lines.slice(i).join("\n").trim() !== "") throw new Error("style-lyra.css の外側の `}` の後に内容がある");
  return rules;
}

/** `hover:[a]:bg-x!` → variant の並び・本体・! の有無 */
function splitClass(token) {
  const important = token.startsWith("!") || token.endsWith("!");
  const body = token.replace(/^!|!$/g, "");
  const variants = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "[" || ch === "(") depth += 1;
    if (ch === "]" || ch === ")") depth -= 1;
    if (ch === ":" && depth === 0) {
      variants.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  return { variants, base: current, important };
}

/** 疑似要素 (::before など) を対象にする variant */
const PSEUDO_ELEMENT_VARIANTS = new Set(["before", "after", "placeholder", "file", "marker", "selection", "first-letter", "first-line", "backdrop"]);

/**
 * その要素ではなく子孫・疑似要素に当たる variant か (`[&_svg]`・`[&>img]`・`*`・`**`・`before` など)。
 * lyra の規則はその要素だけに当たるので、こうした素のクラスとは競わない。
 */
function targetsOtherElement(variant) {
  if (variant === "*" || variant === "**" || PSEUDO_ELEMENT_VARIANTS.has(variant)) return true;
  return variant.startsWith("[") && /&[\s_>+~]/.test(variant);
}

/**
 * lyra を CSS で読んでいたとき、lyra (レイヤーの外) に負けていた素のクラスか。
 * 素のクラスが lyra のクラスの variant をすべて持ち、本体が同じ性質を決めるなら負ける
 * (例: lyra の bg-transparent は hover:bg-muted にも勝つ)。! 付きの素のクラスは勝つ。
 */
export function losesToLyra(token, lyraTokens) {
  const raw = splitClass(token);
  if (raw.important || raw.variants.some(targetsOtherElement)) return false;
  return lyraTokens.some((lyraToken) => {
    const lyra = splitClass(lyraToken);
    if (lyra.important || !lyra.variants.every((variant) => raw.variants.includes(variant))) return false;
    return !cn(raw.base, lyra.base).split(" ").includes(raw.base);
  });
}

const markersOf = (value, rules) => value.split(/\s+/).filter((token) => rules.has(token));

/** 規則名の @apply を正本の順に並べ、同じクラスは 1 つにする */
export function lyraClasses(names, rules) {
  const order = [...rules.keys()];
  const sorted = [...new Set(names)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const tokens = sorted.flatMap((name) => rules.get(name).split(/\s+/)).filter(Boolean);
  return tokens.filter((token, index) => tokens.lastIndexOf(token) === index).join(" ");
}

/** 素のクラスの文字列から、lyra に負けていて tailwind-merge では消えないクラスを外す (lyra と同じクラスは残す) */
export function stripLosers(value, lyra) {
  const lyraTokens = lyra.split(/\s+/).filter(Boolean);
  const lyraSet = new Set(lyraTokens);
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.startsWith("cn-") || lyraSet.has(token) || !losesToLyra(token, lyraTokens))
    .join(" ");
}

/* ---- ソースの読み取り (文字列とコメントを飛ばして括弧を数える) ---- */

function skipString(text, i) {
  const quote = text[i];
  i += 1;
  while (i < text.length) {
    if (text[i] === "\\") i += 2;
    else if (text[i] === quote) return i + 1;
    else if (quote === "`" && text[i] === "$" && text[i + 1] === "{") i = matchClose(text, i + 1) + 1;
    else i += 1;
  }
  return i;
}

/** text[open] が ( / { / [ のとき、対応する閉じ括弧の位置 */
function matchClose(text, open) {
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(text, i);
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      i = text.indexOf("\n", i);
      if (i < 0) return text.length;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i) + 2;
      continue;
    }
    if (ch === "(" || ch === "{" || ch === "[") depth += 1;
    if (ch === ")" || ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  throw new Error("括弧が閉じていない");
}

/** text[open] が ( のとき、最上位の引数 (前後の空白を除いた範囲) */
function topLevelArgs(text, open) {
  const close = matchClose(text, open);
  const args = [];
  let depth = 0;
  let start = open + 1;
  let i = open + 1;
  const push = (end) => {
    const raw = text.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body) args.push({ start: start + lead, end: start + lead + body.length, text: body });
  };
  while (i < close) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(text, i);
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i) + 2;
      continue;
    }
    if (ch === "(" || ch === "{" || ch === "[") depth += 1;
    if (ch === ")" || ch === "}" || ch === "]") depth -= 1;
    if (ch === "," && depth === 0) {
      push(i);
      start = i + 1;
    }
    i += 1;
  }
  push(close);
  return { args, close };
}

const STRING_ARG = /^"([^"\n\\]*)"$/;

/** 1 つの書き換え (範囲を新しい文字列に替える) を後ろから当てる */
function applyEdits(text, edits) {
  let out = text;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  return out;
}

/* ---- cva ---- */

/** cva の第 2 引数から variants (群 → 値 → 文字列の範囲) と defaultVariants の本文を読む */
function readCvaVariants(text, objOpen) {
  const objClose = matchClose(text, objOpen);
  const body = text.slice(objOpen, objClose + 1);
  const groups = [];
  const variantsAt = body.search(/\bvariants:\s*\{/);
  if (variantsAt >= 0) {
    const vOpen = objOpen + body.indexOf("{", variantsAt);
    const vClose = matchClose(text, vOpen);
    const groupRe = /(\w+):\s*\{/g;
    groupRe.lastIndex = vOpen + 1;
    let m;
    while ((m = groupRe.exec(text)) && m.index < vClose) {
      const gOpen = m.index + m[0].length - 1;
      const gClose = matchClose(text, gOpen);
      const entries = [];
      const entryRe = /("?[\w-]+"?):\s*("[^"\n\\]*")/g;
      entryRe.lastIndex = gOpen + 1;
      let e;
      while ((e = entryRe.exec(text)) && e.index < gClose) {
        entries.push({ key: e[1], start: e.index + e[0].length - e[2].length, end: e.index + e[0].length, value: e[2].slice(1, -1) });
      }
      groups.push({ name: m[1], entries });
      groupRe.lastIndex = gClose + 1;
    }
  }
  const defaultsAt = body.search(/\bdefaultVariants:\s*\{/);
  let defaults = null;
  if (defaultsAt >= 0) {
    const dOpen = objOpen + body.indexOf("{", defaultsAt);
    defaults = text.slice(dOpen, matchClose(text, dOpen) + 1);
  }
  return { groups, defaults };
}

function regionPattern(name) {
  return new RegExp(`\\n// lyra:begin ${name}\\b[\\s\\S]*?\\n// lyra:end ${name}\\n`);
}

function renderLyraCva(name, base, groups, defaults) {
  const lines = [`// lyra:begin ${name} (scripts/ui-theme/inline-lyra.mjs が style-lyra.css から書く。手で直さない)`];
  lines.push(`const ${name}Lyra = cva(${JSON.stringify(base)}, {`);
  lines.push("  variants: {");
  for (const group of groups) {
    lines.push(`    ${group.name}: {`);
    for (const entry of group.entries) lines.push(`      ${entry.key}: ${JSON.stringify(entry.lyra)},`);
    lines.push("    },");
  }
  lines.push("  },");
  if (defaults) lines.push(`  defaultVariants: ${defaults.replace(/\n\s*/g, " ").replace(/,\s*\}/, " }")},`);
  lines.push("})");
  lines.push(`// lyra:end ${name}`);
  return `\n${lines.join("\n")}\n`;
}

/* ---- 1 ファイル ---- */

/** 1 ファイルの書き換え結果と、組み立てられた cn-* の行・書き込めなかった cn-* の行 */
export function inlineSource(text, rules) {
  const dynamic = [];
  for (const match of text.matchAll(DYNAMIC_CN)) dynamic.push(text.slice(0, match.index).split("\n").length);
  const covered = [];
  const edits = [];

  // cva: lyra だけの cva を書く
  const cvaRanges = [];
  for (const match of text.matchAll(/const (\w+) = cva\(/g)) {
    const name = match[1];
    const open = match.index + match[0].length - 1;
    const { args, close } = topLevelArgs(text, open);
    cvaRanges.push([match.index, close]);
    const baseArg = args[0] && STRING_ARG.exec(args[0].text);
    if (!baseArg) continue;
    const objArg = args[1];
    const { groups, defaults } = objArg ? readCvaVariants(text, objArg.start) : { groups: [], defaults: null };
    const baseMarkers = markersOf(baseArg[1], rules);
    const hasMarkers = baseMarkers.length > 0 || groups.some((g) => g.entries.some((e) => markersOf(e.value, rules).length > 0));
    if (!hasMarkers) continue;
    const baseLyra = lyraClasses(baseMarkers, rules);
    covered.push([args[0].start, args[0].end]);
    edits.push({ start: args[0].start, end: args[0].end, text: JSON.stringify(stripLosers(baseArg[1], baseLyra)) });
    for (const group of groups) {
      for (const entry of group.entries) {
        const own = markersOf(entry.value, rules);
        entry.lyra = lyraClasses(own, rules);
        covered.push([entry.start, entry.end]);
        edits.push({ start: entry.start, end: entry.end, text: JSON.stringify(stripLosers(entry.value, `${baseLyra} ${entry.lyra}`)) });
      }
    }
    const region = renderLyraCva(name, baseLyra, groups, defaults);
    const existing = regionPattern(name).exec(text);
    if (existing) edits.push({ start: existing.index, end: existing.index + existing[0].length, text: region });
    else {
      const lineEnd = text.indexOf("\n", close);
      edits.push({ start: lineEnd, end: lineEnd, text: region.slice(0, -1) });
    }
  }
  const inCva = (index) => cvaRanges.some(([s, e]) => index >= s && index <= e);

  // 文字列の定数 (const X = "cn-…") は、その定数を引数に取る cn(…) で扱う
  const constants = new Map();
  for (const match of text.matchAll(/const (\w+) =\s*\n?\s*("[^"\n\\]*")/g)) {
    const value = match[2].slice(1, -1);
    if (markersOf(value, rules).length === 0) continue;
    const start = match.index + match[0].length - match[2].length;
    constants.set(match[1], { value, start, end: match.index + match[0].length });
  }

  // cn(…): 最後の引数に lyra を足す
  for (const match of text.matchAll(/(?<![\w.$])cn\(/g)) {
    if (inCva(match.index) || /function\s+$/.test(text.slice(Math.max(0, match.index - 9), match.index))) continue;
    const open = match.index + 2;
    const { args, close } = topLevelArgs(text, open);
    const names = [];
    const stringArgs = [];
    for (const arg of args) {
      if (arg.text.startsWith(LYRA_ARG)) continue;
      const literal = STRING_ARG.exec(arg.text);
      if (literal) {
        // 規則名を持たない文字列も同じ要素のクラスなので、lyra に負けるものを外す対象にする
        names.push(...markersOf(literal[1], rules));
        stringArgs.push({ ...arg, value: literal[1] });
      } else if (constants.has(arg.text)) {
        const constant = constants.get(arg.text);
        names.push(...markersOf(constant.value, rules));
        stringArgs.push({ ...constant, isConstant: true });
      }
    }
    if (names.length === 0) continue;
    const lyra = lyraClasses(names, rules);
    for (const arg of stringArgs) {
      covered.push([arg.start, arg.end]);
      if (!arg.isConstant) edits.push({ start: arg.start, end: arg.end, text: JSON.stringify(stripLosers(arg.value, lyra)) });
      else if (!edits.some((e) => e.start === arg.start)) edits.push({ start: arg.start, end: arg.end, text: JSON.stringify(stripLosers(arg.value, lyra)) });
    }
    const lyraArg = `${LYRA_ARG} ${JSON.stringify(lyra)}`;
    const existing = args.find((arg) => arg.text.startsWith(LYRA_ARG));
    if (existing) {
      edits.push({ start: existing.start, end: existing.end, text: lyraArg });
      continue;
    }
    const last = args[args.length - 1];
    const between = text.slice(last.end, close);
    if (between.includes("\n")) {
      const lineStart = text.lastIndexOf("\n", last.start) + 1;
      const indent = /^\s*/.exec(text.slice(lineStart, last.start))[0];
      const trailingComma = between.trimStart().startsWith(",");
      edits.push({ start: last.end, end: last.end + (trailingComma ? between.indexOf(",") + 1 : 0), text: `,\n${indent}${lyraArg}${trailingComma ? "," : ""}` });
    } else {
      edits.push({ start: last.end, end: last.end, text: `, ${lyraArg}` });
    }
  }

  // className="…" の直書き: 呼び出し側の className が入らないので、文字列の中で lyra を後ろに合成する
  for (const match of text.matchAll(/className=("([^"\n\\]*)")/g)) {
    const names = markersOf(match[2], rules);
    if (names.length === 0) continue;
    const start = match.index + match[0].length - match[1].length;
    const lyra = lyraClasses(names, rules);
    const merged = cn(stripLosers(match[2], lyra), lyra).split(" ");
    covered.push([start, start + match[1].length]);
    edits.push({
      start,
      end: start + match[1].length,
      text: JSON.stringify(merged.filter((token, index) => merged.lastIndexOf(token) === index).join(" ")),
    });
  }

  // どの cva / cn にも乗らなかった cn-* の文字列
  const uncovered = [];
  for (const match of text.matchAll(/"([^"\n\\]*)"/g)) {
    if (markersOf(match[1], rules).length === 0) continue;
    const start = match.index;
    if (covered.some(([s, e]) => start >= s && start < e)) continue;
    if (text.slice(Math.max(0, start - LYRA_ARG.length - 1), start).includes(LYRA_ARG)) continue;
    uncovered.push(text.slice(0, start).split("\n").length);
  }
  return { output: applyEdits(text, edits), dynamic, uncovered };
}

/**
 * lyra の規則に見本の差分を重ねる。差分は lyra にある規則だけに書け、同じ性質は tailwind-merge で置き換わる
 * (例: lyra の text-xs/relaxed → 見本の text-sm/relaxed)。
 */
export function mergeReference(rules, reference) {
  const merged = new Map(rules);
  for (const [name, classes] of reference) {
    if (!merged.has(name)) throw new Error(`style-reference.css: 規則 ${name} が style-lyra.css に無い`);
    merged.set(name, cn(merged.get(name), classes));
  }
  return merged;
}

export function run({ write }) {
  const rules = mergeReference(
    parseLyra(readFileSync(SOURCE_CSS, "utf8")),
    parseLyra(readFileSync(REFERENCE_CSS, "utf8"), ".style-reference")
  );
  const changed = [];
  const dynamic = [];
  const uncovered = [];
  for (const file of listSourceFiles()) {
    const text = readFileSync(file, "utf8");
    if (!/(?<![A-Za-z0-9_-])cn-[a-z]/.test(text)) continue;
    const result = inlineSource(text, rules);
    for (const line of result.dynamic) dynamic.push(`${relative(ROOT, file)}:${line}`);
    for (const line of result.uncovered) uncovered.push(`${relative(ROOT, file)}:${line}`);
    if (result.output === text) continue;
    changed.push(relative(ROOT, file));
    if (write) writeFileSync(file, result.output);
  }
  return { changed, dynamic, uncovered, rules };
}

function main() {
  const check = process.argv.includes("--check");
  const { changed, dynamic, uncovered } = run({ write: !check });
  if (dynamic.length > 0) {
    console.error(`組み立てられた cn-* があり、規則を書き込めない:\n  ${dynamic.join("\n  ")}`);
    process.exit(1);
  }
  if (uncovered.length > 0) {
    console.error(`cn(…) の引数でも cva(…) の文字列でもない cn-* があり、規則を書き込めない:\n  ${uncovered.join("\n  ")}`);
    process.exit(1);
  }
  if (check) {
    if (changed.length > 0) {
      console.error(`lyra の規則が書き込まれていない部品がある。npm run ui-theme:lyra を実行する:\n  ${changed.join("\n  ")}`);
      process.exit(1);
    }
    console.log("lyra の規則は部品に書き込み済み");
    return;
  }
  console.log(`lyra の規則を書き込んだ (${changed.length} ファイル)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
