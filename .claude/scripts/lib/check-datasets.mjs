#!/usr/bin/env node
/**
 * check-datasets.mjs — データセット台帳 (config/datasets.mjs) と追跡ファイルの突合。
 *
 * 落とすもの (error):
 *   - 台帳の行の不備 (id 重複・語彙外の kind / target / domain・寿命の名前が RETENTION_POLICIES に無い、または置き場が食い違う)
 *   - GOVERNED に当たる追跡ファイルが、台帳のどの行にも当たらない (未宣言) / 2 行以上に当たる (重なり)
 *   - どのファイルにも当たらない行 (planned・r2State を除く)。r2State の行が追跡ファイルに当たる・live/ の外にある
 *   - 移した旧置き場 (RETIRED の from) がコード・workflow・package.json と、Markdown (手順書・作業カード・文書・memory・
 *     README) と Codex 用の agent 定義に残っている。当時のパスを残す履歴 (data/・.claude/state/・スキルの
 *     reference/ の監査とレビュー・原稿の outbox) は対象外。コードのコメント行と、文書で「旧置き場」「旧パス」と書いた
 *     経緯の行は除く
 *   - 画像が IMAGE_ROOTS の外にある (素材の原本は assets/、配信用はアプリの public/ へ)
 *   - コード (ts・tsx・mjs・cjs・js) が台帳の data/ のパスを直書きしている (datasetPath(id) / datasetDir(id) で引く)。
 *     テスト・コメント行・import 行・DATA_LITERAL_EXEMPT に理由を書いたファイルは除く
 *   - kind が config / ledger で path が .json の行に schema (JSON Schema のパス) が無い / schema のファイルが無い /
 *     当たるファイルが schema に合わない (SCHEMA_REQUIRED_KINDS。台帳の正本が形の契約を持たないと、書き手の差分で黙って壊れる)。
 *     それ以外の種類でも schema を宣言した行は同じく検証する (判断に使う state・series の記録。2026-10-20)
 *   - `.claude/state/` を指す行が AGENT_STATE (エージェント運用の状態の許可リスト) に無い / 許可リストに台帳に無い id がある
 *   - 台帳の行の refs (と REGISTRY_REFS) が指す ID が参照先の台帳・registry に無い / 写しの項目が参照先と違う /
 *     refs の宣言の不備 (2026-10-26。書き方は config/datasets.mjs の REFS の説明)
 * 出すだけのもの: target の置き場と現在地が違う行 (data/ への移行対象) の件数と一覧。severity: "warn" の参照の違反
 * (既存データの違反を理由付きで残している参照。先頭 10 件、--refs で全件)。
 *
 *   npm run check-datasets             # 検査 (error があれば exit 1)
 *   npm run check-datasets -- --moves  # 移行対象の行も一覧する
 *   npm run check-datasets -- --refs   # warn の参照の違反を全件出す
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import Ajv from "ajv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AGENT_STATE, DATASETS, GOVERNED, IGNORED_NAMES, IMAGE_EXT, IMAGE_ROOTS, KINDS, REGISTRIES, REGISTRY_REFS, RETIRED, SLOTS, TARGETS } from "../../../config/datasets.mjs";
import { DOMAINS } from "../../../config/paths.mjs";
import { addCommonSchema } from "./dataset-shape.mjs";
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

/** 人やスクリプトが判断して書く台帳・設定は、形の契約 (JSON Schema) を必ず持つ */
export const SCHEMA_REQUIRED_KINDS = new Set(["config", "ledger"]);
const SCHEMA_FILE = /\.schema\.json$/;

/** schema が要る行か (JSON Schema 自身は除く) */
export function needsSchema(ds) {
  return SCHEMA_REQUIRED_KINDS.has(ds.kind) && /\.json$/.test(ds.path) && !SCHEMA_FILE.test(ds.path);
}

/**
 * 行ごとに schema の宣言・実在・当たるファイルの形を検査する。readJson(path) は repo root 相対で JSON を返す。
 * 当たるファイルの選び方は台帳の照合と同じ patternToRegExp を使う。
 */
export function checkSchemas({ datasets, files, readJson, exists }) {
  const errors = [];
  const ajv = addCommonSchema(new Ajv({ allErrors: true }));
  for (const ds of datasets) {
    if (ds.schema !== undefined && !SCHEMA_FILE.test(ds.schema)) errors.push(`${ds.id}: schema は *.schema.json を指す (${ds.schema})`);
    // config / ledger は schema が必須。それ以外の種類も、schema を宣言した行は当たるファイルを検証する
    // (2026-10-20 RECORD-SCHEMA-CONTRACT-01。セッションが判断に使う state・series の記録)
    if (!ds.schema) {
      if (needsSchema(ds)) errors.push(`${ds.id}: config / ledger の JSON に schema (JSON Schema のパス) が無い (${ds.path})`);
      continue;
    }
    if (!exists(ds.schema)) {
      errors.push(`${ds.id}: schema のファイルが無い (${ds.schema})`);
      continue;
    }
    let validate;
    try {
      validate = ajv.compile(readJson(ds.schema));
    } catch (e) {
      errors.push(`${ds.id}: schema を読めない (${ds.schema}): ${e.message}`);
      continue;
    }
    const re = patternToRegExp(ds.path);
    for (const file of files.filter((f) => re.test(f))) {
      let doc;
      try {
        doc = readJson(file);
      } catch (e) {
        errors.push(`${ds.id}: JSON として読めない ${file}: ${e.message}`);
        continue;
      }
      if (!validate(doc)) errors.push(`${ds.id}: ${file} が schema に合わない (${ds.schema}): ${ajv.errorsText(validate.errors, { dataVar: "" }).slice(0, 300)}`);
    }
  }
  return errors;
}

// ── 台帳どうしの参照 (外部キー相当) ── 2026-10-26。宣言の書き方は config/datasets.mjs の REFS の説明

const REGISTRY_PREFIX = "registry:";
const REF_KEYS = new Set(["field", "to", "key", "where", "parse", "copies", "severity", "why"]);

/**
 * JSON の値をたどる。path は "." 区切り。`name[]` は配列の各要素、`*` はオブジェクトの各値、末尾の `$keys` はオブジェクトのキー。
 * 返す parent は値を持つオブジェクト (where と copies が兄弟の項目を見るのに使う。`$keys` ではキーの指す値)。
 * 途中で無い項目 (undefined / null) は黙って飛ばす (任意項目の参照は、値があるときだけ検査する)。
 * @param {unknown} doc
 * @param {string} path
 * @returns {{ value: unknown, parent: any }[]}
 */
export function selectPath(doc, path) {
  /** @type {{ value: any, parent: any }[]} */
  let nodes = [{ value: doc, parent: null }];
  const segments = path.split(".");
  segments.forEach((segment, i) => {
    /** @type {{ value: any, parent: any }[]} */
    const next = [];
    const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
    for (const node of nodes) {
      if (segment === "$keys") {
        if (i !== segments.length - 1) throw new Error(`$keys は path の末尾にだけ置く: ${path}`);
        if (isObject(node.value)) for (const [k, v] of Object.entries(node.value)) next.push({ value: k, parent: v });
      } else if (segment === "*") {
        if (isObject(node.value)) for (const v of Object.values(node.value)) next.push({ value: v, parent: node.value });
      } else {
        const iterate = segment.endsWith("[]");
        const name = iterate ? segment.slice(0, -2) : segment;
        const value = name === "" ? node.value : isObject(node.value) ? node.value[name] : undefined;
        const parent = name === "" ? node.parent : node.value;
        if (value === undefined || value === null) continue;
        if (iterate) {
          if (Array.isArray(value)) for (const item of value) next.push({ value: item, parent });
        } else next.push({ value, parent });
      }
    }
    nodes = next;
  });
  return nodes;
}

/**
 * 参照の値を ID の並びにする。parse: "list" は配列・JSON 配列の文字列・カンマ区切りの文字列を受ける
 * (SNS 投稿台帳の metric_keys は書き手ごとに 3 通りで入っている)。
 * @param {unknown} value
 * @param {string | undefined} parse
 * @returns {unknown[]}
 */
export function refValues(value, parse) {
  if (parse !== "list") return [value];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [value];
  const text = value.trim();
  if (text === "") return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // JSON として読めない文字列はカンマ区切りとして扱う
    }
  }
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * TS 側の正本 (指標の registry・商品カタログなど) から ID の集合を作る。check-datasets は素の node で動くので
 * TS を import せず、宣言した正規表現で本文から読む。読んだ件数が 0 なら読み方の取り違えとして例外にする
 * (0 件の集合で照合すると、全件が参照切れに見えるか、照合そのものが消える)。
 * @param {{ files: string[], pattern: string, between?: [string, string] }} registry
 * @param {(path: string) => string} readText
 */
export function resolveRegistry(registry, readText) {
  const ids = new Set();
  for (const file of registry.files) {
    let text = readText(file);
    if (registry.between) {
      const [start, end] = registry.between;
      const from = text.indexOf(start);
      const to = text.indexOf(end, from + 1);
      if (from < 0 || to < 0) throw new Error(`${file} に区切り ${start} … ${end} が無い`);
      text = text.slice(from, to);
    }
    for (const m of text.matchAll(new RegExp(registry.pattern, "gm"))) ids.add(m[1]);
  }
  if (ids.size === 0) throw new Error(`registry から ID を 1 件も読めない (${registry.files.join(", ")})`);
  return ids;
}

const show = (v) => (typeof v === "string" ? v : JSON.stringify(v));
/** 違反の要素を人が探せるように、要素の識別子 (id / key / slug) を添える */
const where = (parent) => {
  const label = ["id", "key", "slug"].find((k) => parent && (typeof parent[k] === "string" || typeof parent[k] === "number"));
  return label ? ` (${label}=${parent[label]})` : "";
};

/**
 * 台帳の行の refs と REGISTRY_REFS を検査する。参照先に無い ID は error (severity: "warn" を宣言した参照だけ warning)。
 * readJson / readText は repo root 相対で読む。
 * @param {{ datasets: any[], files: string[], readJson: (p: string) => any, readText: (p: string) => string, registries?: Record<string, any>, registryRefs?: any[] }} input
 */
export function checkRefs({ datasets, files, readJson, readText, registries = {}, registryRefs = [] }) {
  const errors = [];
  const warnings = [];
  const byId = new Map(datasets.map((d) => [d.id, d]));
  const registryCache = new Map();
  const docCache = new Map();
  const filesOf = (ds) => {
    const re = patternToRegExp(ds.path);
    return files.filter((f) => re.test(f));
  };
  const docOf = (file) => {
    if (!docCache.has(file)) docCache.set(file, readJson(file));
    return docCache.get(file);
  };
  /** 参照先の ID → 要素 (copies の比較に使う)。registry は要素を持たない */
  const targetOf = (owner, ref) => {
    if (typeof ref.to !== "string") throw new Error(`${owner}: refs の to が無い`);
    if (ref.to.startsWith(REGISTRY_PREFIX)) {
      const name = ref.to.slice(REGISTRY_PREFIX.length);
      if (!registries[name]) throw new Error(`${owner}: REGISTRIES に無い参照先 ${ref.to}`);
      if (ref.key || ref.copies) throw new Error(`${owner}: registry を参照先にするときは key / copies を書かない (${ref.to})`);
      if (!registryCache.has(name)) registryCache.set(name, new Map([...resolveRegistry(registries[name], readText)].map((id) => [id, null])));
      return registryCache.get(name);
    }
    const target = byId.get(ref.to);
    if (!target) throw new Error(`${owner}: 台帳に無い参照先 ${ref.to}`);
    if (!ref.key) throw new Error(`${owner}: 台帳を参照先にするときは key (参照先の ID の path) が要る (${ref.to})`);
    const map = new Map();
    for (const file of filesOf(target)) for (const { value, parent } of selectPath(docOf(file), ref.key)) map.set(value, parent);
    if (map.size === 0) throw new Error(`${owner}: 参照先 ${ref.to} の ${ref.key} から ID を 1 件も読めない`);
    return map;
  };
  const declare = (owner, ref) => {
    for (const k of Object.keys(ref)) if (!REF_KEYS.has(k)) throw new Error(`${owner}: refs に知らない項目 ${k}`);
    if (ref.severity !== undefined && ref.severity !== "warn") throw new Error(`${owner}: severity は "warn" だけ (既定は error)`);
    if (ref.severity === "warn" && !(typeof ref.why === "string" && ref.why.length >= 10)) {
      throw new Error(`${owner}: severity: "warn" には理由 (why) を書く`);
    }
    if (ref.parse !== undefined && ref.parse !== "list") throw new Error(`${owner}: parse は "list" だけ`);
  };

  for (const ds of datasets) {
    for (const ref of ds.refs ?? []) {
      const owner = `${ds.id} → ${ref.to} (${ref.field})`;
      const sink = ref.severity === "warn" ? warnings : errors;
      let target;
      try {
        declare(owner, ref);
        target = targetOf(owner, ref);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
        continue;
      }
      for (const file of filesOf(ds)) {
        let doc;
        try {
          doc = docOf(file);
        } catch (e) {
          errors.push(`${owner}: JSON として読めない ${file}: ${e instanceof Error ? e.message : String(e)}`);
          continue;
        }
        for (const { value, parent } of selectPath(doc, ref.field)) {
          if (ref.where && !Object.entries(ref.where).every(([k, v]) => parent?.[k] === v)) continue;
          for (const id of refValues(value, ref.parse)) {
            if (!target.has(id)) {
              sink.push(`参照切れ: ${ds.id} ${file}${where(parent)} の ${ref.field}=${show(id)} が ${ref.to}${ref.key ? ` の ${ref.key}` : ""} に無い`);
              continue;
            }
            for (const field of ref.copies ?? []) {
              const expected = target.get(id)?.[field];
              if (parent?.[field] !== expected) {
                sink.push(`写しの不一致: ${ds.id} ${file} の ${field}=${show(parent?.[field])} が ${ref.to} (${show(id)}) の ${show(expected)} と違う`);
              }
            }
          }
        }
      }
    }
  }

  for (const ref of registryRefs) {
    const owner = `${ref.from} → ${ref.to}`;
    try {
      if (typeof ref.from !== "string" || !ref.from.startsWith(REGISTRY_PREFIX) || !registries[ref.from.slice(REGISTRY_PREFIX.length)]) {
        throw new Error(`${owner}: REGISTRY_REFS の from は REGISTRIES の registry:<名前>`);
      }
      const { from: _from, ...rest } = ref;
      declare(owner, { field: "", ...rest });
      const target = targetOf(owner, ref);
      const sink = ref.severity === "warn" ? warnings : errors;
      for (const id of resolveRegistry(registries[ref.from.slice(REGISTRY_PREFIX.length)], readText)) {
        if (!target.has(id)) sink.push(`参照切れ: ${ref.from} の ${show(id)} が ${ref.to} の ${ref.key} に無い`);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { errors, warnings };
}

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
    if (c.hits === 0 && !c.ds.planned && !c.ds.r2State) errors.push(`どのファイルにも当たらない: ${c.ds.id} (${c.ds.path})`);
    // r2State の行は正本が R2 で、手元は git 管理外の live/ に置く。追跡ファイルに当たっていたら置き場の取り違え
    if (c.ds.r2State && (c.hits > 0 || !c.ds.path.includes("/live/"))) errors.push(`r2State の行は git 管理外の live/ に置く: ${c.ds.id} (${c.ds.path})`);
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
  result.errors.push(...checkSchemas({
    datasets: DATASETS,
    files: trackedFiles(),
    readJson: (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8")),
    exists: (p) => existsSync(resolve(ROOT, p)),
  }));
  const refs = checkRefs({
    datasets: DATASETS,
    files: trackedFiles(),
    readJson: (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8")),
    readText: (p) => readFileSync(resolve(ROOT, p), "utf8"),
    registries: REGISTRIES,
    registryRefs: REGISTRY_REFS,
  });
  result.errors.push(...refs.errors);
  result.errors.push(...findRetiredReferences(RETIRED, retiredHits()));
  const tops = dataTops(DATASETS);
  result.errors.push(...findDataPathLiterals(tops, dataLiteralHits(tops)));
  for (const e of result.errors) console.error(`✗ ${e}`);
  // warn の参照は既存データの違反を一覧する (理由は台帳の refs の why)。既定は先頭 10 件、--refs で全件
  const listAll = process.argv.includes("--refs");
  for (const w of listAll ? refs.warnings : refs.warnings.slice(0, 10)) console.warn(`! ${w}`);
  if (!listAll && refs.warnings.length > 10) console.warn(`! … 参照の warning 他 ${refs.warnings.length - 10} 件 (--refs で全件)`);
  const moveFiles = result.moves.reduce((n, m) => n + m.files, 0);
  if (process.argv.includes("--moves")) {
    for (const m of result.moves) console.log(`  → ${m.target}: ${m.id} (${m.files} files) ${m.path}`);
  }
  const mark = result.errors.length ? "✗" : "✓";
  console.log(
    `${mark} check-datasets: 台帳 ${result.datasetCount} 行 / 対象ファイル ${result.governedCount} 件 / error ${result.errors.length} / 参照の warning ${refs.warnings.length}` +
      ` (本来の置き場と違う行 ${result.moves.length} 行・${moveFiles} 件 — --moves で一覧)`,
  );
  if (result.errors.length) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
