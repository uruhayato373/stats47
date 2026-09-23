#!/usr/bin/env node
"use strict";

/**
 * Threads 長期アクセストークンの更新 (CI 用)。threads-token-refresh.yml が週次で呼ぶ。
 *
 * 公式 (https://developers.facebook.com/docs/threads/get-started/long-lived-tokens ・アクセス日 2026-09-23):
 * - 長期トークンは 60 日有効。発行から 24 時間以上経過し、失効前で、threads_basic が付与されていれば
 *   GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token で更新できる
 * - 更新後は更新日から 60 日有効。60 日更新しないと失効し、以後は更新できない
 *
 * 新トークンは THREADS_TOKEN_OUT のファイルへ書き、呼び出し元が `gh secret set THREADS_ACCESS_TOKEN`
 * で Secret を差し替える。ログにトークン全体は出さない。
 *
 *   THREADS_ACCESS_TOKEN=<secret> THREADS_TOKEN_OUT=/tmp/threads-new-token.txt \
 *     node .claude/scripts/threads/refresh-token-ci.cjs [--dry-run]
 *
 * 終了コード: 0 = 成功、1 = トークン未設定・API エラー
 */

const fs = require("node:fs");

const DRY_RUN = process.argv.includes("--dry-run");
const OUT_FILE = process.env.THREADS_TOKEN_OUT || "/tmp/threads-new-token.txt";

const mask = (t) => `${t.slice(0, 6)}…${t.slice(-4)} (len ${t.length})`;

async function main() {
  const current = process.env.THREADS_ACCESS_TOKEN;
  if (!current) {
    console.error("::error::THREADS_ACCESS_TOKEN が未設定 (GitHub Secret を登録する)");
    return 1;
  }
  console.log(`[threads-token] current: ${mask(current)}`);
  if (DRY_RUN) {
    console.log("[threads-token] --dry-run: API は呼ばない");
    return 0;
  }

  const url = new URL("https://graph.threads.net/refresh_access_token");
  url.searchParams.set("grant_type", "th_refresh_token");
  url.searchParams.set("access_token", current);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || !data.access_token) {
    console.error(`::error::更新失敗 (HTTP ${res.status}): ${data.error?.message ?? "access_token が返らない"}`);
    return 1;
  }

  const expiresInSec = Number(data.expires_in ?? 0);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  fs.writeFileSync(OUT_FILE, data.access_token, { mode: 0o600 });
  console.log(`[threads-token] new: ${mask(data.access_token)} / expires_at ${expiresAt}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `expires_at=${expiresAt}\nexpires_in_days=${(expiresInSec / 86400).toFixed(1)}\n`,
    );
  }
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`::error::${err.message || err}`);
    process.exit(1);
  });
