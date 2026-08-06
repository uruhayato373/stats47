#!/usr/bin/env tsx

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import {
  createCodexMcpImagegenRequest,
  ingestCodexBackgroundAsset,
  validateCodexBackgroundCatalog,
} from './lib/blog-codex-background-workflow';

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');

function stringArg(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  const value = index >= 0 ? args[index + 1] : null;
  return value && !value.startsWith('--') ? value : null;
}

function requiredArg(args: string[], flag: string): string {
  const value = stringArg(args, flag);
  if (!value) throw new Error(`${flag} が必要です`);
  return value;
}

function assertSlug(slug: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`slugが不正です: ${slug}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'request') {
    const slug = requiredArg(args, '--slug');
    assertSlug(slug);
    const request = createCodexMcpImagegenRequest(slug);
    const requestPath = join(
      PROJECT_ROOT,
      '.local/blog-imagegen/requests',
      `${slug}.json`
    );
    mkdirSync(dirname(requestPath), { recursive: true });
    writeFileSync(requestPath, `${JSON.stringify(request, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          requestPath: requestPath.slice(PROJECT_ROOT.length + 1),
          request,
        },
        null,
        2
      )
    );
    return;
  }

  if (command === 'ingest') {
    const slug = requiredArg(args, '--slug');
    assertSlug(slug);
    const result = await ingestCodexBackgroundAsset({
      projectRoot: PROJECT_ROOT,
      slug,
      inputPath: resolve(requiredArg(args, '--input')),
      promptHash: requiredArg(args, '--prompt-hash'),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'check') {
    const result = await validateCodexBackgroundCatalog(PROJECT_ROOT);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(
    '使い方: manage-blog-codex-backgrounds.ts ' +
      '<request --slug SLUG | ingest --slug SLUG --input PATH --prompt-hash HASH | check>'
  );
}

main().catch((error) => {
  console.error(
    `Fatal: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
