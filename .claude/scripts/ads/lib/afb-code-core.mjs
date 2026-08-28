/**
 * afb-code-core.mjs — afb 広告原稿 HTML の決定的な抽出・検証。
 *
 * afb の発行コードは、クリック URL (`t.afi-b.com/visit.php`) と
 * 1x1 計測ピクセル (`t.afi-b.com/lead/...`) を一組で持つ。片方だけを
 * 保存すると計測不能になるため、両方を必須にする。
 */
import { isCanonicalSize } from "./a8-code-core.mjs";

function decodeHtmlAttribute(value) {
  return String(value ?? "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function attr(tag, name) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (quoted) return decodeHtmlAttribute(quoted[1]);
  const bare = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return bare ? decodeHtmlAttribute(bare[1]) : null;
}

function imgTags(html) {
  return html.match(/<img\b[^>]*>/gi) ?? [];
}

function isAfbTrackingHost(hostname) {
  return hostname === "t.afi-b.com" || hostname === "track.affiliate-b.com";
}

function validUrl(value, predicate) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && predicate(url) ? url : null;
  } catch {
    return null;
  }
}

export function extractAfbHref(html) {
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const value = decodeHtmlAttribute(match[1]);
    const url = validUrl(value, (u) => isAfbTrackingHost(u.hostname) && u.pathname === "/visit.php");
    if (url) return url.href;
  }
  const raw = html.match(/https:\/\/(?:t\.afi-b\.com|track\.affiliate-b\.com)\/visit\.php\?[^\s"'<>]+/i);
  if (!raw) return null;
  const value = decodeHtmlAttribute(raw[0]);
  return validUrl(value, (u) => isAfbTrackingHost(u.hostname) && u.pathname === "/visit.php")?.href ?? null;
}

export function extractAfbPixelUrl(html) {
  for (const tag of imgTags(html)) {
    const src = attr(tag, "src");
    if (!src) continue;
    const url = validUrl(src, (u) => isAfbTrackingHost(u.hostname) && u.pathname.startsWith("/lead/"));
    if (url) return url.href;
  }
  return null;
}

function bannerTag(html) {
  for (const tag of imgTags(html)) {
    const src = attr(tag, "src");
    if (!src) continue;
    const isPixel = validUrl(src, (u) => isAfbTrackingHost(u.hostname) && u.pathname.startsWith("/lead/"));
    if (isPixel) continue;
    const width = Number(attr(tag, "width"));
    const height = Number(attr(tag, "height"));
    if (Number.isFinite(width) && Number.isFinite(height) && width > 1 && height > 1) {
      return { src, width, height };
    }
  }
  return null;
}

/** @returns {{ok:boolean,error?:string,fields?:object,trackingKey?:string|null}} */
export function parseAfbCode(html) {
  if (typeof html !== "string" || html.trim() === "") return { ok: false, error: "empty-html" };

  const href = extractAfbHref(html);
  if (!href) return { ok: false, error: "no-afb-click-url" };

  const pixel = extractAfbPixelUrl(html);
  if (!pixel) return { ok: false, error: "no-afb-lead-pixel" };

  const banner = bannerTag(html);
  const adType = banner ? "banner" : "text";
  if (banner && !isCanonicalSize(banner.width, banner.height)) {
    return {
      ok: false,
      error: `non-canonical-size:${banner.width}x${banner.height}`,
      fields: {
        htmlContent: href,
        imageUrl: banner.src,
        trackingPixelUrl: pixel,
        width: banner.width,
        height: banner.height,
        adType,
      },
    };
  }

  const click = new URL(href);
  return {
    ok: true,
    trackingKey: click.searchParams.get("a"),
    fields: {
      htmlContent: href,
      imageUrl: banner?.src ?? null,
      trackingPixelUrl: pixel,
      width: banner?.width ?? null,
      height: banner?.height ?? null,
      adType,
    },
  };
}
