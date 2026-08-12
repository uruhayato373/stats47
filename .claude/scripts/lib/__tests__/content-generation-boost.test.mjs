import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  DEFAULT_MAX_CONSECUTIVE_FAILURES,
  MAX_LIMIT,
  decide,
  failureStreak,
  isWithinWindow,
  parseBoostConfig,
  summarizeBoostUsage,
} from '../content-generation-boost.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(HERE, '..', 'content-generation-boost.mjs');
const REPO = path.resolve(HERE, '..', '..', '..');

const BASELINE_CRON = '0 18 * * *';
const EXTRA_CRON = '0 23 * * *';

function config(overrides = {}) {
  return parseBoostConfig(
    JSON.stringify({
      reason: '不在週の余剰枠を ai-content の全件完成に充てるため',
      from: '2026-08-09T19:00:00+09:00',
      until: '2026-08-13T23:59:59+09:00',
      aiContent: { limit: 3, extraCrons: [EXTRA_CRON, '0 4 * * *', '0 9 * * *'] },
      ...overrides,
    }),
  );
}

const DURING = Date.parse('2026-08-11T00:00:00+09:00');
const BEFORE = Date.parse('2026-08-08T00:00:00+09:00');
const AFTER = Date.parse('2026-08-20T00:00:00+09:00');

function csv(rows) {
  const header =
    'date,workflow,run_id,limit,items,turns,duration_ms,cost_usd,input,output,cache_write,cache_read,token_source,is_error';
  const body = rows.map(
    ({ date, workflow, items = 0, isError = 0 }) =>
      `${date},${workflow},1,10,${items},1,1,1,1,1,1,1,result,${isError}`,
  );
  return [header, ...body].join('\n');
}

function scheduled(extra = {}) {
  return decide({
    workflow: 'ai-content',
    eventName: 'schedule',
    baselineCron: BASELINE_CRON,
    defaultLimit: 5,
    cron: BASELINE_CRON,
    config: null,
    nowMs: DURING,
    ...extra,
  });
}

// ── 期間窓 ────────────────────────────────────────────────────────────────────

test('設定が無ければ baseline がそのまま走る (通常状態)', () => {
  const d = scheduled({ config: null });
  assert.equal(d.run, true);
  assert.equal(d.limit, 5);
  assert.equal(d.boostActive, false);
});

test('期間中は baseline の件数も boost 値になる', () => {
  const d = scheduled({ config: config(), nowMs: DURING });
  assert.equal(d.run, true);
  assert.equal(d.limit, 3, '既定 5 のままなら boost 値が効いていない');
  assert.equal(d.boostActive, true);
});

test('期間中は追加スロットが走る', () => {
  const d = scheduled({ config: config(), nowMs: DURING, cron: EXTRA_CRON });
  assert.equal(d.run, true);
  assert.equal(d.limit, 3);
});

test('期間前は追加スロットが走らず baseline は既定件数', () => {
  const extra = scheduled({ config: config(), nowMs: BEFORE, cron: EXTRA_CRON });
  assert.equal(extra.run, false);
  const base = scheduled({ config: config(), nowMs: BEFORE });
  assert.equal(base.run, true);
  assert.equal(base.limit, 5);
});

test('until を過ぎたら誰も触らなくても自動で失効する', () => {
  const extra = scheduled({ config: config(), nowMs: AFTER, cron: EXTRA_CRON });
  assert.equal(extra.run, false);
  const base = scheduled({ config: config(), nowMs: AFTER });
  assert.equal(base.limit, 5, 'until 後に boost 件数が残っている');
});

test('extraCrons に無い cron は期間中でも走らない (cloud から回数を減らせる)', () => {
  const reduced = config({ aiContent: { limit: 3, extraCrons: ['0 9 * * *'] } });
  assert.equal(scheduled({ config: reduced, nowMs: DURING, cron: EXTRA_CRON }).run, false);
  assert.equal(scheduled({ config: reduced, nowMs: DURING, cron: '0 9 * * *' }).run, true);
});

test('extraCrons を空にすると baseline の件数だけが変わる', () => {
  const c = config({ aiContent: { limit: 4, extraCrons: [] } });
  assert.equal(scheduled({ config: c, nowMs: DURING, cron: EXTRA_CRON }).run, false);
  assert.equal(scheduled({ config: c, nowMs: DURING }).limit, 4);
});

test('isWithinWindow は境界を含む', () => {
  const c = config();
  assert.equal(isWithinWindow(c, c.from), true);
  assert.equal(isWithinWindow(c, c.until), true);
  assert.equal(isWithinWindow(c, c.from - 1), false);
  assert.equal(isWithinWindow(c, c.until + 1), false);
  assert.equal(isWithinWindow(null, DURING), false);
});

// ── ブレーカー ────────────────────────────────────────────────────────────────

test('連続失敗が閾値に達したら boost を落とす (枠に当たった後の空回りを止める)', () => {
  const history = csv([
    { date: '2026-08-10', workflow: 'ai-content', items: 10 },
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
  ]);
  const extra = scheduled({ config: config(), nowMs: DURING, cron: EXTRA_CRON, historyCsv: history });
  assert.equal(extra.run, false);
  assert.match(extra.reason, /連続失敗/);

  const base = scheduled({ config: config(), nowMs: DURING, historyCsv: history });
  assert.equal(base.run, true, 'baseline まで止めない');
  assert.equal(base.limit, 5, 'ブレーカー作動時は既定件数へ戻す');
});

test('失敗のあとに成功があれば連続失敗は切れる', () => {
  const history = csv([
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
    { date: '2026-08-11', workflow: 'ai-content', items: 10 },
  ]);
  assert.equal(failureStreak(history, 'ai-content'), 0);
  assert.equal(scheduled({ config: config(), nowMs: DURING, cron: EXTRA_CRON, historyCsv: history }).run, true);
});

test('別 workflow の失敗は数えない', () => {
  const history = csv([
    { date: '2026-08-11', workflow: 'blog', isError: 1 },
    { date: '2026-08-11', workflow: 'blog', isError: 1 },
    { date: '2026-08-11', workflow: 'ai-content', items: 10 },
  ]);
  assert.equal(failureStreak(history, 'ai-content'), 0);
});

test('閾値は設定で変えられる', () => {
  const history = csv([{ date: '2026-08-11', workflow: 'ai-content', isError: 1 }]);
  assert.equal(scheduled({ config: config(), nowMs: DURING, cron: EXTRA_CRON, historyCsv: history }).run, true);
  const strict = config({ maxConsecutiveFailures: 1 });
  assert.equal(scheduled({ config: strict, nowMs: DURING, cron: EXTRA_CRON, historyCsv: history }).run, false);
});

test('history が空でも落ちない', () => {
  assert.equal(failureStreak('', 'ai-content'), 0);
  assert.equal(failureStreak(undefined, 'ai-content'), 0);
  assert.equal(scheduled({ config: config(), nowMs: DURING, cron: EXTRA_CRON, historyCsv: '' }).run, true);
});

// ── schedule 以外 ─────────────────────────────────────────────────────────────

test('cloud からの request push は boost の期間外でも指定件数で走る', () => {
  const d = decide({
    workflow: 'ai-content',
    eventName: 'push',
    baselineCron: BASELINE_CRON,
    defaultLimit: 5,
    config: config(),
    nowMs: AFTER,
    requestLimit: 3,
    requestDryRun: true,
  });
  assert.equal(d.run, true);
  assert.equal(d.limit, 3);
  assert.equal(d.dryRun, true);
  assert.equal(d.boostActive, false);
});

test('手動 dispatch は boost 期間中でも入力値が勝つ', () => {
  const d = decide({
    workflow: 'ai-content',
    eventName: 'workflow_dispatch',
    baselineCron: BASELINE_CRON,
    defaultLimit: 5,
    config: config(),
    nowMs: DURING,
    inputLimit: 2,
  });
  assert.equal(d.limit, 2);
});

// ── 設定の検証 ────────────────────────────────────────────────────────────────

test('壊れた設定は握り潰さず投げる', () => {
  const bad = {
    'JSON でない': '{',
    '配列': '[]',
    'from 欠落': JSON.stringify({ until: '2026-08-13T00:00:00Z', reason: 'x'.repeat(20), aiContent: { limit: 5, extraCrons: [] } }),
    'TZ 無し': JSON.stringify({
      from: '2026-08-09T19:00:00',
      until: '2026-08-13T23:59:59+09:00',
      reason: 'x'.repeat(20),
      aiContent: { limit: 5, extraCrons: [] },
    }),
    'from > until': JSON.stringify({
      from: '2026-08-20T00:00:00Z',
      until: '2026-08-13T00:00:00Z',
      reason: 'x'.repeat(20),
      aiContent: { limit: 5, extraCrons: [] },
    }),
    'reason 不足': JSON.stringify({
      from: '2026-08-09T00:00:00Z',
      until: '2026-08-13T00:00:00Z',
      reason: '増やす',
      aiContent: { limit: 5, extraCrons: [] },
    }),
    '件数が上限超え': JSON.stringify({
      from: '2026-08-09T00:00:00Z',
      until: '2026-08-13T00:00:00Z',
      reason: 'x'.repeat(20),
      aiContent: { limit: MAX_LIMIT + 1, extraCrons: [] },
    }),
    '件数が 0': JSON.stringify({
      from: '2026-08-09T00:00:00Z',
      until: '2026-08-13T00:00:00Z',
      reason: 'x'.repeat(20),
      aiContent: { limit: 0, extraCrons: [] },
    }),
    'extraCrons が配列でない': JSON.stringify({
      from: '2026-08-09T00:00:00Z',
      until: '2026-08-13T00:00:00Z',
      reason: 'x'.repeat(20),
      aiContent: { limit: 5, extraCrons: '0 9 * * *' },
    }),
  };
  for (const [label, text] of Object.entries(bad)) {
    assert.throws(() => parseBoostConfig(text), undefined, `${label} を通してしまう`);
  }
});

test('maxConsecutiveFailures を省略すると既定値が入る', () => {
  assert.equal(config().maxConsecutiveFailures, DEFAULT_MAX_CONSECUTIVE_FAILURES);
});

// ── 実績集計 ──────────────────────────────────────────────────────────────────

test('boost 開始以降だけを集計する (「使用量が多いか」の判断材料)', () => {
  const history = csv([
    { date: '2026-08-05', workflow: 'ai-content', items: 5 },
    { date: '2026-08-10', workflow: 'ai-content', items: 10 },
    { date: '2026-08-11', workflow: 'ai-content', items: 8 },
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
    { date: '2026-08-11', workflow: 'blog', items: 1 },
  ]);
  assert.deepEqual(summarizeBoostUsage(history, 'ai-content', config()), {
    runs: 3,
    items: 18,
    failures: 1,
  });
});

// ── 変異による感度確認 (通ることと検知できることは別) ─────────────────────────

async function importMutated(replace, replacement) {
  const source = readFileSync(SOURCE, 'utf8');
  assert.ok(source.includes(replace), `変異対象が見つからない: ${replace}`);
  const dir = mkdtempSync(path.join(tmpdir(), 'boost-mutant-'));
  const file = path.join(dir, 'mutant.mjs');
  writeFileSync(file, source.replace(replace, replacement));
  try {
    return await import(pathToFileURL(file).href);
  } finally {
    // import 後は読み込み済みなので消してよい
    rmSync(dir, { recursive: true, force: true });
  }
}

test('期間チェックを外すと期間外テストが落ちる', async () => {
  const mutant = await importMutated(
    'return config !== null && nowMs >= config.from && nowMs <= config.until;',
    'return config !== null;',
  );
  const d = mutant.decide({
    workflow: 'ai-content',
    eventName: 'schedule',
    cron: EXTRA_CRON,
    baselineCron: BASELINE_CRON,
    defaultLimit: 5,
    config: config(),
    nowMs: AFTER,
  });
  assert.equal(d.run, true, '変異させても skip のまま = 期間チェックを見ていない');
});

test('ブレーカーを外すと連続失敗テストが落ちる', async () => {
  const mutant = await importMutated(
    'const tripped = inWindow && streak >= config.maxConsecutiveFailures;',
    'const tripped = false;',
  );
  const history = csv([
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
    { date: '2026-08-11', workflow: 'ai-content', isError: 1 },
  ]);
  const d = mutant.decide({
    workflow: 'ai-content',
    eventName: 'schedule',
    cron: EXTRA_CRON,
    baselineCron: BASELINE_CRON,
    defaultLimit: 5,
    config: config(),
    nowMs: DURING,
    historyCsv: history,
  });
  assert.equal(d.run, true, '変異させても skip のまま = ブレーカーを見ていない');
});

// ── 実物の設定ファイル ────────────────────────────────────────────────────────

test('コミットされている設定ファイルは検証を通る', () => {
  const file = path.join(REPO, '.claude/config/content-generation-boost.json');
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return; // 設定なし = boost なしが通常状態
  }
  const parsed = parseBoostConfig(text);
  assert.ok(parsed.until > parsed.from);
});
