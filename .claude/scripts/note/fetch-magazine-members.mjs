/**
 * note.com の各マガジンの所属記事 (member) を取得し、catalog の割当と突合 (read-only)
 *
 * 有料マガジンが無料記事も束ねているか等、catalog の magazine 割当が note.com の実態と
 * 一致するかを検証する。永続プロファイルを再利用。
 *
 * 実行: node .claude/scripts/note/fetch-magazine-members.mjs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PROFILE = join(ROOT, ".local/playwright-note-profile");
const OUT = join(ROOT, ".local/note-operator-debug");
mkdirSync(OUT, { recursive: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// note.com 実在マガジン (fetch-note-magazines の結果)
const MAGS = [
  { catalogKey: "koumuin-claude-code", noteKey: "m512ad7023815" },
  { catalogKey: "koumuin-estat-claude-code", noteKey: "m1b836e4c8dce" },
  { catalogKey: "product-d3-colors", noteKey: "mfe0fab2606eb" },
];

// catalog の noteUrl -> {catalogKey, magazine, isPaid} を索引 (突合用)
const idx = new Map();
try {
  const pub = JSON.parse(readFileSync(join(ROOT, ".claude/state/note-published-urls.json"), "utf8")).articles;
  for (const [k, a] of Object.entries(pub)) {
    if (a.url) {
      const noteId = a.url.split("/n/")[1];
      if (noteId) idx.set(noteId, { key: k, title: a.title, is_paid: a.is_paid });
    }
  }
} catch {}

async function launch() {
  try {
    return await chromium.launchPersistentContext(PROFILE, { headless: true, channel: "chrome" });
  } catch {
    return await chromium.launchPersistentContext(PROFILE, { headless: true });
  }
}

async function fetchMembers(ctx, noteKey) {
  // 候補エンドポイントを順に試す (note API はバージョン差がある)
  const candidates = [
    `https://note.com/api/v1/magazines/${noteKey}/notes?page=1`,
    `https://note.com/api/v2/magazines/${noteKey}`,
  ];
  for (const url of candidates) {
    try {
      const r = await ctx.request.get(url, { headers: { "User-Agent": UA } });
      if (r.status() !== 200) continue;
      const j = await r.json();
      // レスポンス形状ゆれを吸収して notes 配列を取り出す
      const notes = j?.data?.notes ?? j?.data?.contents ?? j?.data?.notes?.contents ?? [];
      if (Array.isArray(notes) && notes.length) return { url, notes };
      if (j?.data) return { url, notes: [], raw: Object.keys(j.data) };
    } catch {}
  }
  return { url: null, notes: [] };
}

const ctx = await launch();
const report = [];
for (const m of MAGS) {
  const { url, notes, raw } = await fetchMembers(ctx, m.noteKey);
  const members = notes.map((n) => ({ key: n.key ?? n.id, title: (n.name ?? n.title ?? "").slice(0, 40), isPaid: n.price > 0 || n.isPaid || false }));
  report.push({ ...m, endpoint: url, memberCount: members.length, rawKeys: raw, members });
  console.log(`\n[${m.catalogKey}] note.com 所属 ${members.length} 件 (endpoint=${url ?? "取得不可"})`);
  for (const mem of members.slice(0, 6)) console.log(`   · ${mem.isPaid ? "有料" : "無料"} ${mem.title}`);
  if (members.length > 6) console.log(`   … 他 ${members.length - 6} 件`);
}
writeFileSync(join(OUT, "magazine-members.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`\n→ ${join(OUT, "magazine-members.json")}`);
await ctx.close();
process.exit(0);
