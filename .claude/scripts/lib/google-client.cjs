/**
 * Google API の認証とクライアント生成の単一実装 (SCRIPT-GOOGLE-CLIENT-UNIFY-01)。
 * 新しいスクリプトで GoogleAuth / OAuth2 を自前で組まない (check-maintenance-debt.cjs の GOOGLE_AUTH_LOCAL が止める)。
 *
 * 認証:
 * - サービスアカウント (GA4・Search Console): env GOOGLE_SERVICE_ACCOUNT_KEY_JSON をメモリで渡す。無ければリポジトリ直下の
 *   stats47-*.json を読む。鍵を一時ファイルへ書かない (CI の公開 repo へ push するジョブでも読める場所に秘密を残さない)。
 *   探す場所は実行ディレクトリではなくこのファイルの位置から決める。
 * - AdSense: OAuth リフレッシュトークン (env GOOGLE_ADSENSE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)。
 *   スコープは発行時 (.claude/scripts/adsense/oauth-setup.js) に付けた adsense.readonly で決まる。
 *
 * 再試行: googleapis は既定で 408・429・5xx を最大 3 回再試行するが、対象メソッドは GET・HEAD・PUT・OPTIONS・DELETE で
 * POST を含まない (googleapis-common 8.0.3 apirequest.js / gaxios 7.1.3 retry.js で確認)。GA4 の runReport、
 * Search Console の検索実績・URL 検査は読み取りだが POST なので、読み取り用クライアントは POST も再試行する。
 * 書き込み用クライアント (GA4 Admin の作成) は GET・HEAD・OPTIONS だけを再試行し、変更系の要求は 1 回だけ送る。
 */
const fs = require("node:fs");
const path = require("node:path");
const { google } = require("googleapis");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const SCOPES = Object.freeze({
  GA4_READ: "https://www.googleapis.com/auth/analytics.readonly",
  GA4_EDIT: "https://www.googleapis.com/auth/analytics.edit",
  GSC_READ: "https://www.googleapis.com/auth/webmasters.readonly",
  ADSENSE_READ: "https://www.googleapis.com/auth/adsense.readonly",
});

const SERVICE_ACCOUNT_ENV = "GOOGLE_SERVICE_ACCOUNT_KEY_JSON";
const ADMIN_SERVICE_ACCOUNT_ENV = "GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON";
const LOCAL_KEY_CANDIDATES = Object.freeze(["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"]);

// 読み取り用クライアントだけが使う。PUT・DELETE を外し、誤って書き込みに使っても変更を再送しない。
const READ_RETRY_CONFIG = Object.freeze({ httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "POST"] });
const WRITE_RETRY_CONFIG = Object.freeze({ httpMethodsToRetry: ["GET", "HEAD", "OPTIONS"] });

/**
 * サービスアカウント鍵を探す。見つからなければ null。env の JSON が壊れていれば JSON.parse の例外をそのまま投げる。
 * @param {{ env?: NodeJS.ProcessEnv, root?: string }} [options]
 */
function findServiceAccountCredentials({ env = process.env, root = PROJECT_ROOT } = {}) {
  if (env[SERVICE_ACCOUNT_ENV]) return JSON.parse(env[SERVICE_ACCOUNT_ENV]);
  for (const name of LOCAL_KEY_CANDIDATES) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return null;
}

/** findServiceAccountCredentials と同じだが、見つからなければ例外を投げる。 */
function loadServiceAccountCredentials(options = {}) {
  const credentials = findServiceAccountCredentials(options);
  if (credentials) return credentials;
  throw new Error(
    `Service account key not found. Set ${SERVICE_ACCOUNT_ENV} env or place one of ${LOCAL_KEY_CANDIDATES.join(", ")} at ${options.root ?? PROJECT_ROOT}`,
  );
}

/** @param {string[]} scopes @param {{ credentials?: object, env?: NodeJS.ProcessEnv, root?: string }} [options] */
function createServiceAccountAuth(scopes, options = {}) {
  const credentials = options.credentials ?? loadServiceAccountCredentials(options);
  return new google.auth.GoogleAuth({ credentials, scopes });
}

// options.auth は差し替え用 (テストで API キー文字列を渡す)。options.rootUrl も同じ。
function serviceOptions(scope, retryConfig, options) {
  const auth = options.auth ?? createServiceAccountAuth([scope], options);
  return { auth, retryConfig, ...(options.rootUrl ? { rootUrl: options.rootUrl } : {}) };
}

/** GA4 Data API (runReport)。読み取り用。 */
function createGa4DataClient(options = {}) {
  return google.analyticsdata({ version: "v1beta", ...serviceOptions(SCOPES.GA4_READ, READ_RETRY_CONFIG, options) });
}

/** Search Console API (検索実績・URL 検査)。読み取り用。 */
function createSearchConsoleClient(options = {}) {
  return google.searchconsole({ version: "v1", ...serviceOptions(SCOPES.GSC_READ, READ_RETRY_CONFIG, options) });
}

/** Search Console の旧 API (sites.list)。読み取り用。 */
function createWebmastersClient(options = {}) {
  return google.webmasters({ version: "v3", ...serviceOptions(SCOPES.GSC_READ, READ_RETRY_CONFIG, options) });
}

/** GA4 Admin API の読み取り用 (v1beta と、v1beta に無い項目を読む v1alpha)。認証は 1 つを共有する。 */
function createAnalyticsAdminReadClients(options = {}) {
  const shared = serviceOptions(SCOPES.GA4_READ, READ_RETRY_CONFIG, options);
  return {
    beta: google.analyticsadmin({ version: "v1beta", ...shared }),
    alpha: google.analyticsadmin({ version: "v1alpha", ...shared }),
  };
}

/**
 * GA4 Admin API の書き込み用 (analytics.edit)。専用鍵 GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON があればそれを使い、
 * 無ければ通常のサービスアカウント鍵を使う。作成などの変更は再試行しない。
 */
function createAnalyticsAdminEditClient(options = {}) {
  const env = options.env ?? process.env;
  const credentials = options.credentials ?? (env[ADMIN_SERVICE_ACCOUNT_ENV] ? JSON.parse(env[ADMIN_SERVICE_ACCOUNT_ENV]) : undefined);
  return google.analyticsadmin({
    version: "v1beta",
    ...serviceOptions(SCOPES.GA4_EDIT, WRITE_RETRY_CONFIG, { ...options, credentials }),
  });
}

/** env から AdSense の OAuth 資格情報を読む。1 つでも欠ければ null。 */
function adsenseCredentialsFromEnv(env = process.env) {
  const clientId = env.GOOGLE_ADSENSE_CLIENT_ID;
  const clientSecret = env.GOOGLE_ADSENSE_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_ADSENSE_REFRESH_TOKEN;
  return clientId && clientSecret && refreshToken ? { clientId, clientSecret, refreshToken } : null;
}

/** AdSense Management API v2。読み取り用。資格情報が欠ければ null。 */
function createAdsenseClient(credentials = adsenseCredentialsFromEnv(), options = {}) {
  if (!credentials) return null;
  const auth = options.auth ?? new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);
  if (!options.auth) auth.setCredentials({ refresh_token: credentials.refreshToken });
  return google.adsense({
    version: "v2",
    auth,
    retryConfig: READ_RETRY_CONFIG,
    ...(options.rootUrl ? { rootUrl: options.rootUrl } : {}),
  });
}

module.exports = {
  SCOPES,
  LOCAL_KEY_CANDIDATES,
  READ_RETRY_CONFIG,
  WRITE_RETRY_CONFIG,
  findServiceAccountCredentials,
  loadServiceAccountCredentials,
  createServiceAccountAuth,
  createGa4DataClient,
  createSearchConsoleClient,
  createWebmastersClient,
  createAnalyticsAdminReadClients,
  createAnalyticsAdminEditClient,
  adsenseCredentialsFromEnv,
  createAdsenseClient,
};
