/**
 * note.com マガジン作成フォームの read-only probe (note-operator の form lib 設計用)
 *
 * 「投稿」ドロップダウンとマガジン作成の入口・フォームフィールドを調べる。
 * ★read-only: 送信 (作成) はしない。フォームを開いて構造を dump するだけ。
 *
 * 実行: node .claude/scripts/note/probe-magazine-create.mjs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PROFILE = join(ROOT, ".local/playwright-note-profile");
const OUT = join(ROOT, ".local/note-operator-debug");
mkdirSync(OUT, { recursive: true });

async function launch() {
  try {
    return await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1366, height: 1000 }, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1366, height: 1000 } });
  }
}

async function dumpForm(page, label) {
  await page.waitForTimeout(3000);
  const rec = { label, finalUrl: page.url(), title: await page.title().catch(() => null) };
  rec.inputs = await page.$$eval("input, textarea", (els) =>
    els.map((e) => ({ tag: e.tagName.toLowerCase(), type: e.getAttribute("type"), name: e.getAttribute("name"), id: e.id || null, placeholder: e.getAttribute("placeholder"), maxlength: e.getAttribute("maxlength") })),
  ).catch(() => []);
  rec.buttons = await page.$$eval("button, [role=button], a[href]", (els) =>
    els.map((e) => (e.textContent || "").trim()).filter((t) => t && t.length < 30 && /作成|保存|公開|マガジン|追加|次へ|完了|下書き/.test(t)),
  ).catch(() => []);
  rec.radios = await page.$$eval("input[type=radio], input[type=checkbox]", (els) =>
    els.map((e) => ({ name: e.getAttribute("name"), value: e.getAttribute("value"), label: (e.closest("label")?.textContent || "").trim().slice(0, 30) })),
  ).catch(() => []);
  return rec;
}

const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
const report = [];

const CREATE_URLS = [
  ["magazine-new", "https://note.com/magazine/new"],
  ["notes-dashboard", "https://note.com/notes"],
];
for (const [label, url] of CREATE_URLS) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
  const rec = await dumpForm(page, label);
  await page.screenshot({ path: join(OUT, `create-${label}.png`), fullPage: false }).catch(() => {});
  report.push(rec);
  console.log(`[${label}] final=${rec.finalUrl} title="${rec.title}"`);
  console.log(`  inputs: ${JSON.stringify(rec.inputs.slice(0, 8))}`);
  console.log(`  buttons: ${JSON.stringify(rec.buttons)}`);
  console.log(`  radios: ${JSON.stringify(rec.radios.slice(0, 6))}`);
}

writeFileSync(join(OUT, "create-probe.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`\n→ ${join(OUT, "create-probe.json")} + create-*.png`);
await ctx.close();
process.exit(0);
