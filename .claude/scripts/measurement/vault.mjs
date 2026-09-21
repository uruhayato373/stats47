import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const BUCKET = 'stats47-private';
const PREFIX = 'operations/authenticated-measurement';

function encryptionKey() {
  const value = process.env.MEASUREMENT_VAULT_KEY;
  if (!value || !/^[a-f0-9]{64}$/.test(value)) throw new Error('vault_key_missing');
  return Buffer.from(value, 'hex');
}
export function encrypt(bytes, key, address) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(address));
  const body = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}
export function decrypt(bytes, key, address) {
  if (bytes.length < 28) throw new Error('vault_invalid_ciphertext');
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(address));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
}
function client() {
  return new S3Client({ region: 'auto', endpoint: process.env.R2_S3_ENDPOINT, credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  } });
}
function objectKey(key) {
  if (!/^[a-z0-9][a-z0-9/_.-]+$/.test(key) || key.includes('..')) throw new Error('vault_invalid_key');
  return `${PREFIX}/${key}.enc`;
}
export async function readVault(key) {
  const Key = objectKey(key);
  try {
    const response = await client().send(new GetObjectCommand({ Bucket: BUCKET, Key }));
    return JSON.parse(decrypt(Buffer.from(await response.Body.transformToByteArray()), encryptionKey(), Key));
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}
export async function writeVault(key, value) {
  if (!process.env.GITHUB_ACTIONS) throw new Error('vault_write_ci_only');
  const Key = objectKey(key);
  const body = Buffer.from(JSON.stringify(value));
  const encrypted = encrypt(body, encryptionKey(), Key);
  const s3 = client();
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key, Body: encrypted, ContentType: 'application/octet-stream', CacheControl: 'private, no-store' }));
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key }));
  const readback = Buffer.from(await response.Body.transformToByteArray());
  if (!encrypted.equals(readback)) throw new Error('vault_readback_mismatch');
  return { sha256: createHash('sha256').update(body).digest('hex'), bytes: body.length };
}
