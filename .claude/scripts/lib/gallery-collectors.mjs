/**
 * メディア資産の列挙 collector (共有ライブラリ・依存ゼロ)
 *
 * OGP / リンクカード / note カバー / note 記事内画像 / 動画 master などの資産を、
 * R2 は list 不可という制約下で SSOT (sitemap / all.json / note state / archive-manifest)
 * を起点に列挙し、種別タブ用の統一 entry を返す。
 *
 * 消費側:
 *  - .claude/scripts/ogp/build-image-gallery.mjs  (CI 週次ゲート・静的 HTML)
 *  - apps/admin/lib/server/collectors.ts        (統合メディアコンソール・Next.js ランタイム)
 *
 * 純関数のみ。CLI/出力/exit code は各消費側が持つ (このファイルは列挙だけを担う)。
 * 正典: .claude/rules/ogp-image-standards.md / .claude/rules/r2-storage-design.md
 */
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_CONCURRENCY = 12;
export const RANKING_SAMPLE = 30;

/** OGP / カード / note カバー タブ (build-image-gallery.mjs の従来 8 タブ + pref-silhouette)。 */
export const OGP_TABS = [
  "blog-ogp",
  "ranking-ogp",
  "theme-ogp",
  "category-ogp",
  "areas-ogp",
  "blog-card",
  "ranking-card",
  "note-cover",
  "pref-silhouette",
];

/**
 * 県シルエットカードの R2 variant (5比率 × blue/dark)。
 * SSOT は apps/web/scripts/data/pref-silhouette-tokens.ts の
 * PREF_CARD_RATIO_KEYS × PREF_CARD_PUSH_THEMES。本ファイルは node 実行 (.mjs) で TS を
 * import できないため派生を手書きする (buzz-map collector 等と同じ割り切り)。比率/push テーマを
 * 変えたら両方を更新する (変更頻度は低い)。
 */
export const PREF_SILHOUETTE_VARIANTS = [
  "ogp-blue",
  "45-blue",
  "11-blue",
  "916-blue",
  "169-blue",
  "ogp-dark",
  "45-dark",
  "11-dark",
  "916-dark",
  "169-dark",
];

/** 17 category キー (SSOT: packages/data-configs/src/types.ts CATEGORY_KEYS)。 */
export const CATEGORY_KEYS = [
  "landweather",
  "population",
  "laborwage",
  "agriculture",
  "miningindustry",
  "commercial",
  "economy",
  "construction",
  "energy",
  "tourism",
  "educationsports",
  "administrativefinancial",
  "safetyenvironment",
  "socialsecurity",
  "international",
  "infrastructure",
  "ict",
];

// ─── 汎用ユーティリティ ─────────────────────────────────
export async function pMap(items, fn, concurrency = DEFAULT_CONCURRENCY) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { error: String(err?.message || err) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/** GET でステータス + content-type を確認 (本文はダウンロードしない)。 */
export async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const ct = res.headers.get("content-type") || "";
    try {
      await res.body?.cancel();
    } catch {}
    return { ok: res.ok && ct.startsWith("image"), status: res.status, ct };
  } catch (err) {
    return { ok: false, status: 0, ct: String(err?.name || err) };
  } finally {
    clearTimeout(timer);
  }
}

/** 先頭 N + 等間隔でサンプリング (代表性を保つ)。 */
export function sample(list, n) {
  if (list.length <= n) return list;
  const head = Math.min(10, n);
  const picked = list.slice(0, head);
  const remaining = n - head;
  if (remaining > 0) {
    const step = (list.length - head) / remaining;
    for (let i = 0; i < remaining; i++) picked.push(list[head + Math.floor(i * step)]);
  }
  return [...new Set(picked)];
}

export function esc(s) {
  return String(s ?? "").replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c],
  );
}

export function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

// ─── sitemap 列挙 (site 別 TTL キャッシュ) ─────────────────
const _sitemapCache = new Map(); // site -> { at, locs }
const SITEMAP_TTL_MS = 10 * 60 * 1000;

export async function loadSitemapLocs(site) {
  const cached = _sitemapCache.get(site);
  if (cached && Date.now() - cached.at < SITEMAP_TTL_MS) return cached.locs;
  const index = await fetchText(`${site}/sitemap.xml`);
  const parts = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const all = [];
  await pMap(parts, async (u) => {
    const xml = await fetchText(u);
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) all.push(m[1]);
  });
  _sitemapCache.set(site, { at: Date.now(), locs: all });
  return all;
}

export async function enumerateFromSitemap(site, re) {
  const locs = await loadSitemapLocs(site);
  const keys = new Set();
  for (const loc of locs) {
    const m = loc.match(re);
    if (m) keys.add(m[1]);
  }
  return [...keys].sort();
}

export async function enumerateBlogSlugs(r2) {
  const manifest = JSON.parse(await fetchText(`${r2}/app/blog/all.json`));
  const arts = (manifest.articles || []).filter((a) => a.published !== false);
  return arts.map((a) => a.slug).sort();
}

/**
 * note カバー: state の draft-index + published-urls から集約。
 * note カバーは R2 に archive されず公開時に note.com へ直接アップロードされる ephemeral
 * (2026-07-06 確認)。published は note.com リンクを提示、r2Path から archive パスを組む。
 */
export function enumerateNoteCovers(projectRoot) {
  const out = new Map(); // slug -> { slug, status, noteUrl, r2Path }
  const draft = readJsonSafe(path.join(projectRoot, ".claude/state/note-draft-index.json"));
  for (const [slug, v] of Object.entries(draft?.drafts || {})) {
    if (!v?.r2_path) continue;
    out.set(slug, { slug, status: v?.status || "draft", noteUrl: null, r2Path: v.r2_path });
  }
  const pub = readJsonSafe(path.join(projectRoot, ".claude/state/note-published-urls.json"));
  for (const [slug, v] of Object.entries(pub?.articles || {})) {
    if (slug.startsWith("_") || !v?.r2_path) continue;
    out.set(slug, { slug, status: "published", noteUrl: v?.url || null, r2Path: v.r2_path });
  }
  return [...out.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

// ─── OGP entry 構築 ──────────────────────────────────────
/**
 * ページ HTML の og:image meta から実際に配信されている OGP 画像 URL を解決する。
 * 静的フォールバックやハッシュ付き URL、ランタイム 500 をそのまま反映する = 真実を映す。
 */
export async function resolveOgImage(pageUrl) {
  try {
    const html = await fetchText(pageUrl);
    const m = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (m) return { url: m[1], resolved: true };
  } catch {}
  return { url: `${pageUrl}/opengraph-image`, resolved: false };
}

export async function ogpEntries(pairs) {
  return pMap(pairs, async ({ key, pageUrl }) => {
    const og = await resolveOgImage(pageUrl);
    return { key, label: key, pageUrl, images: [{ variant: "single", url: og.url }], ogResolved: og.resolved };
  });
}

/** R2 静的 OGP (事前生成した ogp.png) を参照する単一画像 entry。 */
export function r2OgpEntry(key, r2Key, pageUrl, r2) {
  return { key, label: key, pageUrl, images: [{ variant: "single", url: `${r2}/${r2Key}` }] };
}

/**
 * タブ 1 つ分の entry 群を構築する。
 * opts = { limit, all, site, r2, rankingSample=30, projectRoot }
 * 返り値 = { source, aspect, r2KeyPattern, entries:[{key,label,pageUrl,images:[{variant,url}]}] }
 */
export async function buildTab(tab, opts) {
  const { limit = null, all = false, site, r2, rankingSample = RANKING_SAMPLE, projectRoot } = opts;
  switch (tab) {
    case "blog-ogp": {
      let slugs = await enumerateBlogSlugs(r2);
      if (limit) slugs = slugs.slice(0, limit);
      return {
        source: "r2-static",
        aspect: "1.91:1",
        r2KeyPattern: `app/blog/<slug>/ogp/ogp.png`,
        entries: slugs.map((s) => r2OgpEntry(s, `app/blog/${s}/ogp/ogp.png`, `${site}/blog/${s}`, r2)),
      };
    }
    case "ranking-ogp": {
      let keys = await enumerateFromSitemap(site, /stats47\.jp\/ranking\/([a-z0-9-]+)$/);
      if (limit) keys = keys.slice(0, limit);
      else if (!all) keys = sample(keys, rankingSample);
      return {
        source: "r2-static",
        aspect: "1.91:1",
        r2KeyPattern: `app/ranking/<key>/ogp/ogp.png`,
        entries: keys.map((k) => r2OgpEntry(k, `app/ranking/${k}/ogp/ogp.png`, `${site}/ranking/${k}`, r2)),
      };
    }
    case "theme-ogp": {
      let slugs = await enumerateFromSitemap(site, /stats47\.jp\/themes\/([a-z0-9-]+)$/);
      if (limit) slugs = slugs.slice(0, limit);
      return {
        source: "satori-route",
        aspect: "1.91:1",
        r2KeyPattern: `${site}/themes/<slug>/opengraph-image`,
        entries: await ogpEntries(slugs.map((s) => ({ key: s, pageUrl: `${site}/themes/${s}` }))),
      };
    }
    case "category-ogp": {
      let keys = [...CATEGORY_KEYS];
      if (limit) keys = keys.slice(0, limit);
      return {
        source: "static",
        aspect: "1.91:1",
        r2KeyPattern: `${site}/og-image.jpg (共通静的)`,
        entries: keys.map((k) => ({
          key: k,
          label: k,
          pageUrl: `${site}/category/${k}`,
          images: [{ variant: "single", url: `${site}/og-image.jpg` }],
        })),
      };
    }
    case "areas-ogp": {
      let codes = await enumerateFromSitemap(site, /stats47\.jp\/areas\/([0-9]{5})$/);
      if (codes.length === 0)
        codes = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, "0") + "000");
      if (limit) codes = codes.slice(0, limit);
      return {
        source: "r2-static",
        aspect: "1.91:1",
        r2KeyPattern: `app/areas/<code>/ogp/ogp.png`,
        entries: codes.map((c) => r2OgpEntry(c, `app/areas/${c}/ogp/ogp.png`, `${site}/areas/${c}`, r2)),
      };
    }
    case "blog-card": {
      let slugs = await enumerateBlogSlugs(r2);
      if (limit) slugs = slugs.slice(0, limit);
      return {
        source: "r2-static",
        aspect: "16:9",
        r2KeyPattern: `app/blog/<slug>/thumbnail-{light,dark}.webp`,
        entries: slugs.map((s) => ({
          key: s,
          label: s,
          pageUrl: `${site}/blog/${s}`,
          images: [
            { variant: "light", url: `${r2}/app/blog/${s}/thumbnail-light.webp` },
            { variant: "dark", url: `${r2}/app/blog/${s}/thumbnail-dark.webp` },
          ],
        })),
      };
    }
    case "ranking-card": {
      let keys = await enumerateFromSitemap(site, /stats47\.jp\/ranking\/([a-z0-9-]+)$/);
      if (limit) keys = keys.slice(0, limit);
      else if (!all) keys = sample(keys, rankingSample);
      return {
        source: "r2-static",
        aspect: "16:9",
        r2KeyPattern: `app/ranking/<key>/thumbnail-{light,dark}.webp`,
        entries: keys.map((k) => ({
          key: k,
          label: k,
          pageUrl: `${site}/ranking/${k}`,
          images: [
            { variant: "light", url: `${r2}/app/ranking/${k}/thumbnail-light.webp` },
            { variant: "dark", url: `${r2}/app/ranking/${k}/thumbnail-dark.webp` },
          ],
        })),
      };
    }
    case "pref-silhouette": {
      // 県シルエットカード素材 (47県 × 5比率 × blue/dark)。areas OGP と同デザイン系。
      let codes = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, "0"));
      if (limit) codes = codes.slice(0, limit);
      return {
        source: "r2-static",
        aspect: "multi (ogp/4:5/1:1/9:16/16:9)",
        r2KeyPattern: `sns/pref-silhouette/<code2>/card-<ratio>-<theme>.png`,
        entries: codes.map((c) => ({
          key: c,
          label: c,
          pageUrl: `${site}/areas/${c}000`,
          images: PREF_SILHOUETTE_VARIANTS.map((v) => ({
            variant: v,
            url: `${r2}/sns/pref-silhouette/${c}/card-${v}.png`,
          })),
        })),
      };
    }
    case "note-cover": {
      let covers = enumerateNoteCovers(projectRoot);
      if (limit) covers = covers.slice(0, limit);
      return {
        source: "r2-static",
        aspect: "1.91:1",
        r2KeyPattern: `note/<vertical>/<slug>/images/cover-1280x670.png`,
        entries: covers.map((c) => ({
          key: c.slug,
          label: `${c.slug} [${c.status}]`,
          pageUrl: c.noteUrl,
          images: [{ variant: "single", url: `${r2}/${c.r2Path}/images/cover-1280x670.png` }],
        })),
      };
    }
    default:
      return { source: "none", aspect: "?", r2KeyPattern: "", entries: [] };
  }
}

// ─── 新 collector: note 記事内画像 ────────────────────────
/**
 * note 記事の draft.md から本文中の画像参照を抽出する (カバー以外)。
 * draft.md は R2 の <r2Path>/draft.md にある。markdown 画像 `![](url)` と `<img src>` を拾い、
 * 相対パスは <r2Path>/ 基準で絶対化する。R2 に無い画像は UI 側 onerror で欠落表示。
 */
export async function enumerateNoteImages(projectRoot, r2, opts = {}) {
  const { limit = null, concurrency = 8 } = opts;
  let covers = enumerateNoteCovers(projectRoot);
  if (limit) covers = covers.slice(0, limit);
  const groups = await pMap(
    covers,
    async (c) => {
      let md;
      try {
        md = await fetchText(`${r2}/${c.r2Path}/draft.md`);
      } catch {
        return null;
      }
      const urls = new Set();
      for (const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) urls.add(m[1]);
      for (const m of md.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) urls.add(m[1]);
      const images = [...urls]
        .filter((u) => !/cover-\d+x\d+/.test(u)) // カバーは note-cover タブが担う
        .map((u) => {
          const abs = /^https?:\/\//.test(u) ? u : `${r2}/${c.r2Path}/${u.replace(/^\.?\//, "")}`;
          return { variant: "image", url: abs };
        });
      if (images.length === 0) return null;
      return { key: c.slug, label: `${c.slug} [${c.status}] · ${images.length}枚`, pageUrl: c.noteUrl, images };
    },
    concurrency,
  );
  return {
    source: "r2 (note draft.md 抽出)",
    aspect: "各種",
    r2KeyPattern: `note/<vertical>/<slug>/... (draft.md の画像参照)`,
    entries: groups.filter((g) => g && !g.error),
  };
}

// ─── 新 collector: 動画 master ────────────────────────────
/**
 * Remotion master 動画を列挙する。SSOT は apps/remotion/out/.archive-manifest.json の
 * projects.<name>.keep[].dest (video/<slug>/... に保存される宣言)。ローカル .local/r2/video も併走。
 */
export function enumerateVideoMasters(projectRoot, r2) {
  const manifest = readJsonSafe(path.join(projectRoot, "apps/remotion/out/.archive-manifest.json"));
  const localVideoDir = path.join(projectRoot, ".local/r2/video");
  const byKey = new Map(); // dest -> entry
  const add = (dest, project, localPath) => {
    if (!/\.(mp4|webm|mov)$/i.test(dest)) return;
    const variant = "video";
    const localExists = localPath && fs.existsSync(localPath);
    byKey.set(dest, {
      key: dest,
      label: `${project} · ${dest.replace(/^video\//, "")}`,
      pageUrl: null,
      images: [
        {
          variant,
          // ローカルにあれば /media 経由では配信不可 (LOCAL_SNS_DIR 限定) なので R2 公開 URL を提示
          url: `${r2}/${dest}`,
          local: localExists,
        },
      ],
    });
  };
  for (const [project, def] of Object.entries(manifest?.projects || {})) {
    for (const k of def?.keep || []) {
      if (k?.dest) add(k.dest, project, k.src ? path.join(projectRoot, ".local/r2", k.dest) : null);
    }
  }
  // manifest 外のローカル video も拾う
  if (fs.existsSync(localVideoDir)) {
    for (const slug of fs.readdirSync(localVideoDir)) {
      const dir = path.join(localVideoDir, slug);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) {
        const dest = `video/${slug}/${f}`;
        if (!byKey.has(dest)) add(dest, slug, path.join(dir, f));
      }
    }
  }
  return {
    source: "archive-manifest + .local/r2/video",
    aspect: "動画",
    r2KeyPattern: `video/<slug>/master.mp4`,
    entries: [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };
}
