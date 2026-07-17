import "server-only";

import { R2_BASE } from "./project-root";
import { fetchText, pMap, classify, inspectSvg, CATALOGS } from "./collectors";

/**
 * ブログ SVG カタログ (R2 から fetch → 分類)。旧 server.mjs の svgCatalog を忠実移植。
 * プロセス内 10 分 TTL キャッシュ (limit/all キー別)。globalThis で HMR 二重化を防ぐ。
 */
export interface SvgChart {
  slug: string;
  file: string;
  cat: string;
  url: string;
  viewBox: string | null;
  hasTheme: boolean;
  hasViewBox: boolean;
}

export interface SvgCatalogData {
  catalogs: Array<{ key: string; label: string; desc: string; count: number }>;
  items: SvgChart[];
  articleCount: number;
}

interface SvgCache {
  at: number;
  key: string;
  data: SvgCatalogData;
}

const g = globalThis as unknown as { __gallerySvgCache?: SvgCache | null };
const TTL_MS = 10 * 60 * 1000;

export async function svgCatalog(
  opts: { limit?: number | null; all?: boolean } = {},
): Promise<SvgCatalogData> {
  const { limit = 30, all = false } = opts;
  const key = all ? "all" : String(limit ?? 30);
  const cached = g.__gallerySvgCache;
  if (cached && cached.key === key && Date.now() - cached.at < TTL_MS) return cached.data;

  const manifest = JSON.parse(await fetchText(`${R2_BASE}/app/blog/all.json`));
  let articles: Array<{ slug: string; hasCharts?: boolean }> = (manifest.articles || []).filter(
    (a: { hasCharts?: boolean }) => a.hasCharts,
  );
  const cap = all ? articles.length : limit ?? 30;
  articles = articles.slice(0, cap);

  const groups = await pMap(
    articles,
    async (a) => {
      let md: string;
      try {
        md = await fetchText(`${R2_BASE}/app/blog/${a.slug}/article.md`);
      } catch {
        return [] as SvgChart[];
      }
      const refs = [
        ...new Set([...md.matchAll(/\]\(data\/([^)]+\.svg)\)/g)].map((m) => m[1])),
      ];
      const charts = await pMap(
        refs,
        async (file) => {
          try {
            const svg = await fetchText(`${R2_BASE}/app/blog/${a.slug}/data/${file}`);
            return {
              slug: a.slug,
              file,
              cat: classify(file, svg),
              url: `${R2_BASE}/app/blog/${a.slug}/data/${file}`,
              ...inspectSvg(svg),
            } as SvgChart;
          } catch {
            return null;
          }
        },
        6,
      );
      return charts.filter((c): c is SvgChart => c !== null && !(c as { error?: unknown }).error);
    },
    8,
  );

  const items = groups.filter((gr): gr is SvgChart[] => Array.isArray(gr)).flat();
  const catalogs = CATALOGS.map((c) => ({
    ...c,
    count: items.filter((i) => i.cat === c.key).length,
  }));
  const data: SvgCatalogData = { catalogs, items, articleCount: articles.length };
  g.__gallerySvgCache = { at: Date.now(), key, data };
  return data;
}
