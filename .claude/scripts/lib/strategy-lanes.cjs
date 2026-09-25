'use strict';

/**
 * 戦略レーン (収益化戦略の優先順位表) の読み取りと、月次・週次・バックログとの整合検査。
 *
 * 正典: docs/00_プロジェクト管理/02_収益化戦略.md §5「戦略レーンと優先順位」の
 *       `<!-- strategy-lanes:start -->` 〜 `end` の表。レーンの名前・構え・順番はそこだけに書く。
 *       ここにレーン名の写しを持たない (手で二重管理すると必ずずれる)。
 *
 * 利用者: check-docs-governance.cjs (DG073〜DG078) と管理画面 /strategy/lanes。
 * カードのパースは backlog-lib.cjs を使い、ここでは別実装を持たない。
 */

const fs = require('node:fs');
const path = require('node:path');
const backlogLib = require('./backlog-lib.cjs');

const STRATEGY_DOC = 'docs/00_プロジェクト管理/02_収益化戦略.md';
const STANCES = ['攻める', '維持', '凍結'];
const ATTACK = '攻める';
const FROZEN = '凍結';
const START = '<!-- strategy-lanes:start -->';
const END = '<!-- strategy-lanes:end -->';
const COLUMNS = ['順', 'レーン', '構え', '今の狙い', '構えを変える条件', '改善Metric'];
const PLAN_SECTIONS = ['Must', 'Should', 'Could'];

function cellsOf(line) {
  return line.split('|').slice(1, -1).map((c) => c.trim());
}

/** 収益化戦略の本文からレーン表を読む。表の破損は errors に積み、例外にしない。 */
function parseLanes(text) {
  const src = String(text ?? '').replace(/\r\n/g, '\n');
  const errors = [];
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s < 0 || e < 0 || e < s) {
    return { lanes: [], errors: [`レーン表のマーカー (${START} / ${END}) が見つからない`] };
  }
  const rows = src
    .slice(s + START.length, e)
    .split('\n')
    .filter((l) => l.trim().startsWith('|'));
  if (rows.length === 0) return { lanes: [], errors: ['レーン表が空'] };
  const header = cellsOf(rows[0]);
  if (header.join('|') !== COLUMNS.join('|')) {
    errors.push(`レーン表の列が契約と違う: ${header.join(' | ')} (期待: ${COLUMNS.join(' | ')})`);
    return { lanes: [], errors };
  }
  const lanes = [];
  for (const row of rows.slice(1)) {
    const cells = cellsOf(row);
    if (cells.every((c) => /^[-:\s]*$/.test(c))) continue;
    if (cells.length !== COLUMNS.length) {
      errors.push(`レーン表の行の列数が違う: ${row.trim()}`);
      continue;
    }
    const [order, name, stance, aim, gate, metrics] = cells;
    if (!/^\d+$/.test(order)) errors.push(`${name} の順が整数でない: ${order}`);
    if (!name) errors.push('レーン名が空の行がある');
    if (!STANCES.includes(stance)) errors.push(`${name} の構えが語彙外: ${stance} (${STANCES.join(' / ')})`);
    if (lanes.some((l) => l.name === name)) errors.push(`レーン名が重複: ${name}`);
    lanes.push({
      order: Number(order),
      name,
      stance,
      aim,
      gate,
      improvementMetrics: metrics === '—' || metrics === '' ? [] : metrics.split(',').map((m) => m.trim()),
    });
  }
  const orders = lanes.map((l) => l.order);
  if (new Set(orders).size !== orders.length) errors.push('順が重複している');
  const claimed = new Map();
  for (const lane of lanes) {
    for (const m of lane.improvementMetrics) {
      if (claimed.has(m)) errors.push(`改善Metric ${m} が ${claimed.get(m)} と ${lane.name} の両方にある`);
      claimed.set(m, lane.name);
    }
  }
  lanes.sort((a, b) => a.order - b.order);
  return { lanes, errors };
}

/** improvements.md の Metric 値からレーンを引く。`ga4/note` は対応のある最後の語で決める。 */
function resolveImprovementLane(metric, lanes) {
  const tokens = String(metric ?? '').split('/').map((t) => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const lane = lanes.find((l) => l.improvementMetrics.includes(tokens[i]));
    if (lane) return lane.name;
  }
  return null;
}

/** improvements.md の 6 列表から ID と Metric だけを取る。 */
function parseImprovementRows(text) {
  const out = [];
  let inTier = false;
  String(text ?? '').replace(/\r\n/g, '\n').split('\n').forEach((ln, i) => {
    if (/^## /.test(ln)) inTier = /^## Tier /.test(ln);
    if (!inTier || !ln.startsWith('|')) return;
    const cells = cellsOf(ln);
    if (cells.length !== 6 || cells[0] === 'ID' || /^[-:\s]+$/.test(cells[0])) return;
    out.push({ id: cells[0], metric: cells[5], line: i + 1 });
  });
  return out;
}

/** monthly.md の frontmatter `focus_lanes`。無ければ null (未設定と空配列を区別する)。 */
function parseFocusLanes(monthlyText) {
  const m = String(monthlyText ?? '').replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const lines = m[1].split('\n');
  const idx = lines.findIndex((l) => /^focus_lanes:/.test(l));
  if (idx < 0) return null;
  const inline = lines[idx].replace(/^focus_lanes:\s*/, '').trim();
  if (inline.startsWith('[')) {
    return inline.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  const out = [];
  for (const l of lines.slice(idx + 1)) {
    const item = l.match(/^\s+-\s+(.+)$/);
    if (!item) break;
    out.push(item[1].trim().replace(/^["']|["']$/g, ''));
  }
  return out;
}

/** weekly.md の「### Must / Should / Could」配下のチェックボックス行と参照 ID。 */
function parseWeeklyItems(weeklyText) {
  const out = [];
  let section = null;
  String(weeklyText ?? '').replace(/\r\n/g, '\n').split('\n').forEach((ln, i) => {
    const h3 = ln.match(/^###\s+(\S+)/);
    if (h3) {
      section = PLAN_SECTIONS.find((s) => h3[1].startsWith(s)) ?? null;
      return;
    }
    if (/^##\s/.test(ln)) {
      section = null;
      return;
    }
    if (!section) return;
    const item = ln.match(/^- \[([ xX])\]\s+(.*)$/);
    if (!item) return;
    const ids = [...item[2].matchAll(/`([A-Z0-9]+(?:-[A-Z0-9]+)+)`/g)].map((m) => m[1]);
    out.push({
      section,
      line: i + 1,
      done: item[1] !== ' ',
      text: item[2].replace(/\s+—.*$/, '').replace(/\*\*/g, '').replace(/\s*\[[SML]\]$/, '').trim(),
      ids: [...new Set(ids)],
    });
  });
  return out;
}

/**
 * 整合検査の本体 (純関数)。ファイル I/O は laneBoard が行う。
 *
 * @returns {{lanes, focusLanes, cardLanes: Map, weekly, issues: Array<{level, code, file, message}>}}
 */
function auditLaneAlignment({ strategyText, backlogText, improvementsText, monthlyText, weeklyText, files = {} }) {
  const f = {
    strategy: STRATEGY_DOC,
    backlog: '.claude/todo/backlog.md',
    monthly: '.claude/todo/monthly.md',
    weekly: '.claude/todo/weekly.md',
    ...files,
  };
  const issues = [];
  const add = (level, code, file, message) => issues.push({ level, code, file, message });

  const { lanes, errors } = parseLanes(strategyText);
  for (const err of errors) add('error', 'DG073', f.strategy, err);
  const byName = new Map(lanes.map((l) => [l.name, l]));

  // backlog カードのレーン
  const cards = backlogLib.parseBacklog(backlogText);
  const idIndex = new Map();
  let noLane = 0;
  for (const card of cards) {
    const label = card.id ?? `L${card.line} ${card.title}`;
    if (card.lane && lanes.length && !byName.has(card.lane)) {
      add('error', 'DG074', f.backlog, `${label}のレーンが収益化戦略のレーン表に無い: ${card.lane}`);
    }
    if (!card.lane) noLane += 1;
    if (card.id) idIndex.set(card.id, { lane: card.lane, kind: card.kind, source: 'backlog', title: card.title });
  }
  if (noLane > 0) {
    add('warning', 'DG075', f.backlog, `レーン未設定 ${noLane} 件 / 全 ${cards.length} カード — todo-curator が漸次付与する`);
  }
  for (const row of parseImprovementRows(improvementsText)) {
    if (!idIndex.has(row.id)) {
      idIndex.set(row.id, { lane: resolveImprovementLane(row.metric, lanes), kind: null, source: 'improvements', title: row.id });
    }
  }

  // 月次の重点レーン
  const focusLanes = parseFocusLanes(monthlyText);
  if (focusLanes === null) {
    add('warning', 'DG076', f.monthly, 'frontmatter に focus_lanes が無い。収益化戦略の「攻める」レーンから1〜2個選ぶ');
  } else {
    if (focusLanes.length === 0 || focusLanes.length > 2) {
      add('warning', 'DG076', f.monthly, `focus_lanes は1〜2個にする (現在 ${focusLanes.length} 個)`);
    }
    for (const name of focusLanes) {
      const lane = byName.get(name);
      if (!lane) add('error', 'DG076', f.monthly, `focus_lanes のレーンが収益化戦略に無い: ${name}`);
      else if (lane.stance !== ATTACK) {
        add('error', 'DG076', f.monthly, `focus_lanes に「${lane.stance}」のレーンは置けない: ${name} (攻めるだけ)`);
      }
    }
  }

  // 週次計画の各項目
  const focus = new Set(focusLanes ?? []);
  const weekly = parseWeeklyItems(weeklyText).map((item) => {
    const refs = item.ids.map((id) => ({ id, ...(idIndex.get(id) ?? { lane: null, kind: null, source: null }) }));
    const lanesOfItem = [...new Set(refs.map((r) => r.lane).filter(Boolean))];
    const defect = refs.some((r) => r.kind === backlogLib.DEFECT_KIND);
    let status = 'aligned';
    if (lanesOfItem.length === 0) status = 'unresolved';
    else if (lanesOfItem.some((n) => byName.get(n)?.stance === FROZEN) && !defect) status = 'frozen';
    else if (!lanesOfItem.some((n) => focus.has(n)) && !defect) status = 'off-focus';
    return { ...item, refs, lanes: lanesOfItem, defect, status };
  });
  for (const item of weekly) {
    const where = `${item.section} L${item.line}「${item.text.slice(0, 40)}」`;
    const missing = item.refs.filter((r) => r.source === null).map((r) => r.id);
    const note = missing.length ? ` — 台帳に無い ID: ${missing.join(', ')}` : '';
    if (item.status === 'frozen') {
      add('error', 'DG078', f.weekly, `${where} は凍結レーン (${item.lanes.join(', ')}) の不具合以外のタスク`);
    }
    if (item.section !== 'Must') continue;
    if (item.status === 'unresolved') {
      add('warning', 'DG077', f.weekly, `${where} のレーンを引けない (backlog / improvements にある ID を参照する)${note}`);
    } else if (item.status === 'off-focus' && focusLanes !== null) {
      add('warning', 'DG077', f.weekly, `${where} は今月の重点レーン外 (${item.lanes.join(', ')})${note}`);
    }
  }

  const cardLanes = new Map(lanes.map((l) => [l.name, []]));
  for (const card of cards) if (card.lane && cardLanes.has(card.lane)) cardLanes.get(card.lane).push(card);

  return { lanes, focusLanes, cards, cardLanes, idIndex, weekly, issues };
}

/**
 * リポジトリの実ファイルから整合検査する (governance / 管理画面の入口)。
 * 収益化戦略そのものが無い root (governance テストの fixture) では検査しない。
 * 実リポジトリでの存在は 00_プロジェクト管理 の固定構成検査が保証する。
 */
function laneBoard(root) {
  if (!fs.existsSync(path.join(root, STRATEGY_DOC))) {
    return { lanes: [], focusLanes: null, cards: [], cardLanes: new Map(), idIndex: new Map(), weekly: [], issues: [], skipped: true };
  }
  const read = (rel) => {
    const abs = path.join(root, rel);
    return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  };
  return auditLaneAlignment({
    strategyText: read(STRATEGY_DOC),
    backlogText: read('.claude/todo/backlog.md'),
    improvementsText: read('.claude/todo/improvements.md'),
    monthlyText: read('.claude/todo/monthly.md'),
    weeklyText: read('.claude/todo/weekly.md'),
  });
}

module.exports = {
  STRATEGY_DOC,
  STANCES,
  COLUMNS,
  parseLanes,
  resolveImprovementLane,
  parseImprovementRows,
  parseFocusLanes,
  parseWeeklyItems,
  auditLaneAlignment,
  laneBoard,
};
