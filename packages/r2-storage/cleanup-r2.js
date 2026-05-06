const { ProxyAgent, fetch: undiciFetch } = require('undici');
require('dotenv').config({ path: '.env.local' });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BUCKET = 'stats47';
const CONCURRENCY = 20;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('Missing: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;
const headers = { Authorization: `Bearer ${API_TOKEN}` };

async function collectKeys(prefix, filter) {
  const keys = [];
  let cursor;
  do {
    const params = new URLSearchParams({ limit: '1000' });
    if (prefix) params.set('prefix', prefix);
    if (cursor) params.set('cursor', cursor);
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects?${params}`;
    const res = await undiciFetch(url, { dispatcher, headers });
    if (!res.ok) throw new Error(`API エラー: ${res.status}`);
    const json = await res.json();
    for (const obj of json.result || []) {
      if (obj.key && filter(obj.key)) keys.push(obj.key);
    }
    cursor = json.result_info?.is_truncated ? json.result_info.cursor : undefined;
  } while (cursor);
  return keys;
}

async function deleteKeys(keys, label) {
  if (keys.length === 0) { console.log(label + ': 0 files'); return; }
  console.log(label + ': ' + keys.length + ' files to delete...');
  let deleted = 0;
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const chunk = keys.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (key) => {
      const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;
      const res = await undiciFetch(url, { method: 'DELETE', dispatcher, headers });
      if (res.ok || res.status === 404) deleted++;
    }));
  }
  console.log('  deleted ' + deleted + '/' + keys.length);
}

async function main() {
  console.log('Collecting files to delete...\n');

  const [ogpLight, ogpDark, json, csv, blogOldOgp] = await Promise.all([
    collectKeys('ranking/', k => k.includes('ogp-light.png')),
    collectKeys('ranking/', k => k.includes('ogp-dark.png')),
    collectKeys('ranking/', k => k.endsWith('.json')),
    collectKeys('ranking/', k => k.endsWith('.csv')),
    collectKeys('blog/', k => /^blog\/[^/]+\/ogp\.png$/.test(k)),
  ]);

  console.log('ogp-light.png: ' + ogpLight.length);
  console.log('ogp-dark.png: ' + ogpDark.length);
  console.log('JSON: ' + json.length);
  console.log('CSV: ' + csv.length);
  console.log('blog root ogp.png: ' + blogOldOgp.length);
  console.log('Total: ' + (ogpLight.length + ogpDark.length + json.length + csv.length + blogOldOgp.length) + '\n');

  await deleteKeys(ogpLight, 'ogp-light.png');
  await deleteKeys(ogpDark, 'ogp-dark.png');
  await deleteKeys(json, 'JSON');
  await deleteKeys(csv, 'CSV');
  await deleteKeys(blogOldOgp, 'blog root ogp.png');

  console.log('\nDone!');
}
main();
