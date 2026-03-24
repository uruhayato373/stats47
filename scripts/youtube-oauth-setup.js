#!/usr/bin/env node
/**
 * YouTube Analytics API 用 OAuth 2.0 セットアップスクリプト
 *
 * 初回のみブラウザで認証し、リフレッシュトークンを .env.local に保存する。
 *
 * 事前準備:
 *   1. Google Cloud Console → 認証情報 → OAuth 2.0 クライアント ID（デスクトップアプリ）
 *   2. YouTube Analytics API と YouTube Data API v3 を有効化
 *   3. .env.local に GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET を設定
 *
 * 使い方:
 *   node scripts/youtube-oauth-setup.js
 */

const { google } = require("googleapis");
const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// .env.local から読み込み
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
}

const CLIENT_ID = envVars.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = envVars.GOOGLE_OAUTH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: .env.local に GOOGLE_OAUTH_CLIENT_ID と GOOGLE_OAUTH_CLIENT_SECRET を設定してください");
  process.exit(1);
}

const PORT = 3847;
// デスクトップアプリの場合、リダイレクト URI は http://localhost のみ許可
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPES = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("ブラウザで以下の URL を開いて認証してください:\n");
console.log(authUrl);
console.log("\n認証後、自動的にリダイレクトされます...\n");

// ローカルサーバーでコールバックを受け取る（任意のパスで受信）
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");

  if (!code) {
    // favicon.ico 等の無関係なリクエストは無視
    res.writeHead(200);
    res.end("");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("認証成功!");
    console.log("  Access Token: " + tokens.access_token?.substring(0, 20) + "...");
    console.log("  Refresh Token: " + tokens.refresh_token?.substring(0, 20) + "...");

    // .env.local にリフレッシュトークンを追記
    const currentContent = fs.readFileSync(envPath, "utf-8");
    const lines = currentContent.split("\n");
    const filtered = lines.filter(
      (l) => !l.startsWith("GOOGLE_OAUTH_REFRESH_TOKEN=")
    );
    filtered.push(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    fs.writeFileSync(envPath, filtered.join("\n") + "\n");

    console.log("\n.env.local に GOOGLE_OAUTH_REFRESH_TOKEN を保存しました。");
    console.log("以下のコマンドでデータ取得できます:");
    console.log("  node scripts/youtube-analytics.js overview");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>認証完了</h1><p>このタブを閉じてください。</p>");
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
