/** R2 objects for note covers and article bodies. S3 credentials or the user's existing Wrangler OAuth session. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { rootCertificates } from 'node:tls';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { COVER_ROOT, coverSha, coverAssetKey, coverInputKey } from './cover-assets.mjs';
import { R2_PRIVATE_BUCKET, R2_PUBLIC_BASE_URL, SITE_ORIGIN } from '../../lib/site-config.cjs';
import { assertGeneratedCoverReview } from './generated-cover.mjs';

const BUCKET = R2_PRIVATE_BUCKET;
const LIMIT = 16 * 1024 * 1024;
const pendingRefreshes = new Map();
const runFile = promisify(execFile);

async function renewWranglerSession() {
  const authorities = windowsTrustedAuthorities();
  const directory = authorities ? fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-note-r2-ca-')) : null;
  try {
    const env = { ...process.env, CI: 'true', NODE_TLS_REJECT_UNAUTHORIZED: '1' };
    if (directory) {
      const certificates = path.join(directory, 'roots.pem');
      fs.writeFileSync(certificates, authorities.join('\n'));
      env.NODE_EXTRA_CA_CERTS = certificates;
    }
    // wrangler is a dependency of apps/web; npm may install it there instead of hoisting it to the root.
    const wrangler = ['node_modules', 'apps/web/node_modules']
      .map((dir) => path.join(COVER_ROOT, dir, 'wrangler/bin/wrangler.js'))
      .find((file) => fs.existsSync(file));
    if (!wrangler) throw Object.assign(Error('private R2 session renewal failed; wrangler is not installed (run npm ci)'), { safe: true });
    await runFile(process.execPath, [wrangler, 'whoami'], {
      env, cwd: COVER_ROOT, timeout: 30000, maxBuffer: 1e6, windowsHide: true,
    });
  } catch (error) {
    // Only this fixed version notice leaves the process; wrangler output may contain credentials.
    const required = /requires at least Node\.js (v\d+)/.exec(String(error?.stderr ?? ''))?.[1];
    if (required) throw Object.assign(Error(`private R2 session renewal failed; wrangler requires Node.js ${required}+ (admin runs ${process.version})`), { safe: true });
    throw Error('private R2 session renewal failed; run wrangler login');
  }
  finally { if (directory) fs.rmSync(directory, { recursive: true, force: true }); }
}

/**
 * Wrangler's own login file location (getGlobalConfigPath + xdg-app-paths in wrangler):
 * a ~/.wrangler directory in the home folder wins, otherwise the per-OS config directory.
 */
export function wranglerConfigFile({ platform = process.platform, env = process.env, home = os.homedir(),
  isDirectory = (dir) => fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory() ?? false } = {}) {
  const homeDir = path.join(home, '.wrangler');
  const base = isDirectory(homeDir) ? homeDir : path.join(env.XDG_CONFIG_HOME
    ?? (platform === 'darwin' ? path.join(home, 'Library/Preferences')
      : platform === 'win32' ? path.join(env.APPDATA ?? path.join(home, 'AppData/Roaming'), 'xdg.config')
      : path.join(home, '.config')), '.wrangler');
  return path.join(base, 'config/default.toml');
}

/** Renew only the existing session, non-interactively. Concurrent image reads share one renewal. */
export function wranglerTokenProvider(config, renew = renewWranglerSession) {
  function credential() {
    const auth = fs.readFileSync(config, 'utf8');
    const token = /^(?:oauth_token|api_token)\s*=\s*"([^"]+)"/m.exec(auth)?.[1];
    if (!token) throw Error('private R2 authentication unavailable');
    const oauth = /^oauth_token\s*=/m.test(auth);
    const expires = Date.parse(/^expiration_time\s*=\s*"([^"]+)"/m.exec(auth)?.[1] ?? '');
    return { token, expired: oauth && (!Number.isFinite(expires) || expires <= Date.now() + 30000) };
  }
  return async function token() {
    const current = credential();
    if (current.expired) {
      let pending = pendingRefreshes.get(config);
      if (!pending) {
        pending = Promise.resolve().then(renew).finally(() => pendingRefreshes.delete(config));
        pendingRefreshes.set(config, pending);
      }
      try { await pending; } catch (error) {
        throw Error(error?.safe ? error.message : 'private R2 session renewal failed; run wrangler login');
      }
      const refreshed = credential();
      if (refreshed.expired) throw Error('private R2 session expired; run wrangler login');
      return refreshed.token;
    }
    return current.token;
  };
}
let trustedAuthorities;
function windowsTrustedAuthorities() {
  if (process.platform !== 'win32') return undefined;
  if (trustedAuthorities) return trustedAuthorities;
  // Match the OS/browser's trusted roots, including installed corporate TLS inspection CAs.
  // Read only public certificate bytes; never private keys. No verification bypass is used.
  let publicRoots;
  try {
    publicRoots = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      'foreach ($coverLocation in "LocalMachine","CurrentUser") { $coverCertStore = [Security.Cryptography.X509Certificates.X509Store]::new("Root",$coverLocation); try { $coverCertStore.Open("ReadOnly"); foreach ($coverCertificate in $coverCertStore.Certificates) { "-----BEGIN CERTIFICATE-----"; [Convert]::ToBase64String($coverCertificate.RawData); "-----END CERTIFICATE-----" } } finally { $coverCertStore.Close() } }'],
      { encoding: 'utf8', timeout: 10000, maxBuffer: 4e6, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch { throw Error('Windows trusted root certificates unavailable'); }
  const extraFile = process.env.NODE_EXTRA_CA_CERTS;
  trustedAuthorities = [...rootCertificates, publicRoots, ...(extraFile && fs.existsSync(extraFile) ? [fs.readFileSync(extraFile, 'utf8')] : [])];
  return trustedAuthorities;
}
/** Retry transient reads only. Never repeat an image POST or private object write. */
export async function retryCoverRead(read, method = 'GET', wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await read();
      if (method !== 'GET' || ![502, 503, 504].includes(result.status) || attempt === 2) return result;
    } catch (error) {
      if (method !== 'GET' || attempt === 2 ||
        (!['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNABORTED'].includes(error.code)
          && error.message !== 'cover remote request timed out')) throw error;
    }
    await wait(300 * (attempt + 1));
  }
}
function request(url, options = {}) {
  return retryCoverRead(() => requestOnce(url, options), options.method ?? 'GET');
}
function requestOnce(url, { method = 'GET', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
    const req = https.request(url, { method, headers, rejectUnauthorized: true, ca: windowsTrustedAuthorities(), agent: proxy ? new HttpsProxyAgent(proxy) : undefined }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > LIMIT) req.destroy(Error('cover response exceeds size limit'));
        else chunks.push(chunk);
      });
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.setTimeout(30_000, () => req.destroy(Error('cover remote request timed out')));
    req.on('error', reject);
    req.end(body);
  });
}

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

const CONTENT_TYPES = {
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf', '.html': 'text/html; charset=utf-8',
};
export const r2ContentType = (key) => CONTENT_TYPES[path.extname(key).toLowerCase()] ?? 'application/octet-stream';

/**
 * One R2 bucket. writeOnce refuses to replace an existing object (covers and archives are immutable).
 * Listing needs S3 credentials; the Wrangler fallback can read, write and delete single objects only.
 */
export function createR2Store({ bucket, writeOnce = false }) {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (endpoint && accessKeyId && secretAccessKey) {
    const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
    return {
      bucket,
      async get(key) {
        try {
          const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          const bytes = Buffer.from(await out.Body.transformToByteArray());
          if (bytes.length > LIMIT) throw Error('R2 object exceeds size limit');
          return bytes;
        } catch (error) {
          if (error.$metadata?.httpStatusCode === 404 || error.name === 'NoSuchKey') return null;
          throw Error(`R2 read unavailable (${bucket})`);
        }
      },
      async put(key, bytes) {
        await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes,
          ContentType: r2ContentType(key), ...(writeOnce ? { IfNoneMatch: '*' } : {}) }));
      },
      async delete(key) {
        if (writeOnce) throw Error('write-once R2 store refuses deletes');
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      },
      async list(prefix) {
        const objects = [];
        let token;
        do {
          const out = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
          for (const o of out.Contents ?? []) objects.push({ key: o.Key, size: o.Size, lastModified: o.LastModified?.toISOString() ?? null });
          token = out.NextContinuationToken;
        } while (token);
        return objects;
      },
    };
  }
  const config = wranglerConfigFile();
  if (!fs.existsSync(config)) throw Error('R2 authentication unavailable (S3 or wrangler login required)');
  const token = wranglerTokenProvider(config);
  // Authorization is confined to the Cloudflare API; never persisted in the ledger or returned to the UI.
  let account = process.env.CLOUDFLARE_ACCOUNT_ID;
  async function api(resource, options = {}) {
    return request(`https://api.cloudflare.com/client/v4${resource}`, {
      ...options, headers: { ...options.headers, authorization: `Bearer ${await token()}` },
    });
  }
  async function objectPath(key) {
    if (!account) {
      const result = await api('/accounts');
      if (result.status !== 200) throw Error('Wrangler session expired or account access unavailable; run wrangler whoami');
      const accounts = JSON.parse(result.body.toString()).result;
      if (!Array.isArray(accounts) || accounts.length !== 1) throw Error('CLOUDFLARE_ACCOUNT_ID is required for multiple accounts');
      account = accounts[0].id;
    }
    return `/accounts/${account}/r2/buckets/${bucket}/objects/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
  return {
    bucket,
    async get(key) {
      const out = await api(await objectPath(key));
      if (out.status === 404) return null;
      if (out.status !== 200) throw Error(`R2 read HTTP ${out.status} (${bucket})`);
      return out.body;
    },
    async put(key, bytes) {
      const out = await api(await objectPath(key), { method: 'PUT', body: bytes,
        headers: { 'content-type': r2ContentType(key), ...(writeOnce ? { 'if-none-match': '*' } : {}),
          'content-length': String(bytes.length) } });
      if (![200, 201].includes(out.status)) throw Error(`R2 write HTTP ${out.status} (${bucket})`);
    },
    async delete(key) {
      if (writeOnce) throw Error('write-once R2 store refuses deletes');
      const out = await api(await objectPath(key), { method: 'DELETE' });
      if (![200, 204, 404].includes(out.status)) throw Error(`R2 delete HTTP ${out.status} (${bucket})`);
    },
    async list() {
      throw Error('R2 listing requires S3 credentials (R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)');
    },
  };
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
