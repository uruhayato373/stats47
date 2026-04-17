/**
 * 地図タイルプロキシ (Cloudflare Workers edge cache 利用)
 *
 * Leaflet が fetch する CartoDB タイル (basemaps.cartocdn.com) を stats47.jp 経由で
 * プロキシし、Cloudflare エッジで長期キャッシュする。
 *
 * 背景: Cloudflare Web Analytics で Leaflet タイルが LCP 最大 19,888ms の主犯と判明。
 *       cartocdn から都度 fetch すると TLS/DNS/転送で重く、ユーザー体験を悪化させていた。
 *
 * 設計:
 * - URL: /tiles/{theme}/{z}/{x}/{ypng}
 *   - theme: "light_all" | "dark_all"（CartoDB の light/dark basemap）
 *   - z: ズームレベル (0-20)
 *   - x, y: タイル座標
 *   - ypng: "{y}.png" or "{y}@2x.png"
 * - fetch 時に Cloudflare edge に 30 日キャッシュ、ブラウザにも 30 日 immutable
 * - subdomain 分散は不要（Cloudflare CDN 経由で HTTP/2 多重化が効く）
 */

export const runtime = "edge";

const ALLOWED_THEMES = new Set(["light_all", "dark_all"]);
const Y_PNG_PATTERN = /^(\d+)(@2x)?\.png$/;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ theme: string; z: string; x: string; ypng: string }> }
): Promise<Response> {
  const { theme, z, x, ypng } = await ctx.params;

  // パラメータ検証（不正リクエストは 400、無意味な upstream 呼び出しを防ぐ）
  if (!ALLOWED_THEMES.has(theme)) {
    return new Response("invalid theme", { status: 400 });
  }
  if (!/^\d{1,2}$/.test(z) || parseInt(z, 10) > 20) {
    return new Response("invalid zoom", { status: 400 });
  }
  if (!/^\d+$/.test(x)) {
    return new Response("invalid x", { status: 400 });
  }
  if (!Y_PNG_PATTERN.test(ypng)) {
    return new Response("invalid y", { status: 400 });
  }

  // upstream fetch（subdomain は "a" 固定、Cloudflare 側で HTTP/2 多重化済み）
  const upstreamUrl = `https://a.basemaps.cartocdn.com/${theme}/${z}/${x}/${ypng}`;

  try {
    // Cloudflare Workers の fetch は cf オプションで edge cache を制御可能
    // 型は @cloudflare/workers-types で定義されるが、ビルド時に吸収される
    const upstream = await fetch(upstreamUrl, {
      // @ts-expect-error -- Cloudflare-specific fetch options
      cf: {
        cacheTtl: 2592000, // 30 日
        cacheEverything: true,
      },
    });

    if (!upstream.ok) {
      return new Response(null, { status: upstream.status });
    }

    // ブラウザキャッシュも 30 日 immutable（タイル内容は固定）
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
        "X-Tile-Source": "cartocdn-proxy",
      },
    });
  } catch (_err) {
    // upstream 失敗は 502（Leaflet はタイル loading error で fallback する）
    return new Response(null, { status: 502 });
  }
}
