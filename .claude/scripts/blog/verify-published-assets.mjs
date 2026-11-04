#!/usr/bin/env node
/**
 * verify-published-assets.mjs — R2 へ書いたファイルを公開 URL から取り直し、手元と同じ内容かを確かめる。
 *
 * push の成功は「書いたつもり」までで、読者に届くものを見ていない。regenerate-blog-svgs.yml の反映の直後に
 * 走らせ、1 件でも違えば失敗にする (2026-11-04 までは人が手で全件を取り直していた)。
 *
 * Usage: node .claude/scripts/blog/verify-published-assets.mjs --keys-file .local/generated-blog-svg-keys.txt
 *        (key の実体は .local/r2/<key>)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)('../lib/site-config.cjs');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const CONCURRENCY = 16;
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

/** @returns {Promise<string|null>} 食い違いの説明。一致なら null */
export async function compareAsset(key, localBytes, fetcher = fetch) {
  let response;
  for (let i = 0; i < 4 && !response; i++) {
    try {
      response = await fetcher(`${R2}/${key}?verify=${Date.now()}`);
    } catch {
      await new Promise((d) => setTimeout(d, 1000 * (i + 1)));
    }
  }
  if (!response) return `${key}: 取得できない`;
  if (!response.ok) return `${key}: HTTP ${response.status}`;
  const remote = Buffer.from(await response.arrayBuffer());
  return sha(remote) === sha(localBytes) ? null : `${key}: 公開版が手元と違う`;
}

async function main(argv) {
  const keysFile = argv[argv.indexOf('--keys-file') + 1];
  if (!argv.includes('--keys-file') || !fs.existsSync(keysFile)) throw new Error('--keys-file <path> が要る');
  const keys = fs.readFileSync(keysFile, 'utf8').split('\n').map((k) => k.trim()).filter(Boolean);
  const problems = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < keys.length) {
      const key = keys[i++];
      const problem = await compareAsset(key, fs.readFileSync(path.join('.local/r2', key)));
      if (problem) problems.push(problem);
    }
  }));
  console.log(`[verify] ${keys.length} 件を公開 URL で確認: 不一致 ${problems.length}`);
  if (problems.length) {
    problems.slice(0, 30).forEach((p) => console.error(`  ${p}`));
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
