import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import { SITE_ORIGIN } from '../../lib/site-config.cjs';

const cleanUrl = (value) => { const url = new URL(value); url.search = ''; url.hash = ''; return url.href; };
const escapeAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** note caches external metadata by destination URL, even when it issues a new embed key. */
export function createCardImageRefresh(rollout) {
  const verification = rollout.siteMetadataVerification;
  if (!verification || verification.failed !== 0 || !verification.passed || !/^[a-z0-9-]+$/.test(verification.version || '')) throw Error('Verify deployed site metadata before refreshing note images');
  const targets = new Map();
  const siteImages = new Set();
  for (const entry of rollout.entries.filter((entry) => entry.pageUrl)) {
    if (entry.status !== 'published') throw Error('Unpublished image target');
    const magazine = entry.kind === 'magazine';
    const image = magazine ? entry.publication?.ogImage : entry.sitePublication;
    const imageUrl = magazine ? image?.originalUrl : image?.url;
    if (!imageUrl || !/^[a-f0-9]{64}$/.test(image.sha256)) throw Error('Missing verified image');
    const expected = new URL(imageUrl);
    if (!magazine) { expected.searchParams.set('v', verification.version); siteImages.add(cleanUrl(expected.href)); }
    targets.set(cleanUrl(entry.pageUrl), { imageUrl: expected.href, sha256: image.sha256, magazine });
  }
  const revision = createHash('sha256').update(JSON.stringify(['native-image-refresh-v2', verification.version, [...targets]])).digest('hex');
  function targetFor(value) {
    const url = new URL(value);
    return targets.get(cleanUrl(value)) ?? (url.origin === SITE_ORIGIN ? { imageUrl: null, sha256: revision, magazine: false } : null);
  }
  function versionUrl(value) {
    const target = targetFor(value); if (!target) return value;
    const version = createHash('sha256').update(`${target.imageUrl || ''}:${target.sha256}`).digest('hex').slice(0, 12);
    const url = new URL(value); url.searchParams.set('s47_ogp', version); return url.href;
  }
  function rewriteBody(body) {
    return body.replace(/<figure\b[^>]*>/g, (figure) => {
      const $ = cheerio.load(figure); const element = $('figure');
      if (element.attr('embedded-service') !== 'external-article') return figure;
      const oldUrl = element.attr('data-src'); if (!oldUrl || !targetFor(oldUrl)) return figure;
      const nextUrl = versionUrl(oldUrl);
      return figure.replace(/\b(data-src|data-identifier)=(["'])(.*?)\2/g, (attribute, name, quote) => {
        if (name === 'data-identifier' && element.attr(name) !== oldUrl) return attribute;
        return `${name}=${quote}${escapeAttribute(nextUrl)}${quote}`;
      });
    });
  }
  function assertFresh(native, value) {
    const target = targetFor(value); if (!target) return null;
    const $ = cheerio.load(native.html_for_embed || native.html_for_display || '');
    const urls = $('.external-article-widget-image').toArray().flatMap((element) => {
      const style = $(element).attr('style') || '';
      const match = /background-image\s*:\s*url\((['"]?)(.*?)\1\)/i.exec(style);
      return match ? [match[2]] : [];
    });
    const imageUrl = urls.find((value) => {
      const image = new URL(value);
      if (target.magazine) return cleanUrl(value) === cleanUrl(target.imageUrl);
      return image.searchParams.get('v') === verification.version && (target.imageUrl ? cleanUrl(value) === cleanUrl(target.imageUrl) : siteImages.has(cleanUrl(value)));
    });
    if (!imageUrl) throw Error(`note returned a stale or missing card image: ${value}`);
    return { imageUrl, expectedImageUrl: target.imageUrl, verifiedAt: new Date().toISOString() };
  }
  return { revision, rewriteBody, assertFresh };
}
