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
  { parameterName: "download_purpose", displayName: "CSV download purpose", scope: "EVENT", description: "stats47: CSV ダウンロード後の任意アンケートの用途 (csv_download_purpose)" },
  { parameterName: "pv_trigger", displayName: "Page view trigger", scope: "EVENT", description: "stats47: page_view の送信理由 landing / navigation / query_change (page_view)" },
  { parameterName: "theme_slug", displayName: "Theme slug", scope: "EVENT", description: "stats47: テーマのキー (page_view / ui_interaction / read_progress)" },
  { parameterName: "area_code", displayName: "Area code", scope: "EVENT", description: "stats47: 都道府県・市区町村コード (page_view / geo_* / ui_interaction)" },
  { parameterName: "ui_action", displayName: "UI action", scope: "EVENT", description: "stats47: 画面内の操作の種類 (ui_interaction)" },
  { parameterName: "ui_target", displayName: "UI target", scope: "EVENT", description: "stats47: 画面内の操作の対象 (ui_interaction)" },
  { parameterName: "progress", displayName: "Read progress", scope: "EVENT", description: "stats47: 読了の段階 25/50/75/100 (read_progress)" },
  { parameterName: "result_type", displayName: "Search result type", scope: "EVENT", description: "stats47: 検索結果の種類 (search_result_click)" },
  { parameterName: "result_position", displayName: "Search result position", scope: "EVENT", description: "stats47: 検索結果の表示順位 (search_result_click)" },
  { parameterName: "analysis_slug", displayName: "Geo analysis slug", scope: "EVENT", description: "stats47: 地域分析のキー (geo_*)" },
  { parameterName: "geography", displayName: "Geo geography", scope: "EVENT", description: "stats47: 地域分析の地理単位 prefecture / municipality / mesh (geo_*)" },
  { parameterName: "interaction_type", displayName: "Geo interaction type", scope: "EVENT", description: "stats47: 地域分析の地図操作の種類 (geo_map_interaction)" },
  { parameterName: "declared_purpose", displayName: "Declared purpose", scope: "USER", description: "stats47: CSV 後アンケートで申告した用途 (user property)" },
]);

/** event-scoped / user-scoped custom dimension の無料枠上限 (https://support.google.com/analytics/answer/10075209)。 */
export const EVENT_SCOPED_DIMENSION_CAP = 50;
export const USER_SCOPED_DIMENSION_CAP = 25;

/** 1 回の承認で作成してよい件数の上限 (2026-09-26 オーナー判断。README「Phase 2 apply」)。 */
export const MAX_ITEMS_PER_APPROVAL = 10;

/**
 * 承認付き API で作成してよい GA4 key event の **authored 定義**。
 * 収益化戦略の成果 (広告クリック・商品/深掘り CTA・CSV 取得・問い合わせ) に対応する。
 * countingMethod は API の enum。
 */
export const AUTHORED_KEY_EVENTS = Object.freeze([
  { eventName: "affiliate_click", countingMethod: "ONCE_PER_EVENT" },
  { eventName: "cta_click", countingMethod: "ONCE_PER_EVENT" },
  { eventName: "file_download", countingMethod: "ONCE_PER_EVENT" },
  { eventName: "contact_click", countingMethod: "ONCE_PER_EVENT" },
]);

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
 * GA4 custom dimension の作成計画を決める (pure・決定的・1 承認あたり最大 maxItems 件)。
 *
 * README「Phase 2 plan」: 台帳の ⏳要登録 だけを候補にし、authored 定義があり、GA4 に同じ
 * parameterName が無く、scope ごとの空き枠があるものを安定順 (parameterName 昇順) で並べる。
 * 対象外 parameter の blocker (authored 定義なし等) は返すが、候補の作成を止める理由にはしない
 * (止めるのは identity と、候補自身の blocker だけ — CLI 側で判定)。
 *
 * @param {{
 *   needsRegistrationParams: string[],
 *   existingParams?: string[],
 *   existingScopeByParam?: Record<string,string>,
 *   eventScopedCount?: number|null,
 *   userScopedCount?: number|null,
 *   cap?: number,
 *   userCap?: number,
 *   maxItems?: number,
 * }} args
 * @returns {{plans: object[], plan: object|null, noops: Array<object>, blockers: Array<object>}}
 */
export function planCustomDimension({
  needsRegistrationParams,
  existingParams = [],
  existingScopeByParam = {},
  eventScopedCount = null,
  userScopedCount = 0,
  cap = EVENT_SCOPED_DIMENSION_CAP,
  userCap = USER_SCOPED_DIMENSION_CAP,
  maxItems = MAX_ITEMS_PER_APPROVAL,
}) {
  const noops = [];
  const blockers = [];
  const existing = new Set(existingParams ?? []);
  const candidates = [...new Set(needsRegistrationParams ?? [])].sort();

  const eligible = [];
  for (const param of candidates) {
    const authored = AUTHORED_BY_PARAM.get(param);
    if (existing.has(param)) {
      const scope = existingScopeByParam[param];
      const want = authored?.scope ?? "EVENT";
      if (scope && scope !== want) {
        blockers.push({ code: "scope-mismatch", parameterName: param, detail: `${param} は GA4 で ${scope} scope で存在 — ${want} でないため作成も修正もしない (人間確認)` });
      } else {
        noops.push({ action: "create-ga4-custom-dimension", parameterName: param, reason: "GA4 に既に存在 (作成しない)" });
      }
      continue;
    }
    if (!authored) {
      blockers.push({ code: "authored-definition-missing", parameterName: param, detail: `${param} は台帳が ⏳要登録 だが authored 定義が無い — 推測で作らない` });
      continue;
    }
    if (authored.scope !== "EVENT" && authored.scope !== "USER") {
      blockers.push({ code: "authored-scope-unsupported", parameterName: param, detail: `${param} の authored scope が EVENT/USER でない (${authored.scope})` });
      continue;
    }
    eligible.push(authored);
  }

  if (eligible.length === 0) return { plans: [], plan: null, noops, blockers };

  // 空き枠の確認 (件数が取れないときは fail closed で作らない)
  if (eventScopedCount == null || !Number.isFinite(eventScopedCount) || userScopedCount == null || !Number.isFinite(userScopedCount)) {
    blockers.push({ code: "capacity-unknown", detail: "custom dimension の件数を取得できない — 空き枠不明のため作成しない" });
    return { plans: [], plan: null, noops, blockers };
  }
  const room = { EVENT: cap - eventScopedCount, USER: userCap - userScopedCount };
  const plans = [];
  for (const target of eligible) {
    if (plans.length >= maxItems) {
      noops.push({ action: "create-ga4-custom-dimension", parameterName: target.parameterName, reason: `次回の承認へ繰り越す (1 承認 ${maxItems} 件まで)` });
      continue;
    }
    if (room[target.scope] <= 0) {
      blockers.push({ code: "no-capacity", parameterName: target.parameterName, detail: `${target.scope} scope の custom dimension が上限に達している` });
      continue;
    }
    room[target.scope] -= 1;
    plans.push({
      action: "create-ga4-custom-dimension",
      displayName: target.displayName,
      parameterName: target.parameterName,
      scope: target.scope,
      description: target.description,
    });
  }
  return { plans, plan: plans[0] ?? null, noops, blockers };
}

/**
 * GA4 key event の作成計画 (pure)。AUTHORED_KEY_EVENTS にあり GA4 に無いものだけを安定順で返す。
 * @param {{existingEventNames?: string[]|null, maxItems?: number}} args
 */
export function planKeyEvents({ existingEventNames, maxItems = MAX_ITEMS_PER_APPROVAL }) {
  const noops = [];
  const blockers = [];
  if (!Array.isArray(existingEventNames)) {
    blockers.push({ code: "key-events-unreadable", detail: "key events を取得できない — 重複の有無が不明のため作成しない" });
    return { plans: [], noops, blockers };
  }
  const existing = new Set(existingEventNames);
  const plans = [];
  for (const k of [...AUTHORED_KEY_EVENTS].sort((a, b) => (a.eventName < b.eventName ? -1 : 1))) {
    if (existing.has(k.eventName)) {
      noops.push({ action: "create-ga4-key-event", eventName: k.eventName, reason: "GA4 に既に存在 (作成しない)" });
      continue;
    }
    if (plans.length >= maxItems) {
      noops.push({ action: "create-ga4-key-event", eventName: k.eventName, reason: `次回の承認へ繰り越す (1 承認 ${maxItems} 件まで)` });
      continue;
    }
    plans.push({ action: "create-ga4-key-event", eventName: k.eventName, countingMethod: k.countingMethod });
  }
  return { plans, noops, blockers };
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
  const canon = (p) => JSON.stringify(Object.entries(p).sort(([a], [b]) => (a < b ? -1 : 1)));
  // 複数件の計画 (1 承認 最大 10 件) は配列ごと 1 つの token にする。1 件でも変われば token が変わる。
  const body = !plan ? "" : Array.isArray(plan) ? JSON.stringify(plan.map(canon)) : canon(plan);
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
