/**
 * note-operator: マガジン作成 CLI (dry-run 既定 + --commit gate)
 *
 * catalog (magazines.ts = intent の SSOT) と note.com の差分から、
 * 「作成すべきマガジン」を算出し、承認 (--commit) 時のみ note.com に実作成する。
 * ★既定は dry-run (書き込みなし)。--commit で初めて note.com に書き込む。
 * ★account assert (urlname==stats47) を通してからしか書き込まない。
 * ★既に noteUrl を持つマガジン (note.com 実在) は絶対に作り直さない。
 *
 * Usage:
 *   node .claude/scripts/note/note-magazine.mjs plan
 *       未作成 (noteUrl null) かつ member>0 のマガジンを一覧 (dry-run)
 *   node .claude/scripts/note/note-magazine.mjs create --key s47-sports-culture
 *       作成内容を提示 (dry-run・書き込みなし)
 *   node .claude/scripts/note/note-magazine.mjs create --key s47-sports-culture --commit
 *       note.com に実作成 → 新 URL を magazines.ts の noteUrl へ書き戻す
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launchContext, assertAccount, UA } from "./lib/note-session.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MAGAZINES_TS = join(ROOT, ".claude/scripts/note/catalog/magazines.ts");
const NEW_URL = "https://note.com/magazines/new";
const NAME_MAX = 30;

const args = process.argv.slice(2);
const cmd = args[0];
const keyArg = (() => { const i = args.indexOf("--key"); return i >= 0 ? args[i + 1] : null; })();
const COMMIT = args.includes("--commit");

function getCatalog() {
  const json = execFileSync("npx", ["tsx", join(ROOT, ".claude/scripts/note/catalog/dump-magazines-json.ts")], {
    cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(json);
}

function pending(catalog) {
  // 未作成 (noteUrl null) かつ 公開済みメンバー>0 を作成候補に
  return catalog.filter((m) => !m.noteUrl && m.publishedMemberCount > 0).sort((a, b) => b.publishedMemberCount - a.publishedMemberCount);
}

function cmdPlan() {
  const catalog = getCatalog();
  const todo = pending(catalog);
  const live = catalog.filter((m) => m.noteUrl);
  console.log(`=== note マガジン作成プラン (dry-run) ===`);
  console.log(`note.com 稼働: ${live.length} / 作成候補 (未作成・member>0): ${todo.length}\n`);
  console.log("作成候補 (公開済みメンバー数 降順):");
  for (const m of todo) {
    const nameLen = [...m.name].length;
    const warn = nameLen > NAME_MAX ? ` ⚠名前${nameLen}字>30` : "";
    console.log(`  ${String(m.publishedMemberCount).padStart(3)}件 | ${m.isPaid ? "有料" : "無料"} | ${m.key}  「${m.name}」${warn}`);
  }
  console.log(`\n作成: node ${"note-magazine.mjs"} create --key <key> [--commit]`);
}

async function cmdCreate() {
  if (!keyArg) { console.error("--key <magazineKey> が必要です"); process.exit(1); }
  const catalog = getCatalog();
  const m = catalog.find((x) => x.key === keyArg);
  if (!m) { console.error(`マガジンキー "${keyArg}" が catalog に不在`); process.exit(1); }
  if (m.noteUrl) { console.error(`✗ "${keyArg}" は既に note.com 実在 (${m.noteUrl})。作り直さない`); process.exit(1); }
  const nameLen = [...m.name].length;
  if (nameLen > NAME_MAX) { console.error(`✗ 名前が ${nameLen}字 > ${NAME_MAX}字上限。magazines.ts の name を短縮してください`); process.exit(1); }

  console.log(`=== マガジン作成 ${COMMIT ? "(★COMMIT: note.com へ実書き込み)" : "(dry-run)"} ===`);
  console.log(`  key:  ${m.key}`);
  console.log(`  名前: ${m.name} (${nameLen}字)`);
  console.log(`  説明: ${m.description}`);
  console.log(`  価格: ${m.isPaid ? "有料" : "無料"}`);
  console.log(`  対象記事: 公開済み ${m.publishedMemberCount} 件`);

  if (!COMMIT) {
    console.log(`\n(dry-run。実作成は --commit を付ける。作成後 noteUrl を magazines.ts へ書き戻す)`);
    return;
  }
  if (m.isPaid) { console.error("\n✗ このCLIは無料マガジン専用 (有料は価格設定・審査が絡むため手動)。中断"); process.exit(1); }

  const ctx = await launchContext({ headless: false });
  try {
    const acct = await assertAccount(ctx);
    console.log(`  account assert OK: ${acct}`);
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    const noteUrl = await createOnPage(page, m);
    console.log(`\n✓ 作成成功: ${noteUrl}`);
    writeBackNoteUrl(m.key, noteUrl);
    console.log(`✓ magazines.ts の "${m.key}" に noteUrl を記録`);
  } finally {
    await ctx.close();
  }
}

/** 1マガジンを note.com 作成フォームで作る (page は既にログイン済み)。noteUrl を返す。 */
async function createOnPage(page, m) {
  await page.goto(NEW_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.fill('input[placeholder*="30字以内"]', m.name); // 名前 (≤30字)
  await page.fill('textarea[placeholder*="400字以内"]', m.description); // 説明 (≤400字)
  await page.click('button:has-text("無料")').catch(() => {}); // 無料 を選択
  await page.waitForTimeout(500);
  await page.click('button:has-text("作成")'); // submit
  await page.waitForURL(/\/m\/m[0-9a-f]+/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const mk = page.url().match(/\/m\/(m[0-9a-f]+)/);
  if (!mk) throw new Error(`作成後 URL が想定外: ${page.url()}`);
  return `https://note.com/stats47/m/${mk[1]}`;
}

/** 未作成 (noteUrl null・member>0・無料) を 1 セッションで全作成。 */
async function cmdCreateAll() {
  const catalog = getCatalog();
  const todo = pending(catalog).filter((m) => !m.isPaid && [...m.name].length <= NAME_MAX);
  const skipped = pending(catalog).filter((m) => m.isPaid || [...m.name].length > NAME_MAX);
  console.log(`=== 一括作成 ${COMMIT ? "(★COMMIT)" : "(dry-run)"} : 対象 ${todo.length} / スキップ ${skipped.length} ===`);
  for (const m of todo) console.log(`  - ${m.key} 「${m.name}」(${m.publishedMemberCount}件)`);
  if (skipped.length) console.log(`  スキップ(有料/名前超過): ${skipped.map((m) => m.key).join(", ")}`);
  if (!COMMIT) { console.log("\n(dry-run。--commit で一括実作成)"); return; }

  const ctx = await launchContext({ headless: false });
  try {
    const acct = await assertAccount(ctx);
    console.log(`\naccount assert OK: ${acct}\n`);
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    let ok = 0;
    for (const m of todo) {
      try {
        const noteUrl = await createOnPage(page, m);
        writeBackNoteUrl(m.key, noteUrl);
        ok++;
        console.log(`  ✓ ${m.key} → ${noteUrl}`);
      } catch (e) {
        console.log(`  ✗ ${m.key} 失敗: ${String(e).slice(0, 80)} (残りは継続)`);
      }
    }
    console.log(`\n完了: ${ok}/${todo.length} 作成・noteUrl 書き戻し済み`);
  } finally {
    await ctx.close();
  }
}

function writeBackNoteUrl(key, noteUrl) {
  let src = readFileSync(MAGAZINES_TS, "utf8");
  // key: "<key>" を含むエントリ内の noteUrl: null を実URLへ (エントリ境界は key 位置で切る)
  const km = [...src.matchAll(/key:\s*"([^"]+)"/g)];
  let out = "", cursor = 0, done = false;
  for (let i = 0; i < km.length; i++) {
    const segStart = km[i].index, segEnd = i + 1 < km.length ? km[i + 1].index : src.length;
    let seg = src.slice(segStart, segEnd);
    if (km[i][1] === key && !done) {
      const ns = seg.replace(/noteUrl:\s*null/, `noteUrl: "${noteUrl}"`);
      if (ns !== seg) { seg = ns; done = true; }
    }
    out += src.slice(cursor, segStart) + seg; cursor = segEnd;
  }
  out += src.slice(cursor);
  if (!done) throw new Error(`magazines.ts に key "${key}" の noteUrl:null が見つからず書き戻せません`);
  writeFileSync(MAGAZINES_TS, out);
}

// ── add-articles: catalog の割当どおりに記事をマガジンへ追加 (idempotent) ──
async function fetchNoteIdMap(ctx) {
  const map = {};
  for (let p = 1; p <= 100; p++) {
    const r = await ctx.request.get(`https://note.com/api/v2/creators/stats47/contents?kind=note&page=${p}`, { headers: { "User-Agent": UA } });
    const j = await r.json().catch(() => ({}));
    const contents = j?.data?.contents || [];
    if (!contents.length) break;
    for (const c of contents) if (c.key && c.id) map[c.key] = c.id;
    if (j?.data?.isLastPage) break;
  }
  return map;
}
async function fetchOwnedPublishedNoteId(ctx, noteKey) {
  const r = await ctx.request.get(`https://note.com/api/v3/notes/${noteKey}?ts=${Date.now()}`, {
    headers: { "User-Agent": UA },
  });
  if (r.status() !== 200) return null;
  const j = await r.json().catch(() => ({}));
  const note = j?.data;
  if (
    note?.key !== noteKey ||
    note?.status !== "published" ||
    note?.user?.urlname !== "stats47" ||
    !Number.isInteger(note?.id)
  ) return null;
  return note.id;
}
async function fetchMemberKeys(ctx, magNoteKey) {
  const keys = new Set();
  for (let p = 1; p <= 60; p++) {
    const r = await ctx.request.get(`https://note.com/api/v1/magazines/${magNoteKey}/notes?page=${p}`, { headers: { "User-Agent": UA } });
    const j = await r.json().catch(() => ({}));
    const notes = j?.data?.notes || j?.data?.contents || [];
    if (!notes.length) break;
    for (const n of notes) if (n.key) keys.add(n.key);
    if (j?.data?.isLastPage) break;
  }
  return keys;
}
async function addNote(ctx, magNoteKey, noteKey, noteId) {
  const r = await ctx.request.post(`https://note.com/api/v1/our/magazines/${magNoteKey}/notes`, {
    headers: { "User-Agent": UA, "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    data: { note_id: noteId, note_key: noteKey },
  });
  return r.status();
}
const noteKeyOf = (url) => url?.match(/\/n\/(n[0-9a-z]+)/i)?.[1] ?? null;
const magKeyOf = (url) => url?.match(/\/m\/(m[0-9a-f]+)/)?.[1] ?? null;

async function cmdAddArticles() {
  const catalog = getCatalog();
  const targets = catalog.filter((m) => m.noteUrl && (!keyArg || m.key === keyArg) && m.publishedMembers.length);
  if (!targets.length) { console.log("対象マガジンなし (noteUrl 有 + publishedMembers>0)"); return; }
  console.log(`=== 記事追加 ${COMMIT ? "(★COMMIT)" : "(dry-run)"} : マガジン ${targets.length} ===`);
  const ctx = await launchContext({ headless: true });
  try {
    await assertAccount(ctx);
    const idMap = await fetchNoteIdMap(ctx);
    console.log(`note id マップ: ${Object.keys(idMap).length} 件\n`);
    let totalAdd = 0;
    for (const m of targets) {
      const magKey = magKeyOf(m.noteUrl);
      const current = await fetchMemberKeys(ctx, magKey);
      const toAdd = [], noId = [];
      for (const a of m.publishedMembers) {
        const nk = noteKeyOf(a.noteUrl);
        if (!nk) continue;
        if (current.has(nk)) continue; // 既にメンバー
        if (!idMap[nk]) idMap[nk] = await fetchOwnedPublishedNoteId(ctx, nk);
        if (!idMap[nk]) { noId.push(a); continue; } // note_id 不明 (下書き等)
        toAdd.push({ ...a, nk });
      }
      console.log(`[${m.key}] 現在 ${current.size} / 追加対象 ${toAdd.length}${noId.length ? ` / id不明 ${noId.length}` : ""}`);
      if (!COMMIT) continue;
      let ok = 0;
      for (const a of toAdd) {
        const st = await addNote(ctx, magKey, a.nk, idMap[a.nk]);
        if (st >= 200 && st < 300) ok++;
        else console.log(`  ✗ ${a.title.slice(0, 24)} → ${st}`);
        await new Promise((r) => setTimeout(r, 400)); // note へ配慮した間隔
      }
      totalAdd += ok;
      console.log(`  ✓ ${ok}/${toAdd.length} 追加`);
    }
    console.log(`\n完了: 合計 ${totalAdd} 記事を追加`);
  } finally {
    await ctx.close();
  }
}

if (cmd === "plan") cmdPlan();
else if (cmd === "create") await cmdCreate();
else if (cmd === "create-all") await cmdCreateAll();
else if (cmd === "add-articles") await cmdAddArticles();
else { console.log("usage: note-magazine.mjs plan | create --key <key> [--commit] | create-all [--commit] | add-articles [--key <key>] [--commit]"); process.exit(1); }
