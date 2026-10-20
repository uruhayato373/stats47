// SCRIPT-GOOGLE-CLIENT-UNIFY-01: Google API の認証とクライアント生成は google-client.cjs だけが持つ。
// 読み取りの POST (GA4 runReport・検索実績・URL 検査) は googleapis の既定では再試行されないので、読み取り用クライアントで
// 再試行を有効にし、書き込み (GA4 Admin の作成) は 1 回だけ送ることを、ローカルの HTTP サーバーへの実要求で確かめる。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  LOCAL_KEY_CANDIDATES,
  findServiceAccountCredentials,
  loadServiceAccountCredentials,
  createGa4DataClient,
  createSearchConsoleClient,
  createAnalyticsAdminEditClient,
  adsenseCredentialsFromEnv,
  createAdsenseClient,
} = require("../google-client.cjs");

const FAKE_KEY = { type: "service_account", client_email: "test@example.iam.gserviceaccount.com", private_key: "unused" };

/** statuses を順に返し、尽きたら 200 を返すサーバー。受けた要求を記録する。 */
async function serve(t, statuses) {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(`${req.method} ${req.url.split("?")[0]}`);
    const status = statuses[hits.length - 1] ?? 200;
    res.writeHead(status, { "content-type": "application/json" });
    res.end(status === 200 ? JSON.stringify({ ok: true }) : JSON.stringify({ error: { code: status, message: "test" } }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { hits, rootUrl: `http://127.0.0.1:${server.address().port}/` };
}

test("GA4 runReport (POST) は 503 と 429 の後に再試行して成功する", async (t) => {
  const { hits, rootUrl } = await serve(t, [503, 429]);
  const client = createGa4DataClient({ auth: "test-key", rootUrl });
  const { data } = await client.properties.runReport({ property: "properties/1", requestBody: {} });
  assert.deepEqual(data, { ok: true });
  assert.deepEqual(hits, Array(3).fill("POST /v1beta/properties/1:runReport"));
});

test("URL 検査 (POST) も再試行する", async (t) => {
  const { hits, rootUrl } = await serve(t, [500]);
  const client = createSearchConsoleClient({ auth: "test-key", rootUrl });
  await client.urlInspection.index.inspect({ requestBody: { inspectionUrl: "https://example.com/", siteUrl: "sc-domain:example.com" } });
  assert.equal(hits.length, 2);
});

test("400 は値の誤りなので再試行しない", async (t) => {
  const { hits, rootUrl } = await serve(t, [400]);
  const client = createSearchConsoleClient({ auth: "test-key", rootUrl });
  await assert.rejects(client.searchanalytics.query({ siteUrl: "sc-domain:example.com", requestBody: {} }));
  assert.equal(hits.length, 1);
});

test("GA4 Admin の作成 (POST) は 503 でも再送しない", async (t) => {
  const { hits, rootUrl } = await serve(t, [503]);
  const client = createAnalyticsAdminEditClient({ auth: "test-key", rootUrl });
  await assert.rejects(client.properties.customDimensions.create({ parent: "properties/1", requestBody: {} }));
  assert.deepEqual(hits, ["POST /v1beta/properties/1/customDimensions"]);
});

test("GA4 Admin の書き込み用クライアントでも一覧 (GET) は再試行する", async (t) => {
  const { hits, rootUrl } = await serve(t, [503]);
  const client = createAnalyticsAdminEditClient({ auth: "test-key", rootUrl });
  await client.properties.customDimensions.list({ parent: "properties/1" });
  assert.equal(hits.length, 2);
});

test("AdSense の読み取りも再試行し、資格情報が欠ければ null を返す", async (t) => {
  const { hits, rootUrl } = await serve(t, [503]);
  const client = createAdsenseClient({ clientId: "a", clientSecret: "b", refreshToken: "c" }, { auth: "test-key", rootUrl });
  await client.accounts.list({});
  assert.equal(hits.length, 2);
  assert.equal(createAdsenseClient(null), null);
  assert.equal(adsenseCredentialsFromEnv({ GOOGLE_ADSENSE_CLIENT_ID: "a", GOOGLE_ADSENSE_CLIENT_SECRET: "b" }), null);
  assert.deepEqual(
    adsenseCredentialsFromEnv({ GOOGLE_ADSENSE_CLIENT_ID: "a", GOOGLE_ADSENSE_CLIENT_SECRET: "b", GOOGLE_ADSENSE_REFRESH_TOKEN: "c" }),
    { clientId: "a", clientSecret: "b", refreshToken: "c" },
  );
});

test("鍵は env を優先し、無ければリポジトリ直下の候補を読む。どちらも無ければ null / 例外", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-google-client-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  assert.equal(findServiceAccountCredentials({ env: {}, root }), null);
  assert.throws(() => loadServiceAccountCredentials({ env: {}, root }), /GOOGLE_SERVICE_ACCOUNT_KEY_JSON/);

  fs.writeFileSync(path.join(root, LOCAL_KEY_CANDIDATES[1]), JSON.stringify({ ...FAKE_KEY, client_email: "file@example.com" }));
  assert.equal(findServiceAccountCredentials({ env: {}, root }).client_email, "file@example.com");

  const env = { GOOGLE_SERVICE_ACCOUNT_KEY_JSON: JSON.stringify(FAKE_KEY) };
  assert.deepEqual(findServiceAccountCredentials({ env, root }), FAKE_KEY);
  assert.throws(() => findServiceAccountCredentials({ env: { GOOGLE_SERVICE_ACCOUNT_KEY_JSON: "{broken" }, root }), SyntaxError);
});

test("鍵を一時ファイルへ書き出さない", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "google-client.cjs"), "utf8");
  assert.doesNotMatch(source, /writeFileSync|tmpdir|keyFile/);
});
