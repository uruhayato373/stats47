#!/usr/bin/env node
/**
 * 公開済みの note 有料記事の価格だけを変える。変更は data/products/price-history.json に先に書いたものだけを適用し、
 * 本文・有料の境界・添付・タグは公開版のまま PUT して読み戻す (仕組みは patch-note-paid-landing.mjs と同じ)。
 * 適用できたら履歴と記事台帳 (data/note/articles.json) の価格を更新する。
 *
 * 使い方:
 *   node .claude/scripts/note/update-note-price.mjs --experiment <ID> [--key <記事キー>]            # dry-run
 *   node .claude/scripts/note/update-note-price.mjs --experiment <ID> [--key <記事キー>] --commit   # 更新と読み戻し
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { datasetPath } from "../../../config/datasets.mjs";
import { findLedgerArticle, updateArticleLedger, readArticleLedger } from "./lib/article-ledger.mjs";
import { assertAccount, launchContext, UA } from "./lib/note-session.mjs";
import { liveProblems, plannedChanges, preflightProblems } from "./lib/price-change.mjs";
import { noteKeyFromUrl, splitPublishedBody } from "./patch-note-paid-landing.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const HISTORY_PATH = join(ROOT, datasetPath("products.price-history"));

const argValue = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
};

async function fetchOwnerNote(ctx, noteKey, query = "") {
  const response = await ctx.request.get(`https://note.com/api/v3/notes/${noteKey}?${query}ts=${Date.now()}`, { headers: { "User-Agent": UA } });
  if (response.status() !== 200) throw new Error(`note API ${response.status()}`);
  const data = (await response.json())?.data;
  if (!data) throw new Error("note API data なし");
  return data;
}

/** editor の「更新する」を押し、PUT の価格を変更後へ差し替える。本文は公開版を送る */
async function putPrice(ctx, noteKey, published, toYen) {
  const { free, pay } = splitPublishedBody(String(published.body || ""), published.separator);
  const page = await ctx.newPage();
  const state = { status: null };
  try {
    await page.route("**/api/v1/text_notes/**", async (route) => {
      const request = route.request();
      if (request.method() !== "PUT") return route.continue();
      const payload = request.postDataJSON();
      if (!Array.isArray(payload.hashtags) || payload.hashtags.length !== (published.hashtag_notes || []).length) {
        state.guardError = `hashtags changed before update (${payload.hashtags?.length})`;
        return route.fulfill({ status: 409, contentType: "application/json", body: '{"error":"blocked by price guard"}' });
      }
      Object.assign(payload, { price: toYen, free_body: free, pay_body: pay, separator: published.separator });
      return route.continue({ postData: JSON.stringify(payload), headers: { ...request.headers(), "content-type": "application/json" } });
    });
    page.on("response", (response) => {
      const request = response.request();
      if (request.method() === "PUT" && request.url().includes("/api/v1/text_notes/")) state.status = response.status();
    });
    await page.goto(`https://editor.note.com/notes/${noteKey}/edit?draft_reedit=true`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_800);
    if (await page.locator('[contenteditable="true"][role="textbox"]').count() !== 1) throw new Error("記事編集画面を確認できません");
    await page.getByRole("button", { name: "公開に進む" }).click();
    await page.locator('[placeholder="ハッシュタグを追加する"]').waitFor({ state: "visible", timeout: 15_000 });
    const areaButton = page.getByRole("button", { name: "有料エリア設定", exact: true });
    if (await areaButton.count() !== 1) throw new Error("有料エリア設定ボタンを確認できません");
    await areaButton.click();
    await page.waitForTimeout(1_500);
    if (await page.locator("#paywall-line[aria-pressed='true']").count() === 0) {
      await page.getByRole("button", { name: "ラインをこの場所に変更", exact: true }).first().click();
      await page.waitForTimeout(1_000);
    }
    const updateButton = page.getByRole("button", { name: "更新する", exact: true });
    await updateButton.first().waitFor({ state: "visible", timeout: 15_000 });
    await updateButton.first().click();
    for (let attempt = 0; attempt < 20 && !Number.isInteger(state.status); attempt += 1) await page.waitForTimeout(500);
    if (state.status === null || state.status < 200 || state.status >= 300) throw new Error(state.guardError || `更新APIが失敗: ${JSON.stringify(state)}`);
  } finally {
    await page.close().catch(() => {});
  }
}

async function applyChange(ctx, history, change, commit) {
  const article = findLedgerArticle(readArticleLedger(), change.productKey);
  if (!article?.noteUrl) throw new Error(`${change.productKey}: 記事台帳に公開 URL が無い`);
  const noteKey = noteKeyFromUrl(article.noteUrl);
  const published = await fetchOwnerNote(ctx, noteKey);
  const draft = published.has_draft ? await fetchOwnerNote(ctx, noteKey, "draft=true&draft_reedit=true&") : null;
  const before = preflightProblems(change, published, draft);
  if (before.length) throw new Error(`${change.productKey}: ${before.join(" / ")}`);
  const oldPriceText = change.fromYen.toLocaleString("en-US");
  const mentions = String(published.body).replace(/<[^>]+>/g, " ").includes(oldPriceText);
  console.log(`  ${change.productKey}: ¥${change.fromYen} → ¥${change.toYen}${mentions ? ` (本文に ${oldPriceText} あり。価格の記載か確かめる)` : ""}`);
  if (!commit) return;
  await putPrice(ctx, noteKey, published, change.toYen);
  let problems = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((done) => setTimeout(done, 1_500));
    problems = liveProblems(change, published, await fetchOwnerNote(ctx, noteKey));
    if (problems.length === 0) break;
  }
  if (problems.length) throw new Error(`${change.productKey}: 読み戻しの失敗 ${problems.join(" / ")}`);
  updateArticleLedger((ledger) => { findLedgerArticle(ledger, change.productKey).priceJpy = change.toYen; });
  change.status = "applied";
  change.appliedAt = new Date().toISOString();
  writeFileSync(HISTORY_PATH, `${JSON.stringify(history, null, 2)}\n`);
  console.log(`  ${change.productKey}: 適用した (読み戻し済み)`);
}

async function main() {
  const experimentId = argValue("--experiment");
  if (!experimentId) throw new Error("--experiment <ID> を指定");
  const commit = process.argv.includes("--commit");
  const history = JSON.parse(readFileSync(HISTORY_PATH, "utf8"));
  const changes = plannedChanges(history, experimentId, argValue("--key"));
  console.log(`=== note の価格変更 ${commit ? "(★COMMIT)" : "(dry-run)"}: ${changes.length} 本 ===`);
  const ctx = await launchContext({ headless: true });
  try {
    console.log(`account gate: ${await assertAccount(ctx)}`);
    // 1 本でも止まったらそこで止める (同じ原因で全部を壊さない)
    for (const change of changes) await applyChange(ctx, history, change, commit);
  } finally {
    await ctx.close();
  }
}

try { await main(); } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
