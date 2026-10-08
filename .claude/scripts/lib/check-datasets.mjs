#!/usr/bin/env node
/**
 * check-datasets.mjs — データセット台帳 (config/datasets.mjs) と追跡ファイルの突合。
 *
 * 落とすもの (error):
 *   - 台帳の行の不備 (id 重複・語彙外の kind / target / domain・寿命の名前が RETENTION_POLICIES に無い、または置き場が食い違う)
 *   - GOVERNED に当たる追跡ファイルが、台帳のどの行にも当たらない (未宣言) / 2 行以上に当たる (重なり)
 *   - どのファイルにも当たらない行 (planned を除く)
 *   - 移した旧置き場 (RETIRED の from) がコード・workflow・package.json と、Markdown (手順書・作業カード・文書・memory・
 *     README) と Codex 用の agent 定義に残っている。当時のパスを残す履歴 (data/・.claude/state/・スキルの
 *     reference/ の監査とレビュー・原稿の outbox) は対象外。コードのコメント行と、文書で「旧置き場」「旧パス」と書いた
 *     経緯の行は除く
 *   - 画像が IMAGE_ROOTS の外にある (素材の原本は assets/、配信用はアプリの public/ へ)
 *   - コード (ts・tsx・mjs・cjs・js) が台帳の data/ のパスを直書きしている (datasetPath(id) / datasetDir(id) で引く)。
 *     テスト・コメント行・import 行・DATA_LITERAL_EXEMPT に理由を書いたファイルは除く
 *   - `.claude/state/` を指す行が AGENT_STATE (エージェント運用の状態の許可リスト) に無い / 許可リストに台帳に無い id がある
 * 出すだけのもの: target の置き場と現在地が違う行 (data/ への移行対象) の件数と一覧。
 *
 *   npm run check-datasets             # 検査 (error があれば exit 1)
 *   npm run check-datasets -- --moves  # 移行対象の行も一覧する
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AGENT_STATE, DATASETS, GOVERNED, IGNORED_NAMES, IMAGE_EXT, IMAGE_ROOTS, KINDS, RETIRED, SLOTS, TARGETS } from "../../../config/datasets.mjs";
import { DOMAINS } from "../../../config/paths.mjs";
import { RETENTION_POLICIES } from "./prune-state-snapshots.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

/** "a/{date}.json" → /^a\/\d{4}-\d{2}-\d{2}\.json$/ */
export function patternToRegExp(path) {
  const parts = path.split(/(\{[a-z*]+\})/);
  const body = parts
    .map((part) => {
      if (/^\{[a-z*]+\}$/.test(part)) {
        if (!SLOTS[part]) throw new Error(`未知の可変部分 ${part}: ${path}`);
        return SLOTS[part];
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(`^${body}$`);
}

/** 可変部分より前の固定部分 (現在地の判定に使う) */
export function fixedPrefix(path) {
  const i = path.indexOf("{");
  return i < 0 ? path : path.slice(0, i);
}

const AGENT_STATE_DIR = ".claude/state/";

export function checkDatasets({ datasets, files, governed, ignoredNames, kinds, targets, domainIds, retention, imageRoots = [], imageExt = null, agentState = null }) {
  const errors = [];
  if (imageExt) {
    for (const file of files) {
      if (imageExt.test(file) && !imageRoots.some((re) => re.test(file))) {
        errors.push(`画像の置き場違反: ${file} (素材の原本は assets/、配信用はアプリの public/ へ。置き場は .claude/rules/data-storage.md)`);
      }
    }
  }
  const ids = new Set();
  const compiled = [];
  for (const ds of datasets) {
    if (ids.has(ds.id)) errors.push(`id が重複: ${ds.id}`);
    ids.add(ds.id);
    if (!kinds[ds.kind]) errors.push(`${ds.id}: 語彙外の kind "${ds.kind}"`);
    if (!targets[ds.target]) errors.push(`${ds.id}: 語彙外の target "${ds.target}"`);
    if (!domainIds.has(ds.domain)) errors.push(`${ds.id}: ${DOMAINS} に無い領域 "${ds.domain}"`);
    if (agentState && fixedPrefix(ds.path).startsWith(AGENT_STATE_DIR) && !agentState[ds.id]) {
      errors.push(`${ds.id}: ${AGENT_STATE_DIR} はエージェント運用の状態だけを置く (事業の記録は data/ へ。置くなら AGENT_STATE に理由付きで足す)`);
    }
    if (ds.retain !== undefined) {
      const policy = retention[ds.retain];
      if (!policy) errors.push(`${ds.id}: RETENTION_POLICIES に無い寿命 "${ds.retain}"`);
      else if (!ds.path.startsWith(`${policy.directory}/`)) {
        errors.push(`${ds.id}: 寿命 "${ds.retain}" の置き場 ${policy.directory} と path が食い違う`);
      }
    }
    try {
      compiled.push({ ds, re: patternToRegExp(ds.path), hits: 0 });
    } catch (e) {
      errors.push(`${ds.id}: ${e.message}`);
    }
  }

  for (const id of Object.keys(agentState ?? {})) {
    if (!ids.has(id)) errors.push(`AGENT_STATE に台帳に無い id: ${id}`);
  }

  const governedFiles = files.filter((f) => governed.some((re) => re.test(f)) && !ignoredNames.has(f.split("/").pop()));
  for (const file of governedFiles) {
    const matched = compiled.filter((c) => c.re.test(file));
    if (matched.length === 0) errors.push(`未宣言: ${file}`);
    if (matched.length > 1) errors.push(`重なり: ${file} ← ${matched.map((c) => c.ds.id).join(", ")}`);
    for (const c of matched) c.hits += 1;
  }
  for (const c of compiled) {
    if (c.hits === 0 && !c.ds.planned) errors.push(`どのファイルにも当たらない: ${c.ds.id} (${c.ds.path})`);
  }

  const moves = compiled
    .filter((c) => !fixedPrefix(c.ds.path).startsWith(targets[c.ds.target]?.dir ?? "\0"))
    .map((c) => ({ id: c.ds.id, path: c.ds.path, target: c.ds.target, files: c.hits }));
  return { errors, governedCount: governedFiles.length, datasetCount: datasets.length, moves };
}

const COMMENT_LINE = /^\s*(?:\/\/|\/?\*|#)/;
const IMPORT_LINE = /^\s*(?:import\b|export\b.*\bfrom\b)/;
export const RETIRED_SCAN_GLOBS = ["*.mjs", "*.cjs", "*.js", "*.ts", "*.tsx", "*.mts", "*.cts", "*.sh", "*.ps1", "*.py", "*.yml", "*.yaml", "package.json"];
/**
 * 人と agent が読む文書。ここに旧パスが残ると、agent が旧置き場を読んで空と判断したり旧置き場へ書いたりする。
 * 2026-10-07 に手順書 (SKILL.md・agents・rules・CLAUDE.md) から全 Markdown へ広げた。作業カード (.claude/todo) の
 * 完了条件が旧パスの git diff を指したまま残り、空の差分で合格に見える状態になっていたため。
 */
export const RETIRED_SCAN_DOC_GLOBS = [":(glob)**/*.md", ":(glob).codex/agents/*.toml"];
/** 当時のパスを残す履歴 (data-storage.md「置き場を移す手順」5)。書き換えないので検査しない */
export const RETIRED_SCAN_HISTORY_EXCLUDES = [
  ":(exclude,glob)data/**",
  ":(exclude,glob).claude/state/**",
  ":(exclude,glob)**/reference/reports/**",
  ":(exclude,glob)**/reference/audits/**",
  ":(exclude,glob)**/reference/reviews/**",
  ":(exclude,glob)**/reference/archive/**",
  ":(exclude,glob)**/reference/snapshots/**",
  ":(exclude,glob)**/reference/inventory/**",
  ":(exclude,glob)contents/blog/**",
  ":(exclude,glob)**/trends-snapshots/**",
  ":(exclude,glob)docs/31_*/**",
];
const DOC_FILE = /\.(?:md|toml)$/;
/** 手順書の中で経緯として旧パスに触れる行の印 */
const HISTORY_MARK = /旧置き場|旧パス/;

/** 旧置き場を含む行 ({ file, line, text }) のうち、コードのコメント行と手順書の経緯の行を除いたものを error にする */
export function findRetiredReferences(retired, hits) {
  const errors = [];
  for (const { file, line, text } of hits) {
    if (DOC_FILE.test(file) ? HISTORY_MARK.test(text) : COMMENT_LINE.test(text)) continue;
    for (const r of retired) {
      if (text.includes(r.from)) errors.push(`旧置き場の参照: ${file}:${line} (${r.from} → ${r.to})`);
    }
  }
  return errors;
}

export function retiredHits() {
  if (RETIRED.length === 0) return [];
  const args = ["-C", ROOT, "-c", "core.quotepath=false", "grep", "-n", "-F", ...RETIRED.flatMap((r) => ["-e", r.from]), "--",
    ...RETIRED_SCAN_GLOBS, ...RETIRED_SCAN_DOC_GLOBS, ...RETIRED_SCAN_HISTORY_EXCLUDES];
  let out;
  try {
    out = execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    if (e.status === 1) return []; // 一致なし
    throw e;
  }
  return out
    .split("\n")
    .map((row) => row.match(/^([^:]+):(\d+):(.*)$/))
    .filter(Boolean)
    .map((m) => ({ file: m[1], line: Number(m[2]), text: m[3] }))
    .filter((hit) => hit.file !== "config/datasets.mjs"); // 旧置き場を宣言する台帳自身は除く
}

export const DATA_LITERAL_CODE_GLOBS = ["*.ts", "*.tsx", "*.mjs", "*.cjs", "*.js"];
/** data/ の直書きを許すファイル (理由付き)。足すときは理由を書く */
export const DATA_LITERAL_EXEMPT = [
  { re: /(^|\/)__tests__\/|\.test\.[cm]?[jt]sx?$|^(?:packages|apps)\/[^/]+\/tests\//, why: "テストは期待値として実パスを書く" },
  { re: /^config\//, why: "台帳と config/ の定数そのもの" },
  { re: /^packages\/data-configs\/src\//, why: "web の実行時バンドル (middleware・ページ) に入るので repo 運用の台帳を import しない。表示用の出典ラベルは旧パスの検査が守る" },
  { re: /^\.claude\/scripts\/lib\/check-repo-hygiene\.cjs$/, why: "テストが一時リポジトリへ単体でコピーして動かす検査器。直書きは案内文の 1 か所だけ" },
];

/** 台帳の data/ の第 1 階層 (data/gsc・data/sns …) */
export function dataTops(datasets) {
  return [...new Set(datasets.filter((d) => d.path.startsWith("data/")).map((d) => d.path.split("/")[1]))].filter((t) => !t.includes("{"));
}

/**
 * コードの行 ({ file, line, text }) から data/ の直書きを探す。コメント行は除く。
 * `../../../data/x` のような相対パスは、ファイルの位置から解いてリポジトリ直下の data/ を指すものだけを拾う。
 */
export function findDataPathLiterals(tops, hits, exempt = DATA_LITERAL_EXEMPT) {
  const names = tops.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const direct = new RegExp(`(?<![A-Za-z0-9_./-])data/(?:${names})(?![A-Za-z0-9_-])`);
  const relative = new RegExp(`((?:\\.\\./)+)data/(?:${names})(?![A-Za-z0-9_-])`);
  const errors = [];
  for (const { file, line, text } of hits) {
    // import 先は静的な文字列でしか書けない。誤りは型検査と実行時に必ず落ちる (config-paths.test.ts と同じ扱い)
    if (COMMENT_LINE.test(text) || IMPORT_LINE.test(text) || exempt.some((e) => e.re.test(file))) continue;
    let bad = direct.test(text);
    const rel = text.match(relative);
    if (!bad && rel) {
      const ups = rel[1].length / 3;
      bad = file.split("/").length - 1 === ups; // ファイルのディレクトリの深さだけ上がるとリポジトリ直下
    }
    if (bad) errors.push(`data/ の直書き: ${file}:${line} (台帳の datasetPath(id) / datasetDir(id) で引く。置き場は .claude/rules/data-storage.md)`);
  }
  return errors;
}

export function dataLiteralHits(tops) {
  const args = ["-C", ROOT, "-c", "core.quotepath=false", "grep", "-n", "-E", `data/(${tops.join("|")})`, "--", ...DATA_LITERAL_CODE_GLOBS];
  let out;
  try {
    out = execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    if (e.status === 1) return [];
    throw e;
  }
  return out
    .split("\n")
    .map((row) => row.match(/^([^:]+):(\d+):(.*)$/))
    .filter(Boolean)
    .map((m) => ({ file: m[1], line: Number(m[2]), text: m[3] }));
}

function trackedFiles() {
  return execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\0")
    .filter(Boolean);
}

function main() {
  const domainIds = new Set(JSON.parse(readFileSync(resolve(ROOT, DOMAINS), "utf8")).domains.map((x) => x.id));
  const result = checkDatasets({
    datasets: DATASETS,
    files: trackedFiles(),
    governed: GOVERNED,
    ignoredNames: IGNORED_NAMES,
    kinds: KINDS,
    targets: TARGETS,
    domainIds,
    retention: RETENTION_POLICIES,
    imageRoots: IMAGE_ROOTS,
    imageExt: IMAGE_EXT,
    agentState: AGENT_STATE,
  });
  result.errors.push(...findRetiredReferences(RETIRED, retiredHits()));
  const tops = dataTops(DATASETS);
  result.errors.push(...findDataPathLiterals(tops, dataLiteralHits(tops)));
  for (const e of result.errors) console.error(`✗ ${e}`);
  const moveFiles = result.moves.reduce((n, m) => n + m.files, 0);
  if (process.argv.includes("--moves")) {
    for (const m of result.moves) console.log(`  → ${m.target}: ${m.id} (${m.files} files) ${m.path}`);
  }
  const mark = result.errors.length ? "✗" : "✓";
  console.log(
    `${mark} check-datasets: 台帳 ${result.datasetCount} 行 / 対象ファイル ${result.governedCount} 件 / error ${result.errors.length}` +
      ` (本来の置き場と違う行 ${result.moves.length} 行・${moveFiles} 件 — --moves で一覧)`,
  );
  if (result.errors.length) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
