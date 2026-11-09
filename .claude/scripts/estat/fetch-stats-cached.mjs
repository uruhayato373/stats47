#!/usr/bin/env node
/**
 * e-Stat の getStatsData の応答を手元に残し、同じ取得条件なら API を呼ばずに返す (npm run estat:fetch)。
 *
 *   npm run -s estat:fetch -- --id 0002070005 --param cdCat01=004 --param cdCat02=03
 *   → 標準出力に保存先のパス (.local/estat-cache/<statsDataId>/<条件の sha256 先頭16桁>.json) を 1 行
 *
 * 2026-11-09 に家計調査の記事 10 本を 3 体の書き手が並行して書いたとき、同じ表を書き手ごとに取りに行き、
 * 応答の読み込みでトークンが重複した。取得条件 (statsDataId と params) が同じなら同じファイルを読む。
 * 応答の中身を記事の正本にはしない (正本は図の source.json の取得条件)。寿命は config/local-resources.json の登録で回収する。
 *
 * オプション: --refresh で取り直す。--max-age-days N (既定 7) より古い保存は取り直す。
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { fetchStatsData } from "../lib/estat-catalog/api.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CACHE_DIR = path.join(ROOT, ".local/estat-cache");
const DEFAULT_MAX_AGE_DAYS = 7;
const DAY_MS = 86_400_000;

const { values } = parseArgs({
  options: {
    id: { type: "string" },
    param: { type: "string", multiple: true, default: [] },
    refresh: { type: "boolean", default: false },
    "max-age-days": { type: "string" },
    help: { type: "boolean", short: "h", default: false },
  },
});
if (values.help || !values.id) {
  console.error("使い方: npm run -s estat:fetch -- --id <statsDataId> [--param key=value ...] [--refresh] [--max-age-days N]");
  process.exit(values.help ? 0 : 2);
}

const params = Object.fromEntries(
  values.param.map((p) => {
    const at = p.indexOf("=");
    if (at <= 0) {
      console.error(`--param は key=value の形: ${p}`);
      process.exit(2);
    }
    return [p.slice(0, at), p.slice(at + 1)];
  })
);
// 年度範囲と地域の指定は保存を分断する (.claude/rules/estat-api.md)。全年・全地域で取り、読む側で絞る
const FORBIDDEN = ["cdTimeFrom", "cdTimeTo", "cdArea"].filter((k) => k in params);
if (FORBIDDEN.length) {
  console.error(`${FORBIDDEN.join(", ")} は使わない (.claude/rules/estat-api.md)。全年・全地域で取得して読む側で絞る`);
  process.exit(2);
}
// 条件の並びが違っても同じファイルになるよう、キーを並べてから hash する
const key = JSON.stringify(Object.keys(params).sort().map((k) => [k, params[k]]));
const file = path.join(CACHE_DIR, values.id, `${crypto.createHash("sha256").update(key).digest("hex").slice(0, 16)}.json`);
const maxAgeMs = Number(values["max-age-days"] ?? DEFAULT_MAX_AGE_DAYS) * DAY_MS;

const isFresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < maxAgeMs;
if (!isFresh || values.refresh) {
  const json = await fetchStatsData({ statsDataId: values.id, ...params });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ statsDataId: values.id, params, fetchedAt: new Date().toISOString(), response: json }));
}
console.log(path.relative(ROOT, file));
