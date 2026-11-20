import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyEntry, evaluateFreshness, formatFreshnessReport } from '../r2-freshness-core.mjs';

const NOW = Date.parse('2026-08-13T00:00:00Z');
const entry = (over = {}) => ({ key: 'app/x.json', maxAgeDays: 3, generatedAt: '2026-08-12T00:00:00Z', ...over });

test('許容期間内は fresh', () => {
  assert.equal(classifyEntry(entry(), NOW).status, 'fresh');
});

test('上限を超えたら stale', () => {
  const r = classifyEntry(entry({ generatedAt: '2026-08-04T00:00:00Z' }), NOW);
  assert.equal(r.status, 'stale');
  assert.equal(Math.round(r.ageDays), 9);
});

test('境界 (ちょうど上限) は fresh のまま', () => {
  const r = classifyEntry(entry({ generatedAt: '2026-08-10T00:00:00Z' }), NOW); // 3.0 日
  assert.equal(r.status, 'fresh');
});

// 「読めなかった」を「健全」と混同しない。今回の事故はまさに沈黙が
// 成功と区別できなかったことが原因。
test('取得失敗は問題として扱う', () => {
  const s = evaluateFreshness([entry({ error: '404' })], NOW);
  assert.equal(s.problems.length, 1);
  assert.equal(s.problems[0].status, 'error');
});

test('generatedAt が無い / 壊れているのも問題', () => {
  assert.equal(classifyEntry(entry({ generatedAt: null }), NOW).status, 'no-timestamp');
  assert.equal(classifyEntry(entry({ generatedAt: 'いつか' }), NOW).status, 'no-timestamp');
});

// 未来日時は時計ずれか壊れた書き込み。新しすぎるものを健全と言い切らない。
test('未来の generatedAt は問題', () => {
  assert.equal(classifyEntry(entry({ generatedAt: '2026-09-01T00:00:00Z' }), NOW).status, 'future');
});

test('問題は古い順に並ぶ', () => {
  const s = evaluateFreshness(
    [
      entry({ key: 'a', generatedAt: '2026-08-09T00:00:00Z' }),
      entry({ key: 'b', generatedAt: '2026-08-01T00:00:00Z' }),
      entry({ key: 'c' }),
    ],
    NOW,
  );
  assert.deepEqual(s.problems.map((p) => p.key), ['b', 'a']);
});

test('全て新しければ報告は言い切る', () => {
  assert.match(formatFreshnessReport(evaluateFreshness([entry()], NOW)), /全て許容期間内/);
});

test('報告に key・経過日数・上限・理由が出る', () => {
  const s = evaluateFreshness(
    [entry({ key: 'app/rakuten/items/x.json', generatedAt: '2026-08-04T00:00:00Z', why: '日次 cron' })],
    NOW,
  );
  const out = formatFreshnessReport(s);
  assert.match(out, /app\/rakuten\/items\/x\.json: 9\.0 日前 \(上限 3 日\)/);
  assert.match(out, /日次 cron/);
});
