#!/usr/bin/env node
/**
 * 公開済み note 記事のハッシュタグ99個を、記事のタイトルと公開本文から Claude に提案させ、
 * 決定的な検査 (lib/note-hashtags.mjs) を通ったものだけを台帳 note.hashtags (data/note/hashtags.json) の
 * その記事の行に書く (表全体を読んで 1 件を入れ替える。題・URL・系統は記事台帳にあるので書かない)。
 * note には書き込まない。反映は update-published-hashtags.mjs が行う。
 *
 * Usage (--concurrency N で並列数、既定 3):
 *   node .claude/scripts/note/propose-note-hashtags.mjs --slugs slug1,slug2 [--force]
 *   node .claude/scripts/note/propose-note-hashtags.mjs --all [--force]
 *
 * 既に提案済みで本文が変わっていない記事は飛ばす (--force で作り直す)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchNoteDetail } from './lib/cover-storage.mjs';
import { plainText, sourceSha256, readHashtagTable, writeHashtagRecord, HASHTAG_MODEL } from './lib/note-hashtags.mjs';
import { proposeHashtags } from './lib/note-hashtags-propose.mjs';
import { datasetPath } from "../../../config/datasets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const argv = process.argv.slice(2);
const value = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
const all = argv.includes('--all');
const slugs = value('--slugs')?.split(',').filter(Boolean);
if (Boolean(all) === Boolean(slugs?.length)) throw Error('`--slugs a,b` か `--all` のどちらか1つを指定してください');
const force = argv.includes('--force');
const CONCURRENCY = Number(value('--concurrency') || 3);

const index = JSON.parse(fs.readFileSync(path.join(ROOT, datasetPath("note.published-urls")), 'utf8')).articles;
const targets = Object.entries(index).filter(([slug]) => !slug.startsWith('_') && (all || slugs.includes(slug)));
if (slugs && targets.length !== slugs.length) throw Error('unknown slug in --slugs');

const summary = { written: 0, skipped: 0, failed: 0, costUsd: 0 };
async function proposeOne([slug, article]) {
  try {
    const detail = await fetchNoteDetail(article.url.split('/').pop());
    if (detail.user?.urlname !== 'stats47' || `https://note.com/stats47/n/${detail.key}` !== article.url) throw Error('article identity mismatch');
    const title = detail.name;
    const text = plainText(detail.body);
    const source = sourceSha256(title, text);
    if (!force && readHashtagTable(ROOT).hashtags[slug]?.sourceSha256 === source) {
      summary.skipped += 1;
      return;
    }
    const { tags, costUsd } = await proposeHashtags({ title, vertical: article.vertical, text, cwd: ROOT });
    summary.costUsd += costUsd;
    writeHashtagRecord(ROOT, slug, { tags, sourceSha256: source, model: HASHTAG_MODEL, generatedAt: new Date().toISOString() });
    summary.written += 1;
    console.log(`OK ${slug}`);
  } catch (error) {
    summary.failed += 1;
    console.log(`FAIL ${slug}: ${error.message}`);
  }
}
let cursor = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
  while (cursor < targets.length) await proposeOne(targets[cursor++]);
}));
console.log(JSON.stringify(summary));
process.exitCode = summary.failed ? 1 : 0;
