#!/usr/bin/env tsx

import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { resolve } from 'node:path';

import { createS3ImageObjectStore } from '../image-pipeline';
import { assertR2WriteAllowed } from './_assert-ci-write';
import { compressR2TopoJsonObject } from './compress-r2-topojson-core';

const PROJECT_ROOT = resolve(__dirname, '..', '..', '..', '..');
config({ path: resolve(PROJECT_ROOT, '.env.local') });

function readArg(name: string): string | null {
  const args = process.argv.slice(2);
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? null) : null;
}

function validatePrefix(raw: string): string {
  const prefix = raw.replace(/^\/+|\/+$/g, '');
  if (prefix !== 'gis/mlit-ksj' && !prefix.startsWith('gis/mlit-ksj/')) {
    throw new Error(`KSJ prefix以外は指定できません: ${raw}`);
  }
  if (!/^[A-Za-z0-9._~/-]+$/.test(prefix)) {
    throw new Error(`安全でないprefixです: ${raw}`);
  }
  return `${prefix}/`;
}

async function listTopoJsonKeys(
  client: S3Client,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const object of response.Contents ?? []) {
      if (object.Key?.endsWith('.topojson')) keys.push(object.Key);
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  return keys.sort();
}

async function main(): Promise<void> {
  const prefix = validatePrefix(readArg('--prefix') ?? 'gis/mlit-ksj');
  const apply = process.argv.includes('--apply');
  const rawConcurrency = Number(readArg('--concurrency') ?? '2');
  if (!Number.isInteger(rawConcurrency) || rawConcurrency < 1 || rawConcurrency > 4) {
    throw new Error('--concurrencyは1〜4の整数で指定してください');
  }
  assertR2WriteAllowed({ op: `compress KSJ TopoJSON (${prefix})`, dryRun: !apply });

  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が必要です');
  }
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'stats47';
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  const store = createS3ImageObjectStore(client, bucket);
  const keys = await listTopoJsonKeys(client, bucket, prefix);
  if (keys.length === 0) throw new Error(`TopoJSONが0件です: ${prefix}`);
  console.log(`TopoJSON: ${keys.length}件 prefix=${prefix} mode=${apply ? 'apply' : 'dry-run'}`);

  let nextIndex = 0;
  let completed = 0;
  let compressed = 0;
  let skipped = 0;
  let beforeBytes = 0;
  let afterBytes = 0;
  const failures: string[] = [];
  const worker = async (): Promise<void> => {
    while (true) {
      const index = nextIndex++;
      const key = keys[index];
      if (!key) return;
      try {
        const result = await compressR2TopoJsonObject({
          key,
          store,
          dryRun: !apply,
        });
        completed += 1;
        beforeBytes += result.beforeBytes;
        afterBytes += result.afterBytes;
        if (result.status === 'skipped') skipped += 1;
        else compressed += 1;
        if (completed % 25 === 0 || completed === keys.length) {
          console.log(
            `進捗 ${completed}/${keys.length} compressed=${compressed} skipped=${skipped} saved=${((beforeBytes - afterBytes) / 1024 / 1024).toFixed(1)}MiB`
          );
        }
      } catch (error) {
        failures.push(`${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(rawConcurrency, keys.length) }, () => worker())
  );
  if (failures.length > 0) {
    throw new Error(`圧縮失敗 ${failures.length}件\n${failures.slice(0, 20).join('\n')}`);
  }
  console.log(
    `完了: total=${keys.length} compressed=${compressed} skipped=${skipped} before=${(beforeBytes / 1024 / 1024).toFixed(1)}MiB after=${(afterBytes / 1024 / 1024).toFixed(1)}MiB`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
