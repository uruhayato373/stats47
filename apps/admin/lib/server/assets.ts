import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot, localPilotDir, R2_BASE, SITE } from "./project-root";
import { loadAll } from "./posts-store";
import {
  buildTab,
  enumerateBlogSlugs,
  enumerateNoteCovers,
  enumerateNoteImages,
  enumerateVideoMasters,
  readJsonSafe,
  probe,
  pMap,
  type TabResult,
  type AssetEntry,
} from "./collectors";

/**
 * 統合資産タブ (OGP / カード / note / video / パイロット)。
 * 旧 server.mjs の ASSET_TABS / getAssetTab / enumeratePilot / assetsSummary / probe(check) を忠実移植。
 */
export interface AssetTab {
  id: string;
  label: string;
  kind: "local-pilot" | "ogp" | "note-image" | "video";
}

export const ASSET_TABS: AssetTab[] = [
  { id: "blog-ogp-pilot", label: "ブログ OGP パイロット (local)", kind: "local-pilot" },
  { id: "blog-ogp", label: "ブログ OGP", kind: "ogp" },
  { id: "blog-card", label: "ブログ リンクカード", kind: "ogp" },
  { id: "ranking-ogp", label: "ランキング OGP", kind: "ogp" },
  { id: "ranking-card", label: "ランキング リンクカード", kind: "ogp" },
  { id: "areas-ogp", label: "都道府県 OGP", kind: "ogp" },
  // 2026-07-15 に他ブランチが collectors へ追加した新タブ (buildTab が dispatch)。merge 統合で追随
  { id: "pref-silhouette", label: "県シルエットカード (SNS)", kind: "ogp" },
  { id: "theme-ogp", label: "テーマ OGP", kind: "ogp" },
  { id: "category-ogp", label: "カテゴリ OGP", kind: "ogp" },
  { id: "note-cover", label: "note カバー", kind: "ogp" },
  { id: "note-image", label: "note 記事内画像", kind: "note-image" },
  { id: "video-master", label: "動画 master", kind: "video" },
];

/**
 * ブログ OGP パイロット collector (local・R2 非公開の目視レビュー用)。
 * generate-blog-thumbnails-cloud.ts --ai-background --out-dir .local/ogp-pilot の出力を読む。
 */
function enumeratePilot(): TabResult {
  const pilotDir = localPilotDir();
  const base = {
    source: "local (.local/ogp-pilot)",
    aspect: "1.91:1",
    r2KeyPattern: ".local/ogp-pilot/<slug>/ogp/ogp.png (R2 非書込・パイロット目視専用)",
  };
  if (!fs.existsSync(pilotDir)) return { ...base, entries: [] };
  const entries: AssetEntry[] = [];
  for (const slug of fs.readdirSync(pilotDir).sort()) {
    const dir = path.join(pilotDir, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
    const meta = (readJsonSafe(path.join(dir, "ogp", "ogp.json")) as Record<string, unknown>) || {};
    const bg = (meta.background as Record<string, unknown>) || {};
    const images: AssetEntry["images"] = [];
    const add = (variant: string, rel: string) => {
      if (fs.existsSync(path.join(dir, rel))) {
        images.push({ variant, url: `/pilot/${encodeURIComponent(slug)}/${rel}` });
      }
    };
    add("ogp", "ogp/ogp.png"); // 最終合成 (実際に配信される OGP)
    add("bg", "ogp/background.jpg"); // AI 背景 (light 正規化) — 品質判定用
    add("light", "thumbnail-light.webp");
    add("dark", "thumbnail-dark.webp");
    if (images.length === 0) continue;
    const tag = [bg.visualType, bg.motif].filter(Boolean).join("/");
    const src = bg.source ? ` · ${bg.source}` : "";
    entries.push({
      key: slug,
      label: `${slug}${tag ? ` [${tag}${src}]` : ""}`,
      pageUrl: `${SITE}/blog/${slug}`,
      images,
    });
  }
  return { ...base, entries };
}

/** タブ 1 つ分の資産 entry を取得する。unknown tab は throw (呼び元 route が 400 化)。 */
export async function getAssetTab(
  tab: string,
  opts: { limit?: number | null; all?: boolean } = {},
): Promise<TabResult & { tab: string; label: string }> {
  const { limit = null, all = false } = opts;
  const meta = ASSET_TABS.find((t) => t.id === tab);
  if (!meta) throw new Error(`unknown asset tab: ${tab}`);
  const root = projectRoot();
  const base = { limit, all, site: SITE, r2: R2_BASE, projectRoot: root };
  if (meta.kind === "local-pilot") return { tab, label: meta.label, ...enumeratePilot() };
  if (meta.kind === "ogp") return { tab, label: meta.label, ...(await buildTab(tab, base)) };
  if (meta.kind === "note-image") {
    return { tab, label: meta.label, ...(await enumerateNoteImages(root, R2_BASE, { limit })) };
  }
  if (meta.kind === "video") {
    return { tab, label: meta.label, ...enumerateVideoMasters(root, R2_BASE) };
  }
  throw new Error(`unhandled kind: ${meta.kind}`);
}

/** ホーム用の軽量サマリ (sitemap 走査を避け、即答できる件数だけ)。 */
export async function assetsSummary(): Promise<{
  sns: { total: number; posted: number; scheduled: number; draft: number };
  blogArticles: number;
  noteCovers: number;
  videoMasters: number;
  assetTabs: number;
}> {
  const root = projectRoot();
  const posts = loadAll().filter((p) => p.status !== "deleted");
  let blogSlugs = 0;
  try {
    blogSlugs = (await enumerateBlogSlugs(R2_BASE)).length;
  } catch {
    // sitemap/all.json 到達不可でも他サマリは返す
  }
  return {
    sns: {
      total: posts.length,
      posted: posts.filter((p) => p.status === "posted").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      draft: posts.filter((p) => p.status === "draft").length,
    },
    blogArticles: blogSlugs,
    noteCovers: enumerateNoteCovers(root).length,
    videoMasters: enumerateVideoMasters(root, R2_BASE).entries.length,
    assetTabs: ASSET_TABS.length,
  };
}

/** タブ内の全画像 URL を HEAD probe して欠落を確定する。unknown tab は throw (400)。 */
export async function checkAssets(
  tab: string,
  opts: { limit?: number | null; all?: boolean } = {},
): Promise<{ checked: number; result: Record<string, unknown> }> {
  const data = await getAssetTab(tab, opts);
  const urls = [
    ...new Set(
      data.entries.flatMap((e) =>
        e.images.map((im) => im.url).filter((u): u is string => !!u),
      ),
    ),
  ];
  const result: Record<string, unknown> = {};
  await pMap(urls, async (u) => {
    result[u] = await probe(u);
  });
  return { checked: urls.length, result };
}
