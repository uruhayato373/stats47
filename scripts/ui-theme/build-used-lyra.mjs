#!/usr/bin/env node
/**
 * style-lyra.css (テンプレートの正本) から、公開サイトのソースに出てくる cn-* の規則だけを抜き出して
 * packages/ui-theme/style-lyra.used.css を書く。base.css はこの used.css を読む。
 *
 * なぜ要るか: style-lyra.css は Base UI の全部品 (323 規則) の @apply を持ち、Tailwind はソースで使われて
 * いなくても @apply の中身を全部 CSS に出す。サイトが使う部品は一部なので、使わない部品の分だけ
 * 全ページの CSS が重くなっていた (2026-10-28 配信サイズの点検)。
 *
 * 守ること:
 * - 正本 (style-lyra.css) は手で直さない。テンプレートを取り直したら、このスクリプトを再実行する
 * - 規則の順序・セレクタ・本文は正本のまま写す (外側の .style-lyra { … } とレイヤーなしの扱いも同じ)
 * - cn-* はソースに文字列として書く。`cn-${x}` や "cn-" + x のように組み立てると、ここで拾えず
 *   規則が落ちる (テストが組み立てを拒否する)
 *
 * 使い方:
 *   node scripts/ui-theme/build-used-lyra.mjs          # used.css を書き直す
 *   node scripts/ui-theme/build-used-lyra.mjs --check  # 書き直さずに食い違いだけを調べる (食い違えば exit 1)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SOURCE_CSS = join(ROOT, "packages/ui-theme/style-lyra.css");
export const OUTPUT_CSS = join(ROOT, "packages/ui-theme/style-lyra.used.css");

/** cn-* を探すソースの場所。apps/web/tailwind.config.ts の content と同じ 3 か所 */
export const SOURCE_DIRS = ["apps/web/src", "packages/components/src", "packages/visualization/src"];

/**
 * どこからも import されない atom (packages/components/src/atoms/ui/<name>.tsx)。index.ts の export * には
 * 残るが、描画されないので Tailwind の走査 (apps/web/tailwind.config.ts の content の "!" 除外) からもこの抽出からも外す。
 * 使い始めたら両方から消す (テストが apps/web/tailwind.config.ts の content の除外との一致と importer 0 件を確かめる)。
 */
export const UNUSED_ATOMS = ["accordion", "alert", "alert-dialog", "dialog", "progress", "switch", "textarea"];
const UNUSED_ATOM_FILES = new Set(
  UNUSED_ATOMS.map((name) => join(ROOT, "packages/components/src/atoms/ui", `${name}.tsx`))
);

const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|mdx|css)$/;
/** テストは数えない (テストだけに出る名前のために規則を残さない) */
const IGNORED_DIR = new Set(["node_modules", "__tests__", "__mocks__", ".next"]);
const IGNORED_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

/** 前が英数字・_・- でない cn- から始まる名前 (shadcn-dashboard の "cn-dashboard" を拾わない) */
const CN_NAME = /(?<![A-Za-z0-9_-])cn-[a-z0-9]+(?:-[a-z0-9]+)*/g;
/** 組み立てられた cn-*: `cn-${…}` / "cn-" + … / `cn-` で終わる文字列 */
const DYNAMIC_CN = /(?<![A-Za-z0-9_-])cn-(?:\$\{|["'`]\s*\+|["'`])/g;

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

/** ソースに出る cn-* の名前の集合と、組み立てられた cn-* の出現箇所 */
export function collectUsedNames(files, root = ROOT) {
  const names = new Set();
  const dynamic = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(CN_NAME)) names.add(match[0]);
    for (const match of text.matchAll(DYNAMIC_CN)) {
      const line = text.slice(0, match.index).split("\n").length;
      dynamic.push(`${relative(root, file)}:${line}`);
    }
  }
  return { names, dynamic };
}

/**
 * 正本を「外側の開始行・区切り (MARK コメント)・規則・外側の終了行」に分ける。
 * 正本は `.style-lyra {` の中に 2 スペース字下げの `.cn-x {` … `}` が並ぶ形だけを持つ。
 * それ以外の形が来たら黙って落とさず例外にする (テンプレートの取り直しで形が変わったことに気づくため)。
 */
export function parseLyra(css) {
  const lines = css.split("\n");
  if (lines[0] !== ".style-lyra {") throw new Error("style-lyra.css の 1 行目が `.style-lyra {` ではない");
  const items = [];
  let i = 1;
  let closed = false;
  while (i < lines.length) {
    const line = lines[i];
    if (line === "}") {
      closed = true;
      i += 1;
      break;
    }
    if (line === "") {
      items.push({ kind: "blank" });
      i += 1;
      continue;
    }
    if (/^  \/\*.*\*\/$/.test(line)) {
      items.push({ kind: "comment", text: line });
      i += 1;
      continue;
    }
    const head = /^  \.(cn-[a-z0-9]+(?:-[a-z0-9]+)*) \{$/.exec(line);
    if (!head) throw new Error(`style-lyra.css ${i + 1} 行目を解釈できない: ${line}`);
    const body = [line];
    i += 1;
    while (i < lines.length && lines[i] !== "  }") {
      if (!lines[i].startsWith("    ")) throw new Error(`style-lyra.css ${i + 1} 行目: 規則 ${head[1]} の中が想定外`);
      body.push(lines[i]);
      i += 1;
    }
    if (i >= lines.length) throw new Error(`style-lyra.css: 規則 ${head[1]} が閉じていない`);
    body.push(lines[i]);
    i += 1;
    items.push({ kind: "rule", name: head[1], text: body.join("\n") });
  }
  if (!closed) throw new Error("style-lyra.css の外側の `}` が無い");
  const rest = lines.slice(i).join("\n").trim();
  if (rest !== "") throw new Error("style-lyra.css の外側の `}` の後に内容がある");
  return items;
}

/** 使う規則だけを正本の順で並べた CSS。MARK コメントは、その節に残る規則があるときだけ残す */
export function buildUsedCss(css, usedNames) {
  const items = parseLyra(css);
  const sections = [];
  let current = { comment: null, rules: [] };
  for (const item of items) {
    if (item.kind === "comment") {
      sections.push(current);
      current = { comment: item.text, rules: [] };
    } else if (item.kind === "rule" && usedNames.has(item.name)) {
      current.rules.push(item.text);
    }
  }
  sections.push(current);
  const blocks = sections
    .filter((section) => section.rules.length > 0)
    .map((section) => [section.comment, section.rules.join("\n\n")].filter(Boolean).join("\n"));
  const header = [
    "/* 生成物。手で直さない。正本は style-lyra.css (テンプレートの写し)。",
    "   node scripts/ui-theme/build-used-lyra.mjs が、サイトのソースに出る cn-* の規則だけを正本の順で写す。 */",
  ].join("\n");
  return `${header}\n.style-lyra {\n${blocks.join("\n\n")}\n}\n`;
}

/** 正本にある規則名 */
export function lyraRuleNames(css) {
  return new Set(parseLyra(css).filter((item) => item.kind === "rule").map((item) => item.name));
}

export function generate() {
  const css = readFileSync(SOURCE_CSS, "utf8");
  const { names, dynamic } = collectUsedNames(listSourceFiles());
  return { output: buildUsedCss(css, names), names, dynamic, ruleNames: lyraRuleNames(css) };
}

function main() {
  const { output, dynamic, names, ruleNames } = generate();
  if (dynamic.length > 0) {
    console.error(`組み立てられた cn-* があり、使う規則を決められない:\n  ${dynamic.join("\n  ")}`);
    process.exit(1);
  }
  const kept = [...names].filter((name) => ruleNames.has(name)).length;
  if (process.argv.includes("--check")) {
    const current = readFileSync(OUTPUT_CSS, "utf8");
    if (current !== output) {
      console.error("style-lyra.used.css が古い。node scripts/ui-theme/build-used-lyra.mjs を実行する");
      process.exit(1);
    }
    console.log(`style-lyra.used.css は最新 (${kept}/${ruleNames.size} 規則)`);
    return;
  }
  writeFileSync(OUTPUT_CSS, output);
  console.log(`style-lyra.used.css を書いた (${kept}/${ruleNames.size} 規則)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
