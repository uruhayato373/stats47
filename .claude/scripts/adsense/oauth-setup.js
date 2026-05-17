#!/usr/bin/env node
/**
 * AdSense Management API 用 OAuth 2.0 セットアップスクリプト
 *
 * `.env.local` の GOOGLE_ADSENSE_REFRESH_TOKEN を更新する。
 * `.claude/scripts/youtube/oauth-setup.js` の AdSense 版。
 *
 * 事前準備:
 *   1. Google Cloud Console → 認証情報 → OAuth 2.0 クライアント ID（デスクトップアプリ、AdSense 用）
 *      → OAuth 同意画面の publishing status を **"In production"** にすること
 *      （Testing のままだと refresh token が 7 日で auto-expire する Google 仕様。Issue #184）
 *      対象 client: 1044264339032-rfo463bt3j000eee8d2uolqeguod2v95
 *   2. AdSense Management API を有効化
 *   3. AdSense scope: https://www.googleapis.com/auth/adsense.readonly が同意画面に追加されていること
 *   4. .env.local に GOOGLE_ADSENSE_CLIENT_ID / GOOGLE_ADSENSE_CLIENT_SECRET を設定済み
 *
 * 使い方:
 *   node .claude/scripts/adsense/oauth-setup.js
 *   → ブラウザで Google 認証 → 自動的に .env.local の GOOGLE_ADSENSE_REFRESH_TOKEN が更新される
 *
 * 失効時の典型エラー:
 *   - `/fetch-adsense-data snapshot ...` で `invalid_grant` → 本スクリプトで再認証
 */

const { google } = require("googleapis");
const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", "..", "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
}

const CLIENT_ID = envVars.GOOGLE_ADSENSE_CLIENT_ID;
const CLIENT_SECRET = envVars.GOOGLE_ADSENSE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: .env.local に GOOGLE_ADSENSE_CLIENT_ID と GOOGLE_ADSENSE_CLIENT_SECRET を設定してください");
  process.exit(1);
}

const PORT = 53217;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPES = ["https://www.googleapis.com/auth/adsense.readonly"];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("ブラウザで以下の URL を開いて認証してください:\n");
console.log(authUrl);
console.log("\n認証後、自動的にリダイレクトされます...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(200);
    res.end("");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("認証成功!");
    console.log("  Access Token: " + tokens.access_token?.substring(0, 20) + "...");
    console.log("  Refresh Token: " + tokens.refresh_token?.substring(0, 20) + "...");

    const currentContent = fs.readFileSync(envPath, "utf-8");
    const lines = currentContent.split("\n");
    const filtered = lines.filter(
      (l) => !l.startsWith("GOOGLE_ADSENSE_REFRESH_TOKEN=")
    );
    filtered.push(`GOOGLE_ADSENSE_REFRESH_TOKEN=${tokens.refresh_token}`);
    fs.writeFileSync(envPath, filtered.join("\n") + "\n");

    console.log("\n.env.local の GOOGLE_ADSENSE_REFRESH_TOKEN を更新しました。");
    console.log("以下で動作確認:");
    console.log("  /fetch-adsense-data snapshot 2026-W21");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>AdSense OAuth 認証完了</h1><p>このタブを閉じてください。</p>");
  } catch (err) {
    console.error("トークン取得エラー:", err.message);
    res.writeHead(500);
    res.end("Error: " + err.message);
  }

  server.close();
});

server.listen(PORT, () => {
  console.log(`コールバックサーバー起動: http://localhost:${PORT}`);
});
