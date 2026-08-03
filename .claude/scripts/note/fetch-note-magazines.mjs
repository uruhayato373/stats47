/**
 * note.com の stats47 既存マガジン一覧を取得 (read-only・カタログ照合用)
 *
 * 永続プロファイルを再利用し、creator contents API からマガジン (kind=magazine) を全ページ取得。
 * name / key(URL) / isPaid / price / noteCount / 公開状態 を dump する。
 * これを magazines.ts の noteUrl / isPaid 照合と、記事のマガジン所属復元の入力にする。
 *
 * 実行: node .claude/scripts/note/fetch-note-magazines.mjs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PROFILE = join(ROOT, ".local/playwright-note-profile");
const OUT = join(ROOT, ".local/note-operator-debug");
mkdirSync(OUT, { recursive: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

async function launch() {
  const opts = { headless: true };
  try {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, opts);
  }
}

const ctx = await launch();
const mags = [];
for (let page = 1; page <= 10; page++) {
  const url = `https://note.com/api/v2/creators/stats47/contents?kind=magazine&page=${page}`;
  const r = await ctx.request.get(url, { headers: { "User-Agent": UA } });
  if (r.status() !== 200) { console.log(`page ${page}: status ${r.status()} — stop`); break; }
  const j = await r.json().catch(() => null);
  const contents = j?.data?.contents ?? [];
  if (!contents.length) break;
  for (const c of contents) {
    mags.push({
      name: c.name ?? c.title,
      key: c.key,
      url: c.key ? `https://note.com/stats47/m/${c.key}` : null,
      isPaid: c.isPaid ?? c.magazineType === "paid" ?? null,
      magazineType: c.magazineType ?? null,
      price: c.price ?? null,
      noteCount: c.notesCount ?? c.publishNoteCount ?? null,
      publishStatus: c.publishStatus ?? null,
    });
  }
  if (j?.data?.isLastPage) break;
}

writeFileSync(join(OUT, "note-magazines.json"), JSON.stringify(mags, null, 2) + "\n");
console.log(`既存マガジン ${mags.length} 件:`);
for (const m of mags) console.log(`  · ${m.name} | ${m.magazineType ?? (m.isPaid ? "paid" : "free")} ¥${m.price ?? 0} | ${m.noteCount ?? "?"}本 | key=${m.key}`);
console.log(`\n→ ${join(OUT, "note-magazines.json")}`);
await ctx.close();
process.exit(0);
