#!/usr/bin/env tsx
/**
 * 共通生成manifestを持たないassetを、local bytesのSHA-256を正典としてexact publishする。
 * 対象は `.local/r2` 内の明示key、または十分狭いprefix+extensionだけ。
 */

import { resolve } from 'node:path';

import { config } from 'dotenv';

import { createS3ImageObjectStoreFromEnv } from '../image-pipeline';
import { assertR2WriteAllowed } from './_assert-ci-write';
import {
  parseExactAssetArgs,
  publishExactR2Assets,
  resolveExactAssetCandidates,
} from './push-exact-r2-assets-core';

const PROJECT_ROOT = resolve(__dirname, '..', '..', '..', '..');
config({ path: resolve(PROJECT_ROOT, '.env.local') });

async function main(): Promise<void> {
  const { selection, dryRun } = parseExactAssetArgs(process.argv.slice(2));
  assertR2WriteAllowed({ op: 'push-exact-r2-assets', dryRun });
  const candidates = resolveExactAssetCandidates(PROJECT_ROOT, selection);
  const store = createS3ImageObjectStoreFromEnv();
  if (!store) {
    throw new Error(
      'R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が必要です'
    );
  }
  const result = await publishExactR2Assets({ candidates, store, dryRun });
  console.log(
    `exact publish: candidates=${result.candidates} changed=${result.changed} uploaded=${result.uploaded} skipped=${result.skipped}` +
      (dryRun ? ' (dry-run)' : '')
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
