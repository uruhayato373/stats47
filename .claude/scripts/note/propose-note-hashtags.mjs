#!/usr/bin/env node
/**
 * 公開済み note 記事のハッシュタグ99個を、記事のタイトルと公開本文から Claude に提案させ、
 * 決定的な検査 (lib/note-hashtags.mjs) を通ったものだけを data/note/hashtags/<slug>.json に書く。
 * note には書き込まない。反映は update-published-hashtags.mjs が行う。
 *
 * Usage:
 *   node .claude/scripts/note/propose-note-hashtags.mjs --slugs slug1,slug2 [--force]
 *   node .claude/scripts/note/propose-note-hashtags.mjs --all [--force]
 *
 * 既に提案済みで本文が変わっていない記事は飛ばす (--force で作り直す)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fetchNoteDetail } from './lib/cover-storage.mjs';
import { HASHTAG_COUNT, GENERIC_HASHTAGS, plainText, sourceSha256, requiredHashtags, validateHashtags, hashtagFile } from './lib/note-hashtags.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const MODEL = 'claude-sonnet-5-5';
const BODY_CHARS = 6000;
const ATTEMPTS = 3;

const argv = process.argv.slice(2);
const value = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
const all = argv.includes('--all');
const slugs = value('--slugs')?.split(',').filter(Boolean);
if (Boolean(all) === Boolean(slugs?.length)) throw Error('`--slugs a,b` か `--all` のどちらか1つを指定してください');
const force = argv.includes('--force');

const index = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/state/note-published-urls.json'), 'utf8')).articles;
const targets = Object.entries(index).filter(([slug]) => !slug.startsWith('_') && (all || slugs.includes(slug)));
if (slugs && targets.length !== slugs.length) throw Error('unknown slug in --slugs');

function prompt({ title, vertical, text, errors, previous }) {
  return [
    `note 記事に付けるハッシュタグをちょうど${HASHTAG_COUNT}個提案してください。`,
    '目的: この記事を読みたい人が、テーマ・地域・データ・用途の言葉で検索したときに見つけられるようにすること。',
    '',
    '条件:',
    '- すべてのタグが、この記事の主題・地域・使っているデータや統計・分析の方法・想定読者・読者が一緒に調べそうな関連テーマのどれかを表すこと。',
    '- 記事と関係のない人気タグ、note 自体やフォローを促すタグ、「面白い」「おすすめ」のような中身を表さない言葉は使わないこと。',
    `- 使ってはいけない例: ${[...GENERIC_HASHTAGS].slice(0, 20).join(' ')}`,
    '- 形式: 先頭に # を1つ、空白・ハイフン・#を含めない、数字だけにしない、25文字以内、重複なし。',
    '- 年のタグ (例: #2024年) は記事に出てくる年だけ。',
    ...(requiredHashtags(title).length ? [`- 必ず含める: ${requiredHashtags(title).join(' ')}`] : []),
    '- 具体的な言葉 (品目名・地名・指標名・制度名) を中心に、少し広いテーマの言葉も混ぜること。',
    '',
    `記事のシリーズ: ${vertical}`,
    `タイトル: ${title}`,
    `本文 (公開部分の先頭): ${text.slice(0, BODY_CHARS)}`,
    ...(errors ? ['', `前回の提案は次の理由で不合格でした。直して${HASHTAG_COUNT}個を出し直してください: ${errors.join(' / ')}`, `前回の提案: ${JSON.stringify(previous)}`] : []),
    '',
    `出力: JSON だけを1行で返す。形式 {"tags":["#...", ...]}。説明文は書かない。`,
  ].join('\n');
}

function askClaude(input) {
  const res = spawnSync('claude', ['-p', prompt(input), '--model', MODEL, '--tools', '', '--strict-mcp-config',
    '--no-session-persistence', '--setting-sources', 'project', '--settings', '{"disableAllHooks":true}', '--output-format', 'json'],
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 5 * 60 * 1000 });
  const envelope = JSON.parse(res.stdout || '{}');
  if (envelope.is_error || typeof envelope.result !== 'string') throw Error(`claude failed: ${(res.stderr || res.stdout || '').slice(0, 300)}`);
  const json = envelope.result.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw Error('claude returned no JSON');
  return { tags: JSON.parse(json).tags, costUsd: envelope.total_cost_usd ?? null };
}

const summary = { written: 0, skipped: 0, failed: 0, costUsd: 0 };
for (const [slug, article] of targets) {
  try {
    const detail = await fetchNoteDetail(article.url.split('/').pop());
    if (detail.user?.urlname !== 'stats47' || `https://note.com/stats47/n/${detail.key}` !== article.url) throw Error('article identity mismatch');
    const title = detail.name;
    const text = plainText(detail.body);
    const source = sourceSha256(title, text);
    const file = hashtagFile(ROOT, slug);
    if (!force && fs.existsSync(file) && JSON.parse(fs.readFileSync(file, 'utf8')).sourceSha256 === source) {
      summary.skipped += 1;
      continue;
    }
    let tags, errors;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      const answer = askClaude({ title, vertical: article.vertical, text, errors, previous: tags });
      summary.costUsd += answer.costUsd ?? 0;
      tags = answer.tags;
      const check = validateHashtags(tags, { title, text });
      if (check.ok) { errors = null; break; }
      errors = check.errors;
    }
    if (errors) throw Error(`gate failed after ${ATTEMPTS} attempts: ${errors.slice(0, 5).join('; ')}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify({ slug, noteUrl: article.url, title, vertical: article.vertical,
      sourceSha256: source, model: MODEL, generatedAt: new Date().toISOString(), tags }, null, 2)}\n`);
    summary.written += 1;
    console.log(`OK ${slug}`);
  } catch (error) {
    summary.failed += 1;
    console.log(`FAIL ${slug}: ${error.message}`);
  }
}
console.log(JSON.stringify(summary));
process.exitCode = summary.failed ? 1 : 0;
