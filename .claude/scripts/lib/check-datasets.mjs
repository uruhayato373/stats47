#!/usr/bin/env node
/**
 * check-datasets.mjs — データセット台帳 (config/datasets.mjs) と追跡ファイルの突合。
 *
 * 落とすもの (error):
 *   - 台帳の行の不備 (id 重複・語彙外の kind / target / domain・寿命の名前が RETENTION_POLICIES に無い、または置き場が食い違う)
 *   - GOVERNED に当たる追跡ファイルが、台帳のどの行にも当たらない (未宣言) / 2 行以上に当たる (重なり)
 *   - どのファイルにも当たらない行 (planned を除く)
 *   - 移した旧置き場 (RETIRED の from) がコード・workflow・package.json と、agent の手順書 (SKILL.md・agents・rules・
 *     CLAUDE.md・Codex 用ミラー) に残っている。コードのコメント行と、手順書で「旧置き場」「旧パス」と書いた経緯の行は除く
 *   - 画像が IMAGE_ROOTS の外にある (素材の原本は assets/、配信用はアプリの public/ へ)
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
export const RETIRED_SCAN_GLOBS = ["*.mjs", "*.cjs", "*.js", "*.ts", "*.tsx", "*.mts", "*.cts", "*.sh", "*.ps1", "*.py", "*.yml", "*.yaml", "package.json"];
/**
 * agent が手順として読む文書。ここに旧パスが残ると、agent が旧置き場を読んで空と判断したり旧置き場へ書いたりする。
 * 履歴の記録 (改善ログ・レビュー・state の json) は当時のパスのままにするので対象外。
 */
export const RETIRED_SCAN_DOC_GLOBS = [
  ":(glob).claude/skills/**/SKILL.md",
  ":(glob).agents/skills/**/SKILL.md",
  ":(glob).claude/agents/*.md",
  ":(glob).codex/agents/*.toml",
  ":(glob).claude/rules/*.md",
  "CLAUDE.md",
];
const DOC_FILE = /(?:\/SKILL\.md|^\.claude\/(?:agents|rules)\/[^/]+\.md|^\.codex\/agents\/[^/]+\.toml|^CLAUDE\.md)$/;
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

function retiredHits() {
  if (RETIRED.length === 0) return [];
  const args = ["-C", ROOT, "grep", "-n", "-F", ...RETIRED.flatMap((r) => ["-e", r.from]), "--", ...RETIRED_SCAN_GLOBS, ...RETIRED_SCAN_DOC_GLOBS];
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
