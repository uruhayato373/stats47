/** Private R2 cover objects. S3 credentials or the user's existing Wrangler OAuth session. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { rootCertificates } from 'node:tls';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { COVER_ROOT, coverSha, coverAssetKey } from './cover-assets.mjs';

const BUCKET = 'stats47-private';
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
    await runFile(process.execPath, [path.join(COVER_ROOT, 'node_modules/wrangler/bin/wrangler.js'), 'whoami'], {
      env, cwd: COVER_ROOT, timeout: 30000, maxBuffer: 1e6, windowsHide: true,
    });
  } catch { throw Error('private R2 session renewal failed; run wrangler login'); }
  finally { if (directory) fs.rmSync(directory, { recursive: true, force: true }); }
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
      try { await pending; } catch { throw Error('private R2 session renewal failed; run wrangler login'); }
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
function request(url, { method = 'GET', body, headers = {} } = {}) {
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
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (endpoint && accessKeyId && secretAccessKey) {
    const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
    return {
      async get(key) {
        try {
          const out = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
          const bytes = Buffer.from(await out.Body.transformToByteArray());
          if (bytes.length > LIMIT) throw Error('cover exceeds size limit');
          return bytes;
        } catch (error) {
          if (error.$metadata?.httpStatusCode === 404 || error.name === 'NoSuchKey') return null;
          throw Error('private cover storage unavailable');
        }
      },
      async put(key, bytes) {
        await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes, ContentType: 'image/png', IfNoneMatch: '*' }));
      },
    };
  }
  const config = path.join(process.platform === 'win32' ? path.join(process.env.APPDATA ?? '', 'xdg.config')
    : process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config'), '.wrangler/config/default.toml');
  if (!fs.existsSync(config)) throw Error('private R2 authentication unavailable (S3 or wrangler login required)');
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
    return `/accounts/${account}/r2/buckets/${BUCKET}/objects/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
  return {
    async get(key) {
      const out = await api(await objectPath(key));
      if (out.status === 404) return null;
      if (out.status !== 200) throw Error(`private cover read HTTP ${out.status}`);
      return out.body;
    },
    async put(key, bytes) {
      const out = await api(await objectPath(key), { method: 'PUT', body: bytes,
        headers: { 'content-type': 'image/png', 'if-none-match': '*', 'content-length': String(bytes.length) } });
      if (![200, 201].includes(out.status)) throw Error(`private cover write HTTP ${out.status}`);
    },
  };
}

export async function readStoredCover(revision, store = createCoverStore()) {
  const bytes = await store.get(revision.storage.key);
  if (!bytes || bytes.length !== revision.bytes || coverSha(bytes) !== revision.sha256)
    throw Error('private cover missing or SHA mismatch');
  return bytes;
}

/** Write once, then verify remote bytes before registering a revision. */
export async function storeCoverBytes(articleKey, bytes, store = createCoverStore()) {
  const sha256 = coverSha(bytes);
  const key = coverAssetKey(articleKey, sha256);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(articleKey) || bytes.length > LIMIT) throw Error('invalid cover asset');
  const existing = await store.get(key);
  if (existing && (existing.length !== bytes.length || coverSha(existing) !== sha256)) throw Error('immutable remote cover conflict');
  if (!existing) await store.put(key, bytes);
  const check = await store.get(key);
  if (!check || check.length !== bytes.length || coverSha(check) !== sha256) throw Error('cover remote verification failed');
  return { sha256, storage: { provider: 'r2-private', bucket: BUCKET, key }, bytes: bytes.length };
}
