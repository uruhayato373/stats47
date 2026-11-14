'use strict';

/**
 * backlog の「承認待ちの一覧」「期日が来るカード」「流入と流出の数」を組み立てる純関数。
 * I/O と引数の解釈は backlog-waits.mjs が持つ。カードの読み方は backlog-lib.cjs (単一実装)、
 * 期日の境界は cardsDueWithin、ISO 週は metrics/lib/periods.mjs、誰も持っていない古いカードの判定は
 * docs:check の DG093 (check-docs-governance.cjs の isUntriagedStale) と同じ実装を使う。
 *
 * 正典: `.claude/rules/todo-standards.md` §3 `[待ち:X]`・§5・§7
 */

const backlogLib = require('../lib/backlog-lib.cjs');
const { isIsoDate, isUntriagedStale } = require('../lib/check-docs-governance.cjs');
const { addDays, isoWeekOf, isoWeekRange, jstDateOf } = require('../metrics/lib/periods.mjs');

/** 承認の表で「何を承認するか」として本文から抜き出す行の目印 */
const APPROVAL_LINE = /承認|停止条件|残り/;
/** 抜き出す行の数と、まとめた文字数の上限 (週次レビューで 1 枚 1 行で読める長さ) */
const APPROVAL_NOTE_LINES = 2;
const APPROVAL_NOTE_MAX_CHARS = 120;
/** 総枚数の目安の既定 (config の todo.backlogTargetCards で上書き) */
const DEFAULT_BACKLOG_TARGET_CARDS = 200;
/** 誰も持っていない古いカードの日数の既定 (config の todo.untriagedMaxAgeDays。DG093 と同じ既定) */
const DEFAULT_UNTRIAGED_MAX_AGE_DAYS = 30;
const NO_LANE = '(領域なし)';
const NO_WAIT = 'なし';

/** 文字数 (コードポイント) で切り、切ったときは末尾を … にして上限に収める */
function truncate(text, max) {
  const chars = [...text];
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`;
}

/**
 * 本文から「承認」「停止条件」「残り」を含む行を最大 2 行抜き出し、箇条書きの記号と太字を外して 1 行にまとめる。
 * 無ければ空文字。
 * @param {string} body
 */
function approvalNote(body) {
  const lines = String(body ?? '')
    .split('\n')
    .map((ln) => ln.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim())
    .filter((ln) => ln && APPROVAL_LINE.test(ln))
    .slice(0, APPROVAL_NOTE_LINES);
  return truncate(lines.join(' / '), APPROVAL_NOTE_MAX_CHARS);
}

/** 起票日の古い順。起票日の無いカードは末尾 */
function byFiled(a, b) {
  const last = '9999-99-99';
  const fa = isIsoDate(a.filed ?? '') ? a.filed : last;
  const fb = isIsoDate(b.filed ?? '') ? b.filed : last;
  return fa.localeCompare(fb) || a.line - b.line;
}

/**
 * `[待ち:承認]` のカードの表。領域ごとにまとめ (領域名の順、領域なしは最後)、領域の中は起票の古い順。
 * @param {Array<{id:string|null,title:string,lane:string|null,waits:string[],verify:string|null,filed:string|null,body:string,line:number}>} cards parseBacklog の出力
 */
function buildApprovals(cards) {
  const rows = cards
    .filter((c) => c.waits.includes('承認'))
    .map((c) => ({
      id: c.id,
      title: c.title,
      lane: c.lane ?? NO_LANE,
      note: approvalNote(c.body),
      verify: c.verify,
      filed: c.filed,
      line: c.line,
    }));
  const laneRank = (lane) => (lane === NO_LANE ? 1 : 0);
  return rows
    .sort((a, b) => laneRank(a.lane) - laneRank(b.lane) || a.lane.localeCompare(b.lane, 'ja') || byFiled(a, b))
    .map(({ line, ...row }) => row);
}

/**
 * 期間の引数を YYYY-MM-DD の両端へ。week (YYYY-Www・月曜〜日曜) / month (YYYY-MM・1 日〜末日) / from+to のどれか 1 つ。
 * 何も無ければ today の ISO 週。
 * @param {{from?:string,to?:string,week?:string,month?:string,today:string}} input
 */
function resolveRange({ from, to, week, month, today }) {
  const given = [week ? 'week' : null, month ? 'month' : null, from || to ? 'from/to' : null].filter(Boolean);
  if (given.length > 1) throw new Error(`期間は --week / --month / --from と --to のどれか 1 つで渡す (${given.join(', ')})`);
  if (week) {
    const { monday, sunday } = isoWeekRange(week);
    return { from: monday, to: sunday, label: week };
  }
  if (month) {
    if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) throw new Error(`--month は YYYY-MM で渡す: ${month}`);
    const first = `${month}-01`;
    const nextMonth = addDays(`${month}-28`, 4).slice(0, 7);
    return { from: first, to: addDays(`${nextMonth}-01`, -1), label: month };
  }
  if (from || to) {
    if (!from || !to) throw new Error('--from と --to は両方渡す');
    return { from, to, label: `${from}〜${to}` };
  }
  const current = isoWeekOf(today);
  const { monday, sunday } = isoWeekRange(current);
  return { from: monday, to: sunday, label: current };
}

/**
 * backlog と年間計画から、期日が期間に入るカードと、期日を過ぎて残っているカード。
 * @param {{backlogText:string, annualText:string, from:string, to:string}} input
 */
function buildDue({ backlogText, annualText, from, to }) {
  const pick = (c) => ({
    due: c.due,
    source: c.source,
    month: c.month ?? null,
    id: c.id,
    title: c.title,
    waits: c.waits,
    tier: c.tier,
  });
  const { due, overdue } = backlogLib.cardsDueWithin({ backlogText, annualText, from, to });
  return { from, to, due: due.map(pick), overdue: overdue.map(pick) };
}

/** 台帳の記録日 (JST の暦日)。completedAt が無ければ最後の試行の日 */
function closedDateOf(item) {
  const at = item.completedAt ?? item.attempts?.at(-1)?.at ?? null;
  return at ? jstDateOf(at) : null;
}

/**
 * 週ごとの起票と完了の数、いまの総枚数・待ちの理由ごとの枚数・誰も持っていない古いカードの枚数。
 *
 * - 起票: いま backlog と年間計画に残っているカードの `[起票:]` を ISO 週で数える (消えたカードは数えられない)
 * - 閉じた: 実行台帳 (ledger) の status=completed の記録日。class=stale (既に済んでいたので閉じた) もここに入る
 * - 総枚数・待ち・古いカード: backlog だけを数える (年間計画は置き場が別なので総枚数の目安に入れない)
 *
 * @param {{backlogCards:any[], annualCards:any[], ledgerItems:Record<string, any>, today:string, weeks:number,
 *          target?:number, untriagedMaxAgeDays?:number}} input
 */
function buildFlow({ backlogCards, annualCards, ledgerItems, today, weeks, target, untriagedMaxAgeDays }) {
  if (!Number.isInteger(weeks) || weeks < 1) throw new Error(`weeks は 1 以上の整数: ${weeks}`);
  const targetCards = target ?? DEFAULT_BACKLOG_TARGET_CARDS;
  const maxAgeDays = untriagedMaxAgeDays ?? DEFAULT_UNTRIAGED_MAX_AGE_DAYS;
  const latestMonday = isoWeekRange(isoWeekOf(today)).monday;
  const weekIds = Array.from({ length: weeks }, (_, i) => isoWeekOf(addDays(latestMonday, -7 * (weeks - 1 - i))));
  const rows = new Map(weekIds.map((week) => [week, { week, filed: 0, closed: 0, closedStale: 0 }]));

  for (const card of [...backlogCards, ...annualCards]) {
    if (!isIsoDate(card.filed ?? '')) continue;
    const row = rows.get(isoWeekOf(card.filed));
    if (row) row.filed += 1;
  }
  for (const item of Object.values(ledgerItems ?? {})) {
    if (item?.status !== 'completed') continue;
    const date = closedDateOf(item);
    const row = date ? rows.get(isoWeekOf(date)) : null;
    if (!row) continue;
    row.closed += 1;
    if (item.class === 'stale') row.closedStale += 1;
  }

  const byWait = Object.fromEntries([...backlogLib.WAITS, NO_WAIT].map((w) => [w, 0]));
  for (const card of backlogCards) {
    if (card.waits.length === 0) byWait[NO_WAIT] += 1;
    for (const w of card.waits) byWait[w] = (byWait[w] ?? 0) + 1;
  }
  const untriagedStale = backlogCards.filter((c) => isUntriagedStale(c, today, maxAgeDays)).length;
  const total = backlogCards.length;
  return {
    today,
    weeks: weekIds.map((w) => rows.get(w)),
    total,
    annualTotal: annualCards.length,
    target: targetCards,
    overTarget: total > targetCards,
    byWait,
    untriagedStale,
    untriagedMaxAgeDays: maxAgeDays,
    limits: [
      '起票の数は、いま backlog と年間計画に残っているカードの [起票:] だけを数える。起票した後に消えたカードは数えられない。',
      '閉じた数は実行台帳 (ledger) の completed の記録日で数える。週次レビューが手で消したカードなど、台帳を通らずに消えたカードは入らない。',
    ],
  };
}

/** 表のセル用: 改行と | を潰す */
function cell(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
}

function code(value) {
  if (!value) return '';
  return value.includes('`') ? cell(value) : `\`${cell(value)}\``;
}

function formatApprovals(rows) {
  const lines = [`## 承認待ち (${rows.length} 枚・領域ごと・起票の古い順)`, ''];
  if (rows.length === 0) return [...lines, '承認待ちのカードはありません。', ''].join('\n');
  lines.push('| ID | 題 | 領域 | 何を承認するか | 検証 | 起票 |', '|---|---|---|---|---|---|');
  for (const r of rows) {
    lines.push(`| \`${cell(r.id ?? '—')}\` | ${cell(r.title)} | ${cell(r.lane)} | ${cell(r.note)} | ${code(r.verify)} | ${cell(r.filed ?? '—')} |`);
  }
  return [...lines, ''].join('\n');
}

function dueTable(rows) {
  if (rows.length === 0) return ['該当なし。'];
  return [
    '| 期日 | 置き場 | ID | 題 | 待ち |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${cell(r.due)} | ${r.source} | \`${cell(r.id ?? '—')}\` | ${cell(r.title)} | ${cell(r.waits.join('・') || '—')} |`),
  ];
}

function formatDue(report, label) {
  return [
    `## 期日が ${report.from}〜${report.to}${label ? ` (${label})` : ''} のカード (${report.due.length} 枚)`,
    '',
    ...dueTable(report.due),
    '',
    `## 期日を過ぎて残っているカード (${report.overdue.length} 枚・期日が ${report.from} より前)`,
    '',
    ...dueTable(report.overdue),
    '',
  ].join('\n');
}

function formatFlow(flow) {
  const waits = Object.entries(flow.byWait).map(([w, n]) => `${w} ${n}`).join(' / ');
  return [
    `## backlog の流入と流出 (直近 ${flow.weeks.length} 週・${flow.today} 時点)`,
    '',
    '| 週 | 起票 | 閉じた | うち stale |',
    '|---|---:|---:|---:|',
    ...flow.weeks.map((w) => `| ${w.week} | ${w.filed} | ${w.closed} | ${w.closedStale} |`),
    '',
    '| 項目 | 値 |',
    '|---|---|',
    `| backlog の総枚数 | ${flow.total} / 目安 ${flow.target}${flow.overTarget ? ` (${flow.total - flow.target} 枚超過)` : ''} |`,
    `| 年間計画の枚数 | ${flow.annualTotal} |`,
    `| 待ちの理由ごと (backlog) | ${waits} |`,
    `| 起票から ${flow.untriagedMaxAgeDays} 日を超えて誰も持っていない (DG093) | ${flow.untriagedStale} |`,
    '',
    ...flow.limits.map((l) => `注: ${l}`),
    '',
  ].join('\n');
}

module.exports = {
  APPROVAL_NOTE_MAX_CHARS,
  DEFAULT_BACKLOG_TARGET_CARDS,
  approvalNote,
  buildApprovals,
  resolveRange,
  buildDue,
  buildFlow,
  formatApprovals,
  formatDue,
  formatFlow,
};
