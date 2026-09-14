#!/usr/bin/env node
/**
 * R2 `state/<domain>/` (CI が書く生 snapshot・公開 URL) をローカルの gitignored `live/` へ取得する。
 *
 *   npm run state:pull -- ads/ga4-affiliate            # index.json に載る全 object
 *   npm run state:pull -- ads/ga4-affiliate --latest   # latest.json だけ
 *
 * 置き場の規約 (docs/01_技術設計/02_データアーキテクチャ.md・.claude/rules/data-storage.md 2026-09-14):
 *   - 書き手は CI だけ (S3 creds は GitHub Actions secrets)。ローカルは公開 URL で読むだけ。
 *   - `state/<domain>/index.json` は CI が維持する object 一覧 (公開 R2 は list できないため)。
 *   - ローカル保存先は `.claude/state/<top>/live/<rest>/…`。`live/` は各 domain の .gitignore で除外する
 *     (search-growth の live/ と同じ形)。読み手は「git 追跡の集約 → 無ければ live/」の順で読む。
 *
 * 会社 PC のプロキシは HTTPS_PROXY を undici の ProxyAgent で通す (theme-chart-live-audit.mjs と同じ手本)。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BASE = (process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp").replace(/\/+$/, "");

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

export function localDirFor(domain, root = ROOT) {
  const [top, ...rest] = domain.split("/").filter(Boolean);
  if (!top) throw new Error(`domain が空: ${domain}`);
  return path.join(root, ".claude", "state", top, "live", ...rest);
}

async function fetchJson(url, dispatcher) {
  const res = await fetch(url, { dispatcher, headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

export async function pullState(domain, { latestOnly = false, root = ROOT, log = console.log } = {}) {
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(domain) || domain.includes("..")) throw new Error(`不正な domain: ${domain}`);
  const dispatcher = resolveDispatcher();
  const prefix = `${BASE}/state/${domain}`;
  const dir = localDirFor(domain, root);
  fs.mkdirSync(dir, { recursive: true });
  const keys = latestOnly ? ["latest.json"] : await (await fetchJson(`${prefix}/index.json`, dispatcher)).json();
  if (!Array.isArray(keys)) throw new Error(`index.json が配列でない: ${prefix}/index.json`);
  const written = [];
  for (const key of keys) {
    if (typeof key !== "string" || key.includes("..") || key.startsWith("/")) throw new Error(`不正な key: ${key}`);
    const res = await fetchJson(`${prefix}/${key}`, dispatcher);
    const target = path.join(dir, key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    written.push(path.relative(root, target).split(path.sep).join("/"));
  }
  log(`[state:pull] ${domain}: ${written.length} object(s) → ${path.relative(root, dir).split(path.sep).join("/")}`);
  return written;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const domain = argv.find((a) => !a.startsWith("--"));
  if (!domain) {
    console.error("usage: node .claude/scripts/lib/state-pull.mjs <domain> [--latest]");
    process.exit(2);
  }
  pullState(domain, { latestOnly: argv.includes("--latest") }).catch((error) => {
    console.error(`[state:pull] ${error.message}`);
    process.exit(1);
  });
}
