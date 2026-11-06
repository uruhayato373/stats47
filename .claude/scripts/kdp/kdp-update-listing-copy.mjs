#!/usr/bin/env node
/**
 * 既刊の紹介文とキーワードだけを KDP へ反映する。題名・カテゴリ・原稿・表紙・価格には触らない。
 * 値は台帳 (config/kdp-listings.json)。原稿 data/products/kdp-listing-copy.json の approved だけを対象にし、
 * 提出すると KDP は「変更事項のレビュー中」になり、その間は詳細画面が開けない (2026-11-06 実測)。
 * 提出の受理は本棚の表示で submitted とし、レビュー後に --verify で画面を読み直して一致したら reflected にする。
 *
 *   node .claude/scripts/kdp/kdp-update-listing-copy.mjs --id K-S1-02            # 入力と読み戻しまで (保存しない)
 *   node .claude/scripts/kdp/kdp-update-listing-copy.mjs --id K-S1-02 --commit   # ★反映する (オーナー承認の後)
 *   node .claude/scripts/kdp/kdp-update-listing-copy.mjs --all --commit          # approved の全冊を 1 冊ずつ。失敗で止める
 *   node .claude/scripts/kdp/kdp-update-listing-copy.mjs --verify                # submitted の全冊を読み直す
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KDP_LISTING_COPY } from "../../../config/paths.mjs";
import { readBookshelfState } from "./lib/kdp-flow.mjs";
import { fillKdpListingCopy, goToNextKdpStep, readKdpListingCopy } from "./lib/kdp-form.mjs";
import { validateKdpListingMetadata } from "./lib/kdp-preflight.mjs";
import { assertAccount, launchContext, readListings, shotPath, sleep, waitForLogin, writeBackKdpState } from "./lib/kdp-session.mjs";
import { normalizeKdpStatus } from "./lib/kdp-status.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const BASE = "https://kdp.amazon.co.jp/ja_JP";
const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const ONE = args.includes("--id") ? args[args.indexOf("--id") + 1] : null;
const copyPath = resolve(ROOT, KDP_LISTING_COPY);
const readCopies = () => JSON.parse(readFileSync(copyPath, "utf8"));

const listings = readListings();
const VERIFY = args.includes("--verify");
const eligible = Object.entries(readCopies().books).filter(([, copy]) => copy.status === (VERIFY ? "submitted" : "approved")).map(([id]) => id);
const ids = ONE ? [ONE] : args.includes("--all") || VERIFY ? eligible : [];
if (ids.length === 0 || ids.some((id) => !eligible.includes(id))) {
  console.error(`対象なし。候補: ${eligible.join(", ") || "なし"}`);
  process.exit(2);
}

const REVIEWING = /変更(?:事項|内容)の?(?:レビュー中|出版準備中)/;
const normalize = (text) => String(text).replace(/\s/g, "");
function listingCopyDiff(screen, listing) {
  const problems = [];
  if (normalize(screen.description) !== normalize(listing.description)) problems.push("内容紹介が台帳と違う");
  if (JSON.stringify(screen.keywords) !== JSON.stringify(listing.keywords)) problems.push(`キーワードが台帳と違う (${screen.keywords.join(" / ")})`);
  return problems;
}

async function openDetails(page, draftId) {
  await page.goto(`${BASE}/title-setup/kindle/${draftId}/details`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try { await page.waitForLoadState("networkidle", { timeout: 20000 }); } catch {}
  await sleep(6000);
}

function markCopy(id, status) {
  const doc = readCopies();
  doc.books[id].status = status;
  doc.books[id][`${status}At`] = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  writeFileSync(copyPath, `${JSON.stringify(doc, null, 2)}\n`);
}

async function update(page, id, listing) {
  const tag = `[copy ${id}]`;
  const check = validateKdpListingMetadata(id, listing);
  if (!check.ok) return { ok: false, reason: `台帳の検査: ${check.errors.join(" / ")}` };
  const shelfBefore = await readBookshelfState(page, listing.draftId, { asin: listing.asin ?? "" });
  if (!shelfBefore.found || normalizeKdpStatus(shelfBefore.status) !== "live" || shelfBefore.asin !== listing.asin) {
    return { ok: false, reason: `本棚の行が販売中の対象と一致しない (${shelfBefore.status ?? "行なし"} / ${shelfBefore.asin ?? ""})` };
  }
  await openDetails(page, listing.draftId);
  const filled = await fillKdpListingCopy(page, listing, { tag });
  if (filled.warnings.length) return { ok: false, reason: filled.warnings.join(" / ") };
  const entered = listingCopyDiff(await readKdpListingCopy(page), listing);
  if (entered.length) return { ok: false, reason: entered.join(" / ") };
  await page.screenshot({ path: shotPath(`copy-${id}-details.png`), fullPage: true }).catch(() => {});
  if (!COMMIT) return { ok: true, dryRun: true };

  for (const step of ["content", "pricing"]) {
    const moved = await goToNextKdpStep(page, step, { tag });
    if (!moved.ok) return { ok: false, reason: `${step} へ進めない: ${moved.error ?? moved.reason ?? ""}` };
    await sleep(3000);
  }
  const errors = await page.evaluate(() => [...document.querySelectorAll(".a-alert-error")].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || "").trim()).filter(Boolean));
  if (errors.length) return { ok: false, reason: `pricing にエラー: ${errors.join(" / ").slice(0, 200)}` };
  // 海外の価格欄は日本の価格から非同期に換算される。埋まる前に押すと「希望小売価格を設定します」で止まる (2026-11-06 実測)
  await page.waitForFunction(() => {
    const prices = [...document.querySelectorAll('input[name*="[price_vat_inclusive]"]')];
    return prices.length > 1 && prices.every((input) => input.value.trim());
  }, undefined, { timeout: 30000 }).catch(() => {});
  await sleep(5000);
  await page.locator("text=Kindle 本を出版").first().click({ timeout: 20000 });
  await sleep(8000);
  if (await page.locator(".a-alert-error:visible").count()) {
    await sleep(8000);
    await page.locator("text=Kindle 本を出版").first().click({ timeout: 20000 });
    await sleep(8000);
  }
  await page.locator('[role="dialog"]:visible, .a-popover-modal:visible').locator("text=/^出版$|^公開$|^OK$/").first().click({ timeout: 10000 }).catch(() => {});
  await sleep(10000);
  await page.screenshot({ path: shotPath(`copy-${id}-publish.png`), fullPage: true }).catch(() => {});

  const shelf = await readBookshelfState(page, listing.draftId, { asin: listing.asin ?? "" });
  if (!shelf.found || !shelf.statusKnown || shelf.isDraft) return { ok: false, reason: `公開を確認できない (${shelf.status ?? "行なし"})` };
  if (!REVIEWING.test(shelf.rowText ?? "")) return { ok: false, reason: `変更のレビュー中を確認できない (${shelf.status})` };
  markCopy(id, "submitted");
  return { ok: true, status: "変更事項のレビュー中" };
}

async function verifyReflected(page, id, listing) {
  const shelf = await readBookshelfState(page, listing.draftId, { asin: listing.asin ?? "" });
  if (REVIEWING.test(shelf.rowText ?? "")) return { ok: true, pending: true };
  await openDetails(page, listing.draftId);
  const saved = listingCopyDiff(await readKdpListingCopy(page), listing);
  if (saved.length) return { ok: false, reason: `読み戻し: ${saved.join(" / ")}` };
  markCopy(id, "reflected");
  return { ok: true, status: "読み戻し一致" };
}

const ctx = await launchContext({ headless: false });
const results = [];
try {
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  page.on("dialog", async (dialog) => { try { await dialog.accept(); } catch {} });
  const login = await waitForLogin(page, { tag: "[copy]", waitMinutes: 2 });
  if (!login.ok) throw new Error(login.reason);
  const account = await assertAccount(page, { tag: "[copy]" });
  if (!account.ok) throw new Error(account.reason);
  for (const id of ids) {
    const result = await (VERIFY ? verifyReflected : update)(page, id, listings[id]);
    results.push({ id, ...result });
    console.log(`[copy] ${id}: ${result.ok ? (result.pending ? "まだレビュー中" : result.dryRun ? "入力と読み戻しは一致 (保存していない)" : `反映 (${result.status})`) : `停止 ${result.reason}`}`);
    if (!result.ok) break;
  }
} finally {
  await ctx.close();
}
const failed = results.filter((result) => !result.ok).length;
console.log(`[copy] 結果 ${results.length - failed}/${ids.length}`);
process.exit(failed ? 1 : 0);
