/**
 * apply-allowlisted-settings — 変更 (mutation) の決定 (pure) と Playwright residual の実行。
 *
 * 正典: ./README.md「allowlist」「denylist」「Phase 2」「Phase 4」。
 *
 * このモジュールが持つのは 2 系統の mutation:
 *   1. GA4 custom dimension (API・承認付き) の **計画** — planCustomDimension (pure)。
 *      実際の作成 (customDimensions.create) は audit-ga4-api.mjs の I/O が行う。
 *   2. Playwright residual (公式 API が無い操作) の **決定と実行**:
 *      - create-search-console-link / publish-search-console-collection のみ。
 *
 * AdSense unit の create/patch・GA4 AdSense link 作成・custom dimension の
 * 削除/archive/rename/scope 変更は denylist で、ここに実行経路を作らない
 * (README「denylist」)。ALLOWED_ACTIONS は Playwright residual の 2 action だけ。
 */
import { createHash } from "node:crypto";

/**
 * ローカル Playwright で実行してよい action。README「allowlist」(ローカル Playwright) と 1:1。
 *
 * GA4 custom dimension は承認付き API 経路へ移した (Phase 2) ため、ここには含めない。
 * AdSense unit / GA4 AdSense link は denylist なので実行経路が存在しない。
 */
export const ALLOWED_ACTIONS = Object.freeze([
  "create-search-console-link",
  "publish-search-console-collection",
]);

/**
 * 承認付き API で作成してよい GA4 custom dimension の **authored 定義**。
 *
 * README「allowlist」: display name / parameter / scope を台帳の文章から推測しない。
 * コードに明示したこの定義だけを plan 対象にする。parameterName は
 * events.ts が実際に送るパラメータ名と一致させる。scope は API の enum ("EVENT")。
 */
export const AUTHORED_DIMENSIONS = Object.freeze([
  { parameterName: "ad_id", displayName: "Affiliate ad ID", scope: "EVENT", description: "stats47: アフィリエイト広告の識別子 (affiliate_click / affiliate_impression)" },
  { parameterName: "cta_id", displayName: "CTA ID", scope: "EVENT", description: "stats47: CTA クリックの識別子 (cta_click)" },
  { parameterName: "content_id", displayName: "Content ID", scope: "EVENT", description: "stats47: CTA の対象コンテンツ識別子 (cta_click)" },
  { parameterName: "target_type", displayName: "Target type", scope: "EVENT", description: "stats47: CTA の遷移先種別 (cta_click)" },
  { parameterName: "target_key", displayName: "Target key", scope: "EVENT", description: "stats47: CTA の遷移先キー (cta_click)" },
  { parameterName: "card_variant", displayName: "Card variant", scope: "EVENT", description: "stats47: ホーム注目カードのバリアント (home_featured_*)" },
  { parameterName: "slot", displayName: "Slot", scope: "EVENT", description: "stats47: ホーム注目カードのスロット (home_featured_*)" },
  { parameterName: "experiment_variant", displayName: "Experiment variant", scope: "EVENT", description: "stats47: ホーム注目カードの実験バリアント (home_featured_*)" },
]);

/** event-scoped custom dimension の無料枠上限 (README「集計反映」)。 */
export const EVENT_SCOPED_DIMENSION_CAP = 50;

const AUTHORED_BY_PARAM = new Map(AUTHORED_DIMENSIONS.map((d) => [d.parameterName, d]));

/** allowlist 外 action を runtime で拒否する。 */
export function assertAllowed(action) {
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error(`action not in allowlist: ${String(action)} (denylist — 実行しない)`);
  }
  return action;
}

/**
 * Playwright residual (SC link / collection) の決定 (pure・決定的)。
 *
 * @param {{
 *   gsc: {present:boolean|null, permissionLevel?:string|null},
 *   scLinks: {status:string, linked?:boolean},
 *   library: {status:string, hasScCollection?:boolean, published?:boolean, unpublished?:boolean},
 * }} inv
 * @returns {{actions:string[], noops:Array<{action:string,reason:string}>, blockers:Array<{code:string,detail:string}>}}
 */
export function decideScActions(inv) {
  const actions = [];
  const noops = [];
  const blockers = [];
  const drift = (r) => r?.status !== "ok";

  // --- A. create-search-console-link ---
  if (drift(inv.scLinks)) {
    blockers.push({ code: "sc-links-unreadable", detail: `SC links audit ${inv.scLinks?.status} — 状態不明のまま作成しない` });
  } else if (inv.scLinks.linked) {
    noops.push({ action: "create-search-console-link", reason: "既存リンクあり (重複作成しない)" });
  } else if (inv.gsc?.present !== true) {
    blockers.push({ code: "gsc-property-missing", detail: `GSC property sc-domain:stats47.jp を API で確認できない (present=${String(inv.gsc?.present)})` });
  } else {
    actions.push("create-search-console-link");
  }

  // --- B. publish-search-console-collection ---
  if (drift(inv.library)) {
    blockers.push({ code: "library-unreadable", detail: `Library audit ${inv.library?.status}` });
  } else if (!inv.library.hasScCollection) {
    // リンク作成前は collection 自体が無いことがある → リンク後の verify で再評価する
    noops.push({ action: "publish-search-console-collection", reason: "Search Console collection が未生成 (リンク作成後に再評価)" });
  } else if (inv.library.published) {
    noops.push({ action: "publish-search-console-collection", reason: "既に公開済み" });
  } else {
    actions.push("publish-search-console-collection");
  }

  for (const a of actions) assertAllowed(a);
  return { actions, noops, blockers };
}

/**
 * GA4 custom dimension の作成計画を決める (pure・決定的・1 run 1 件)。
 *
 * README「Phase 2 plan」: 台帳の ⏳要登録 だけを候補にし、authored 定義があり、GA4 に同じ
 * parameterName が無く、EVENT scope で、空き枠があるものを安定順で 1 件だけ plan にする。
 *
 * @param {{
 *   needsRegistrationParams: string[],   // 台帳 ⏳要登録 の required parameter (安定順)
 *   existingParams?: string[],           // GA4 に既にある parameterName
 *   existingScopeByParam?: Record<string,string>, // GA4 の param -> scope
 *   eventScopedCount?: number|null,      // 現在の EVENT-scoped custom dimension 件数 (null=不明)
 *   cap?: number,
 * }} args
 * @returns {{plan: object|null, noops: Array<object>, blockers: Array<object>}}
 */
export function planCustomDimension({
  needsRegistrationParams,
  existingParams = [],
  existingScopeByParam = {},
  eventScopedCount = null,
  cap = EVENT_SCOPED_DIMENSION_CAP,
}) {
  const noops = [];
  const blockers = [];
  const existing = new Set(existingParams ?? []);
  // 安定順 (parameterName の昇順) で候補を並べる。入力順に依存させない。
  const candidates = [...new Set(needsRegistrationParams ?? [])].sort();

  const eligible = [];
  for (const param of candidates) {
    if (existing.has(param)) {
      // 既存: 作成しない。ただし EVENT 以外の scope なら台帳と食い違うので blocker (直さない・止める)
      const scope = existingScopeByParam[param];
      if (scope && scope !== "EVENT") {
        blockers.push({ code: "scope-mismatch", detail: `${param} は GA4 で ${scope} scope で存在 — EVENT でないため作成も修正もしない (人間確認)` });
      } else {
        noops.push({ action: "create-ga4-custom-dimension", parameterName: param, reason: "GA4 に既に存在 (作成しない)" });
      }
      continue;
    }
    const authored = AUTHORED_BY_PARAM.get(param);
    if (!authored) {
      blockers.push({ code: "authored-definition-missing", detail: `${param} は台帳が ⏳要登録 だが authored 定義が無い — 推測で作らない` });
      continue;
    }
    if (authored.scope !== "EVENT") {
      blockers.push({ code: "authored-scope-not-event", detail: `${param} の authored scope が EVENT でない (${authored.scope})` });
      continue;
    }
    eligible.push(authored);
  }

  if (eligible.length === 0) {
    return { plan: null, noops, blockers };
  }

  // 空き枠の確認 (件数が取れないときは fail closed で作らない)
  if (eventScopedCount == null || !Number.isFinite(eventScopedCount)) {
    blockers.push({ code: "capacity-unknown", detail: "EVENT-scoped custom dimension の件数を取得できない — 空き枠不明のため作成しない" });
    return { plan: null, noops, blockers };
  }
  if (eventScopedCount >= cap) {
    blockers.push({ code: "no-capacity", detail: `EVENT-scoped custom dimension が上限 ${cap} 件に達している (現在 ${eventScopedCount})` });
    return { plan: null, noops, blockers };
  }

  const target = eligible[0];
  const plan = {
    action: "create-ga4-custom-dimension",
    displayName: target.displayName,
    parameterName: target.parameterName,
    scope: "EVENT",
    description: target.description,
  };
  for (const rest of eligible.slice(1)) {
    noops.push({ action: "create-ga4-custom-dimension", parameterName: rest.parameterName, reason: "次回 run へ繰り越す (1 run 1 件)" });
  }
  return { plan, noops, blockers };
}

// ── 承認ゲート ────────────────────────────────────────────────────────────────

/**
 * 計画そのものに対する承認トークンを決定的に作る (pure)。
 *
 * planned が 1 文字でも変われば token が変わるので、承認は「その計画」に対してだけ有効になる
 * (古い承認を別の計画に流用できない)。site / propertyId / action / request body から作る
 * (README「Phase 2 plan」step 8)。
 */
export function plannedActionToken({ site, propertyId, plan }) {
  const body = plan
    ? JSON.stringify(Object.entries(plan).sort(([a], [b]) => (a < b ? -1 : 1)))
    : "";
  const canonical = JSON.stringify({
    site: site ?? "",
    propertyId: String(propertyId ?? ""),
    plan: body,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

/**
 * mutation を実行してよいかを決める (pure)。
 *
 * `--force` 相当の迂回は用意しない (作れば必ず使われる)。README「Phase 2 apply」の
 * --confirm-site / --commit / --approve <token> を要求する。
 *
 * @param {{argv:string[], site:string, expectedSite:string, expectedToken:string}} args
 * @returns {{allowed:boolean, reason:string}}
 */
export function requireCommit({ argv, site, expectedSite, expectedToken }) {
  const has = (flag) => argv.includes(flag);
  const valueOf = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? (argv[i + 1] ?? null) : null;
  };
  if (site !== expectedSite) {
    return { allowed: false, reason: `--confirm-site が ${expectedSite} でない (${String(site)})` };
  }
  if (!has("--commit")) {
    return { allowed: false, reason: "--commit が無い (既定は計画の出力のみ = draft-first)" };
  }
  const approve = valueOf("--approve");
  if (!approve) {
    return { allowed: false, reason: "--approve <token> が無い (計画に対するオーナー承認が必要)" };
  }
  if (approve !== expectedToken) {
    return {
      allowed: false,
      reason: `--approve のトークンが計画と一致しない (計画が変わった可能性: expected ${expectedToken})`,
    };
  }
  return { allowed: true, reason: "commit 承認済み" };
}

// ── browser apply (Playwright residual・README「Phase 4」) ─────────────────────

async function bodyText(page) {
  return await page.evaluate(() => document.body?.innerText ?? "");
}

async function shot(page, dir, name) {
  try {
    await page.screenshot({ path: `${dir}/${name}.png` });
  } catch { /* */ }
}

async function clickByText(page, labels, { timeout = 8000 } = {}) {
  for (const label of labels) {
    try {
      const el = page.getByText(label, { exact: false }).first();
      await el.waitFor({ state: "visible", timeout });
      await el.click();
      return label;
    } catch { /* try next */ }
  }
  return null;
}

async function clickButton(page, names, { timeout = 8000 } = {}) {
  for (const name of names) {
    try {
      const el = page.getByRole("button", { name, exact: false }).first();
      await el.waitFor({ state: "visible", timeout });
      await el.click();
      return name;
    } catch { /* try next */ }
  }
  return null;
}

/** Save 直前の property 再照合。 */
async function reassertProperty(page, propertyId) {
  const url = page.url();
  const text = await bodyText(page);
  return url.includes(`p${propertyId}`) || text.includes(String(propertyId));
}

/**
 * B. publish-search-console-collection を実行する。
 * Library の Search Console collection カードのメニューから公開する。
 */
export async function applyPublishScCollection(page, { screenshotDir, gotoLibrary, propertyId }) {
  const nav = await gotoLibrary();
  if (nav.status !== "ok") return { status: "blocked", reason: `navigation: ${nav.status}` };
  await shot(page, screenshotDir, "apply-publish-01-before");
  const before = await bodyText(page);
  if (!/Search Console/.test(before)) return { status: "blocked", reason: "Search Console collection が見つからない" };
  if (/公開済み|Published/.test(before.split("Search Console")[1]?.slice(0, 300) ?? "")) {
    return { status: "no-op", reason: "既に公開済み (直前再確認)" };
  }

  // collection カード内のメニュー (︙) → 公開
  let opened = false;
  try {
    const card = page.locator("ga-collection-card, mat-card, [class*='collection-card']", { hasText: "Search Console" }).first();
    await card.waitFor({ state: "visible", timeout: 8000 });
    const menuBtn = card.getByRole("button").last();
    await menuBtn.click();
    opened = true;
  } catch { /* fallback below */ }
  if (!opened) return { status: "selector-drift", step: "collection-menu" };
  await page.waitForTimeout(1500);
  await shot(page, screenshotDir, "apply-publish-02-menu");

  if (!(await reassertProperty(page, propertyId))) return { status: "blocked", reason: "property re-assert failed" };
  // ★「公開」は exact 一致のみ。部分一致は「公開停止」(unpublish) に誤爆する (2026-07-28 実監査で危険を確認)
  let published = null;
  try {
    const item = page.getByText("公開", { exact: true }).first();
    await item.waitFor({ state: "visible", timeout: 8000 });
    await item.click();
    published = "公開";
  } catch {
    try {
      const item = page.getByRole("menuitem", { name: "Publish", exact: true }).first();
      await item.waitFor({ state: "visible", timeout: 4000 });
      await item.click();
      published = "Publish";
    } catch { /* drift */ }
  }
  if (!published) return { status: "selector-drift", step: "publish-menu-item" };
  await page.waitForTimeout(4000);
  await shot(page, screenshotDir, "apply-publish-03-after");

  const renav = await gotoLibrary();
  if (renav.status !== "ok") return { status: "mutation-unknown", reason: "verify navigation failed" };
  const after = await bodyText(page);
  await shot(page, screenshotDir, "apply-publish-04-verify");
  if (/公開済み|Published/.test(after.split("Search Console")[1]?.slice(0, 300) ?? "")) {
    return { status: "applied", verified: true };
  }
  return { status: "mutation-unknown", reason: "公開状態を verify できない — 再実行しない" };
}

/**
 * A. create-search-console-link を実行する。
 * 管理 → Search Console のリンク → リンク → property 選択 (exact sc-domain:stats47.jp) →
 * web stream 選択 (stats47.jp) → 送信。
 */
export async function applyCreateScLink(page, { screenshotDir, gotoScLinks, propertyId }) {
  const nav = await gotoScLinks();
  if (nav.status !== "ok") return { status: "blocked", reason: `navigation: ${nav.status}` };
  await shot(page, screenshotDir, "apply-sclink-01-before");
  const before = await bodyText(page);
  if (/sc-domain:stats47\.jp/.test(before)) return { status: "no-op", reason: "リンク既存 (直前再確認)" };

  const linkBtn = await clickButton(page, ["リンク", "Link"]);
  if (!linkBtn) return { status: "selector-drift", step: "link-button" };
  await page.waitForTimeout(3000);
  await shot(page, screenshotDir, "apply-sclink-02-wizard");

  // アカウントを選択 → sc-domain:stats47.jp を選ぶ
  const choose = await clickByText(page, ["アカウントを選択", "Choose accounts", "アカウントの選択"]);
  if (choose) await page.waitForTimeout(2500);
  const propRow = await clickByText(page, ["sc-domain:stats47.jp", "stats47.jp"]);
  if (!propRow) return { status: "selector-drift", step: "gsc-property-row" };
  await clickButton(page, ["確認", "確定", "Confirm"]);
  await page.waitForTimeout(1500);
  const next1 = await clickButton(page, ["次へ", "Next"]);
  if (!next1) return { status: "selector-drift", step: "next-after-property" };
  await page.waitForTimeout(2000);
  await shot(page, screenshotDir, "apply-sclink-03-stream");

  // web stream 選択 → 次へ → 送信
  const streamChoose = await clickByText(page, ["選択", "Select"]);
  if (streamChoose) await page.waitForTimeout(1500);
  const streamRow = await clickByText(page, ["stats47.jp"]);
  if (!streamRow) return { status: "selector-drift", step: "web-stream-row" };
  await page.waitForTimeout(1000);
  await clickButton(page, ["次へ", "Next"]);
  await page.waitForTimeout(1500);
  await shot(page, screenshotDir, "apply-sclink-04-confirm");

  if (!(await reassertProperty(page, propertyId))) return { status: "blocked", reason: "property re-assert failed (送信中止)" };
  const submit = await clickButton(page, ["送信", "Submit"]);
  if (!submit) return { status: "selector-drift", step: "submit-button" };
  await page.waitForTimeout(5000);
  await shot(page, screenshotDir, "apply-sclink-05-after");

  const renav = await gotoScLinks();
  if (renav.status !== "ok") return { status: "mutation-unknown", reason: "verify navigation failed" };
  const after = await bodyText(page);
  await shot(page, screenshotDir, "apply-sclink-06-verify");
  if (/sc-domain:stats47\.jp|stats47\.jp/.test(after) && !/リンクなし|リンクがありません/.test(after)) {
    return { status: "applied", verified: true };
  }
  return { status: "mutation-unknown", reason: "リンク行を verify できない — 重複作成を避けるため再実行しない" };
}
