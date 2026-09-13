import { createHash } from 'node:crypto';

export const sha256 = (value) =>
  createHash('sha256').update(value).digest('hex');
export const assetPath = (url) =>
  url ? new URL(url).origin + new URL(url).pathname : null;
const preservedFields = [
  'id',
  'key',
  'user_id',
  'status',
  'type',
  'name',
  'body',
  'separator',
  'price',
  'hashtag_notes',
  'belonging_magazine_keys',
  'publish_at',
  'is_pinned',
  'is_profiled',
  'is_r18',
  'disable_comment',
  'is_refund',
  'is_limited',
];

/** Public content hashes only: never persist paid text or send article updates. */
export function contentFingerprint(detail) {
  return Object.fromEntries(
    preservedFields.map((key) => [
      key,
      sha256(JSON.stringify(detail[key] ?? null)),
    ])
  );
}

export function assertPreserved(before, after) {
  const a = contentFingerprint(before),
    b = contentFingerprint(after);
  const changed = preservedFields.filter((key) => a[key] !== b[key]);
  if (changed.length)
    throw Error(`article_content_changed:${changed.join(',')}`);
  return a;
}

export function assertTarget(detail, article) {
  if (
    detail?.key !== article.noteId ||
    detail?.user?.urlname !== 'stats47' ||
    detail?.status !== 'published' ||
    !Number.isSafeInteger(detail?.id) ||
    detail.id <= 0 ||
    article.noteUrl !== `https://note.com/stats47/n/${detail.key}`
  )
    throw Error('target_identity_mismatch');
}

export function assertProduction(article, bytes, dimensions) {
  if (!['create', 'improve'].includes(article.action))
    throw Error('not_a_change');
  if (article.sha256 !== sha256(bytes))
    throw Error('cover_file_changed_after_review');
  if (dimensions.width !== 1280 || dimensions.height !== 670)
    throw Error('cover_dimensions');
  for (const gate of ['textBounds', 'textOverlap', 'visualReview']) {
    if (article.quality?.[gate] !== 'pass') throw Error(`cover_gate:${gate}`);
  }
}

/** Transport contract observed from the actual cover upload UI (2026-09-12). */
export function uploadInBrowser({ noteId, width, height }) {
  return `(async()=>{try{
    if(location.origin!=='https://note.com')throw Error('wrong_origin');
    const bytes=Uint8Array.from(atob(window.__noteCoverBytes),c=>c.charCodeAt(0));
    delete window.__noteCoverBytes;
    const form=new FormData();
    form.append('note_id',${JSON.stringify(String(noteId))});
    form.append('file',new File([bytes],'blob',{type:'image/png'}));
    form.append('width',${JSON.stringify(String(width))});
    form.append('height',${JSON.stringify(String(height))});
    const r=await fetch('https://note.com/api/v1/image_upload/note_eyecatch',{method:'POST',credentials:'include',headers:{'X-Requested-With':'XMLHttpRequest'},body:form});
    window.__noteCoverResult={status:r.status,body:await r.json()};
  }catch(e){window.__noteCoverResult={error:e.message};}})(); true`;
}
