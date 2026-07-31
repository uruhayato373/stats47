/**
 * audit-adsense — AdSense の account 照合と ad unit inventory を **API (read-only)** で取る。
 *
 * 正典: ./README.md「mutation前のidentity確認」「allowlist」。
 *
 * 設計上の要点: inventory は API が一次ソースで、DOM は使わない。
 * `accounts.adclients.adunits.list` が `reportingDimensionId` (= レポートの AD_UNIT_ID) を返し、
 * `adunits.getAdcode` が `data-ad-slot` を含む adCode を返すため、unit ↔ slotId の対応が
 * 決定的に取れる。DOM に頼るのは apply 直前の duplicate 再確認と Save 後 verify だけにして、
 * selector drift の影響範囲を作成フォームに封じ込める。
 *
 * scope は adsense.readonly のみ (書き込み API は AdSense v2 に存在しない)。
 * 認証は OAuth (env: GOOGLE_ADSENSE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)。
 * env が無ければ fail closed で status を返し、推測で先に進まない。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { google } from "googleapis";
import { PROJECT_ROOT } from "./browser-context.mjs";
import { extractSlotIdFromAdCode } from "../metrics/lib/adsense-report-contract.mjs";
import { resolveServiceAccountKeyFile } from "../metrics/lib/auth.mjs";

/** 有効化を確認する API。 */
export const ADSENSE_SERVICE_NAME = "adsense.googleapis.com";

const ADSENSE_ENV_KEYS = Object.freeze([
  "GOOGLE_ADSENSE_CLIENT_ID",
  "GOOGLE_ADSENSE_CLIENT_SECRET",
  "GOOGLE_ADSENSE_REFRESH_TOKEN",
  "GOOGLE_ADSENSE_ACCOUNT_ID",
]);

/**
 * .env.local から AdSense の env を自己ロードする (既に process.env にあれば上書きしない)。
 * 値はログに出さない。CI では .env.local が無いので no-op になる。
 */
export function loadAdsenseEnvFromDotEnv(root = PROJECT_ROOT) {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  let text;
  try {
    text = readFileSync(path, "utf-8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (!ADSENSE_ENV_KEYS.includes(key)) continue;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

/** expected な AdSense account 名 (`accounts/pub-XXXX`)。env 未設定なら null。 */
export function expectedAdSenseAccount() {
  const id = process.env.GOOGLE_ADSENSE_ACCOUNT_ID;
  if (!id) return null;
  return id.startsWith("accounts/") ? id : `accounts/${id}`;
}

/**
 * accounts.list の結果を expected と照合する (pure)。
 *
 * ちょうど 1 件で expected と一致した場合だけ ok。0 件・複数・不一致・expected 未設定はすべて
 * 別アカウントへの誤操作を防ぐため fail closed。
 *
 * @param {Array<{name?:string}>} accounts
 * @param {string|null} expected
 */
export function assertAdSenseAccount(accounts, expected) {
  if (!expected) {
    return { status: "expected-missing", detail: "env GOOGLE_ADSENSE_ACCOUNT_ID が未設定" };
  }
  const list = accounts ?? [];
  if (list.length === 0) return { status: "no-account", detail: "accounts.list が 0 件" };
  if (list.length > 1) {
    return { status: "multiple-accounts", detail: `accounts.list が ${list.length} 件 (単一アカウントを期待)` };
  }
  const actual = list[0]?.name ?? "";
  if (actual !== expected) {
    return { status: "account-mismatch", detail: "accounts.list の 1 件が expected と一致しない" };
  }
  return { status: "ok", accountId: actual };
}

/**
 * コード側 slot 定数から「まだ AdSense に作られていないはずの desired ユニット」を導出する (pure)。
 *
 * `pending: true` かつ adUnitName を持つものだけを対象にする。slotId が既に入っていれば
 * 発行済みなので対象外 (pending 宣言の消し忘れは lint 側が検出する)。
 */
export function deriveDesiredAdUnits(codeSlots) {
  return (codeSlots ?? [])
    .filter((s) => s.pending === true && s.adUnitName && !s.slotId)
    .map((s) => ({ adUnitName: s.adUnitName, format: s.format ?? null, exportName: s.exportName }));
}

/** OAuth クライアントを作る。env 不足なら null。 */
function adsenseClient() {
  const clientId = process.env.GOOGLE_ADSENSE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADSENSE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADSENSE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.adsense({ version: "v2", auth: oauth2Client });
}

/**
 * `serviceusage.services.get` の結果から有効状態を判定する (pure)。
 *
 * state は "ENABLED" / "DISABLED" / "STATE_UNSPECIFIED"。ENABLED 以外は fail closed 扱いにする
 * (未有効のまま token を発行しても、レポート取得が全 job 失敗するため)。
 */
export function classifyApiState(service) {
  const state = service?.state ?? null;
  if (state === "ENABLED") return { status: "ok", state };
  if (state === "DISABLED") {
    return {
      status: "api-not-enabled",
      state,
      detail: `${ADSENSE_SERVICE_NAME} がこのプロジェクトで無効です。有効化しないと全レポート job が失敗します`,
    };
  }
  return { status: "api-state-unknown", state, detail: `state を判定できません (${String(state)})` };
}

/** サービスアカウント鍵から project_id / project_number を読む (I/O)。 */
function serviceAccountProject() {
  try {
    const keyFile = resolveServiceAccountKeyFile();
    const key = JSON.parse(readFileSync(keyFile, "utf-8"));
    return key.project_id ?? null;
  } catch {
    return null;
  }
}

/**
 * AdSense Management API がプロジェクトで有効か確認する。
 *
 * これを事前に見ないと「Secrets を更新したのに CI で初めて全 job 失敗」になる
 * (2026-07-30 に実際に発生。原因は別プロジェクトで API 未有効化だった)。
 *
 * 認証は GA4/GSC と同じサービスアカウントを使う。権限が無い場合も fail closed で報告し、
 * 「確認できなかった」を「有効」と読み替えない。
 */
export async function auditAdSenseApiEnabled({ projectId = null } = {}) {
  const project = projectId ?? serviceAccountProject();
  if (!project) {
    return { status: "project-unknown", detail: "サービスアカウント鍵から project_id を取得できません" };
  }
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: resolveServiceAccountKeyFile(),
      scopes: ["https://www.googleapis.com/auth/cloud-platform.read-only"],
    });
    const su = google.serviceusage({ version: "v1", auth });
    const res = await su.services.get({ name: `projects/${project}/services/${ADSENSE_SERVICE_NAME}` });
    return { ...classifyApiState(res.data), project, service: ADSENSE_SERVICE_NAME };
  } catch (e) {
    const msg = String(e.message ?? e);
    // Service Usage API 自体が無効 / 権限不足も「確認できない」として fail closed
    return {
      status: "api-check-failed",
      project,
      service: ADSENSE_SERVICE_NAME,
      detail: msg.slice(0, 250),
    };
  }
}

/** AdSense account を API で照合する。 */
export async function auditAdSenseAccount() {
  loadAdsenseEnvFromDotEnv();
  const expected = expectedAdSenseAccount();
  const adsense = adsenseClient();
  if (!adsense) {
    return {
      status: "credentials-missing",
      detail: "GOOGLE_ADSENSE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN が無い (.env.local か shell env に設定する)",
    };
  }
  try {
    const res = await adsense.accounts.list({});
    return assertAdSenseAccount(res.data.accounts ?? [], expected);
  } catch (e) {
    return { status: "error", detail: String(e.message ?? e).slice(0, 200) };
  }
}

/**
 * ad unit inventory を API で取る。
 *
 * @param {{codeSlots?: Array<object>, accountId?: string|null}} args
 */
export async function auditAdUnits({ codeSlots = [], accountId = null } = {}) {
  loadAdsenseEnvFromDotEnv();
  const account = accountId ?? expectedAdSenseAccount();
  const adsense = adsenseClient();
  if (!adsense) {
    return { status: "credentials-missing", source: "api", units: [], desired: deriveDesiredAdUnits(codeSlots), codeSlots };
  }
  if (!account) {
    return { status: "expected-missing", source: "api", units: [], desired: deriveDesiredAdUnits(codeSlots), codeSlots };
  }
  try {
    const units = [];
    const clientsRes = await adsense.accounts.adclients.list({ parent: account });
    for (const client of clientsRes.data.adClients ?? []) {
      if (!client.name) continue;
      let pageToken;
      do {
        const res = await adsense.accounts.adclients.adunits.list({
          parent: client.name,
          pageSize: 100,
          ...(pageToken ? { pageToken } : {}),
        });
        for (const u of res.data.adUnits ?? []) {
          let slotId = null;
          if (u.name) {
            try {
              const code = await adsense.accounts.adclients.adunits.getAdcode({ name: u.name });
              slotId = extractSlotIdFromAdCode(code.data.adCode ?? null);
            } catch {
              // adCode 単体の失敗はユニットを落とす理由にしない (slotId 不明として残す)
            }
          }
          units.push({
            id: u.reportingDimensionId ?? "",
            resourceName: u.name ?? "",
            displayName: u.displayName ?? "",
            state: u.state ?? "",
            format: u.contentAdsSettings?.type ?? null,
            size: u.contentAdsSettings?.size ?? null,
            slotId: slotId ?? "",
          });
        }
        pageToken = res.data.nextPageToken || undefined;
      } while (pageToken);
    }
    return {
      status: "ok",
      source: "api",
      units,
      desired: deriveDesiredAdUnits(codeSlots),
      codeSlots,
    };
  } catch (e) {
    return {
      status: "error",
      source: "api",
      units: [],
      desired: deriveDesiredAdUnits(codeSlots),
      codeSlots,
      detail: String(e.message ?? e).slice(0, 200),
    };
  }
}

/**
 * Save 直前の publisher 再照合 (DOM)。
 * URL か本文に expected の pub-ID が現れることを要求する。
 */
export async function reassertPublisher(page, expected = expectedAdSenseAccount()) {
  if (!expected) return false;
  const pub = expected.replace(/^accounts\//, "");
  try {
    const url = page.url();
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    return url.includes(pub) || text.includes(pub);
  } catch {
    return false;
  }
}
