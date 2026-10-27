import * as cheerio from 'cheerio';

/** Read/write only note's own API, using the authenticated browser's normal TLS and cookies. */
export async function noteRequest(page, pathname, { method = 'GET', body, form } = {}) {
  if (!pathname.startsWith('/api/')) throw Error('note API path required');
  return page.evaluate(async ({ pathname, method, body, form }) => {
    const headers = { 'X-Requested-With': 'XMLHttpRequest' };
    const token = document.cookie.split('; ').find((entry) => entry.startsWith('XSRF-TOKEN='))?.slice(11);
    if (token) headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    let data;
    if (form) {
      data = new FormData();
      for (const [key, value] of Object.entries(form)) data.append(key, String(value));
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      data = JSON.stringify(body);
    }
    const response = await fetch(`https://note.com${pathname}`, { method, headers, body: data, credentials: 'include' });
    const result = await response.json();
    if (!response.ok) throw Error(`note API HTTP ${response.status}: ${pathname.split('?')[0]}${typeof result.error?.message === 'string' ? ` (${result.error.message.slice(0, 160)})` : ''}`);
    if (result.error) throw Error(`note API rejected ${pathname.split('?')[0]}`);
    return result.data;
  }, { pathname, method, body, form });
}

export function cardEntries(body) {
  const $ = cheerio.load(body || '');
  return $('figure[embedded-service]').toArray().map((element) => ({
    key: $(element).attr('embedded-content-key') || '',
    url: $(element).attr('data-src') || '',
    service: $(element).attr('embedded-service') || '',
  }));
}

export function unregisteredCards(body, embeddedContents) {
  if (!Array.isArray(embeddedContents)) throw Error('embed registry unavailable');
  const registered = new Map(embeddedContents.filter((entry) => entry.html_for_embed || entry.html_for_display).map((entry) => [entry.key, entry]));
  return cardEntries(body).filter((card) => {
    const native = registered.get(card.key);
    return !native || (native.url && new URL(native.url).href !== new URL(card.url).href) || (native.service && native.service !== card.service);
  });
}

export function assertRegisteredCards(body, embeddedContents) {
  const missing = unregisteredCards(body, embeddedContents);
  if (missing.length) throw Error(`Unregistered note cards: ${missing.map((card) => card.key).join(', ')}`);
}

/** Change only registry references; retain authored HTML, element IDs, URLs and paid boundaries byte for byte. */
export function replaceCardKeys(body, replacements) {
  return body.replace(/<figure\b[^>]*>/g, (figure) => figure.replace(/embedded-content-key="([^"]*)"/, (attribute, key) => {
    const replacement = replacements.get(key);
    if (!replacement) return attribute;
    if (!/^emb[a-zA-Z0-9]+$/.test(replacement)) throw Error('invalid native embed key');
    return `embedded-content-key="${replacement}"`;
  }));
}

/** These are the native editor requests observed on 2026-10-26, not invented HTML embed IDs. */
export async function registerNativeCard(page, noteKey, card) {
  if (!/^n[a-f0-9]{12}$/.test(noteKey)) throw Error('invalid note key');
  if (new URL(card.url).protocol !== 'https:') throw Error('card URL must be HTTPS');
  let native;
  if (card.service === 'external-article') {
    const params = new URLSearchParams({ url: card.url, service: card.service, embeddable_key: noteKey, embeddable_type: 'Note' });
    for (let attempt = 0; attempt < 2; attempt++) {
      try { native = await noteRequest(page, `/api/v2/embed_by_external_api?${params}`); break; }
      catch (error) {
        // The native GET can time out while note fetches public OGP. Never retry a POST or an access/rate denial.
        if (attempt || !/HTTP 400/.test(error.message)) throw error;
        await page.waitForTimeout(1500);
      }
    }
  } else if (card.service === 'note') {
    const targetKey = new URL(card.url).pathname.match(/\/n\/(n[a-f0-9]{12})\/?$/)?.[1];
    if (!targetKey || new URL(card.url).hostname !== 'note.com') throw Error('invalid note card URL');
    const preview = await page.context().newPage();
    let height;
    try {
      await preview.setViewportSize({ width: 494, height: 500 });
      await preview.goto(`https://note.com/embed/notes/${targetKey}`, { waitUntil: 'networkidle', timeout: 30000 });
      height = await preview.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height) + 10);
      if (height < 80 || height > 1000) throw Error('invalid note embed height');
    } finally { await preview.close(); }
    const result = await noteRequest(page, '/api/v1/embed', { method: 'POST', form: {
      url: card.url, height, embeddable_type: 'Note', embeddable_key: noteKey,
    } });
    native = result.embedded_content;
  } else {
    throw Error(`Unsupported unregistered card service: ${card.service}`);
  }
  if (!/^emb[a-zA-Z0-9]+$/.test(native?.key || '') || !native.html_for_embed?.trim()) {
    throw Error(`Native card registration returned no display content: ${card.url}`);
  }
  return native;
}

export async function registerMissingCards(page, noteKey, body, embeddedContents, onRegistered = () => {}, validateNative = () => null) {
  const missing = unregisteredCards(body, embeddedContents);
  const replacements = new Map();
  for (const card of missing) {
    if (replacements.has(card.key)) continue;
    let native;
    try { native = await registerNativeCard(page, noteKey, card); }
    catch (error) { throw Error(`${card.url}: ${error.message}`); }
    const imageVerification = await validateNative(native, card);
    replacements.set(card.key, native.key);
    await onRegistered({ oldKey: card.key, key: native.key, url: card.url, service: card.service, ...(imageVerification ? { imageVerification } : {}) });
  }
  return { body: replaceCardKeys(body, replacements), registered: [...replacements.values()], missing };
}

/** A successful update must also work in an unauthenticated reader's browser. */
export async function verifyPublicCards(context, noteUrl, keys) {
  if (!keys.length) return;
  const page = await context.newPage();
  try {
    await page.goto(noteUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    for (const key of new Set(keys)) {
      if (!/^emb[a-zA-Z0-9]+$/.test(key)) throw Error('invalid card key');
      const figure = page.locator(`figure[embedded-content-key="${key}"]`);
      await figure.waitFor({ state: 'attached', timeout: 15000 });
      await figure.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await page.waitForFunction((key) => {
        const element = document.querySelector(`figure[embedded-content-key="${key}"]`);
        return element && element.getBoundingClientRect().height > 0
          && Boolean(element.textContent?.trim() || element.querySelector('iframe[src],img[src]'));
      }, key, { timeout: 10000 });
      // note cards are lazy-loaded iframes. A nonzero outer box can still contain an unloaded, blank frame.
      const noteFrames = figure.locator('iframe.note-embed');
      for (let index = 0; index < await noteFrames.count(); index++) {
        await page.waitForFunction(({ key, index }) => document.querySelector(`figure[embedded-content-key="${key}"]`)
          ?.querySelectorAll('iframe.note-embed')[index]?.getAttribute('data-ready') === 'true', { key, index }, { timeout: 15000 });
        const frame = await (await noteFrames.nth(index).elementHandle()).contentFrame();
        if (!frame) throw Error(`note card frame unavailable: ${key}`);
        await frame.waitForFunction(() => Boolean(document.body?.innerText.trim()), undefined, { timeout: 10000 });
      }
    }
  } finally { await page.close(); }
}
