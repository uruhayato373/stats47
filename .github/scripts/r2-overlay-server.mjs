#!/usr/bin/env node
/**
 * PR の E2E 用の R2 読み取り中継。
 *
 * テーマ・地域ページは図の定義 (page-components) を実行時に R2 から読む。PR の E2E がアプリを
 * 本番 R2 に向けて起動すると、図の定義は本番 (= main の内容) になり、PR で変えた図の種類を検査できない
 * (2026-10-08、consumer-prices の cpi-heatmap。E2E-THEME-PR-PAGECOMPONENTS-01)。
 *
 * page-components は PR の生成物 apps/web/scripts/data/page-components/ から返す。
 * 指標metadataは同じPRで再生成・検証した .local/r2/ から返す。
 * 観測値など、それ以外の key はすべて本番 R2 の公開 URL へそのまま取り次ぐ。アプリ側は `R2_PUBLIC_FETCH_URL` を
 * この中継に向けるだけで、本番のコードと読み取り経路は変えない。
 *
 *   node .github/scripts/r2-overlay-server.mjs [port]   # 既定 4790
 *   R2_OVERLAY_UPSTREAM=<転送先> (既定は packages/types/src/site.json の r2PublicBaseUrl)
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { R2_PUBLIC_BASE_URL } from "../../.claude/scripts/lib/site-config.cjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LOCAL_DIR = path.join(ROOT, "apps/web/scripts/data/page-components");
const LOCAL_SNAPSHOT_DIR = path.join(ROOT, ".local/r2");
const PREFIX = "/app/page-components/";

/** URL の path が PR の page-components の生成物に当たれば、そのファイルの絶対 path を返す。 */
export function localPageComponentsFile(urlPath, localDir = LOCAL_DIR) {
  if (!urlPath.startsWith(PREFIX)) return null;
  const parts = urlPath.slice(PREFIX.length).split("/");
  if (parts.length !== 2) return null;
  let type;
  let file;
  try {
    [type, file] = parts.map(decodeURIComponent);
  } catch {
    return null;
  }
  if (!/^[a-z0-9-]+$/.test(type) || !file.endsWith(".json") || file.includes("/") || file.startsWith(".")) return null;
  const target = path.resolve(localDir, type, file);
  if (!target.startsWith(`${path.resolve(localDir)}${path.sep}`)) return null;
  return fs.existsSync(target) ? target : null;
}

/** Only generated metric metadata is overlaid; observation data still comes from R2. */
export function localMetricSnapshotFile(urlPath, snapshotDir = LOCAL_SNAPSHOT_DIR) {
  if (!/^\/app\/(?:ranking\/[a-z0-9-]+\/item\.json|ranking-items\/all\.json|municipalities\/ranking\/[a-z0-9-]+\/(?:item|values)\.json)$/.test(urlPath)) return null;
  const target = path.resolve(snapshotDir, ...urlPath.slice(1).split('/'));
  if (!target.startsWith(path.resolve(snapshotDir) + path.sep)) return null;
  return fs.existsSync(target) ? target : null;
}

/** 本番に取り次ぐときに返すヘッダー。fetch が展開した本文を返すので content-encoding / length は返さない。 */
const PASS_HEADERS = ["content-type", "etag", "last-modified", "cache-control"];

export function createOverlayServer({ upstream, localDir = LOCAL_DIR, snapshotDir = LOCAL_SNAPSHOT_DIR, log = () => {} }) {
  const base = upstream.replace(/\/+$/, "");
  return http.createServer(async (req, res) => {
    const urlPath = new URL(req.url ?? "/", "http://overlay").pathname;
    const local = req.method === "GET" || req.method === "HEAD" ? (localPageComponentsFile(urlPath, localDir) ?? localMetricSnapshotFile(urlPath, snapshotDir)) : null;
    if (local) {
      log(`local ${urlPath}`);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : fs.readFileSync(local));
      return;
    }
    try {
      const upstreamRes = await fetch(base + (req.url ?? "/"), { method: req.method, redirect: "manual" });
      const headers = {};
      for (const name of PASS_HEADERS) {
        const value = upstreamRes.headers.get(name);
        if (value) headers[name] = value;
      }
      res.writeHead(upstreamRes.status, headers);
      res.end(req.method === "HEAD" ? undefined : Buffer.from(await upstreamRes.arrayBuffer()));
    } catch (error) {
      log(`upstream error ${urlPath}: ${String(error)}`);
      res.writeHead(502);
      res.end();
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 4790);
  const upstream = process.env.R2_OVERLAY_UPSTREAM || R2_PUBLIC_BASE_URL;
  createOverlayServer({ upstream, log: (line) => console.log(`[r2-overlay] ${line}`) }).listen(port, "127.0.0.1", () => {
    console.log(`[r2-overlay] http://127.0.0.1:${port} → page-components はローカル、それ以外は ${upstream}`);
  });
}
