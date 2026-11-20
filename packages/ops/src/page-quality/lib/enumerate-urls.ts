import type { PageTemplateKey } from "../types";
import { resolveDispatcher } from "./http-dispatcher";

const dispatcher = resolveDispatcher();

/**
 * 公開URL一覧を実際のsitemap (apps/web/src/app/sitemap.ts が生成するもの) から取得する。
 * 独自のURL SSOTを持たない — sitemap.xml (index) → 子sitemap → <loc> をそのまま使う。
 */
export interface EnumeratedUrl {
  path: string;
  template: PageTemplateKey;
}

function extractLocs(xml: string): string[] {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return [...matches].map((m) => m[1].trim());
}

/** URLのパスから監査テンプレートを推定する (url-policy.ts の名前空間に対応するpath prefix判定)。 */
export function classifyPath(path: string): PageTemplateKey {
  if (path === "/" || path === "") return "home";
  if (path === "/areas" || path === "/areas/") return "prefecture-list";
  if (/^\/areas\/\d+\/cities\//.test(path)) return "municipality";
  if (/^\/areas\/\d+/.test(path)) return "prefecture-detail";
  if (path.startsWith("/ranking")) return "ranking";
  if (path.startsWith("/category")) return "category";
  if (path.startsWith("/themes")) return "theme";
  if (path.startsWith("/geo")) return "geo-analysis";
  // 記事詳細 (/blog/<slug>) は一覧 (/blog・/blog/tags) と別レイアウト。予約パスの tags だけ一覧側
  if (/^\/blog\/(?!tags\/?$)[^/]+\/?$/.test(path)) return "blog-article";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/survey")) return "survey";
  return "other";
}

export async function enumerateAllUrls(baseUrl: string): Promise<EnumeratedUrl[]> {
  // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
  const indexRes = await fetch(new URL("/sitemap.xml", baseUrl).toString(), { dispatcher });
  if (!indexRes.ok) {
    throw new Error(`sitemap.xml fetch failed: HTTP ${indexRes.status}`);
  }
  const indexXml = await indexRes.text();
  const childLocs = extractLocs(indexXml);

  // generateSitemaps() が単一sitemapしか作らない場合、index自体が<url><loc>を持つことがある。
  // childLocsが空(0件)の場合は「子sitemap 0件」ではなく判定不能なので、
  // 空配列を返さずindex自身をsitemapとして扱い、その後の「0 URL列挙」ガードに委ねる。
  const isChildSitemapIndex = childLocs.length > 0 && childLocs.every((loc) => /sitemap.*\.xml/.test(loc));
  const sitemapUrls = isChildSitemapIndex ? childLocs : [new URL("/sitemap.xml", baseUrl).toString()];

  const seen = new Set<string>();
  const results: EnumeratedUrl[] = [];
  for (const sitemapUrl of sitemapUrls) {
    // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
    const res = await fetch(sitemapUrl, { dispatcher });
    if (!res.ok) continue;
    const xml = await res.text();
    for (const loc of extractLocs(xml)) {
      let path: string;
      try {
        path = new URL(loc).pathname;
      } catch {
        continue;
      }
      if (seen.has(path)) continue;
      seen.add(path);
      results.push({ path, template: classifyPath(path) });
    }
  }
  return results;
}
