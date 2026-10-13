#!/usr/bin/env node
/**
 * note 記事本文の作業コピーと R2 正本を行き来する唯一の入口 (npm run note:article -- <command>)。
 * 正本: 台帳 data/note/articles.json (所在とマニフェストの SHA) + R2 (本文・画像)。docs/31 は gitignore された作業場。
 *
 *   status   [--keys a,b]               台帳の所在と、作業コピーが保存済みと同じか (通信なし)
 *   checkout <key...> [--force]         R2 から作業コピーへ取り出す。未保存の変更があれば --force なしでは止まる
 *   save     <key...> [--keep-local]    作業コピーを R2 へ保存し (読み戻し照合)、台帳を更新してから作業コピーを消す
 *   adopt    <key...> | --all           台帳ができる前から R2 にある本文を、そのまま台帳に取り込む
 *   verify   [--keys a,b] [--deep] [--record]
 *                                       台帳と R2 を照合する (--deep は全ファイルの SHA。--record は合格日時を台帳へ書く)
 *   sources  [--unlinked]               教材 (参考文献) の note 企画と記事の結び付き (sourceAnalyses) を教材ごとに数える (通信なし)
 *
 * 規約: .claude/scripts/note/catalog/README.md「記事の保存場所と作業手順」
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { LEDGER_ROOT, findLedgerArticle, readArticleLedger, updateArticleLedger } from './lib/article-ledger.mjs';
import { datasetDir } from '../../../config/datasets.mjs';
import {
  buildManifest, createArticleStores, listRemoteFiles, loadArticleFiles, readLocalFiles, saveArticleFiles,
  verifyArticleStorage, workingDir,
} from './lib/article-store.mjs';
import { validateRankingArticleFiles } from './lib/image-assets-audit.mjs';

dotenv.config({ path: path.join(LEDGER_ROOT, '.env.local'), quiet: true });

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const option = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : null);
const positional = rest.filter((a, i) => !a.startsWith('--') && rest[i - 1] !== '--keys');
const keysOption = option('--keys')?.split(',').filter(Boolean) ?? [];

function selectArticles(ledger, { all = false } = {}) {
  const keys = [...positional, ...keysOption];
  if (keys.length) return keys.map((key) => findLedgerArticle(ledger, key));
  if (all) return ledger.articles;
  throw Error('記事キーを指定してください (例: note:article -- save a-kakei-aichi)');
}

/** clean = 作業コピーが台帳の保存済みと同じ / modified = 違う / absent = 作業コピーなし */
function localState(article) {
  const dir = workingDir(article, LEDGER_ROOT);
  if (!fs.existsSync(path.join(dir, 'draft.md'))) return 'absent';
  if (!article.body.manifest) return 'unsaved';
  return buildManifest(article.key, readLocalFiles(dir)).sha256 === article.body.manifest.sha256 ? 'clean' : 'modified';
}

function recordManifest(updates) {
  if (!updates.length) return;
  updateArticleLedger((ledger) => {
    for (const { key, record } of updates) {
      const article = findLedgerArticle(ledger, key);
      article.body = { ...article.body, manifest: record, verifiedAt: record.savedAt };
    }
  });
}

async function status() {
  const ledger = readArticleLedger();
  const selected = keysOption.length ? selectArticles(ledger) : ledger.articles;
  const counts = {};
  const local = [];
  for (const article of selected) {
    const state = article.body.store === 'note-only' ? 'note-only' : article.body.manifest ? 'saved' : 'not-saved';
    counts[`${article.body.store}:${state}`] = (counts[`${article.body.store}:${state}`] ?? 0) + 1;
    const ls = localState(article);
    if (ls !== 'absent') local.push(`${ls.padEnd(8)} ${article.key}`);
  }
  console.log('台帳の所在:', JSON.stringify(counts));
  console.log(`作業コピー: ${local.length} 件${local.length ? `\n  ${local.join('\n  ')}` : ''}`);
}

async function checkout() {
  const ledger = readArticleLedger();
  for (const article of selectArticles(ledger)) {
    const dir = workingDir(article, LEDGER_ROOT);
    const state = localState(article);
    if (state === 'clean') { console.log(`= ${article.key}: 作業コピーは保存済みと同じ`); continue; }
    if (state !== 'absent' && !flags.has('--force'))
      throw Error(`${article.key}: 作業コピーに未保存の変更があります (${dir})。保存するなら save、捨てるなら --force`);
    const files = await loadArticleFiles(article, createArticleStores(article));
    fs.rmSync(dir, { recursive: true, force: true });
    for (const f of files) {
      const target = path.join(dir, ...f.name.split('/'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, f.bytes);
    }
    console.log(`↓ ${article.key}: ${files.length} ファイル → ${path.relative(LEDGER_ROOT, dir)}`);
  }
}

async function save() {
  const ledger = readArticleLedger();
  for (const article of selectArticles(ledger)) {
    const dir = workingDir(article, LEDGER_ROOT);
    if (!fs.existsSync(path.join(dir, 'draft.md'))) throw Error(`${article.key}: 作業コピーがありません (${dir})`);
    const files = readLocalFiles(dir);
    const byName = new Map(files.map((f) => [f.name, f.bytes.toString('utf8')]));
    for (const w of validateRankingArticleFiles(article.key, (name) => byName.get(name) ?? null))
      console.warn(`  ⚠ [${w.code}] ${w.file}: ${w.message}`);
    const { record, uploaded, removed } = await saveArticleFiles(article, files, createArticleStores(article));
    recordManifest([{ key: article.key, record }]);
    if (!flags.has('--keep-local')) fs.rmSync(dir, { recursive: true });
    console.log(`↑ ${article.key}: ${record.files} ファイル (更新 ${uploaded}・削除 ${removed}) → ${article.body.store} ${article.r2Path}${flags.has('--keep-local') ? '' : ' / 作業コピーを削除'}`);
  }
}

async function adopt() {
  const ledger = readArticleLedger();
  const targets = selectArticles(ledger, { all: flags.has('--all') })
    .filter((a) => a.body.store !== 'note-only' && (!a.body.manifest || positional.length || keysOption.length));
  const pending = [];
  const missing = [];
  const unwritten = [];
  let index = 0;
  async function worker() {
    while (index < targets.length) {
      const article = targets[index++];
      const stores = createArticleStores(article);
      const files = await listRemoteFiles(article, stores.body);
      if (!files.some((f) => f.name === 'draft.md')) { (article.status === 'draft' ? unwritten : missing).push(article.key); continue; }
      const { record } = await saveArticleFiles(article, files, stores);
      pending.push({ key: article.key, record });
      if (pending.length >= 20) recordManifest(pending.splice(0));
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  recordManifest(pending);
  console.log(`取り込み ${targets.length - missing.length - unwritten.length} 件 / 本文未作成の下書き ${unwritten.length} 件 / 公開済みなのに R2 に本文なし ${missing.length} 件${missing.length ? `\n  ${missing.join('\n  ')}` : ''}`);
  if (missing.length) process.exitCode = 1;
}

async function verify() {
  const ledger = readArticleLedger();
  const selected = keysOption.length || positional.length ? selectArticles(ledger) : ledger.articles;
  const problems = [];
  const passed = [];
  let unwritten = 0;
  let index = 0;
  async function worker() {
    while (index < selected.length) {
      const article = selected[index++];
      if (article.body.store === 'note-only') continue;
      if (article.status === 'draft' && !article.body.manifest) { unwritten++; continue; }
      const found = await verifyArticleStorage(article, createArticleStores(article), { deep: flags.has('--deep') });
      if (found.length) problems.push(...found);
      else passed.push(article.key);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  const noteOnly = selected.filter((a) => a.body.store === 'note-only').length;
  console.log(`照合 ${passed.length + problems.length} 件: 合格 ${passed.length} / 問題 ${problems.length} 件 / 本文未作成の下書き ${unwritten} 件 / note のみ ${noteOnly} 件 (回収待ち)`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  if (flags.has('--record') && passed.length) {
    const now = new Date().toISOString();
    updateArticleLedger((l) => { for (const key of passed) findLedgerArticle(l, key).body.verifiedAt = now; });
  }
  if (problems.length) process.exitCode = 1;
}

async function sources() {
  const linked = new Map();
  for (const article of readArticleLedger().articles)
    for (const id of article.sourceAnalyses ?? []) linked.set(id, [...(linked.get(id) ?? []), article.key]);
  const base = path.join(LEDGER_ROOT, datasetDir('source-inventory.analyses'));
  const rows = [];
  const unlinked = [];
  for (const sourceKey of fs.readdirSync(base).sort()) {
    const dir = path.join(base, sourceKey);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const edition of fs.readdirSync(dir)) {
      const file = path.join(dir, edition, 'analyses.json');
      if (!fs.existsSync(file)) continue;
      const noteAnalyses = JSON.parse(fs.readFileSync(file, 'utf8')).analyses.filter((a) => a.contentRoles.includes('note'));
      const done = noteAnalyses.filter((a) => linked.has(a.id));
      rows.push(`${`${sourceKey}/${edition}`.padEnd(40)} note 企画 ${String(noteAnalyses.length).padStart(3)} / 記事あり ${String(done.length).padStart(3)} / 未着手 ${String(noteAnalyses.length - done.length).padStart(3)}`);
      unlinked.push(...noteAnalyses.filter((a) => !linked.has(a.id)).map((a) => `${a.id}  ${a.question}`));
    }
  }
  console.log(rows.join('\n'));
  console.log(`合計: 未着手 ${unlinked.length} 件 (企画の contentRoles に note があり、記事台帳の sourceAnalyses から結ばれていない)`);
  if (flags.has('--unlinked')) console.log(unlinked.map((line) => `  ${line}`).join('\n'));
}

const commands = { status, checkout, save, adopt, verify, sources };
if (!commands[command]) {
  console.error('使い方: note:article -- <status|checkout|save|adopt|verify|sources> ... (詳細はファイル先頭)');
  process.exit(2);
}
await commands[command]();
