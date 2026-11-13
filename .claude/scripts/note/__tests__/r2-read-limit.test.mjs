import test from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';
import { createR2Store } from '../lib/cover-storage.mjs';

test('R2 readers retain the cover limit, while fixed delivery archives explicitly permit their recorded size', async () => {
  const previous = Object.fromEntries(['R2_S3_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'].map((key) => [key, process.env[key]]));
  const send = S3Client.prototype.send;
  Object.assign(process.env, { R2_S3_ENDPOINT: 'https://example.test', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test' });
  const bytes = Buffer.alloc(17 * 1024 * 1024);
  S3Client.prototype.send = async () => ({ Body: { transformToByteArray: async () => bytes } });
  try {
    await assert.rejects(createR2Store({ bucket: 'test' }).get('archive.zip'), /R2 read unavailable/);
    assert.equal((await createR2Store({ bucket: 'test', maxBytes: bytes.length }).get('archive.zip')).length, bytes.length);
    await assert.rejects(createR2Store({ bucket: 'test', maxBytes: bytes.length - 1 }).get('archive.zip'), /R2 read unavailable/);
    for (const invalid of [0, -1, 1.5, Infinity]) assert.throws(() => createR2Store({ bucket: 'test', maxBytes: invalid }), /positive integer/);
  } finally {
    S3Client.prototype.send = send;
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
