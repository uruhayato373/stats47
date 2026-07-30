/**
 * audit-ga4 — GA4 Admin UI の read-only inventory。
 * identity契約: ./README.md「mutation前のidentity確認」。
 *
 * property / web stream / Search Console link / AdSense link / custom dimensions /
 * Library の Search Console collection 公開状態を、headed browser で走査する。
 *
 * - 完全 read-only (クリックはナビゲーションのみ・Save/リンク/公開ボタンは押さない)。
 * - 各 step は {status, ...data} を返し、要素が見つからない場合は "selector-drift" として
 *   fail-closed (推測で ok にしない)。screenshot は /tmp のみ。
 * - 値の取得は主に本文テキスト (innerText) の走査 — CSS class への依存を避け、
 *   決定的な文字列 (property ID / sc-domain:stats47.jp / ad_id) の有無で判定する。
 */
import { isLoginUrl, waitForLogin } from "./browser-context.mjs";
import { extractObservedParams } from "./dimension-ledger.mjs";

export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "463218070";
export const GA4_HOME = `https://analytics.google.com/analytics/web/#/p${GA4_PROPERTY_ID}/reports/intelligenthome`;
const NAV_TIMEOUT = 60_000;

async function bodyText(page) {
  return await page.evaluate(() => document.body?.innerText ?? "");
}

async function shot(page, dir, name) {
  try {
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
  } catch {
    /* screenshot 失敗は監査を止めない */
  }
}

/** GA4 へ入り property を開く。ログインが要るときはユーザー操作を待つ。 */
export async function openGa4(page, { screenshotDir, promptLogin }) {
  await page.goto(GA4_HOME, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  await page.waitForTimeout(4000);
  if (isLoginUrl(page.url())) {
    const ok = await waitForLogin(page, {
      doneUrlPattern: /analytics\.google\.com\/analytics\/web/,
      onPrompt: promptLogin,
    });
    if (!ok) return { status: "login-required" };
    await page.goto(GA4_HOME, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page.waitForTimeout(4000);
  }
  await shot(page, screenshotDir, "01-ga4-home");
  return { status: "ok" };
}

/**
 * property identity assert: 画面上の property が GA4_PROPERTY_ID と一致するか。
 * property セレクタ (ヘッダー) のテキストに ID が含まれることを確認する。
 */
export async function assertProperty(page, { screenshotDir }) {
  // admin 画面の property 列に ID が表示される。まず URL の /p<ID>/ を検証。
  const url = page.url();
  const urlOk = url.includes(`p${GA4_PROPERTY_ID}`);
  const text = await bodyText(page);
  const textHasId = text.includes(GA4_PROPERTY_ID);
  await shot(page, screenshotDir, "02-property-assert");
  if (!urlOk && !textHasId) {
    return { status: "property-mismatch", urlHasId: urlOk, textHasId };
  }
  return { status: "ok", urlHasId: urlOk, textHasId };
}

/** 管理 (Admin) を開く。 */
export async function gotoAdmin(page) {
  await page.goto(
    `https://analytics.google.com/analytics/web/#/p${GA4_PROPERTY_ID}/admin`,
    { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT },
  );
  await page.waitForTimeout(5000);
  const text = await bodyText(page);
  if (!/管理|Admin/.test(text)) return { status: "selector-drift", step: "admin-home" };
  return { status: "ok" };
}

/** 管理内のリンクをテキストで開く汎用 (read-only ナビゲーション)。 */
async function openAdminSection(page, labels, { screenshotDir, shotName }) {
  for (const label of labels) {
    const link = page.getByText(label, { exact: false }).first();
    try {
      await link.waitFor({ state: "visible", timeout: 8000 });
      await link.click();
      await page.waitForTimeout(5000);
      await shot(page, screenshotDir, shotName);
      return { status: "ok", label };
    } catch {
      /* 次の label 候補へ */
    }
  }
  await shot(page, screenshotDir, `${shotName}-drift`);
  return { status: "selector-drift", step: shotName, tried: labels };
}

/** データストリーム inventory: stats47.jp の web stream 有無。 */
export async function auditWebStreams(page, { screenshotDir }) {
  const admin = await gotoAdmin(page);
  if (admin.status !== "ok") return admin;
  const nav = await openAdminSection(page, ["データ ストリーム", "データストリーム", "Data streams"], { screenshotDir, shotName: "03-streams" });
  if (nav.status !== "ok") return nav;
  const text = await bodyText(page);
  return {
    status: "ok",
    hasStats47Stream: /stats47\.jp/.test(text),
    streamListText: text.length > 0,
  };
}

/** Search Console リンク inventory。リンク行に sc-domain / stats47.jp が出るか。 */
export async function auditSearchConsoleLinks(page, { screenshotDir }) {
  const admin = await gotoAdmin(page);
  if (admin.status !== "ok") return admin;
  const nav = await openAdminSection(
    page,
    ["Search Console のリンク", "Search Console リンク", "Search Console links"],
    { screenshotDir, shotName: "04-sc-links" },
  );
  if (nav.status !== "ok") return nav;
  const text = await bodyText(page);
  const linked = /sc-domain:stats47\.jp|stats47\.jp/.test(text) && !/リンクなし|リンクがありません|No links/.test(text);
  // 「リンク」作成ボタンの有無 (権限の間接確認)
  const hasLinkButton = /リンク\s*$|^リンク/m.test(text) || text.includes("リンク設定");
  return { status: "ok", linked, hasLinkButton, emptyStateShown: /リンクなし|リンクがありません|No links/.test(text) };
}

/** AdSense リンク inventory (audit-only・作成しない)。 */
export async function auditAdSenseLinks(page, { screenshotDir }) {
  const admin = await gotoAdmin(page);
  if (admin.status !== "ok") return admin;
  const nav = await openAdminSection(
    page,
    ["AdSense のリンク", "AdSense リンク", "AdSense links"],
    { screenshotDir, shotName: "05-adsense-links" },
  );
  if (nav.status !== "ok") return nav;
  const text = await bodyText(page);
  const linked = /pub-\d{10,}/.test(text) && !/リンクなし|リンクがありません|No links/.test(text);
  const pubId = text.match(/pub-\d{10,}/)?.[0] ?? null;
  return { status: "ok", linked, publisherId: pubId };
}

/** カスタム定義 inventory: ad_id (event scope) の有無・displayName。 */
export async function auditCustomDimensions(page, { screenshotDir, knownParams = [] }) {
  const admin = await gotoAdmin(page);
  if (admin.status !== "ok") return admin;
  const nav = await openAdminSection(page, ["カスタム定義", "Custom definitions"], { screenshotDir, shotName: "06-custom-dimensions" });
  if (nav.status !== "ok") return nav;
  const text = await bodyText(page);
  const hasAdId = /\bad_id\b/.test(text);
  // 台帳 (analytics-event-standards.md §2) の「登録が要るパラメータ」が画面に出ているかを
  // 単語境界で照合する。表構造に依存させない (innerText 方式)。
  const observedParams = extractObservedParams(text, knownParams);
  // ad_id 行の周辺テキスト (displayName 推定用・機密ではない)
  let adIdContext = null;
  if (hasAdId) {
    const lines = text.split("\n");
    const i = lines.findIndex((l) => /\bad_id\b/.test(l));
    adIdContext = lines.slice(Math.max(0, i - 2), i + 2).join(" | ").slice(0, 200);
  }
  return { status: "ok", hasAdId, adIdContext, observedParams, pageLoaded: /カスタム定義|ディメンション/.test(text) };
}

/** Library の Search Console collection 公開状態 (レポート → ライブラリ)。
 *  deep-link `#/reports/library` はホームへリダイレクトされるため、レポート画面から
 *  左ナビ末尾の「ライブラリ」をクリックして到達する。 */
export async function auditLibraryCollection(page, { screenshotDir }) {
  await page.goto(
    `https://analytics.google.com/analytics/web/#/p${GA4_PROPERTY_ID}/reports/reportinghub`,
    { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT },
  );
  await page.waitForTimeout(6000);
  // レポート左パネル末尾の「ライブラリ」(編集者のみ表示)
  let clicked = false;
  for (const locator of [
    page.getByRole("link", { name: "ライブラリ" }).first(),
    page.getByRole("button", { name: "ライブラリ" }).first(),
    page.getByText("ライブラリ", { exact: true }).first(),
  ]) {
    try {
      await locator.waitFor({ state: "visible", timeout: 6000 });
      await locator.click();
      clicked = true;
      break;
    } catch { /* try next */ }
  }
  await page.waitForTimeout(6000);
  await shot(page, screenshotDir, "07-library");
  const text = await bodyText(page);
  if (!clicked || !/コレクション|ライブラリ|Library/.test(text)) return { status: "selector-drift", step: "library" };
  // Search Console カードを card 要素スコープで読む (本文全体の split は左ナビの
  // "Search Console" 見出しに誤マッチする — 2026-07-28 実監査でのバグ)。
  let cardText = null;
  try {
    const card = page
      .locator("ga-collection-card, mat-card, [class*='collection-card'], [class*='collectionCard']")
      .filter({ hasText: "Search Console" })
      .first();
    await card.waitFor({ state: "visible", timeout: 5000 });
    cardText = await card.innerText();
  } catch {
    /* card 要素が取れない場合は下の nav シグナルに委ねる */
  }
  // 公開済み collection はレポート左ナビにも section として現れる (強いシグナル)
  const navPublished = /Search Console[\s\S]{0,200}クエリ/.test(text);
  const hasScCollection = cardText !== null || /Search Console/.test(text);
  const published = (cardText !== null && /公開済み|Published/.test(cardText)) || navPublished;
  const unpublished = cardText !== null && /非公開|未公開|Unpublished/.test(cardText) && !published;
  return { status: "ok", hasScCollection, published, unpublished, cardRead: cardText !== null, navPublished };
}
