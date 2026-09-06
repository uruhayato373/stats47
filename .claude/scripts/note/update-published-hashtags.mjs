#!/usr/bin/env node

/**
 * note.com/stats47 の公開済み記事を、本文・価格・有料境界を保ったまま
 * 95個以上（既定99個）のハッシュタグへ更新する。
 *
 * Usage:
 *   node .claude/scripts/note/update-published-hashtags.mjs --slug <slug>
 *   node .claude/scripts/note/update-published-hashtags.mjs --all [--include-paid]
 *   node .claude/scripts/note/update-published-hashtags.mjs --all --audit-only
 */

import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectSeries, generateHashtags } from './generate-note-hashtags.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '../../..');
const PUBLISHED_INDEX = join(PROJECT_ROOT, '.claude/state/note-published-urls.json');
const REPORT_DIR = join(PROJECT_ROOT, '.claude/state/metrics');
const RUN_DATE = new Date().toISOString().slice(0, 10);
const DEFAULT_REPORT = join(REPORT_DIR, `note-hashtag-audit-${RUN_DATE}.json`);
const PROFILE_LOCK = join(tmpdir(), 'stats47-note-profile5.lock');
const BROWSER_USE_PATHS = [
  '/Users/minamidaisuke/.browser-use-env/bin',
  '/Users/minamidaisuke/.browser-use/bin',
  '/Users/minamidaisuke/.local/bin',
  process.env.PATH || '',
].join(':');

function parseArgs(argv) {
  const valueAfter = (flag) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const slug = valueAfter('--slug');
  const all = argv.includes('--all');
  if ((slug ? 1 : 0) + (all ? 1 : 0) !== 1) {
    throw new Error('`--slug <slug>` または `--all` のどちらか1つを指定してください');
  }
  const minimum = Number(valueAfter('--minimum') || 95);
  const target = Number(valueAfter('--target') || 99);
  const max = valueAfter('--max') ? Number(valueAfter('--max')) : Infinity;
  if (!Number.isInteger(minimum) || !Number.isInteger(target) || minimum < 1 || minimum > target || target > 99) {
    throw new Error('tag count は 1 <= minimum <= target <= 99 で指定してください');
  }
  return {
    all,
    slug,
    minimum,
    target,
    max,
    auditOnly: argv.includes('--audit-only'),
    includePaid: argv.includes('--include-paid'),
    reportPath: resolve(valueAfter('--report') || DEFAULT_REPORT),
  };
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < (value || '').length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function noteKeyFromUrl(url) {
  const key = new URL(url).pathname.split('/').filter(Boolean).at(-1);
  if (!/^n[0-9a-f]+$/i.test(key || '')) throw new Error(`note key を抽出できません: ${url}`);
  return key;
}

async function fetchNote(key, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`https://note.com/api/v3/notes/${key}?ts=${Date.now()}`, {
        headers: { 'user-agent': 'stats47-note-hashtag-audit/1.0' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json?.data) throw new Error('note API response has no data');
      return json.data;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 800);
    }
  }
  throw lastError;
}

function noteSnapshot(note) {
  return {
    status: note.status,
    price: Number(note.price || 0),
    separator: note.separator || null,
    bodySignature: fnv1a(note.body || ''),
    hashtagCount: Array.isArray(note.hashtag_notes) ? note.hashtag_notes.length : 0,
    account: note.user?.urlname || '',
    hasDraft: Boolean(note.has_draft),
  };
}

let browserSessionStarted = false;
let profileLockHeld = false;

function acquireProfileLock() {
  try {
    mkdirSync(PROFILE_LOCK);
    writeFileSync(join(PROFILE_LOCK, 'pid'), `${process.pid}\n`, 'utf8');
    profileLockHeld = true;
  } catch {
    throw new Error(`Profile 5 は別のnote操作で使用中です: ${PROFILE_LOCK}`);
  }
}

function releaseProfileLock() {
  if (!profileLockHeld) return;
  try { unlinkSync(join(PROFILE_LOCK, 'pid')); } catch {}
  try { rmdirSync(PROFILE_LOCK); } catch {}
  profileLockHeld = false;
}

function bu(args, { allowFailure = false } = {}) {
  if (args[0] !== 'close') browserSessionStarted = true;
  try {
    return execFileSync('browser-use', ['--headed', '--profile', 'Profile 5', ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PATH: BROWSER_USE_PATHS },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: 90_000,
    });
  } catch (error) {
    if (allowFailure) return `${error.stdout || ''}${error.stderr || ''}`;
    throw new Error(`browser-use ${args[0]} failed: ${String(error.stderr || error.message).slice(0, 500)}`);
  }
}

let cleanedUp = false;
function cleanupBrowser() {
  if (cleanedUp) return;
  cleanedUp = true;
  if (browserSessionStarted) {
    try {
      bu(['close'], { allowFailure: true });
    } catch {}
  }
  const cleanup = String.raw`
pkill -TERM -f "browser_use.skill_cli.daemon" 2>/dev/null || true
sleep 2
pkill -KILL -f "browser_use.skill_cli.daemon" 2>/dev/null || true
pkill -KILL -f "user-data-dir=.*ms-playwright/mcp-chrome" 2>/dev/null || true
ps -Axo pid,command | grep "browser-use-user-data-dir" | grep -v grep | awk '{print $1}' | xargs -n1 kill -9 2>/dev/null || true
osascript -e 'tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "editor.note.com" or URL of t contains "note.com/notes/" then close t
    end repeat
  end repeat
end tell' 2>/dev/null || true
`;
  if (browserSessionStarted) {
    spawnSync('/bin/zsh', ['-c', cleanup], { stdio: 'ignore' });
    for (const entry of readdirSync(tmpdir(), { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('browser-use-user-data-dir-')) {
        rmSync(join(tmpdir(), entry.name), { recursive: true, force: true });
      }
    }
  }
  releaseProfileLock();
}

function findButtonIndex(state, label, { last = false } = {}) {
  const lines = state.split('\n');
  const matches = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== label) continue;
    for (let back = index - 1; back >= Math.max(0, index - 3); back -= 1) {
      const match = lines[back].match(/\[(\d+)]<button/);
      if (match) {
        matches.push(match[1]);
        break;
      }
    }
  }
  if (matches.length === 0) {
    const inline = [...state.matchAll(new RegExp(`\\[(\\d+)]<button[^\\n]*>${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'))];
    matches.push(...inline.map((match) => match[1]));
  }
  return last ? matches.at(-1) : matches[0];
}

function parseEvalJson(output) {
  const raw = output.match(/^result:\s*(.+)$/m)?.[1];
  if (!raw || raw === 'None') throw new Error(`browser eval result が無効です: ${output.slice(0, 300)}`);
  return JSON.parse(raw);
}

async function accountGate() {
  bu(['open', 'https://note.com/settings/account']);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await sleep(2_000);
    const state = bu(['state']);
    if (/note ID\s+stats47\b/.test(state) && /stats47jp@gmail\.com/.test(state)) return;
  }
  throw new Error('Profile 5 のnoteアカウントを stats47 と照合できません');
}

function generatedTags(slug, article, target) {
  const tags = generateHashtags(article.vertical, detectSeries(slug), article.title || slug);
  const valid = tags.filter((tag) => /^#[^#\s-]+$/.test(tag) && !/^#\d+$/.test(tag));
  const unique = [...new Set(valid)];
  if (unique.length < target) throw new Error(`有効タグプールが不足しています: ${unique.length}/${target}`);
  return unique.slice(0, target);
}

function installTagPatch(tags, target, before) {
  const code = `(()=>{
    const pool=${JSON.stringify(tags)};
    const target=${target};
    const expected=${JSON.stringify({
      price: before.price,
      separator: before.separator,
      bodySignature: before.bodySignature,
    })};
    const signature=value=>{
      let hash=0x811c9dc5;
      const text=value||'';
      for(let index=0;index<text.length;index+=1)hash=Math.imul(hash^text.charCodeAt(index),0x01000193);
      return (hash>>>0).toString(16);
    };
    const original=window.fetch.bind(window);
    window.__stats47TagPatch={installed:true,pool:pool.length};
    window.fetch=(input,init)=>{
      const url=String(input);
      if(url.includes('/api/v1/text_notes/')&&String(init?.method).toUpperCase()==='PUT'){
        const body=JSON.parse(init.body);
        if(Number(body.price||0)!==expected.price)throw new Error('price changed before update');
        if(expected.price>0&&body.separator!==expected.separator)throw new Error('paid separator changed before update');
        if(typeof body.free_body!=='string')throw new Error('free body is missing');
        if(expected.price>0&&typeof body.pay_body!=='string')throw new Error('paid body is missing');
        const freeBodySignature=signature(body.free_body);
        if(freeBodySignature!==expected.bodySignature)throw new Error('published free body changed before update');
        const before=Array.isArray(body.hashtags)?body.hashtags:[];
        const output=[];
        const seen=new Set();
        for(const raw of [...before,...pool]){
          const tag=String(raw).trim();
          if(!/^#[^#\\s-]+$/.test(tag)||/^#\\d+$/.test(tag)||seen.has(tag))continue;
          seen.add(tag);
          output.push(tag);
          if(output.length===target)break;
        }
        if(output.length<95)throw new Error('hashtag pool insufficient: '+output.length);
        body.hashtags=output;
        init={...init,body:JSON.stringify(body)};
        window.__stats47TagPatch={
          installed:true,
          before:before.length,
          after:output.length,
          status:'sending',
          freeBodySignature,
          freeBodyLength:body.free_body.length,
          payBodyLength:body.pay_body?.length||0,
          price:Number(body.price||0),
          separator:body.separator||null
        };
        return original(input,init).then(response=>{
          window.__stats47TagPatch.status=response.status;
          response.clone().text().then(text=>{
            window.__stats47TagPatch.responseText=text.slice(0,500);
          }).catch(()=>{});
          return response;
        });
      }
      return original(input,init);
    };
    return JSON.stringify(window.__stats47TagPatch);
  })()`;
  const installed = parseEvalJson(bu(['eval', code]));
  if (!installed.installed || installed.pool < target) throw new Error('タグ送信パッチの初期化に失敗しました');
}

async function updateArticle(slug, article, before, options) {
  const key = noteKeyFromUrl(article.url);
  const current = noteSnapshot(await fetchNote(key));
  if (current.hasDraft) {
    throw new Error('未公開下書きがあるため、下書き保全のためタグ更新を停止しました');
  }
  // `draft_reedit=true` がないと未公開下書きが存在する記事では、その本文まで
  // 公開してしまう。公開版を再編集し、タグ以外の送信内容を下の guard で照合する。
  const editUrl = `https://editor.note.com/notes/${key}/edit?draft_reedit=true`;
  bu(['open', editUrl]);
  await sleep(3_500);

  let state = bu(['state']);
  if (!state.includes('contenteditable=true role=textbox')) throw new Error('記事編集画面を確認できません');
  const publishIndex = findButtonIndex(state, '公開に進む');
  if (!publishIndex) throw new Error('`公開に進む` ボタンが見つかりません');
  bu(['click', publishIndex]);
  await sleep(3_000);

  state = bu(['state']);
  if (!state.includes('placeholder=ハッシュタグを追加する')) {
    throw new Error('公開設定画面のハッシュタグ入力欄が見つかりません');
  }
  const paid = before.price > 0;
  const areaLabel = paid ? '有料エリア設定' : '試し読みエリアを設定';
  const areaIndex = findButtonIndex(state, areaLabel);

  if (paid) {
    if (!areaIndex) throw new Error(`\`${areaLabel}\` ボタンが見つかりません`);
    bu(['click', areaIndex]);
    await sleep(2_500);
    const boundary = parseEvalJson(bu(['eval', `(()=>{
      const line=document.getElementById('paywall-line');
      if(line)line.scrollIntoView({block:'center'});
      return JSON.stringify({exists:!!line,pressed:line?.getAttribute('aria-pressed'),text:line?.textContent?.trim()||''});
    })()`]));
    if (!boundary.exists || boundary.pressed !== 'true') {
      throw new Error('有料境界の既存選択状態を確認できません');
    }
    await sleep(800);
    const screenshotDir = join('/tmp', 'stats47-note-hashtag-boundaries');
    mkdirSync(screenshotDir, { recursive: true });
    bu(['screenshot', join(screenshotDir, `${slug}.png`)]);
  } else if (areaIndex) {
    bu(['click', areaIndex]);
    await sleep(2_500);
    const selected = parseEvalJson(bu(['eval', `(()=>{
      const buttons=[];
      const walk=root=>root.querySelectorAll('*').forEach(element=>{
        if(element.tagName==='BUTTON'&&(element.textContent||'').trim()==='ラインをこの場所に変更')buttons.push(element);
        if(element.shadowRoot)walk(element.shadowRoot);
      });
      walk(document);
      const line=buttons.at(-1);
      if(!line)return JSON.stringify({clicked:false,count:buttons.length});
      line.scrollIntoView({block:'center'});
      line.click();
      return JSON.stringify({clicked:true,count:buttons.length});
    })()`]));
    if (!selected.clicked) throw new Error('無料記事末尾の試し読みラインが見つかりません');
    await sleep(800);
    const verified = parseEvalJson(bu(['eval', `(()=>{
      const line=document.getElementById('paywall-line');
      return JSON.stringify({exists:!!line,pressed:line?.getAttribute('aria-pressed')});
    })()`]));
    if (!verified.exists || verified.pressed !== 'true') {
      throw new Error('無料記事末尾の試し読みラインを選択できません');
    }
  }

  installTagPatch(generatedTags(slug, article, options.target), options.target, before);
  const clickResult = bu(['eval', `(()=>{
    const buttons=[];
    const walk=root=>root.querySelectorAll('*').forEach(element=>{
      if(element.tagName==='BUTTON')buttons.push(element);
      if(element.shadowRoot)walk(element.shadowRoot);
    });
    walk(document);
    const button=buttons.find(element=>(element.textContent||'').trim()==='更新する');
    if(!button)return 'not-found';
    button.click();
    return 'clicked';
  })()`]);
  if (!clickResult.includes('clicked')) throw new Error('`更新する` ボタンの押下に失敗しました');
  await sleep(4_500);

  const publishResult = parseEvalJson(bu(['eval', `JSON.stringify({
    patch:window.__stats47TagPatch||null,
    published:document.body.innerText.includes('記事が公開されました')
  })`]));
  if (publishResult.patch?.status !== 200) {
    throw new Error(`note更新APIが成功していません: ${JSON.stringify(publishResult.patch)}`);
  }

  let afterNote;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    afterNote = await fetchNote(key);
    if ((afterNote.hashtag_notes?.length || 0) >= options.minimum) break;
    await sleep(1_200);
  }
  const after = noteSnapshot(afterNote);
  if (after.account !== 'stats47' || after.status !== 'published') throw new Error('更新後の記事帰属または公開状態が不正です');
  if (after.hashtagCount < options.minimum || after.hashtagCount > 99) {
    throw new Error(`更新後タグ数が不正です: ${after.hashtagCount}; response=${publishResult.patch.responseText || ''}`);
  }
  if (after.price !== before.price) throw new Error(`価格が変化しました: ${before.price} -> ${after.price}`);
  if (paid && after.separator !== before.separator) throw new Error('有料境界が変化しました');
  if (after.bodySignature !== publishResult.patch.freeBodySignature) {
    throw new Error('noteが送信した無料本文と更新後の公開本文が一致しません');
  }

  return { key, paid, before: before.hashtagCount, after: after.hashtagCount, publishedModal: publishResult.published };
}

function writeReport(path, report) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(PUBLISHED_INDEX)) throw new Error(`公開済み記事インデックスがありません: ${PUBLISHED_INDEX}`);
  const index = JSON.parse(readFileSync(PUBLISHED_INDEX, 'utf8'));
  const sourceEntries = Object.entries(index.articles || {}).filter(([slug]) => !slug.startsWith('_'));
  const selected = options.slug
    ? sourceEntries.filter(([slug]) => slug === options.slug)
    : sourceEntries;
  if (selected.length === 0) throw new Error(`対象記事が見つかりません: ${options.slug}`);

  const report = {
    generated_at: new Date().toISOString(),
    account: 'stats47',
    minimum: options.minimum,
    target: options.target,
    audit_only: options.auditOnly,
    total_indexed: sourceEntries.length,
    selected: selected.length,
    summary: { compliant: 0, pending: 0, updated: 0, skipped_paid: 0, failed: 0 },
    articles: [],
  };

  const pending = [];
  for (const [slug, article] of selected) {
    try {
      const key = noteKeyFromUrl(article.url);
      const note = await fetchNote(key);
      const before = noteSnapshot(note);
      if (before.account !== 'stats47' || before.status !== 'published') {
        throw new Error(`記事帰属または公開状態が不正です: ${before.account}/${before.status}`);
      }
      if (before.hashtagCount >= options.minimum) {
        report.summary.compliant += 1;
        report.articles.push({ slug, key, status: 'compliant', count: before.hashtagCount, paid: before.price > 0 });
      } else if (before.hasDraft) {
        report.summary.failed += 1;
        report.articles.push({
          slug,
          key,
          status: 'draft_blocked',
          count: before.hashtagCount,
          paid: before.price > 0,
          error: '未公開下書きがあるため、下書き保全のためタグ更新を停止しました',
        });
      } else if (before.price > 0 && !options.includePaid) {
        report.summary.skipped_paid += 1;
        report.articles.push({ slug, key, status: 'skipped_paid', count: before.hashtagCount, paid: true });
      } else {
        report.summary.pending += 1;
        pending.push({ slug, article, before });
      }
    } catch (error) {
      report.summary.failed += 1;
      report.articles.push({ slug, status: 'audit_failed', error: error.message });
    }
  }
  writeReport(options.reportPath, report);
  console.log(`audit: selected=${selected.length} compliant=${report.summary.compliant} pending=${pending.length} skipped_paid=${report.summary.skipped_paid} failed=${report.summary.failed}`);
  console.log(`report: ${options.reportPath}`);
  if (options.auditOnly) return;

  acquireProfileLock();
  await accountGate();
  console.log('account gate: stats47 / stats47jp@gmail.com');
  let consecutiveFailures = 0;
  for (const item of pending.slice(0, options.max)) {
    const position = report.summary.updated + report.summary.failed + 1;
    process.stdout.write(`[${position}/${Math.min(pending.length, options.max)}] ${item.slug} ... `);
    try {
      const result = await updateArticle(item.slug, item.article, item.before, options);
      report.summary.updated += 1;
      report.summary.pending -= 1;
      report.articles.push({ slug: item.slug, status: 'updated', ...result });
      consecutiveFailures = 0;
      console.log(`${result.before} -> ${result.after}${result.paid ? ' paid' : ''}`);
    } catch (error) {
      report.summary.failed += 1;
      report.summary.pending -= 1;
      report.articles.push({ slug: item.slug, status: 'update_failed', paid: item.before.price > 0, error: error.message });
      consecutiveFailures += 1;
      console.log(`FAIL: ${error.message}`);
      if (consecutiveFailures >= 3) {
        console.log('systemic stop: 3件連続失敗のため、後続の更新を停止します');
        break;
      }
    } finally {
      report.generated_at = new Date().toISOString();
      writeReport(options.reportPath, report);
    }
  }
}

process.on('exit', cleanupBrowser);
process.on('SIGINT', () => {
  cleanupBrowser();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanupBrowser();
  process.exit(143);
});

try {
  await main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
}
