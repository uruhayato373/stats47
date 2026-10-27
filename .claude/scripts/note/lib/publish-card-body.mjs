import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import * as cheerio from 'cheerio';
import { noteRequest } from './native-cards.mjs';

export const bodyHash = (body) => createHash('sha256').update(body || '').digest('hex');
// GET returns the generated heading array; native saves accept an enabled/disabled boolean.
export const indexEnabled = (note) => Array.isArray(note.index) ? note.index.length > 0 : Boolean(note.index);
export function preservePublishedIndex(payload, before) {
  if ('index' in payload && typeof payload.index !== 'boolean') throw Error('editor index flag is not boolean');
  return { ...payload, index: indexEnabled(before) };
}
export function draftSavePayload(draft) {
  return { body: draft.body, name: draft.name, body_length: cheerio.load(draft.body)('body').text().length,
    index: indexEnabled(draft), ...(draft.separator ? { separator: draft.separator } : {}) };
}
const tags = (note) => (note.hashtag_notes || []).map((entry) => entry.hashtag?.name).filter(Boolean).sort();

/** Preserve the published boundary using the actual anonymous preview, not a guessed HTML split. */
export function splitPublishedBody(before, publicBefore, body) {
  if (Number(before.price || 0) === 0) return { free_body: body, pay_body: '' };
  if (!publicBefore.body || !before.body.startsWith(publicBefore.body)) throw Error('paid public prefix mismatch');
  const boundary = before.separator;
  if (!boundary) throw Error('paid boundary missing');
  const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opening = new RegExp(`<([a-z][a-z0-9-]*)\\b[^>]*(?:id|name)="${escaped}"[^>]*>`, 'i').exec(body);
  if (!opening) throw Error('paid boundary element missing');
  const tag = opening[1].toLowerCase();
  if (!['p', 'h1', 'h2', 'h3', 'h4', 'hr', 'figure'].includes(tag)) throw Error('unsupported paid boundary element');
  const end = tag === 'hr' ? opening.index + opening[0].length : body.indexOf(`</${tag}>`, opening.index) + tag.length + 3;
  if (end < opening.index + opening[0].length) throw Error('paid boundary closing tag missing');
  return { free_body: body.slice(0, end), pay_body: body.slice(end) };
}

export function assertPublishedMetadata(before, after) {
  for (const field of ['name', 'price', 'separator', 'status', 'slug', 'eyecatch', 'disable_comment', 'is_limited']) {
    if (JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null)) throw Error(`published ${field} changed`);
  }
  if (JSON.stringify(before.index ?? null) !== JSON.stringify(after.index ?? null)) {
    // note derives the index from headings. Appending an approved footer can append one index entry.
    const previous = before.index;
    const current = after.index;
    const oldBody = cheerio.load(before.body || '');
    const newBody = cheerio.load(after.body || '');
    const appendedOnly = Array.isArray(previous) && Array.isArray(current) && current.length > previous.length
      && JSON.stringify(current.slice(0, previous.length)) === JSON.stringify(previous)
      && current.slice(previous.length).every((entry) => {
        if (!['h2', 'h3'].includes(entry.level) || !/^[a-zA-Z0-9-]+$/.test(entry.name)) return false;
        const selector = `${entry.level}[name="${entry.name}"],${entry.level}[id="${entry.name}"]`;
        return oldBody(selector).length === 0 && newBody(selector).length === 1 && newBody(selector).text() === entry.body;
      });
    if (!appendedOnly) throw Error('published index changed');
  }
  if (JSON.stringify(tags(before)) !== JSON.stringify(tags(after))) throw Error('published hashtags changed');
  if (before.user?.urlname !== 'stats47' || after.user?.urlname !== 'stats47') throw Error('note account mismatch');
}

/**
 * Use the editor's complete per-article payload; only the approved published body is patched.
 * options.name: an approved new title (a full rewrite renames the article). Price, tags and boundary stay guarded.
 */
export async function publishCardBody(context, apiPage, before, publicBefore, body, backupPath, onStage = () => {}, options = {}) {
  if (before.user?.urlname !== 'stats47' || before.status !== 'published') throw Error('owned published article required');
  const key = before.key;
  const draft = before.has_draft ? await noteRequest(apiPage, `/api/v3/notes/${key}?draft=true&draft_reedit=false`) : null;
  mkdirSync(dirname(backupPath), { recursive: true });
  writeFileSync(backupPath, JSON.stringify({ before, publicBefore, draft, expectedBody: body }), { flag: 'wx' });
  const split = splitPublishedBody(before, publicBefore, body);
  const page = await context.newPage();
  let sent = false;
  let visibilityNudge = null;
  try {
    await page.goto(`https://editor.note.com/notes/${key}/edit?draft_reedit=true`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[contenteditable="true"]').first().waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: '公開に進む' }).click();
    await page.locator('[placeholder="ハッシュタグを追加する"]').waitFor({ timeout: 15000 });
    if (Number(before.price || 0) > 0) {
      await page.getByRole('button', { name: '有料エリア設定', exact: true }).click();
      await page.locator('#paywall-line[aria-pressed="true"]').waitFor({ timeout: 15000 });
    } else if (before.separator) {
      // Free notes with an existing preview boundary need a settings change before Update becomes available.
      // The outgoing request restores the existing visibility and boundary instead of publishing that nudge.
      const visibility = page.getByRole('switch', { name: 'クリエイターページに表示' });
      const wasVisible = await visibility.getAttribute('aria-checked') === 'true';
      await visibility.click();
      visibilityNudge = { expectedExclude: wasVisible, restoreExclude: !wasVisible };
      await page.getByRole('button', { name: '試し読みエリアを設定', exact: true }).click();
      await page.locator('#paywall-line').waitFor({ timeout: 15000 });
    }
    let guardError;
    await page.route('**/api/v1/text_notes/**', async (route) => {
      if (route.request().method() !== 'PUT') return route.continue();
      try {
        if (sent) throw Error('duplicate publish request');
        const payload = preservePublishedIndex(route.request().postDataJSON(), before);
        if (visibilityNudge) {
          if (payload.exclude_from_creator_top !== visibilityNudge.expectedExclude) throw Error('visibility nudge mismatch');
          payload.exclude_from_creator_top = visibilityNudge.restoreExclude;
          payload.separator = before.separator;
        }
        if (Number(payload.price || 0) !== Number(before.price || 0) || payload.name !== before.name) throw Error('editor name/price differs from publication');
        if (JSON.stringify([...payload.hashtags].sort()) !== JSON.stringify(tags(before))) throw Error('editor hashtags differ from publication');
        if ((payload.separator || null) !== (before.separator || null)) throw Error('editor boundary differs from publication');
        Object.assign(payload, split);
        if (options.name) payload.name = options.name;
        sent = true;
        await onStage('sending');
        await route.continue({ postData: JSON.stringify(payload) });
      } catch (error) {
        guardError = error;
        await route.fulfill({ status: 409, contentType: 'application/json', body: '{"error":"card repair guard"}' });
      }
    });
    const [result] = await Promise.all([
      page.waitForResponse((item) => item.request().method() === 'PUT' && item.url().includes(`/api/v1/text_notes/${before.id}`), { timeout: 30000 }),
      page.getByRole('button', { name: '更新する', exact: true }).click(),
    ]);
    if (guardError) throw guardError;
    if (!result.ok()) throw Error(`publish HTTP ${result.status()}`);
  } finally { await page.close(); }
  const after = await noteRequest(apiPage, `/api/v3/notes/${key}?cardVerify=${Date.now()}`);
  if (after.body !== body) throw Error('published body differs from approved card repair');
  let metadataError;
  try { assertPublishedMetadata(options.name ? { ...before, name: options.name } : before, after); } catch (error) { metadataError = error; }
  if (draft) {
    await noteRequest(apiPage, `/api/v1/text_notes/draft_save?id=${before.id}&is_temp_saved=true`, { method: 'POST', body: draftSavePayload(draft) });
    const restored = await noteRequest(apiPage, `/api/v3/notes/${key}?draft=true&draft_reedit=false`);
    if (restored.body !== draft.body || restored.name !== draft.name || restored.separator !== draft.separator || JSON.stringify(restored.index ?? null) !== JSON.stringify(draft.index ?? null)) throw Error('pre-existing draft restoration mismatch');
  } else if (after.has_draft) throw Error('unexpected draft after publication');
  if (metadataError) { await onStage('published-metadata-mismatch'); throw metadataError; }
  await onStage('published');
  return { after, preservedDraft: Boolean(draft), beforeBodySha256: bodyHash(before.body), afterBodySha256: bodyHash(after.body) };
}
