#!/usr/bin/env node
/**
 * AdSense Management API 用 OAuth 2.0 セットアップ (refresh token の再発行)。
 *
 * scope は read-only の https://www.googleapis.com/auth/adsense.readonly を要求する。
 * 週次レポート取得と inventory 監査はこれで足りる。広告ユニットの create/patch は
 * AdSense for Platforms 系の制限プロジェクト向けで stats47 の利用権限が未証明のため
 * 自動化しない (README「結論」「denylist」)。書き込み scope は権限の証拠ができるまで要求しない。
 *
 * ★ 値の取り扱い:
 *   - refresh token は最後にまとめて 1 度だけ出力する (先頭 N 文字の部分出力もしない)。
 *   - `.env.local` へは書かない。creds は CI 専任で GitHub Secrets が正
 *     (2026-05-29 の秘密集約。memory project_env_local_ci_consolidation)。
 *
 * ★ 前提 (満たさないと失敗する。2026-07-31 に全部踏んだので明記する):
 *   1. 対象プロジェクトで AdSense Management API が有効
 *      (未有効だと "AdSense Management API has not been used in project ..." で全 job 失敗)
 *   2. Google Auth Platform → データアクセス に auth/adsense.readonly がある
 *   3. Google Auth Platform → 対象 の公開ステータスが「本番環境」
 *      (テストのままだと refresh token が 7 日で失効する)
 *   4. OAuth クライアントが Desktop app タイプ (Web app だと redirect_uri_mismatch)
 *
 * ★ Client Secret は Console で「クライアント シークレットを追加」した直後のダイアログでしか
 *   見られない (Google が表示・ダウンロード機能を廃止した)。その場でコピーすること。
 *
 * 使い方 (プロジェクトルートで実行):
 *   cd ~/stats47 && read -r CID && read -rs CSEC && \
 *     GOOGLE_ADSENSE_CLIENT_ID="$CID" GOOGLE_ADSENSE_CLIENT_SECRET="$CSEC" \
 *     node .claude/scripts/adsense/oauth-setup.js; unset CID CSEC
 *
 * 取得後:
 *   gh secret set GOOGLE_ADSENSE_CLIENT_ID
 *   gh secret set GOOGLE_ADSENSE_CLIENT_SECRET
 *   gh secret set GOOGLE_ADSENSE_REFRESH_TOKEN
 *   (いずれも対話プロンプトへ貼る。コマンド引数にするとシェル履歴に残る)
 */

const { google } = require("googleapis");
const http = require("http");
const { URL } = require("url");

const CLIENT_ID = process.env.GOOGLE_ADSENSE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADSENSE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "GOOGLE_ADSENSE_CLIENT_ID / GOOGLE_ADSENSE_CLIENT_SECRET を環境変数で渡してください。\n" +
      "値は Google Auth Platform → クライアント (Desktop app タイプ) から取得します。\n" +
      "Secret は「クライアント シークレットを追加」直後のダイアログでしか見られません。",
  );
  process.exit(2);
}

const PORT = 53217;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPES = ["https://www.googleapis.com/auth/adsense.readonly"];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // 既に承認済みでも同意画面を出す (scope 追加を確実に反映させる)
});

console.log("ブラウザで以下の URL を開いて認証してください:\n");
console.log(authUrl);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>認可が拒否されました: ${err}</h1>`);
    console.error(`\n認可が拒否されました: ${err}`);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.writeHead(200);
    res.end("");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>AdSense OAuth 認証完了</h1><p>このタブを閉じてください。</p>");

    const granted = String(tokens.scope || "");
    console.log(`\n付与された scope: ${granted || "(不明)"}`);
    if (!granted.includes("adsense")) {
      console.log(
        "\n⚠️  AdSense scope が付与されていません。" +
          "\n   Google Auth Platform → データアクセス に https://www.googleapis.com/auth/adsense.readonly を追加してください。",
      );
    }
    if (!tokens.refresh_token) {
      console.log(
        "\n⚠️  refresh_token が返りませんでした。" +
          "\n   https://myaccount.google.com/permissions で権限を削除してから再実行してください。",
      );
      server.close();
      process.exit(1);
    }

    // 取得した token で実接続を検証する。ここで落とせば「Secrets を更新したのに CI で初めて失敗」を防げる。
    console.log("\n--- 実接続チェック (accounts.list) ---");
    try {
      oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
      const adsense = google.adsense({ version: "v2", auth: oauth2Client });
      const listed = await adsense.accounts.list({});
      const accounts = listed.data.accounts || [];
      console.log(`  ✓ accounts.list 成功: ${accounts.length} 件`);
      for (const a of accounts) console.log(`    - ${a.name}  (${a.displayName || "-"})`);
      if (accounts.length === 0) {
        console.log("  ⚠️  0 件。認可アカウントに AdSense のアクセス権がない可能性があります。");
      }
    } catch (e) {
      const msg = String((e && e.message) || e);
      console.log(`  ✗ accounts.list 失敗: ${msg.slice(0, 300)}`);
      if (/has not been used in project|is disabled/.test(msg)) {
        console.log(
          "\n  → このプロジェクトで AdSense Management API が有効化されていません。" +
            "\n     有効化してから再実行してください (token 自体は取れていますが CI で必ず失敗します)。",
        );
        server.close();
        process.exit(1);
      }
    }

    console.log("\n=== GitHub Secrets を 3 つ更新してください ===\n");
    console.log("  gh secret set GOOGLE_ADSENSE_CLIENT_ID      # 今回使った Client ID");
    console.log("  gh secret set GOOGLE_ADSENSE_CLIENT_SECRET  # 今回使った Client Secret");
    console.log("  gh secret set GOOGLE_ADSENSE_REFRESH_TOKEN  # 下の値\n");
    console.log("--- refresh_token ---");
    console.log(tokens.refresh_token);
    console.log("--- ここまで ---");
  } catch (e) {
    console.error("トークン取得エラー:", (e && e.message) || e);
    res.writeHead(500);
    res.end("Error");
    server.close();
    process.exit(1);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`コールバックサーバー起動: http://localhost:${PORT}\n`);
});
