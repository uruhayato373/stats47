/** Restore the malformed description of one previously published article; preserve all body bytes. */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { parseBlogSnapshotFrontmatter } from '../../../apps/web/scripts/lib/blog-snapshot-frontmatter';

const slug = 'sewerage-water-supply-gap';
const expectedSha = '7fe908513e5743363d3ee1ac647f902403b301bc4dddb9f87078e84abf607200';
const output = path.resolve('.local/blog-datasource-fix');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');

async function main() {
  await fs.mkdir(path.join(output, 'out'), { recursive: true });
  const response = await fetch(`https://storage.stats47.jp/app/blog/${slug}/article.md`, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Article HTTP ${response.status}`);
  const original = await response.text();
  const corrected = original.replace(/^description:\s*"(.*)"\s*$/m, (_, value: string) => `description: ${JSON.stringify(value)}`);
  const knownCorrectedSha = '71f2585aaae583c993ee70aefd5ae0d37020cd48f44d2b1298ced91f097d0385';
  if (sha(original) === knownCorrectedSha) {
    console.log(`${slug}: already repaired; no output or write`);
    return;
  }
  if (sha(original) !== expectedSha || sha(corrected) !== knownCorrectedSha) throw new Error('Source changed; inspect the live article before retrying');
  const body = (value: string) => value.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  if (body(original) !== body(corrected)) throw new Error('Article body changed');
  const fm = parseBlogSnapshotFrontmatter(corrected, slug);
  if (fm.published !== true || !(fm.publishedAt instanceof Date) || fm.publishedAt.toISOString().slice(0, 10) !== '2026-03-06') throw new Error('Original publication contract changed');
  for (const [folder, content] of [['_src', original], ['out', corrected]] as const) {
    const directory = path.join(output, folder, slug);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'article.md'), content);
  }
  const report = { slug, checkedAt: new Date().toISOString(), originalSha256: sha(original), correctedSha256: sha(corrected), bodyUnchanged: true, publishedAt: '2026-03-06', change: 'Escape embedded double quotes in description only' };
  await fs.writeFile(path.join(output, 'frontmatter-repair.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
