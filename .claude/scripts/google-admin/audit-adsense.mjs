/**
 * audit-adsense — AdSense の account 照合と ad unit inventory を **API (read-only)** で取る。
 *
 * 正典: ./README.md「mutation前のidentity確認」「allowlist」。
 *
 * 設計上の要点: inventory は API が一次ソースで、DOM は使わない。
 * `accounts.adclients.adunits.list` が `reportingDimensionId` (= レポートの AD_UNIT_ID) を返し、
 * `adunits.getAdcode` が `data-ad-slot` を含む adCode を返すため、unit ↔ slotId の対応が
 * 決定的に取れる。inventory は API のみで取り、DOM には一切依存しない (read-only)。
 *
 * scope は adsense.readonly のみを使う。`accounts.adclients.adunits.create` / `patch` という
 * メソッドは AdSense Management API v2 に存在するが、AdSense for Platforms 系の制限プロジェクト
 * 向けで現状 DISPLAY のみであり、stats47 での利用権限は未証明のため自動化対象にしない
 * (README「結論」「denylist」/ evidence-based-judgment.md)。
 * 認証は OAuth (env: GOOGLE_ADSENSE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN)。
 * env が無ければ fail closed で status を返し、推測で先に進まない。
 * AdSense を叩けるかの gate は「OAuth client での accounts.list 成功」だけを見る
 * (GA4/GSC 用サービスアカウントの project 有効化を AdSense の判定に使わない — 別 project を
 * 見ており誤判定になる。2026-07-31 是正)。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { google } from "googleapis";
// PROJECT_ROOT は auth.mjs から取る (browser-context.mjs 経由だと playwright を巻き込み、
// API-only の read 経路が browser 依存になるため)。
import { PROJECT_ROOT } from "../metrics/lib/auth.mjs";
import { extractSlotIdFromAdCode } from "../metrics/lib/adsense-report-contract.mjs";
import { collectAdUnitEntries } from "../metrics/lib/adsense-ad-unit-walk.mjs";

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
/**
 * ad client を辿って ad unit を集め、audit 用の行に変換する。
 *
 * ★走査そのものは `../metrics/lib/adsense-ad-unit-walk.mjs` に共有してある (2026-08-21)。
 *   元はこの関数と `fetch-adsense-snapshot.mjs` に**同じ走査が二重実装**されていて、
 *   2026-08-04 に snapshot 側だけ「1 client の失敗で全体を落とさない」修正が入り、
 *   こちらは素通しのままだった。結果、同じ資格情報で snapshot は成功しているのに
 *   audit は毎回「AdSense ad units: 0 件 (error)」になり、原因を credential 側だと
 *   誤診する材料になった。片方だけ直せる形が原因だったので、走査を 1 箇所に集めた。
 *   ここは entries → audit 用の行に変換するだけ。
 *
 * @param {object} adsense googleapis の adsense client
 * @param {string} account `accounts/pub-XXXX`
 * @returns {Promise<{units: object[], skippedClients: string[]}>}
 */
export async function collectAdUnits(adsense, account) {
  const { entries, skippedClients } = await collectAdUnitEntries(adsense, account);
  const units = entries.map(({ unit, adCode }) => ({
    id: unit.reportingDimensionId ?? "",
    resourceName: unit.name ?? "",
    displayName: unit.displayName ?? "",
    state: unit.state ?? "",
    format: unit.contentAdsSettings?.type ?? null,
    size: unit.contentAdsSettings?.size ?? null,
    slotId: extractSlotIdFromAdCode(adCode) ?? "",
  }));
  return { units, skippedClients };
}

export async function auditAdUnits({ codeSlots = [], accountId = null } = {}) {
  loadAdsenseEnvFromDotEnv();
  const account = accountId ?? expectedAdSenseAccount();
  const adsense = adsenseClient();
  if (!adsense) {
    return { status: "credentials-missing", source: "api", units: [], skippedClients: [], desired: deriveDesiredAdUnits(codeSlots), codeSlots };
  }
  if (!account) {
    return { status: "expected-missing", source: "api", units: [], skippedClients: [], desired: deriveDesiredAdUnits(codeSlots), codeSlots };
  }
  try {
    const { units, skippedClients } = await collectAdUnits(adsense, account);
    return {
      status: "ok",
      source: "api",
      units,
      skippedClients,
      desired: deriveDesiredAdUnits(codeSlots),
      codeSlots,
    };
  } catch (e) {
    return {
      status: "error",
      source: "api",
      units: [],
      skippedClients: [],
      desired: deriveDesiredAdUnits(codeSlots),
      codeSlots,
      detail: String(e.message ?? e).slice(0, 200),
    };
  }
}
