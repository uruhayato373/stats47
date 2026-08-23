/**
 * GSC の「ページ」是正対象に含めない配信資産。
 * これらは HTTP 200 が正しく、Web ページとして index されないことも正しい。
 */
export function isIntentionallyNonIndexableResource(rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    return false;
  }

  if (pathname === "/sitemap.xml" || /^\/sitemap\/\d+\.xml$/.test(pathname)) {
    return true;
  }
  if (pathname === "/robots.txt" || pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/static/")) return true;
  if (/\/(?:opengraph-image|twitter-image)$/.test(pathname)) return true;
  return /\.(?:avif|gif|ico|jpe?g|json|m3u8|m4a|mp3|mp4|png|svg|webm|webp|woff2?)$/i.test(
    pathname,
  );
}

export function readHtmlIndexSignals(html, xRobotsTag = "") {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const metaNoindex = metaTags.some(
    (tag) =>
      /\bname=["']robots["']/i.test(tag) &&
      /\bcontent=["'][^"']*noindex/i.test(tag),
  );
  const title = html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
  return {
    robotsNoindex: metaNoindex || /(?:^|[,\s])noindex(?:$|[,\s])/i.test(xRobotsTag),
    softNotFound: /見つかりません|not\s+found/i.test(title),
  };
}
