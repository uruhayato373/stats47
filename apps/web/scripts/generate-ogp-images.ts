#!/usr/bin/env tsx
/**
 * 静的画像 (OGP / リンクカード / note カバー) を Satori (Node) でレンダリングして
 * `.local/r2/<key>` staging に書き出す。R2 反映は diff-push-r2.ts に委譲する
 * (S3 PutObject 差分 push、wrangler put は flaky のため非採用)。
 *
 * 背景: ランタイム next/og は Cloudflare Worker で例外 (1101) を投げ 500 になる。
 * OGP はビルド外の Node で事前生成し R2 静的配信する (正典: .claude/rules/ogp-image-standards.md)。
 * blog OGP は generate-blog-thumbnails-cloud.ts が別途担当 (`app/blog/<slug>/ogp/ogp.png`)。
 *
 * 生成のみ (push しない)。読み=公開 R2 URL + 本番 sitemap。フォントはローカル TTF (Worker と違い健全)。
 *
 * Usage:
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking       [--limit N] [--key a,b]
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type areas
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking-cards [--limit N]
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type note-covers   [--limit N]
 *
 *   # 既存 (R2 に有る) もスキップせず再生成
 *   npx tsx apps/web/scripts/generate-ogp-images.ts --type ranking --force
 *
 * 生成後の push:
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/ranking
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/areas
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix note
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { createElement as h } from "react";

const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const SITE = process.env.SITE_ORIGIN ?? "https://stats47.jp";
const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const STAGE_ROOT = join(PROJECT_ROOT, ".local/r2");
const CONCURRENCY = 6;

type OgpType = "ranking" | "areas" | "ranking-cards" | "note-covers";

interface CliOptions {
  type: OgpType;
  force: boolean;
  audit: boolean;
  keys: string[] | null;
  limit: number | null;
  maxGenerate: number | null;
  source: "sitemap" | "known";
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const val = (name: string): string | null => {
    const i = args.indexOf(name);
    return i !== -1 ? (args[i + 1] ?? null) : null;
  };
  const rawType = val("--type");
  const allowed: OgpType[] = ["ranking", "areas", "ranking-cards", "note-covers"];
  if (!rawType || !allowed.includes(rawType as OgpType)) {
    throw new Error(`--type は ${allowed.join(" | ")} を指定してください`);
  }
  const rawKey = val("--key");
  const rawLimit = val("--limit");
  const rawMax = val("--max-generate");
  const rawSource = val("--source");
  return {
    type: rawType as OgpType,
    force: args.includes("--force"),
    audit: args.includes("--audit"),
    keys: rawKey ? rawKey.split(",").map((s) => s.trim()).filter(Boolean) : null,
    limit: rawLimit ? Number(rawLimit) : null,
    maxGenerate: rawMax ? Number(rawMax) : null,
    source: rawSource === "known" ? "known" : "sitemap",
  };
}

async function pMap<T, R>(items: T[], fn: (item: T, i: number) => Promise<R>, c = CONCURRENCY): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, worker));
  return results;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/** R2 の key が 200 かつ画像か。 */
async function cloudOk(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${PUBLIC_URL}/${key}`, { method: "HEAD" });
    return res.ok && (res.headers.get("content-type") ?? "").includes("image");
  } catch {
    return false;
  }
}

/**
 * ranking キーを列挙。
 * - source=sitemap (既定): 本番 sitemap (live で indexable なキー)。週次監査向け
 * - source=known: git の KNOWN_RANKING_KEYS を parse。新規公開直後 (まだ sitemap 未反映) の
 *   publish フック向け。`packages/ranking/src/config/known-ranking-keys.ts` を正規表現で読む
 */
async function listRankingKeys(source: "sitemap" | "known"): Promise<string[]> {
  if (source === "known") {
    const { readFileSync } = await import("node:fs");
    try {
      const src = readFileSync(
        join(PROJECT_ROOT, "packages/ranking/src/config/known-ranking-keys.ts"),
        "utf8",
      );
      const keys = [...src.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)].map((m) => m[1]);
      return [...new Set(keys)].sort();
    } catch (e) {
      console.error(`known-ranking-keys.ts 読み取り失敗、sitemap にフォールバック: ${String(e)}`);
    }
  }
  const index = (await fetchText(`${SITE}/sitemap.xml`)) ?? "";
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const keys = new Set<string>();
  for (const part of parts) {
    const xml = (await fetchText(part)) ?? "";
    for (const m of xml.matchAll(/stats47\.jp\/ranking\/([a-z0-9-]+)</g)) keys.add(m[1]);
  }
  return [...keys].sort();
}

function listAreaCodes(): string[] {
  return Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);
}

interface NoteEntry {
  slug: string;
  r2Path: string;
  vertical: string;
}
async function listNoteEntries(): Promise<NoteEntry[]> {
  const { readFileSync } = await import("node:fs");
  const readJson = (p: string): unknown => {
    try {
      return JSON.parse(readFileSync(join(PROJECT_ROOT, p), "utf8"));
    } catch {
      return null;
    }
  };
  const out = new Map<string, NoteEntry>();
  const draft = readJson(".claude/state/note-draft-index.json") as {
    drafts?: Record<string, { vertical?: string; r2_path?: string }>;
  } | null;
  for (const [slug, v] of Object.entries(draft?.drafts ?? {})) {
    if (v?.r2_path) out.set(slug, { slug, r2Path: v.r2_path, vertical: v.vertical ?? "stats47-note" });
  }
  const pub = readJson(".claude/state/note-published-urls.json") as {
    articles?: Record<string, { vertical?: string; r2_path?: string }>;
  } | null;
  for (const [slug, v] of Object.entries(pub?.articles ?? {})) {
    if (slug.startsWith("_") || !v?.r2_path) continue;
    out.set(slug, { slug, r2Path: v.r2_path, vertical: v.vertical ?? "stats47-note" });
  }
  return [...out.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function stagePath(key: string): string {
  const p = join(STAGE_ROOT, key);
  mkdirSync(join(p, ".."), { recursive: true });
  return p;
}

// ─── データ導出 (R2 raw JSON → コンポーネント data) ───
interface RankingItemRaw {
  item?: {
    title?: string;
    rankingName?: string;
    seoTitle?: string;
    unit?: string;
    source?: { source?: { name?: string }; name?: string };
    availableYears?: { yearCode?: string; yearName?: string }[];
    latestYear?: { yearCode?: string; yearName?: string };
  };
}
interface ValuesRaw {
  partitions?: { yearCode?: string; values?: { areaName?: string; value?: number | null; rank?: number }[] }[];
}

async function buildRankingOgpData(key: string) {
  const itemPayload = await fetchJson<RankingItemRaw>(`${PUBLIC_URL}/app/ranking/${key}/item.json`);
  const it = itemPayload?.item;
  if (!it?.title && !it?.rankingName) return null;
  const title = it.seoTitle ?? it.title ?? it.rankingName ?? "";
  const unit = it.unit ?? "";
  const source = it.source?.source?.name ?? it.source?.name ?? "e-Stat";
  const latestYear =
    it.availableYears?.[it.availableYears.length - 1]?.yearCode ?? it.latestYear?.yearCode ?? "";
  const values = await fetchJson<ValuesRaw>(`${PUBLIC_URL}/app/ranking/${key}/values.json`);
  const partition =
    values?.partitions?.find((p) => p.yearCode === latestYear) ?? values?.partitions?.[values.partitions.length - 1];
  const rows = (partition?.values ?? [])
    .filter((v) => v.value !== null && v.value !== undefined && typeof v.rank === "number")
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  const top3 = rows.slice(0, 3).map((v) => ({ rank: v.rank as number, name: v.areaName ?? "", value: v.value as number }));
  const last = rows.length > 0 ? rows[rows.length - 1] : null;
  return {
    ogp: {
      title: it.title ?? it.rankingName ?? "",
      seoTitle: title,
      unit,
      source,
      top3,
      last: last ? { rank: last.rank as number, name: last.areaName ?? "", value: last.value as number } : null,
    },
    latestYearName: it.availableYears?.[it.availableYears.length - 1]?.yearName ?? it.latestYear?.yearName ?? "",
  };
}

interface AreaProfileRaw {
  areaName?: string;
  strengths?: { indicator?: string; rank?: number }[];
  weaknesses?: { indicator?: string; rank?: number }[];
}
async function buildAreaOgpData(code: string) {
  const profile = await fetchJson<AreaProfileRaw>(`${PUBLIC_URL}/app/areas/${code}/profile.json`);
  if (!profile?.areaName) return null;
  return {
    prefCode: parseInt(code.slice(0, 2), 10),
    areaName: profile.areaName,
    strengths: (profile.strengths ?? []).slice(0, 2).map((s) => ({ rank: s.rank ?? 0, indicator: s.indicator ?? "" })),
    weaknesses: (profile.weaknesses ?? []).slice(0, 2).map((s) => ({ rank: s.rank ?? 0, indicator: s.indicator ?? "" })),
  };
}

/** draft.md frontmatter の title を抜く。 */
function parseTitle(md: string): string | null {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = m ? m[1] : "";
  const line = block.match(/^title:\s*(.+)$/m);
  if (!line) return null;
  let v = line[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v || null;
}

async function main() {
  const opts = parseArgs();
  console.log(`type=${opts.type} 公開URL=${PUBLIC_URL} stage=${STAGE_ROOT}`);

  // 対象列挙 (render lib 不要 = 監査は native binding なしで完結)
  let ids: string[];
  let noteEntries: NoteEntry[] = [];
  if (opts.type === "note-covers") {
    noteEntries = await listNoteEntries();
    ids = noteEntries.map((n) => n.slug);
  } else if (opts.type === "areas") {
    ids = listAreaCodes();
  } else {
    ids = opts.keys ?? (await listRankingKeys(opts.source));
  }
  if (opts.keys) ids = ids.filter((id) => opts.keys!.includes(id));
  if (opts.limit) ids = ids.slice(0, opts.limit);
  console.log(`候補: ${ids.length} 件`);

  const keyFor = (id: string): string[] => {
    if (opts.type === "ranking") return [`app/ranking/${id}/ogp/ogp.png`];
    if (opts.type === "areas") return [`app/areas/${id}/ogp/ogp.png`];
    if (opts.type === "ranking-cards")
      return [`app/ranking/${id}/thumbnail-light.webp`, `app/ranking/${id}/thumbnail-dark.webp`];
    const n = noteEntries.find((e) => e.slug === id)!;
    return [`${n.r2Path}/images/cover-1280x670.png`];
  };

  // 既存チェック (監査・self-heal 共通)。--force 時のみスキップ (全件再生成)
  let missing: string[] = [];
  if (opts.audit || !opts.force) {
    const checked = await pMap(ids, async (id) => ({ id, ok: await cloudOk(keyFor(id)[0]) }), 12);
    missing = checked.filter((c) => !c.ok).map((c) => c.id);
  }

  // --audit: 生成せず欠落を報告して exit (missing>0 で exit 1)
  if (opts.audit) {
    console.log(`\n監査: ${ids.length} 件中 欠落 ${missing.length} 件`);
    if (missing.length > 0) {
      console.log(`  欠落: ${missing.slice(0, 30).join(", ")}${missing.length > 30 ? ` … 他 ${missing.length - 30} 件` : ""}`);
    }
    process.exit(missing.length > 0 ? 1 : 0);
  }

  // 生成対象 (--force=全件 / 通常=欠落のみ)。--max-generate で1回あたりの blast radius を制限
  let targets = opts.force ? [...ids] : missing;
  const capped = opts.maxGenerate != null && targets.length > opts.maxGenerate;
  if (capped) {
    console.log(`⚠ 生成対象 ${targets.length} 件を上限 ${opts.maxGenerate} 件にクランプ (残りは次回実行)`);
    targets = targets.slice(0, opts.maxGenerate!);
  }
  console.log(`生成対象: ${targets.length} 件 (既存スキップ: ${ids.length - (opts.force ? ids.length : missing.length)})`);
  if (targets.length === 0) return;

  // render lib は生成時のみ読み込む (satori/sharp)
  const { buildElement, loadFonts, renderToPng, renderToWebP } = await import("./lib/blog-thumbnail-render");
  const fonts = loadFonts(PROJECT_ROOT);

  // 既存 OGP コンポーネント (satori 描画用)
  let RankingOgp: unknown, AreaOgp: unknown;
  if (opts.type === "ranking" || opts.type === "areas") {
    RankingOgp = (await import("../src/features/ogp/RankingOgp")).RankingOgp;
    AreaOgp = (await import("../src/features/ogp/AreaOgp")).AreaOgp;
  }

  let generated = 0;
  let fallback = 0;
  let skipped = 0;
  let done = 0;
  const NOTE_SIZE = { width: 1280, height: 670 };

  const processItem = async (id: string) => {
    try {
      if (opts.type === "ranking") {
        const built = await buildRankingOgpData(id);
        if (!built) { skipped++; return; }
        const out = stagePath(keyFor(id)[0]);
        try {
          await renderToPng(h(RankingOgp as never, { data: built.ogp }) as never, fonts, out);
        } catch (e) {
          if (process.env.OGP_DEBUG) console.log(`  [ranking-fallback] ${id}: ${String((e as Error)?.message ?? e).slice(0, 200)}`);
          // satori 非互換 → タイトルカードにフォールバック
          const el = buildElement(
            { title: built.ogp.title, subtitle: built.latestYearName ? `都道府県ランキング（${built.latestYearName}）` : "都道府県ランキング", category: "RANKING", domainPath: "stats47.jp/ranking" },
            false,
          );
          await renderToPng(el, fonts, out);
          fallback++;
        }
      } else if (opts.type === "areas") {
        const data = await buildAreaOgpData(id);
        if (!data) { skipped++; return; }
        const out = stagePath(keyFor(id)[0]);
        try {
          await renderToPng(h(AreaOgp as never, { data }) as never, fonts, out);
        } catch (e) {
          if (process.env.OGP_DEBUG) console.log(`  [area-fallback] ${id}: ${String((e as Error)?.message ?? e).slice(0, 200)}`);
          const el = buildElement(
            { title: data.areaName, subtitle: "統計で見る地域プロフィール", category: "AREA", domainPath: "stats47.jp/areas" },
            false,
          );
          await renderToPng(el, fonts, out);
          fallback++;
        }
      } else if (opts.type === "ranking-cards") {
        const itemPayload = await fetchJson<RankingItemRaw>(`${PUBLIC_URL}/app/ranking/${id}/item.json`);
        const it = itemPayload?.item;
        if (!it?.title && !it?.rankingName) { skipped++; return; }
        const year = it.availableYears?.[it.availableYears.length - 1]?.yearName ?? "";
        const data = { title: it.title ?? it.rankingName ?? "", subtitle: null, category: "RANKING", date: year, domainPath: "stats47.jp/ranking" };
        const [lightKey, darkKey] = keyFor(id);
        await renderToWebP(buildElement(data, false), fonts, stagePath(lightKey));
        await renderToWebP(buildElement(data, true), fonts, stagePath(darkKey));
      } else {
        // note-covers
        const n = noteEntries.find((e) => e.slug === id)!;
        const md = await fetchText(`${PUBLIC_URL}/${n.r2Path}/draft.md`);
        const title = (md ? parseTitle(md) : null) ?? id.replace(/-/g, " ");
        const el = buildElement(
          { title, subtitle: null, category: "NOTE", domainPath: "note.com/stats47" },
          false,
        );
        await renderToPng(el, fonts, stagePath(keyFor(id)[0]), NOTE_SIZE);
      }
      generated++;
    } catch (err) {
      skipped++;
      console.log(`  [error] ${id}: ${String((err as Error)?.message ?? err).slice(0, 100)}`);
    } finally {
      done++;
      if (done % 200 === 0) console.log(`  ... ${done}/${targets.length}`);
    }
  };

  await pMap(targets, (id) => processItem(id), CONCURRENCY);

  console.log(`\n生成: ${generated} 件 (フォールバック ${fallback} / スキップ ${skipped})`);
  const prefix = opts.type === "note-covers" ? "note" : opts.type === "areas" ? "app/areas" : "app/ranking";
  console.log(`staging: ${STAGE_ROOT}/${prefix}`);
  console.log(`push: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix ${prefix}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
