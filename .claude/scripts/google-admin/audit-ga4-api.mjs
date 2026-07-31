/**
 * audit-ga4-api — GA4 Admin API による **read-only inventory** と custom dimension の apply I/O。
 *
 * 正典: ./README.md「Phase 1」「Phase 2」「不変の安全契約」。
 *
 * - browser を起動しない (完全 API)。read は GOOGLE_SERVICE_ACCOUNT_KEY_JSON + analytics.readonly。
 * - property / web stream host / custom dimensions / AdSense link を全 page 取得し、GSC / AdSense を
 *   既存 audit で照合し、台帳 (analytics-event-standards.md §2) と live 定義を突合する。
 * - GA4_PROPERTY_ID は env 必須 (CI で hard-coded fallback を許可しない)。未設定は fail closed。
 * - 一部 API 失敗を ok へ読み替えない。error は ~200 文字へ sanitize し status="error" を返す。
 * - custom dimension の作成 (apply) は analytics.edit の専用 admin credential
 *   (GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON) を要求し、無ければ fail closed。誤作成は自動削除
 *   できないため plan token 一致・承認済みのときだけ 1 件呼ぶ。
 */
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { PROJECT_ROOT, resolveServiceAccountKeyFile } from "../metrics/lib/auth.mjs";
import { auditGscProperty, GSC_PROPERTY } from "./audit-gsc.mjs";
import { auditAdSenseAccount, auditAdUnits, expectedAdSenseAccount } from "./audit-adsense.mjs";
import { loadCodeAdSlots } from "../metrics/lib/code-ad-slots.mjs";
import { parseDimensionLedger, requiredDimensionParams, reconcileDimensions } from "./dimension-ledger.mjs";

export const GA4_READ_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GA4_EDIT_SCOPE = "https://www.googleapis.com/auth/analytics.edit";
export const LEDGER_PATH = path.join(PROJECT_ROOT, ".claude/rules/analytics-event-standards.md");

/** env から GA4 property ID を取る。CI で hard-coded fallback を使わない (未設定は null)。 */
export function resolveApiPropertyId() {
  const id = process.env.GA4_PROPERTY_ID;
  return id && String(id).trim() ? String(id).trim() : null;
}

function sanitizeErr(e) {
  return String(e?.message ?? e).slice(0, 200);
}

/** read 用 analytics admin client を作る。credential 不足なら null。 */
function ga4ReadClients() {
  let keyFile;
  try {
    keyFile = resolveServiceAccountKeyFile();
  } catch {
    return null;
  }
  const auth = new google.auth.GoogleAuth({ keyFile, scopes: [GA4_READ_SCOPE] });
  return {
    beta: google.analyticsadmin({ version: "v1beta", auth }),
    alpha: google.analyticsadmin({ version: "v1alpha", auth }),
  };
}

/** apply 用 admin credential (analytics.edit)。専用鍵の env が無ければ null。 */
export function adminEditClient() {
  const json = process.env.GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON;
  if (!json) return null;
  let credentials;
  try {
    credentials = JSON.parse(json);
  } catch {
    return null;
  }
  const auth = new google.auth.GoogleAuth({ credentials, scopes: [GA4_EDIT_SCOPE] });
  return google.analyticsadmin({ version: "v1beta", auth });
}

/** nextPageToken を辿って全件取得する汎用 (I/O)。 */
async function listAllPages(callFn, params, dataKey) {
  const items = [];
  let pageToken;
  do {
    const res = await callFn({ ...params, ...(pageToken ? { pageToken } : {}) });
    for (const it of res.data?.[dataKey] ?? []) items.push(it);
    pageToken = res.data?.nextPageToken || undefined;
  } while (pageToken);
  return items;
}

// ── pure helpers (テスト対象) ─────────────────────────────────────────────────

/** property.name が properties/<expected> と一致するか (pure)。 */
export function assertPropertyId(property, expectedId) {
  const name = property?.name ?? "";
  if (name === `properties/${expectedId}`) return { status: "ok", name };
  return { status: "property-mismatch" };
}

/** URL の host を返す (解析不能なら null)。 */
function hostOf(uri) {
  try {
    return new URL(String(uri)).host;
  } catch {
    return null;
  }
}

/** apex と www.<apex> を同一サイトとして正規化する (pure)。 */
function siteHost(host) {
  return String(host ?? "").replace(/^www\./, "");
}

/**
 * data streams に expectedHost の web stream がちょうど存在するか (pure)。
 *
 * apex と www は同一サイトとして受理する (identity の実 pin は property ID。GA4 の web stream
 * defaultUri は www.stats47.jp で設定されているが、site は stats47.jp で同一 — 2026-07-31 実測)。
 * 不一致時は別 property の host を state へ残さない (件数だけ返す)。
 */
export function assertStreamHost(dataStreams, expectedHost) {
  const webStreams = (dataStreams ?? []).filter((s) => s?.webStreamData?.defaultUri);
  const want = siteHost(expectedHost);
  for (const s of webStreams) {
    if (siteHost(hostOf(s.webStreamData.defaultUri)) === want) {
      return { status: "ok", host: expectedHost, webStreamCount: webStreams.length };
    }
  }
  return { status: "host-mismatch", webStreamCount: webStreams.length };
}

/** custom dimension 一覧を parameter / scope / EVENT 件数へ要約する (pure)。 */
export function summarizeCustomDimensions(dims) {
  const params = [];
  const scopeByParam = {};
  let eventScopedCount = 0;
  for (const d of dims ?? []) {
    const p = d?.parameterName;
    if (!p) continue;
    params.push(p);
    scopeByParam[p] = d?.scope ?? null;
    if (d?.scope === "EVENT") eventScopedCount += 1;
  }
  return { params, scopeByParam, eventScopedCount, count: (dims ?? []).length };
}

// ── read-only inventory (Phase 1) ─────────────────────────────────────────────

/**
 * GA4 Admin API + GSC + AdSense を read-only で監査する。
 * 各セクションは独立に status を持ち、一部失敗を全体 ok へ読み替えない。
 */
export async function auditGa4Api({ ledgerMd = null } = {}) {
  const propertyId = resolveApiPropertyId();
  const out = { propertyId, gscProperty: GSC_PROPERTY };

  if (!propertyId) {
    out.property = { status: "property-id-missing", detail: "GA4_PROPERTY_ID 未設定 (CI で fallback を使わない)" };
    // property が確定しない = 以降の GA4 read は不能。GSC/AdSense は独立に読む。
    out.gsc = await auditGscProperty();
    out.adsense = await auditAdSenseSection();
    return out;
  }

  const clients = ga4ReadClients();
  if (!clients) {
    out.property = { status: "credentials-missing", detail: "GOOGLE_SERVICE_ACCOUNT_KEY_JSON / ローカル鍵が無い" };
    out.gsc = await auditGscProperty();
    out.adsense = await auditAdSenseSection();
    return out;
  }

  // 1. property
  try {
    const res = await clients.beta.properties.get({ name: `properties/${propertyId}` });
    out.property = assertPropertyId(res.data, propertyId);
  } catch (e) {
    out.property = { status: "error", detail: sanitizeErr(e) };
  }

  // 2. data streams (全 page) → host 照合
  try {
    const streams = await listAllPages(
      (p) => clients.beta.properties.dataStreams.list(p),
      { parent: `properties/${propertyId}`, pageSize: 200 },
      "dataStreams",
    );
    out.webStreams = assertStreamHost(streams, "stats47.jp");
  } catch (e) {
    out.webStreams = { status: "error", detail: sanitizeErr(e) };
  }

  // 3. custom dimensions (全 page)
  let cdSummary = null;
  try {
    const dims = await listAllPages(
      (p) => clients.beta.properties.customDimensions.list(p),
      { parent: `properties/${propertyId}`, pageSize: 200 },
      "customDimensions",
    );
    cdSummary = summarizeCustomDimensions(dims);
    out.customDimensions = { status: "ok", ...cdSummary };
  } catch (e) {
    out.customDimensions = { status: "error", detail: sanitizeErr(e) };
  }

  // 4. AdSense link (v1alpha・audit-only)
  try {
    const links = await listAllPages(
      (p) => clients.alpha.properties.adSenseLinks.list(p),
      { parent: `properties/${propertyId}`, pageSize: 200 },
      "adsenseLinks",
    );
    out.adsenseLinks = {
      status: "ok",
      linkCount: links.length,
      linked: links.length > 0,
      // pub-ID は機密ではないが state を最小にするため件数だけ残す
    };
  } catch (e) {
    out.adsenseLinks = { status: "error", detail: sanitizeErr(e) };
  }

  // 5. GSC property
  out.gsc = await auditGscProperty();

  // 6. AdSense account / units (API・gate は accounts.list 成功)
  out.adsense = await auditAdSenseSection();

  // 7. 台帳との突合
  try {
    const md = ledgerMd ?? fs.readFileSync(LEDGER_PATH, "utf-8");
    const entries = parseDimensionLedger(md);
    if (cdSummary && out.customDimensions?.status === "ok") {
      out.dimensionReconcile = reconcileDimensions(entries, cdSummary.params);
      out.dimensionReconcile.requiredParams = requiredDimensionParams(entries);
    } else {
      out.dimensionReconcile = { rows: [], summary: {}, skipped: out.customDimensions?.status ?? "unknown" };
    }
  } catch (e) {
    out.dimensionReconcile = { rows: [], summary: {}, skipped: "ledger-read-error", detail: sanitizeErr(e) };
  }

  return out;
}

/** AdSense account 照合 + unit inventory。gate は accounts.list 成功のみ。 */
async function auditAdSenseSection() {
  const account = await auditAdSenseAccount();
  let codeSlots = [];
  let codeSlotsError = null;
  try {
    codeSlots = loadCodeAdSlots().slots;
  } catch (e) {
    codeSlotsError = sanitizeErr(e);
  }
  const adUnits = await auditAdUnits({ codeSlots, accountId: account.accountId ?? null });
  return { account, adUnits, codeSlotsError, expected: expectedAdSenseAccount() ? "set" : "missing" };
}

// ── apply (Phase 2) ───────────────────────────────────────────────────────────

/**
 * GA4 custom dimension を 1 件作成する (I/O・admin credential 必須)。
 *
 * plan は planCustomDimension の出力。呼び出し前に CLI 側で live inventory から plan token を
 * 再計算し、承認値と一致していることを確認してから呼ぶ。ここでも作成直前に重複を再確認し、
 * 作成後に list で verify する。verify 不能なら mutation-unknown で止め、再試行しない。
 *
 * @param {{action:string, parameterName:string, displayName:string, scope:string, description:string}} plan
 * @param {{propertyId:string}} ctx
 */
export async function applyCreateCustomDimension(plan, { propertyId }) {
  if (!plan || plan.action !== "create-ga4-custom-dimension" || !plan.parameterName) {
    return { status: "blocked", reason: "plan が create-ga4-custom-dimension でない" };
  }
  if (plan.scope !== "EVENT") {
    return { status: "blocked", reason: `plan の scope が EVENT でない (${plan.scope})` };
  }
  if (!propertyId) {
    return { status: "blocked", reason: "propertyId 未確定" };
  }
  const admin = adminEditClient();
  if (!admin) {
    return { status: "admin-credential-missing", reason: "GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON が無い (Environment secret・人間工程)" };
  }
  const parent = `properties/${propertyId}`;

  // 直前の重複再確認 (live)
  try {
    const before = await listAllPages(
      (p) => admin.properties.customDimensions.list(p),
      { parent, pageSize: 200 },
      "customDimensions",
    );
    if (before.some((d) => d?.parameterName === plan.parameterName)) {
      return { status: "no-op", reason: "作成直前に同 parameterName を確認 (重複作成しない)" };
    }
  } catch (e) {
    return { status: "blocked", reason: `直前確認に失敗: ${sanitizeErr(e)}` };
  }

  // 作成 (1 回)
  let created;
  try {
    const res = await admin.properties.customDimensions.create({
      parent,
      requestBody: {
        displayName: plan.displayName,
        parameterName: plan.parameterName,
        scope: "EVENT",
        description: plan.description,
      },
    });
    created = res.data;
  } catch (e) {
    return { status: "error", reason: sanitizeErr(e) };
  }

  // verify: list を取り直して parameterName / scope / resource name を確認
  try {
    const after = await listAllPages(
      (p) => admin.properties.customDimensions.list(p),
      { parent, pageSize: 200 },
      "customDimensions",
    );
    const found = after.find((d) => d?.parameterName === plan.parameterName);
    if (found && found.scope === "EVENT" && found.name) {
      return { status: "applied", verified: true, resourceName: found.name };
    }
    return { status: "mutation-unknown", reason: "作成後に parameterName/scope/name を verify できない — 再試行しない", resourceName: created?.name ?? null };
  } catch (e) {
    return { status: "mutation-unknown", reason: `verify list に失敗: ${sanitizeErr(e)} — 再試行しない`, resourceName: created?.name ?? null };
  }
}
