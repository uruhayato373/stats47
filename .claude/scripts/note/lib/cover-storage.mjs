/** R2 objects for note covers and article bodies; transport is shared with other Node tools. */
import { coverSha, coverAssetKey, coverInputKey } from './cover-assets.mjs';
import { R2_PRIVATE_BUCKET, R2_PUBLIC_BASE_URL, SITE_ORIGIN } from '../../lib/site-config.cjs';
import { assertGeneratedCoverReview } from './generated-cover.mjs';
import { createR2Store, request } from '../../../../packages/r2-storage/src/lib/clients/private-r2-store.mjs';
export { createR2Store, r2ContentType, wranglerConfigFile, wranglerTokenProvider,
  retryRemoteRead as retryCoverRead } from '../../../../packages/r2-storage/src/lib/clients/private-r2-store.mjs';
const BUCKET = R2_PRIVATE_BUCKET;
const LIMIT = 16 * 1024 * 1024;

/** Fetch only allowed public sources. No credentials are sent to note or its image CDN. */
export async function fetchPublicMediaSource(url) {
  const u=new URL(url);
  if(u.username||u.password||![new URL(R2_PUBLIC_BASE_URL).origin,new URL(SITE_ORIGIN).origin].includes(u.origin))throw Error('public media source not allowed');
  const result=await request(u,{headers:{'user-agent':'stats47-media-inventory/1.0'}});
  if(result.status!==200)throw Object.assign(Error(`public media HTTP ${result.status}`),{status:result.status});
  return result.body;
}

/** Fetch only allowed public sources. No credentials are sent to note or its image CDN. */
export async function fetchCoverSource(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:' || !['assets.st-note.com', 'storage.stats47.jp'].includes(u.hostname))
    throw Error('cover source host not allowed');
  const result = await request(u, { headers: { 'user-agent': 'stats47-cover-assets/1.0' } });
  if (result.status !== 200) throw Error(`cover source HTTP ${result.status}`);
  return result.body;
}

export async function fetchNoteDetail(noteId) {
  if (!/^n[a-f0-9]+$/.test(noteId)) throw Error('invalid note ID');
  const result = await request(`https://note.com/api/v3/notes/${noteId}?coverAssets=${Date.now()}`, {
    headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' },
  });
  if (result.status !== 200) throw Error(`note detail HTTP ${result.status}`);
  const data = JSON.parse(result.body.toString()).data;
  if (!data || data.key !== noteId || data.user?.urlname !== 'stats47') throw Error('note account/article mismatch');
  return data;
}

export function createCoverStore() {
  return createR2Store({ bucket: BUCKET, writeOnce: true });
}

export async function readStoredCover(revision, store = createCoverStore()) {
  const bytes = await store.get(revision.storage.key);
  if (!bytes || bytes.length !== revision.bytes || coverSha(bytes) !== revision.sha256)
    throw Error('private cover missing or SHA mismatch');
  return bytes;
}

/** Write once, then verify remote bytes before registering a revision. */
export async function storeCoverBytes(articleKey, bytes, store = createCoverStore()) {
  return storeImmutableCoverObject(articleKey, bytes, coverAssetKey, store);
}

/** Preserve the exact evidence JSON alongside the image, never only its hash. */
export async function storeCoverInput(articleKey, bytes, store = createCoverStore()) {
  JSON.parse(bytes.toString('utf8'));
  return storeImmutableCoverObject(articleKey, bytes, coverInputKey, store);
}

export async function readStoredCoverInput(revision, store = createCoverStore()) {
  const input = revision.provenance.input;
  if (!input) return null;
  const bytes = await store.get(input.storage.key);
  if (!bytes || bytes.length !== input.bytes || coverSha(bytes) !== input.sha256
      || input.sha256 !== revision.quality?.evidenceSha256) throw Error('private cover input missing or SHA mismatch');
  const evidence = JSON.parse(bytes.toString('utf8'));
  if (revision.provenance.production) {
    const complete = revision.provenance.renderer === 'note-imagegen-cover-v1';
    const background = complete ? evidence.original : evidence.background;
    const sourceSha = complete ? evidence.sourceImageSha256 : evidence.backgroundSha256;
    const articleKey = revision.storage.key.split('/')[2];
    if (!background || background.sha256 !== sourceSha ||
        background.storage?.provider !== 'r2-private' || background.storage.bucket !== BUCKET ||
        background.storage.key !== coverAssetKey(articleKey, background.sha256)) throw Error('private cover background reference mismatch');
    const original = await store.get(background.storage.key);
    if (!original || original.length !== background.bytes || coverSha(original) !== background.sha256) throw Error('private cover background missing or SHA mismatch');
    if (complete) {
      const plan = evidence.production;
      const { planSha256, ...body } = plan ?? {};
      const reference = revision.provenance.production;
      if (evidence.validationMethod !== 'visual' || evidence.renderer !== revision.provenance.renderer ||
          planSha256 !== coverSha(JSON.stringify(body)) || planSha256 !== reference.planSha256 ||
          plan.productionId !== reference.id || plan.policyId !== reference.policyId || plan.policyVersion !== reference.policyVersion ||
          plan.articleKey !== articleKey || plan.account !== 'stats47') throw Error('private cover production evidence mismatch');
      assertGeneratedCoverReview(plan, evidence.visualReview, original);
      if (plan.mapReference) {
        const image = evidence.referenceImage;
        if (!image || image.sha256 !== evidence.referenceImageSha256 || image.sha256 !== evidence.visualReview.referenceSha256 ||
            image.storage?.provider !== 'r2-private' || image.storage.bucket !== BUCKET ||
            image.storage.key !== coverAssetKey(articleKey, image.sha256)) throw Error('private geographic reference mismatch');
        const referenceBytes = await store.get(image.storage.key);
        if (!referenceBytes || referenceBytes.length !== image.bytes || coverSha(referenceBytes) !== image.sha256)
          throw Error('private geographic reference missing or SHA mismatch');
      }
    }
  }
  return bytes;
}

async function storeImmutableCoverObject(articleKey, bytes, keyFor, store) {
  const sha256 = coverSha(bytes);
  const key = keyFor(articleKey, sha256);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(articleKey) || bytes.length > LIMIT) throw Error('invalid cover asset');
  const existing = await store.get(key);
  if (existing && (existing.length !== bytes.length || coverSha(existing) !== sha256)) throw Error('immutable remote cover conflict');
  if (!existing) await store.put(key, bytes);
  const check = await store.get(key);
  if (!check || check.length !== bytes.length || coverSha(check) !== sha256) throw Error('cover remote verification failed');
  return { sha256, storage: { provider: 'r2-private', bucket: BUCKET, key }, bytes: bytes.length };
}
