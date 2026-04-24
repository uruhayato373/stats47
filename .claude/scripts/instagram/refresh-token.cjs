#!/usr/bin/env node
/**
 * Instagram 長期アクセストークン更新スクリプト
 *
 * 使い方:
 *   node .claude/scripts/instagram/refresh-token.cjs [--dry-run]
 *
 * 挙動:
 *   1. .env.local の INSTAGRAM_ACCESS_TOKEN を取得
 *   2. graph.instagram.com/refresh_access_token を叩く（24h 以内の連続呼び出しは不可）
 *   3. 新しいトークンで .env.local を書き換え
 *   4. 結果を .claude/state/metrics/instagram-token.json に記録
 *
 * 実行頻度:
 *   - 月 1 回（1 日等）が推奨。毎回 expires_in は 60 日にリセットされる
 *   - schedule スキルで cron 設定するか、手動で月初に実行
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/metrics");
const STATE_FILE = path.join(STATE_DIR, "instagram-token.json");

const DRY_RUN = process.argv.includes("--dry-run");

function parseEnv(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function replaceEnvValue(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${value}`);
  }
  return content + (content.endsWith("\n") ? "" : "\n") + `${key}=${value}\n`;
}

async function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`❌ ${ENV_PATH} が見つかりません`);
    process.exit(1);
  }
  const envRaw = fs.readFileSync(ENV_PATH, "utf8");
  const env = parseEnv(envRaw);
  const current = env.INSTAGRAM_ACCESS_TOKEN;
  if (!current) {
    console.error("❌ INSTAGRAM_ACCESS_TOKEN が .env.local に未設定");
    process.exit(1);
  }

  const url =
    "https://graph.instagram.com/refresh_access_token" +
    "?grant_type=ig_refresh_token" +
    `&access_token=${encodeURIComponent(current)}`;

  console.log("🔄 Instagram long-lived token を refresh");
  console.log(`  current (先頭10): ${current.slice(0, 10)}...`);
  if (DRY_RUN) {
    console.log("  🧪 DRY RUN: API 呼び出しスキップ");
    return;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    console.error(`❌ API Error ${data.error.code ?? ""}: ${data.error.message}`);
    process.exit(1);
  }
  if (!data.access_token) {
    console.error("❌ access_token が返らず:", data);
    process.exit(1);
  }

  const newToken = data.access_token;
  const expiresInSec = Number(data.expires_in ?? 0);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  console.log(`  new (先頭10): ${newToken.slice(0, 10)}...`);
  console.log(`  expires_in:  ${expiresInSec} sec (${(expiresInSec / 86400).toFixed(1)} 日)`);
  console.log(`  expires_at:  ${expiresAt}`);

  // .env.local を更新
  const updated = replaceEnvValue(envRaw, "INSTAGRAM_ACCESS_TOKEN", newToken);

  // 万が一の備えに .env.local.bak.<ts> を残す（一時的、次回 refresh で削除）
  const bakPath = `${ENV_PATH}.bak.${Date.now()}`;
  fs.writeFileSync(bakPath, envRaw);
  fs.writeFileSync(ENV_PATH, updated);
  console.log(`  ✅ .env.local 更新（backup: ${path.basename(bakPath)}）`);

  // state ファイルに記録
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  const state = {
    refreshed_at: new Date().toISOString(),
    expires_at: expiresAt,
    expires_in_sec: expiresInSec,
    token_prefix: newToken.slice(0, 10),
    token_suffix: newToken.slice(-6),
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`  📝 state: ${STATE_FILE}`);

  // 古い backup（1 週間以上前）を掃除
  const envDir = path.dirname(ENV_PATH);
  for (const f of fs.readdirSync(envDir)) {
    if (!f.startsWith(".env.local.bak.")) continue;
    const ts = Number(f.split(".").pop());
    if (!Number.isFinite(ts)) continue;
    if (Date.now() - ts > 7 * 86400 * 1000) {
      try {
        fs.unlinkSync(path.join(envDir, f));
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
