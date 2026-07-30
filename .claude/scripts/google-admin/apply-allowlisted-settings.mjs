/**
 * apply-allowlisted-settings — allowlist 3 action の決定 (pure) と実行 (browser)。
 *
 * 正典: ./README.md「allowlist」「denylist」「mutation手順」。
 *
 * decideActions (pure・テスト対象):
 *   inventory (audit 結果) + 台帳状態 → 実行すべき allowlist action / blocker / no-op を決める。
 *   - allowlist 外の action 名は型 (ALLOWED_ACTIONS) と runtime (assertAllowed) の両方で拒否。
 *   - AdSense link は audit-only: GA4 に ad_impression 実データがあるのに UI が未リンクなら
 *     矛盾 = blocker (作成しない)。
 *   - wrong GSC link は編集不可のため削除・再作成しない = blocker。
 *   - ad_id: 同 eventParameter が別 displayName で存在 → 既存扱い (作成しない)。
 *     scope 違い → blocker (修正・削除しない)。
 *
 * 実行 (browser) は README の mutation 手順に従う。Save 後に verify できなければ
 * mutation-unknown とし、盲目的に再実行しない。
 */
import { GA4_PROPERTY_ID } from "./audit-ga4.mjs";

export const ALLOWED_ACTIONS = Object.freeze([
  "create-search-console-link",
  "publish-search-console-collection",
  "create-ad-id-dimension",
]);

export const AD_ID_DIMENSION = Object.freeze({
  displayName: "Affiliate ad ID",
  scope: "Event",
  eventParameter: "ad_id",
});

/** allowlist 外 action を runtime で拒否する。 */
export function assertAllowed(action) {
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error(`action not in allowlist: ${String(action)} (denylist — 実行しない)`);
  }
  return action;
}

/**
 * audit inventory から実行 action / blocker / no-op を決める (pure・決定的)。
 * @param {{
 *   gsc: {present:boolean|null, permissionLevel?:string|null},
 *   scLinks: {status:string, linked?:boolean},
 *   adsenseLinks: {status:string, linked?:boolean},
 *   customDimensions: {status:string, hasAdId?:boolean},
 *   library: {status:string, hasScCollection?:boolean, published?:boolean, unpublished?:boolean},
 *   ledger: {adIdStatus: "要登録"|"登録済"|string},
 *   ga4AdImpressionObserved: boolean,
 * }} inv
 * @returns {{actions:string[], noops:Array<{action:string,reason:string}>, blockers:Array<{code:string,detail:string}>}}
 */
export function decideActions(inv) {
  const actions = [];
  const noops = [];
  const blockers = [];
  const drift = (name, r) => r?.status !== "ok";

  // --- A. create-search-console-link ---
  if (drift("scLinks", inv.scLinks)) {
    blockers.push({ code: "sc-links-unreadable", detail: `SC links audit ${inv.scLinks?.status} — 状態不明のまま作成しない` });
  } else if (inv.scLinks.linked) {
    noops.push({ action: "create-search-console-link", reason: "既存リンクあり (重複作成しない)" });
  } else if (inv.gsc?.present !== true) {
    blockers.push({ code: "gsc-property-missing", detail: `GSC property sc-domain:stats47.jp を API で確認できない (present=${String(inv.gsc?.present)})` });
  } else {
    actions.push("create-search-console-link");
  }

  // --- B. publish-search-console-collection ---
  if (drift("library", inv.library)) {
    blockers.push({ code: "library-unreadable", detail: `Library audit ${inv.library?.status}` });
  } else if (!inv.library.hasScCollection) {
    // リンク作成前は collection 自体が無いことがある → リンク後の verify で再評価する
    noops.push({ action: "publish-search-console-collection", reason: "Search Console collection が未生成 (リンク作成後に再評価)" });
  } else if (inv.library.published) {
    noops.push({ action: "publish-search-console-collection", reason: "既に公開済み" });
  } else {
    actions.push("publish-search-console-collection");
  }

  // --- C. create-ad-id-dimension ---
  if (drift("customDimensions", inv.customDimensions)) {
    blockers.push({ code: "dimensions-unreadable", detail: `custom definitions audit ${inv.customDimensions?.status}` });
  } else if (inv.customDimensions.hasAdId) {
    noops.push({ action: "create-ad-id-dimension", reason: "eventParameter ad_id が既に存在 (displayName が違っても新規作成しない・scope 違いは手動確認)" });
  } else if (!/要登録/.test(inv.ledger?.adIdStatus ?? "")) {
    noops.push({ action: "create-ad-id-dimension", reason: `台帳が要登録ではない (${inv.ledger?.adIdStatus ?? "unknown"})` });
  } else {
    actions.push("create-ad-id-dimension");
  }

  // --- AdSense link 整合 (audit-only) ---
  if (!drift("adsenseLinks", inv.adsenseLinks)) {
    if (!inv.adsenseLinks.linked && inv.ga4AdImpressionObserved) {
      blockers.push({
        code: "adsense-link-contradiction",
        detail: "GA4 に ad_impression 実データがあるのに UI が未リンク表示 — 矛盾のため mutation 停止・人間確認 (作成しない)",
      });
    }
  }

  for (const a of actions) assertAllowed(a);
  return { actions, noops, blockers };
}

// ── browser apply (README「mutation手順」) ───────────────────────────────

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
async function reassertProperty(page) {
  const url = page.url();
  const text = await bodyText(page);
  return url.includes(`p${GA4_PROPERTY_ID}`) || text.includes(GA4_PROPERTY_ID);
}

/**
 * C. create-ad-id-dimension を実行する。
 * 各 step で要素が見つからなければ selector-drift で停止 (盲目的に進めない)。
 */
export async function applyCreateAdIdDimension(page, { screenshotDir, gotoCustomDimensions }) {
  const nav = await gotoCustomDimensions();
  if (nav.status !== "ok") return { status: "blocked", reason: `navigation: ${nav.status}` };
  await shot(page, screenshotDir, "apply-adid-01-before");

  // duplicate re-check (直前確認)
  const before = await bodyText(page);
  if (/\bad_id\b/.test(before)) return { status: "no-op", reason: "ad_id が既に存在 (直前再確認)" };

  const createClicked = await clickButton(page, ["カスタム ディメンションを作成", "カスタムディメンションを作成", "Create custom dimension"]);
  if (!createClicked) {
    // ボタンがテキスト要素の場合
    const alt = await clickByText(page, ["カスタム ディメンションを作成", "カスタムディメンションを作成"]);
    if (!alt) return { status: "selector-drift", step: "create-button" };
  }
  await page.waitForTimeout(3000);
  await shot(page, screenshotDir, "apply-adid-02-form");

  // フォーム入力は label 基準でダイアログ内の欄に限定する
  // (getByRole("textbox").first() はヘッダー検索窓に誤入力した — 2026-07-28 実監査のバグ)。
  try {
    const nameBox = page.getByLabel(/ディメンション名|Dimension name/).first();
    await nameBox.waitFor({ state: "visible", timeout: 8000 });
    await nameBox.fill(AD_ID_DIMENSION.displayName);
  } catch {
    return { status: "selector-drift", step: "displayName-input" };
  }
  let paramFilled = false;
  try {
    const paramBox = page.getByLabel(/イベント パラメータ|イベントパラメータ|Event parameter/).first();
    await paramBox.waitFor({ state: "visible", timeout: 8000 });
    await paramBox.fill(AD_ID_DIMENSION.eventParameter);
    await page.waitForTimeout(1200);
    // 候補 dropdown が開いていれば ad_id を選択して確定 (無ければ Escape で閉じる)
    try {
      const opt = page.getByRole("option", { name: AD_ID_DIMENSION.eventParameter, exact: true }).first();
      await opt.waitFor({ state: "visible", timeout: 3000 });
      await opt.click();
    } catch {
      await page.keyboard.press("Escape").catch(() => {});
    }
    paramFilled = true;
  } catch { /* drift below */ }
  if (!paramFilled) return { status: "selector-drift", step: "eventParameter-input" };
  await shot(page, screenshotDir, "apply-adid-03-filled");

  // 範囲がイベントであることを画面テキストで確認 (既定 Event)
  const formText = await bodyText(page);
  if (!/イベント|Event/.test(formText)) return { status: "selector-drift", step: "scope-check" };

  // Save 直前の property 再照合
  if (!(await reassertProperty(page))) return { status: "blocked", reason: "property re-assert failed (Save 中止)" };

  const saved = await clickButton(page, ["保存", "Save"]);
  if (!saved) return { status: "selector-drift", step: "save-button" };
  await page.waitForTimeout(5000);
  await shot(page, screenshotDir, "apply-adid-04-after-save");

  // verify: reload して ad_id 行を確認
  const renav = await gotoCustomDimensions();
  if (renav.status !== "ok") return { status: "mutation-unknown", reason: "verify navigation failed — 再実行しない" };
  const after = await bodyText(page);
  await shot(page, screenshotDir, "apply-adid-05-verify");
  if (/\bad_id\b/.test(after)) return { status: "applied", verified: true };
  return { status: "mutation-unknown", reason: "Save 後に ad_id 行を確認できない — 重複作成を避けるため再実行しない" };
}

/**
 * B. publish-search-console-collection を実行する。
 * Library の Search Console collection カードのメニューから公開する。
 */
export async function applyPublishScCollection(page, { screenshotDir, gotoLibrary }) {
  const nav = await gotoLibrary();
  if (nav.status !== "ok") return { status: "blocked", reason: `navigation: ${nav.status}` };
  await shot(page, screenshotDir, "apply-publish-01-before");
  const before = await bodyText(page);
  if (!/Search Console/.test(before)) return { status: "blocked", reason: "Search Console collection が見つからない" };
  if (/公開済み|Published/.test(before.split("Search Console")[1]?.slice(0, 300) ?? "")) {
    return { status: "no-op", reason: "既に公開済み (直前再確認)" };
  }

  // collection カード内のメニュー (︙) → 公開
  // カードは "Search Console" テキストを含む要素の祖先。メニュー button を探す。
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

  if (!(await reassertProperty(page))) return { status: "blocked", reason: "property re-assert failed" };
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
export async function applyCreateScLink(page, { screenshotDir, gotoScLinks }) {
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
  // 選択の確定 (チェックボックス方式の場合は行クリックで選択される)
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

  if (!(await reassertProperty(page))) return { status: "blocked", reason: "property re-assert failed (送信中止)" };
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
