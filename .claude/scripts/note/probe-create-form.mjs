/**
 * note.com マガジン作成フォームの対話 probe (投稿ドロップダウン経由・read-only)
 *
 * 「投稿」ドロップダウンを開いてメニューを dump し、マガジン作成の入口をたどって
 * 作成フォームのフィールドを dump する。★送信 (作成) は絶対にしない。
 *
 * 実行: node .claude/scripts/note/probe-create-form.mjs
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
    return await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1440, height: 1000 }, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, { headless: true, viewport: { width: 1440, height: 1000 } });
  }
}

const ctx = await launch();
const page = ctx.pages()[0] ?? (await ctx.newPage());
const log = [];
await page.goto("https://note.com/", { waitUntil: "domcontentloaded" }).catch(() => {});
await page.waitForTimeout(3000);

// 1. 「投稿」ドロップダウンの chevron を開く (投稿ボタン隣の▾)
async function openPostMenu() {
  // 投稿ボタン群のトグルを複数戦略で探す
  const candidates = [
    'header button:has-text("投稿") + button',
    'header [aria-haspopup]',
    'button[aria-label*="投稿"]',
    'header button:near(:text("投稿"))',
  ];
  // まず投稿ボタン自体の隣の小ボタン (chevron) を総当り
  const toggles = await page.$$('header button');
  for (const b of toggles) {
    const t = (await b.textContent().catch(() => "")) || "";
    const aria = (await b.getAttribute("aria-haspopup").catch(() => null));
    if (aria || t.trim() === "" ) {
      // chevron 候補: テキスト空 or haspopup。投稿の近くをクリック
    }
  }
  // 素直に「投稿」を含むリンク/ボタンの兄弟 chevron をクリック
  const chevron = await page.$('header button:has-text("投稿") ~ button, header a:has-text("投稿") ~ button');
  if (chevron) { await chevron.click().catch(() => {}); return true; }
  // fallback: 投稿ボタン自体をクリック (メニューが出るタイプ)
  const post = await page.$('header :text("投稿")');
  if (post) { await post.click().catch(() => {}); return true; }
  return false;
}

const opened = await openPostMenu();
await page.waitForTimeout(1500);
// メニュー項目 (投稿ドロップダウン) を dump
const menuItems = await page.$$eval('a[href], [role=menuitem], button', (els) =>
  els.map((e) => ({ t: (e.textContent || "").trim(), href: e.getAttribute?.("href") || null }))
    .filter((x) => x.t && x.t.length < 20 && /マガジン|記事|投稿|つぶやき|募集|メンバー/.test(x.t)),
).catch(() => []);
log.push({ step: "post-menu", opened, menuItems });
console.log("投稿メニュー項目:", JSON.stringify(menuItems));
await page.screenshot({ path: join(OUT, "post-menu.png") }).catch(() => {});

// 2. 「マガジン」を含む導線をたどる (メニュー内 or 直接)
const magLink = await page.$('a:has-text("マガジン")[href*="magazine"], a[href*="/magazine"]:has-text("作成")');
let magHref = null;
if (magLink) magHref = await magLink.getAttribute("href").catch(() => null);
// note の作成 URL 候補も試す
const CREATE_TRY = [magHref, "https://note.com/notes/magazine/new", "https://note.com/magazines/new"].filter(Boolean);
for (const url of CREATE_TRY) {
  const abs = url.startsWith("http") ? url : `https://note.com${url}`;
  await page.goto(abs, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const title = await page.title().catch(() => "");
  const inputs = await page.$$eval("input, textarea", (els) =>
    els.map((e) => ({ tag: e.tagName.toLowerCase(), type: e.getAttribute("type"), name: e.getAttribute("name"), placeholder: e.getAttribute("placeholder"), maxlength: e.getAttribute("maxlength") }))
      .filter((x) => x.placeholder !== "キーワードやクリエイターで検索"),
  ).catch(() => []);
  const btns = await page.$$eval("button", (els) => els.map((e) => (e.textContent || "").trim()).filter((t) => t && /作成|保存|公開|下書き|無料|有料/.test(t))).catch(() => []);
  log.push({ step: "create-try", url: abs, finalUrl: page.url(), title, inputs, buttons: btns });
  console.log(`\n[create ${abs}] → ${page.url()} "${title}"`);
  console.log("  inputs:", JSON.stringify(inputs));
  console.log("  buttons:", JSON.stringify(btns));
  if (inputs.length) { await page.screenshot({ path: join(OUT, "create-form.png") }).catch(() => {}); break; }
}

writeFileSync(join(OUT, "create-form-probe.json"), JSON.stringify(log, null, 2) + "\n");
console.log(`\n→ ${join(OUT, "create-form-probe.json")}`);
await ctx.close();
process.exit(0);
