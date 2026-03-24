const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const client = new S3Client({
  region: 'auto',
  endpoint: 'https://' + process.env.CLOUDFLARE_ACCOUNT_ID + '.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

async function collectKeys(prefix, filter) {
  const keys = [];
  let token;
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: 'stats47', Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }));
    for (const obj of res.Contents || []) {
      if (filter(obj.Key)) keys.push(obj.Key);
    }
    token = res.NextContinuationToken;
  } while (token);
  return keys;
}

async function deleteKeys(keys, label) {
  if (keys.length === 0) { console.log(label + ': 0 files'); return; }
  console.log(label + ': ' + keys.length + ' files to delete...');
  // DeleteObjects max 1000 per batch
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await client.send(new DeleteObjectsCommand({
      Bucket: 'stats47',
      Delete: { Objects: batch.map(k => ({ Key: k })) },
    }));
    console.log('  deleted ' + Math.min(i + 1000, keys.length) + '/' + keys.length);
  }
}

async function main() {
  console.log('Collecting files to delete...\n');

  const [ogpLight, ogpDark, json, csv, blogOldOgp] = await Promise.all([
    collectKeys('ranking/', k => k.includes('ogp-light.png')),
    collectKeys('ranking/', k => k.includes('ogp-dark.png')),
    collectKeys('ranking/', k => k.endsWith('.json')),
    collectKeys('ranking/', k => k.endsWith('.csv')),
    collectKeys('blog/', k => /^blog\/[^\/]+\/ogp\.png$/.test(k)),
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
