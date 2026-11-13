#!/usr/bin/env node
/**
 * CI が書いた生 snapshot を R2 `state/<domain>/` へ出す手順の決定的な部分 (stage と公開 URL での read-back)。
 * 読み手側は state-pull.mjs (`npm run state:pull -- <domain>`)。
 *
 *   node .claude/scripts/lib/state-publish.mjs prepare psi data/psi/live/psi-batch-*.json
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix "state/psi/"
 *   node .claude/scripts/lib/state-publish.mjs verify psi
 *
 * prepare: `.local/r2/state/<domain>/` に生 snapshot を同じ名前で置き、名前の新しいものを latest.json にし、
 *          公開 URL の既存 index.json (無ければ空) に今回の key を足した index.json を書く
 *          (公開 R2 は list できないため index.json が object 一覧の代わり)。
 * verify:  stage した全 object を公開 URL から読み直し、bytes が一致し index.json に載っていることを確かめる。
 *
 * 書き手は CI だけ (S3 creds は GitHub Actions secrets)。push は diff-push-r2.ts が行い、remote を消さない。
 * 置き場の規約: .claude/rules/r2-storage-design.md の `state/<domain>/**` 行 (400 日 lifecycle)。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { R2_PUBLIC_BASE_URL } from "./site-config.cjs";

const ROOT = process.env.STATS47_SCAN_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const LATEST_KEY = "latest.json";
const RETRY_WAIT_MS = 5000;

const publicBase = () => (process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL).replace(/\/+$/, "");

function resolveDispatcher() {
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY;
  if (!proxy) return undefined;
  try {
    const { ProxyAgent } = createRequire(import.meta.url)("undici");
    return new ProxyAgent(proxy);
  } catch {
    return undefined;
  }
}

/** @param {string} domain */
function assertDomain(domain) {
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(domain) || domain.includes("..")) throw new Error(`不正な domain: ${domain}`);
}

/** @param {unknown} key */
function assertKey(key) {
  if (typeof key !== "string" || !key || key.includes("..") || key.startsWith("/")) throw new Error(`不正な key: ${key}`);
}

/** @param {string} domain @param {string} [root] */
export function stageDirFor(domain, root = ROOT) {
  assertDomain(domain);
  return path.join(root, ".local", "r2", "state", ...domain.split("/").filter(Boolean));
}

/**
 * 既存 index と今回の key を重複なしで昇順に並べ、latest.json を最後に置く。
 * @param {unknown} existing @param {string[]} added
 */
export function mergeIndexKeys(existing, added) {
  if (!Array.isArray(existing)) throw new Error("既存の index.json が配列でない");
  const keys = new Set();
  for (const key of [...existing, ...added]) {
    assertKey(key);
    if (key !== LATEST_KEY) keys.add(key);
  }
  return [...[...keys].sort(), LATEST_KEY];
}

/** @param {string} url @param {any} dispatcher */
async function fetchPublic(url, dispatcher) {
  // dispatcher (undici のプロキシ) は Node の fetch だけが受け付け、DOM の RequestInit の型に無い
  return fetch(url, /** @type {any} */ ({ dispatcher, headers: { "cache-control": "no-cache" } }));
}

/**
 * @param {string} domain
 * @param {string[]} files 生 snapshot のパス (basename がそのまま R2 の key になる)
 * @param {{ root?: string, log?: (msg: string) => void }} [opts]
 */
export async function prepareState(domain, files, { root = ROOT, log = console.log } = {}) {
  assertDomain(domain);
  if (files.length === 0) throw new Error(`生 snapshot が無い: ${domain}`);
  const names = files.map((file) => path.basename(file));
  if (new Set(names).size !== names.length) throw new Error(`同じ名前の生 snapshot が重なっている: ${names.join(", ")}`);
  names.forEach(assertKey);
  if (names.includes(LATEST_KEY) || names.includes("index.json")) throw new Error("latest.json と index.json はこのスクリプトが作る");

  const res = await fetchPublic(`${publicBase()}/state/${domain}/index.json`, resolveDispatcher());
  if (!res.ok && res.status !== 404) throw new Error(`${res.status} index.json を読めない: state/${domain}/`);
  const existing = res.ok ? await res.json() : [];
  const keys = mergeIndexKeys(existing, names);

  const dir = stageDirFor(domain, root);
  fs.mkdirSync(dir, { recursive: true });
  const newest = [...files].sort((a, b) => path.basename(a).localeCompare(path.basename(b))).at(-1);
  for (const file of files) fs.copyFileSync(file, path.join(dir, path.basename(file)));
  fs.copyFileSync(/** @type {string} */ (newest), path.join(dir, LATEST_KEY));
  fs.writeFileSync(path.join(dir, "index.json"), `${JSON.stringify(keys, null, 2)}\n`);
  log(`[state:publish] ${domain}: ${names.length} object(s) + latest.json + index.json (${keys.length} key) → ${path.relative(root, dir)}`);
  return { dir, keys, staged: [...names, LATEST_KEY, "index.json"] };
}

/**
 * @param {string} domain
 * @param {{ root?: string, attempts?: number, log?: (msg: string) => void }} [opts]
 */
export async function verifyState(domain, { root = ROOT, attempts = 3, log = console.log } = {}) {
  const dir = stageDirFor(domain, root);
  const staged = fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile());
  const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  const dispatcher = resolveDispatcher();
  let lastError = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const mismatched = [];
    for (const name of staged) {
      const res = await fetchPublic(`${publicBase()}/state/${domain}/${name}?verify=${Date.now()}-${attempt}`, dispatcher);
      const remote = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
      if (!remote || !remote.equals(fs.readFileSync(path.join(dir, name)))) mismatched.push(`${name}${res.ok ? "" : ` (${res.status})`}`);
      else if (name !== "index.json" && !index.includes(name)) mismatched.push(`${name} (index 未登録)`);
    }
    if (mismatched.length === 0) {
      log(`[state:publish] ${domain}: read-back 一致 ${staged.length} object(s)`);
      return staged;
    }
    lastError = mismatched.join(", ");
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_MS * attempt));
  }
  throw new Error(`read-back が一致しない: state/${domain}/ ${lastError}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, domain, ...files] = process.argv.slice(2);
  const run =
    command === "prepare" && domain ? prepareState(domain, files) : command === "verify" && domain ? verifyState(domain) : null;
  if (!run) {
    console.error("usage: node .claude/scripts/lib/state-publish.mjs prepare <domain> <file...> | verify <domain>");
    process.exit(2);
  }
  run.catch((error) => {
    console.error(`[state:publish] ${error.message}`);
    process.exit(1);
  });
}
