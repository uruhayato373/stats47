#!/usr/bin/env node
/** Remove empty paragraphs immediately before saved note cards through the editor. */
import { writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { assertAccount, launchContext, pruneProfileCaches } from "./lib/note-session.mjs";

const args = process.argv.slice(2);
const noteKey = args.includes("--note-key") ? args[args.indexOf("--note-key") + 1] : null;
const commit = args.includes("--commit");
if (!/^n[0-9a-f]+$/.test(noteKey || "")) throw new Error("--note-key n... を指定してください");

async function getLive() {
  const response = await fetch(`https://note.com/api/v3/notes/${noteKey}`, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`note API HTTP ${response.status}`);
  const note = (await response.json()).data;
  if (note?.user?.urlname !== "stats47" || note.status !== "published") throw new Error("公開記事またはアカウントが不一致");
  return note;
}
function snapshot(body) {
  const $ = cheerio.load(body);
  const cards = $("figure[embedded-service]").toArray().map((element) => ({
    key: $(element).attr("embedded-content-key"), url: $(element).attr("data-src"),
  }));
  const blankBefore = $("figure[embedded-service]").toArray()
    .filter((element) => { const prev = $(element).prev(); return prev.is("p") && !prev.text().trim() && prev.find("br").length === 1; })
    .map((element) => $(element).attr("embedded-content-key"));
  $("figure[embedded-service]").remove();
  return {
    cards, blankBefore,
    text: $("body").text().replace(/\s+/g, " ").trim(),
    images: $("img").toArray().map((element) => $(element).attr("src")),
    links: $("a[href]").toArray().map((element) => $(element).attr("href")),
  };
}

const before = await getLive();
if (before.has_draft) throw new Error("編集中の下書きがあるため停止");
if (Number(before.price || 0) !== 0) throw new Error("有料記事は対象外");
const baseline = snapshot(before.body || "");
console.log(JSON.stringify({ noteKey, blankBefore: baseline.blankBefore, commit }));
if (!commit || baseline.blankBefore.length === 0) process.exit(0);

const context = await launchContext();
try {
  await assertAccount(context);
  const page = await context.newPage();
  try {
    await page.goto(`https://editor.note.com/notes/${noteKey}/edit?draft_reedit=true`, { waitUntil: "domcontentloaded" });
    const editor = page.locator("[contenteditable=true]").first();
    await editor.waitFor({ timeout: 20_000 });
    const initial = snapshot(await editor.innerHTML());
    if (JSON.stringify(initial.cards) !== JSON.stringify(baseline.cards)) throw new Error("編集画面のカードが公開本文と一致しません");
    if (JSON.stringify(initial.blankBefore) !== JSON.stringify(baseline.blankBefore)) throw new Error("編集画面の空段落が公開本文と一致しません");

    for (const key of baseline.blankBefore) {
      const figure = editor.locator(`figure[embedded-content-key="${key}"]`);
      await figure.evaluate((element) => {
        const previous = element.previousElementSibling;
        if (previous?.tagName !== "P" || previous.textContent?.trim() || previous.querySelectorAll("br").length !== 1) throw new Error("削除対象が空段落ではありません");
        const range = document.createRange();
        range.selectNodeContents(previous);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        element.parentElement.focus();
      });
      await page.keyboard.press("Backspace");
      const stillBlank = await figure.evaluate((element) => {
        const previous = element.previousElementSibling;
        return previous?.tagName === "P" && !previous.textContent?.trim() && previous.querySelectorAll("br").length === 1;
      });
      if (stillBlank) throw new Error(`空段落を削除できません: ${key}`);
    }
    const edited = snapshot(await editor.innerHTML());
    if (JSON.stringify(edited.cards) !== JSON.stringify(baseline.cards)) throw new Error("カードURL・キー・順序が変わりました");
    if (edited.blankBefore.length || edited.text !== initial.text || JSON.stringify(edited.images) !== JSON.stringify(initial.images) || JSON.stringify(edited.links) !== JSON.stringify(initial.links)) throw new Error("空段落以外に変更があります");
    await page.getByRole("button", { name: "公開に進む" }).click();
    await page.getByRole("button", { name: "更新する" }).waitFor({ timeout: 20_000 });
    const updated = page.waitForResponse((response) => response.request().method() === "PUT" && response.url().includes(`/api/v1/text_notes/${before.id}`), { timeout: 30_000 });
    await page.getByRole("button", { name: "更新する" }).click();
    const response = await updated;
    if (!response.ok()) throw new Error(`更新失敗: HTTP ${response.status()}`);
  } finally {
    await page.close();
  }
} finally {
  await context.close();
  pruneProfileCaches();
}

let after;
for (let attempt = 0; attempt < 8; attempt++) {
  after = await getLive();
  if (!after.has_draft && snapshot(after.body || "").blankBefore.length === 0) break;
  await new Promise((done) => setTimeout(done, 1_000));
}
const current = snapshot(after.body || "");
const checks = {
  blankParagraphsRemoved: current.blankBefore.length === 0,
  cardsUnchanged: JSON.stringify(current.cards) === JSON.stringify(baseline.cards),
  textUnchanged: current.text === baseline.text,
  imagesUnchanged: JSON.stringify(current.images) === JSON.stringify(baseline.images),
  linksUnchanged: JSON.stringify(current.links) === JSON.stringify(baseline.links),
  priceUnchanged: Number(after.price || 0) === Number(before.price || 0),
  separatorUnchanged: after.separator === before.separator,
  hashtagCountUnchanged: (after.hashtag_notes || []).length === (before.hashtag_notes || []).length,
  noDraft: !after.has_draft,
};
const reportPath = `/tmp/note-card-spacing-${noteKey}.json`;
writeFileSync(reportPath, `${JSON.stringify({ noteKey, removed: baseline.blankBefore, checks, completedAt: new Date().toISOString() }, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, checks }));
if (Object.values(checks).some((value) => !value)) process.exitCode = 1;
