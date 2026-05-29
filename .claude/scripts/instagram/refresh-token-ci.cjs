#!/usr/bin/env node
/**
 * Instagram 長期アクセストークン更新スクリプト — CI 版
 *
 * ローカル版 (refresh-token.cjs) との違い:
 *   - トークンを .env.local ではなく環境変数 INSTAGRAM_ACCESS_TOKEN から読む
 *   - .env.local を書き換えない（CI には存在しない）。新トークンは出力ファイルに書き出し、
 *     呼び出し元ワークフローが `gh secret set INSTAGRAM_ACCESS_TOKEN` で GitHub Secret を更新する
 *   - ログには full token を一切出さない（先頭/末尾のみ）
 *
 * 使い方 (GitHub Actions):
 *   INSTAGRAM_ACCESS_TOKEN=<secret> IG_TOKEN_OUT=/tmp/ig-new-token.txt \
 *     node .claude/scripts/instagram/refresh-token-ci.cjs
 *
 * オプション:
 *   --dry-run   API を呼ばず、読み込み・URL 構築のみ検証する
 *
 * 対象トークン:
 *   IGAA (Instagram Login 形式) を ig_refresh_token で延長する。毎回 expires_in が約 60 日にリセット。
 *   ※ ig_refresh_token は「24h 以上経過したトークン」が対象。週次実行なら常に満たす。
 *   EAA (Facebook Graph 形式) は CI では非対応（META_APP_* が CI に無いため）。ローカル版を使うこと。
 *
 * 終了コード: 0=成功 / 1=失敗（トークン未設定・API エラー・EAA 検出など）
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/metrics");
const STATE_FILE = path.join(STATE_DIR, "instagram-token.json");

const DRY_RUN = process.argv.includes("--dry-run");
const OUT_FILE = process.env.IG_TOKEN_OUT || "/tmp/ig-new-token.txt";

function mask(token) {
  return `${token.slice(0, 8)}…${token.slice(-4)} (len ${token.length})`;
}

async function main() {
  const current = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!current) {
    console.error("❌ 環境変数 INSTAGRAM_ACCESS_TOKEN が未設定（GitHub Secret を渡しているか確認）");
    process.exit(1);
  }

  if (current.startsWith("EAA")) {
    console.error(
      "❌ EAA トークン（Facebook Graph 形式）は CI では更新非対応。" +
        "ローカルで META_APP_* を使い refresh-token.cjs を実行してください。"
    );
    process.exit(1);
  }

  const url =
    "https://graph.instagram.com/refresh_access_token" +
    "?grant_type=ig_refresh_token" +
    `&access_token=${encodeURIComponent(current)}`;

  console.log("🔄 Instagram long-lived token を refresh (IGAA / ig_refresh_token)");
  console.log(`  current: ${mask(current)}`);
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
    console.error("❌ access_token が返らず:", JSON.stringify(data));
    process.exit(1);
  }

  const newToken = data.access_token;
  const expiresInSec = Number(data.expires_in ?? 0);
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  console.log(`  new:        ${mask(newToken)}`);
  console.log(`  expires_in: ${expiresInSec} sec (${(expiresInSec / 86400).toFixed(1)} 日)`);
  console.log(`  expires_at: ${expiresAt}`);

  // 新トークンを出力ファイルへ（呼び出し元が gh secret set で使う）。改行なしで書く。
  fs.writeFileSync(OUT_FILE, newToken, { mode: 0o600 });
  console.log(`  ✅ 新トークンを出力: ${OUT_FILE}`);

  // 観測用 state（秘匿値は含めない）
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  const state = {
    refreshed_at: new Date().toISOString(),
    refreshed_by: "ci:instagram-token-refresh",
    expires_at: expiresAt,
    expires_in_sec: expiresInSec,
    token_prefix: newToken.slice(0, 8),
    token_suffix: newToken.slice(-4),
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`  📝 state: ${STATE_FILE}`);

  // GitHub Step Summary 用に expiry を出力
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `expires_at=${expiresAt}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `expires_in_days=${(expiresInSec / 86400).toFixed(1)}\n`);
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
