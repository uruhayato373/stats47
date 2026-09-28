#!/usr/bin/env node
/** Replace one blank published note card through the native editor and verify public rendering. */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { assertAccount, launchContext, pruneProfileCaches } from "./lib/note-session.mjs";

const args = process.argv.slice(2);
const value = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
const slug = value("--slug");
const url = value("--url");
const expectedKey = value("--expected-key");
const commit = args.includes("--commit");
if (!slug || !url) throw new Error("--slug と --url を指定してください");
const catalog = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", ".claude/scripts/note/catalog/dump-circulation-json.ts"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
const article = catalog.articles.find((entry) => entry.key === slug);
if (!article?.noteUrl || !article.noteUrl.startsWith("https://note.com/stats47/n/")) throw new Error("catalog に記事がありません");
const noteKey = article.noteUrl.match(/\/n\/(n[0-9a-f]+)$/)?.[1];
const reportPath = `/tmp/note-card-repair-${slug}.json`;

async function getLive() {
  const response = await fetch(`https://note.com/api/v3/notes/${noteKey}`, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`note API HTTP ${response.status}`);
  const note = (await response.json()).data;
  if (note?.user?.urlname !== "stats47" || note.status !== "published") throw new Error("記事のアカウントまたは公開状態が不一致");
  return note;
}
async function getBrowserCard(key) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.goto(article.noteUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForSelector(`figure[embedded-content-key="${key}"]`, { state: "attached", timeout: 15_000 });
    await page.evaluate((cardKey) => {
      document.querySelector(`figure[embedded-content-key="${cardKey}"]`)?.scrollIntoView({ block: "center" });
    }, key);
    await page.waitForTimeout(1_500);
    return await page.evaluate((cardKey) => {
      const element = document.querySelector(`figure[embedded-content-key="${cardKey}"]`);
      if (!element) throw new Error("公開画面で対象カードが見つかりません");
      return {
        iframe: Boolean(element.querySelector("iframe[src]")),
        image: Boolean(element.querySelector("img[src]")),
        text: Boolean(element.textContent?.trim()),
        height: element.getBoundingClientRect().height,
      };
    }, key);
  } finally {
    await browser.close();
  }
}
function cardEntries(body) {
  const $ = cheerio.load(body);
  return $("figure[embedded-service]").toArray().map((element) => ({ url: $(element).attr("data-src"), key: $(element).attr("embedded-content-key") }));
}
function comparableCardUrl(value) {
  const parsed = new URL(value);
  return parsed.pathname === "/" && !parsed.search && !parsed.hash ? `${parsed.origin}/` : value;
}
function sameCardUrls(left, right) {
  return JSON.stringify(left.map((card) => comparableCardUrl(card.url))) === JSON.stringify(right.map((card) => comparableCardUrl(card.url)));
}
function bodyEvidence(body) {
  const $ = cheerio.load(body);
  $("figure[embedded-service]").remove();
  return {
    text: $("body").text().replace(/\s+/g, " ").trim(),
    images: $("img").toArray().map((element) => $(element).attr("src")),
    links: $("a[href]").toArray().map((element) => $(element).attr("href")),
  };
}

const before = await getLive();
if (before.has_draft) throw new Error("編集中の下書きがあります。上書き防止のため停止");
if (Number(before.price || 0) !== 0) throw new Error("有料記事はこの修復ツールの対象外");
const cards = cardEntries(before.body || "");
const matches = cards.filter((card) => card.url === url);
if (matches.length !== 1) throw new Error(`対象カードは1件必要です: ${matches.length}`);
const oldCard = matches[0];
if (expectedKey && oldCard.key !== expectedKey) throw new Error(`監査時のカードキーと不一致: ${expectedKey} → ${oldCard.key}`);
const publicBefore = await getBrowserCard(oldCard.key);
if (publicBefore.iframe || publicBefore.image || publicBefore.text || publicBefore.height > 0) throw new Error("対象カードはブラウザで空白ではありません");
console.log(JSON.stringify({ slug, noteUrl: article.noteUrl, target: url, oldKey: oldCard.key, cardCount: cards.length, commit }));
if (!commit) process.exit(0);

const ctx = await launchContext();
let newKey = null;
try {
  await assertAccount(ctx);
  const page = await ctx.newPage();
  try {
    await page.goto(`https://editor.note.com/notes/${noteKey}/edit?draft_reedit=true`, { waitUntil: "domcontentloaded" });
    const editor = page.locator("[contenteditable=true]").first();
    await editor.waitFor({ timeout: 20_000 });
    // The target figure is empty and hidden, so locate it by its exact saved key.
    const figure = editor.locator(`figure[embedded-content-key="${oldCard.key}"]`);
    if (await figure.count() !== 1 || await figure.getAttribute("data-src") !== url) throw new Error("編集画面の対象カードが一致しません");
    if (await editor.locator("figure[embedded-service]").count() !== cards.length) throw new Error("編集画面のカード数が公開本文と不一致");
    await figure.evaluate((element) => {
      const previous = element.previousElementSibling;
      if (!previous || previous.tagName !== "P") throw new Error("前の段落が見つかりません");
      const range = document.createRange();
      range.selectNodeContents(previous);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      element.parentElement.focus();
    });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Delete");
    if (await editor.locator(`figure[embedded-content-key="${oldCard.key}"]`).count()) throw new Error("旧カードを削除できませんでした");
    await page.keyboard.press("Enter");
    await page.keyboard.insertText(url);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4_000);
    const edited = await editor.locator("figure[embedded-service]").evaluateAll((elements) => elements.map((element) => ({
      url: element.getAttribute("data-src"), key: element.getAttribute("embedded-content-key"),
    })));
    if (!sameCardUrls(edited, cards)) throw new Error(`カードURLまたは順序が変わりました: ${JSON.stringify({ before: cards.map((card) => card.url), edited: edited.map((card) => card.url) })}`);
    if (edited.length !== cards.length) throw new Error("カード数が変わりました");
    newKey = edited.find((card) => comparableCardUrl(card.url) === comparableCardUrl(url))?.key;
    if (!newKey || newKey === oldCard.key) throw new Error("新しいカードキーが発行されませんでした");
    await page.getByRole("button", { name: "公開に進む" }).click();
    await page.getByRole("button", { name: "更新する" }).waitFor({ timeout: 20_000 });
    const updateResponse = page.waitForResponse((response) => response.request().method() === "PUT" && response.url().includes(`/api/v1/text_notes/${before.id}`), { timeout: 30_000 });
    await page.getByRole("button", { name: "更新する" }).click();
    const response = await updateResponse;
    if (!response.ok()) throw new Error(`記事更新に失敗: HTTP ${response.status()}`);
  } finally {
    await page.close().catch(() => {});
  }
} finally {
  await ctx.close();
  pruneProfileCaches();
}

let after;
for (let attempt = 0; attempt < 8; attempt++) {
  after = await getLive();
  if (cardEntries(after.body || "").some((card) => card.key === newKey)) break;
  await new Promise((done) => setTimeout(done, 1_000));
}
const afterCards = cardEntries(after.body || "");
const checks = {
  newKeyPublished: afterCards.some((card) => card.key === newKey),
  cardUrlsUnchanged: sameCardUrls(afterCards, cards),
  bodyEvidenceUnchanged: JSON.stringify(bodyEvidence(after.body || "")) === JSON.stringify(bodyEvidence(before.body || "")),
  priceUnchanged: Number(after.price || 0) === Number(before.price || 0),
  separatorUnchanged: after.separator === before.separator,
  hashtagsUnchanged: (after.hashtag_notes || []).length === (before.hashtag_notes || []).length,
  noDraft: !after.has_draft,
  publicCardVisible: ((card) => (card.iframe || card.image || card.text) && card.height > 0)(await getBrowserCard(newKey)),
};
const report = { slug, noteUrl: article.noteUrl, target: url, oldKey: oldCard.key, newKey, checks, completedAt: new Date().toISOString() };
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, checks }));
if (Object.values(checks).some((value) => !value)) process.exitCode = 1;
