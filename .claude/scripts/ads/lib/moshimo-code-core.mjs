/**
 * もしもアフィリエイトの広告原稿 HTML を AffiliateAd の各フィールドへ変換する。
 * クリック URL と impression pixel は同じ4識別子を持つ必要がある。
 */
import { isCanonicalSize } from './a8-code-core.mjs';

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function attr(tag, name) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  if (quoted) return decodeHtml(quoted[1]);
  const bare = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i'));
  return bare ? decodeHtml(bare[1]) : null;
}

function absoluteHttps(value) {
  if (!value) return null;
  const normalized = value.startsWith('//') ? `https:${value}` : value;
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function imageTags(html) {
  return html.match(/<img\b[^>]*>/gi) ?? [];
}

function trackingIds(url) {
  return Object.fromEntries(
    ['a_id', 'p_id', 'pc_id', 'pl_id'].map((key) => [
      key,
      url.searchParams.get(key),
    ])
  );
}

function completeIds(ids) {
  return Object.values(ids).every((value) => /^\d+$/.test(value ?? ''));
}

function sameIds(left, right) {
  return Object.keys(left).every((key) => left[key] === right[key]);
}

export function parseMoshimoCode(html, { expectedProgramId = null } = {}) {
  if (typeof html !== 'string' || html.trim() === '')
    return { ok: false, error: 'empty-html' };

  const anchor = html.match(/<a\b[^>]*>/i)?.[0] ?? null;
  const click = absoluteHttps(anchor ? attr(anchor, 'href') : null);
  if (
    !click ||
    click.hostname !== 'af.moshimo.com' ||
    click.pathname !== '/af/c/click'
  ) {
    return { ok: false, error: 'no-moshimo-click-url' };
  }

  const ids = trackingIds(click);
  if (!completeIds(ids))
    return { ok: false, error: 'click-identifiers-missing' };
  if (expectedProgramId !== null && ids.p_id !== String(expectedProgramId)) {
    return { ok: false, error: `program-id-mismatch:${ids.p_id ?? 'missing'}` };
  }

  const rel = String(attr(anchor, 'rel') ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!rel.includes('nofollow'))
    return { ok: false, error: 'nofollow-missing' };
  const referrerPolicy = attr(anchor, 'referrerpolicy');
  if (referrerPolicy !== 'no-referrer-when-downgrade')
    return { ok: false, error: 'referrerpolicy-missing' };
  if (!/\battributionsrc(?:\s*=|[\s>])/i.test(anchor))
    return { ok: false, error: 'attributionsrc-missing' };

  let banner = null;
  let pixel = null;
  for (const tag of imageTags(html)) {
    const url = absoluteHttps(attr(tag, 'src'));
    if (!url) continue;
    if (
      url.hostname === 'image.moshimo.com' &&
      url.pathname.startsWith('/af-img/')
    ) {
      banner = {
        url,
        width: Number(attr(tag, 'width')),
        height: Number(attr(tag, 'height')),
      };
    } else if (
      url.hostname === 'i.moshimo.com' &&
      url.pathname === '/af/i/impression'
    ) {
      pixel = url;
    }
  }
  if (!banner) return { ok: false, error: 'no-moshimo-banner' };
  if (
    !Number.isInteger(banner.width) ||
    !Number.isInteger(banner.height) ||
    banner.width < 2 ||
    banner.height < 2
  ) {
    return { ok: false, error: 'banner-size-missing' };
  }
  if (!isCanonicalSize(banner.width, banner.height)) {
    return {
      ok: false,
      error: `non-canonical-size:${banner.width}x${banner.height}`,
      fields: {
        htmlContent: click.href,
        imageUrl: banner.url.href,
        trackingPixelUrl: pixel?.href ?? null,
        width: banner.width,
        height: banner.height,
        adType: 'banner',
      },
    };
  }
  if (!pixel) return { ok: false, error: 'no-moshimo-impression-pixel' };
  const pixelIds = trackingIds(pixel);
  if (!completeIds(pixelIds) || !sameIds(ids, pixelIds))
    return { ok: false, error: 'tracking-identifiers-mismatch' };

  return {
    ok: true,
    programId: ids.p_id,
    creativeId: ids.pl_id,
    linkAttributes: {
      rel: 'nofollow noopener sponsored',
      referrerPolicy,
      attributionSrc: true,
    },
    fields: {
      htmlContent: click.href,
      imageUrl: banner.url.href,
      trackingPixelUrl: pixel.href,
      width: banner.width,
      height: banner.height,
      adType: 'banner',
    },
  };
}
