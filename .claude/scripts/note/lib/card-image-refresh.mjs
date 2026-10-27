import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { SITE_ORIGIN } from '../../lib/site-config.cjs';
import { readLinkCardLedger } from '../../ogp/lib/link-card-ledger.mjs';
import { fetchCoverSource } from './cover-storage.mjs';

export function readApprovedCardImageRefresh(file) {
  const rollout = readLinkCardLedger(file);
  return rollout.siteMetadataVerification ? createCardImageRefresh(rollout) : null;
}

const cleanUrl = (value) => { const url = new URL(value); url.search = ''; url.hash = ''; return url.href; };
const escapeAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** An unrelated new image target must not cause an already-published article to be sent again. */
export function imageRefreshAlreadyApplied(prior, revision, body, rewritten) {
  const hash = createHash('sha256').update(body || '').digest('hex');
  const confirmed = (prior?.stage === 'verified' && prior.afterBodySha256 === hash)
    || (prior?.stage === 'published' && prior.expectedBody === body);
  return Boolean(confirmed && (prior.imageRevision === revision || rewritten === body));
}

/** note caches external metadata by destination URL, even when it issues a new embed key. */
export function createCardImageRefresh(rollout, { fetchImage = fetchCoverSource } = {}) {
  const verification = rollout.siteMetadataVerification;
  if (!verification || verification.failed !== 0 || !verification.passed || !/^[a-z0-9-]+$/.test(verification.version || '')) throw Error('Verify deployed site metadata before refreshing note images');
  const targets = new Map();
  const siteImages = new Set();
  const sourceHashes = new Map();
  const registeredImages = new Map();
  const proxyChecks = new Map();
  for (const entry of rollout.entries.filter((entry) => entry.pageUrl)) {
    if (entry.status !== 'published') throw Error('Unpublished image target');
    const magazine = entry.kind === 'magazine';
    const image = magazine ? entry.publication?.ogImage : entry.sitePublication;
    const imageUrl = magazine ? image?.originalUrl : image?.url;
    if (!imageUrl || !/^[a-f0-9]{64}$/.test(image.sha256)) throw Error('Missing verified image');
    const expected = new URL(imageUrl);
    if (!magazine) { expected.searchParams.set('v', verification.version); siteImages.add(cleanUrl(expected.href)); }
    targets.set(cleanUrl(entry.pageUrl), { imageUrl: expected.href, deliveryImageUrl: magazine ? image.url || expected.href : expected.href, sha256: image.sha256, magazine });
    sourceHashes.set(cleanUrl(expected.href), image.sha256);
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
    registeredImages.set(value, imageUrl);
    return { imageUrl, expectedImageUrl: target.imageUrl, verifiedAt: new Date().toISOString() };
  }
  /** On publication note copies external OGP images to its own CDN. Compare those delivered pixels. */
  async function verifyFresh(native, value, registeredImageUrl = null) {
    const target = targetFor(value); if (!target) return null;
    let direct;
    try { direct = assertFresh(native, value); } catch { /* A persisted external card may use note's image proxy. */ }
    const $ = cheerio.load(native.html_for_embed || native.html_for_display || '');
    const imageUrl = direct?.imageUrl || $('.external-article-widget-image').toArray().map((element) => {
      const match = /background-image\s*:\s*url\((['"]?)(.*?)\1\)/i.exec($(element).attr('style') || '');
      return match?.[2];
    }).find((image) => {
      try { const url = new URL(image); return url.protocol === 'https:' && url.hostname === 'assets.st-note.com' && url.pathname.startsWith('/production/uploads/ext/'); }
      catch { return false; }
    });
    const sourceUrl = target.imageUrl || registeredImageUrl || registeredImages.get(value);
    if (!imageUrl || !sourceUrl || !sourceHashes.has(cleanUrl(sourceUrl))) throw Error(`note returned a stale or missing card image: ${value}`);
    const cacheKey = JSON.stringify([imageUrl, sourceUrl, sourceHashes.get(cleanUrl(sourceUrl))]);
    if (!proxyChecks.has(cacheKey)) proxyChecks.set(cacheKey, (async () => {
      const sourceRead = fetchImage(sourceUrl);
      const [source, delivered] = await Promise.all([sourceRead, imageUrl === sourceUrl ? sourceRead : fetchImage(imageUrl)]);
      const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
      if (sha(source) !== sourceHashes.get(cleanUrl(sourceUrl))) throw Error('Verified source image bytes changed');
      // Magazine og:image uses note's resized JPEG derivative of the verified original upload.
      const referenceUrl = target.magazine && target.deliveryImageUrl ? target.deliveryImageUrl : sourceUrl;
      if (cleanUrl(referenceUrl) !== cleanUrl(sourceUrl)) throw Error('Image derivative points to another original');
      const reference = referenceUrl === sourceUrl ? source : referenceUrl === imageUrl ? delivered : await fetchImage(referenceUrl);
      const exact = sha(reference) === sha(delivered);
      let meanDifference = 0;
      if (!exact) {
        const sample = (bytes) => sharp(bytes).flatten({ background: '#ffffff' }).resize(320, 168, { fit: 'fill' }).removeAlpha().raw().toBuffer();
        const [left, right] = await Promise.all([sample(reference), sample(delivered)]);
        if (left.length !== right.length) throw Error('note image sample dimensions differ');
        meanDifference = left.reduce((sum, pixel, index) => sum + Math.abs(pixel - right[index]), 0) / left.length;
        if (meanDifference > 3) throw Error(`note proxy image differs from the adopted image: ${value}`);
      }
      return { imageUrl, expectedImageUrl: sourceUrl, referenceImageUrl: referenceUrl, proxySha256: sha(delivered), exactBytes: exact, meanDifference, verifiedAt: new Date().toISOString() };
    })());
    try { return await proxyChecks.get(cacheKey); }
    catch (error) { proxyChecks.delete(cacheKey); throw error; }
  }
  return { revision, rewriteBody, assertFresh, verifyFresh };
}
