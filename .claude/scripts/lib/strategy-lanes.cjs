'use strict';

/**
 * 戦略領域 (収益化戦略の優先順位表) の読み取りと、月次・週次・バックログとの整合検査。
 *
 * 正典: docs/00_プロジェクト管理/02_収益化戦略.md §5「戦略領域と優先順位」の
 *       `<!-- strategy-lanes:start -->` 〜 `end` の表。領域の名前・構え・順番はそこだけに書く。
 *       ここに領域名の写しを持たない (手で二重管理すると必ずずれる)。
 *
 * KPI: 領域表の KPI 列と improvements.md の `[kpi: id]` は、事業計画 catalog の KPI ツリー
 *      (`.claude/state/business-plan/kpi-tree.json`、`npm run business-plan:build-state` が生成) の id だけを参照できる。
 *
 * 計画の規律: 🔴 の上限と鮮度 (DG081)、連続未達 Must の再掲禁止 (DG082)、週次 Must と 🔴 上位の接続 (DG083)。
 *
 * 利用者: check-docs-governance.cjs (DG073〜DG083)・週次メトリクス Issue (cycle-health.mjs)・管理画面 /strategy/lanes。
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
const COLUMNS = ['順', '領域', '構え', '今の狙い', '構えを変える条件', '改善Metric', 'KPI'];
const KPI_TREE = '.claude/state/business-plan/kpi-tree.json';
const DOMAINS_JSON = '.claude/config/domains.json';
/**
 * 同時に判定まで回す active 施策の上限。超えている間は新しい施策を足さず、月次計画で削る。
 * 2026-09-27 に active 29 件・判定済み 5 件 (improvements.md) だった実測から、一人運用で週次に判定を回せる量として置いた運用方針値。
 */
const MAX_ACTIVE_IMPROVEMENTS = 10;
/**
 * バックログ 🔴 (今月中に着手したい) の上限と鮮度。🔴 は起票時に付いたまま下がらず、2026-09-27 に 31 枚
 * (うち 29 枚が 9 月起票) まで膨らみ、週次 Must 3 件も未達だった。🔴 は「今月の重点で今月着手するもの」に限る。
 * 上限は週次 Must 3 件 × 月 4 週を下回る運用方針値。値はここだけに置く (DG081 と週次 Issue が共有)。
 */
const MAX_HIGH_TIER_CARDS = 10;
const HIGH_TIER_MAX_AGE_DAYS = 30;
/** 連続未達がこの週数以上なら、未達 Must を同じ形で次週 Must に再掲させない (DG082)。cycle-health と共有 */
const MUST_MISS_STREAK_LIMIT = 2;
/**
 * 週次 Must が参照すべき 🔴 の上位枚数。🔴 は並び順が着手順 (2026-09-27 オーナー判断) で、月次に付け替えても
 * 週の Must が別作業で埋まれば進まない (W37〜38 は Must 0〜1/3・計画外 226 コミット)。DG083 と週次 Issue が共有する
 */
const HIGH_TIER_TOP_N = 3;
/** オーナー作業のカードは Must ではなく「オーナー作業」として出すので、上位の数え方から外す */
const OWNER_EXECUTOR = 'ユーザー';
/** 分割して 1 週で届く大きさにした持ち越し Must に付ける目印 */
const SPLIT_MARKER = '[分割]';
const REVIEWS_DIR = '.claude/skills/management/weekly-review/reference/reviews';
const KPI_MARKER = /\[kpi:\s*([^\]]+)\]/;
const TARGET_MARKER = /\[target:\s*[^\]]+\]/;
const PLAN_SECTIONS = ['Must', 'Should', 'Could'];

function cellsOf(line) {
  return line.split('|').slice(1, -1).map((c) => c.trim());
}

/** 収益化戦略の本文から領域表を読む。表の破損は errors に積み、例外にしない。 */
function parseLanes(text) {
  const src = String(text ?? '').replace(/\r\n/g, '\n');
  const errors = [];
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s < 0 || e < 0 || e < s) {
    return { lanes: [], errors: [`領域表のマーカー (${START} / ${END}) が見つからない`] };
  }
  const rows = src
    .slice(s + START.length, e)
    .split('\n')
    .filter((l) => l.trim().startsWith('|'));
  if (rows.length === 0) return { lanes: [], errors: ['領域表が空'] };
  const header = cellsOf(rows[0]);
  if (header.join('|') !== COLUMNS.join('|')) {
    errors.push(`領域表の列が契約と違う: ${header.join(' | ')} (期待: ${COLUMNS.join(' | ')})`);
    return { lanes: [], errors };
  }
  const lanes = [];
  for (const row of rows.slice(1)) {
    const cells = cellsOf(row);
    if (cells.every((c) => /^[-:\s]*$/.test(c))) continue;
    if (cells.length !== COLUMNS.length) {
      errors.push(`領域表の行の列数が違う: ${row.trim()}`);
      continue;
    }
    const [order, name, stance, aim, gate, metrics, kpis] = cells;
    if (!/^\d+$/.test(order)) errors.push(`${name} の順が整数でない: ${order}`);
    if (!name) errors.push('領域名が空の行がある');
    if (!STANCES.includes(stance)) errors.push(`${name} の構えが語彙外: ${stance} (${STANCES.join(' / ')})`);
    if (lanes.some((l) => l.name === name)) errors.push(`領域名が重複: ${name}`);
    lanes.push({
      order: Number(order),
      name,
      stance,
      aim,
      gate,
      improvementMetrics: metrics === '—' || metrics === '' ? [] : metrics.split(',').map((m) => m.trim()),
      kpis: kpis === '—' || kpis === '' ? [] : kpis.split(',').map((m) => m.trim()),
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

/** improvements.md の Metric 値から領域を引く。`ga4/note` は対応のある最後の語で決める。 */
function resolveImprovementLane(metric, lanes) {
  const tokens = String(metric ?? '').split('/').map((t) => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const lane = lanes.find((l) => l.improvementMetrics.includes(tokens[i]));
    if (lane) return lane.name;
  }
  return null;
}

/** 週次レビュー本文から「Must N/M」を取る。書式は「Must **0/3**」と「Must 1/3」の両方がある */
function parseMustRatio(reviewText) {
  const m = String(reviewText ?? '').match(/Must\s*\*{0,2}(\d+)\/(\d+)\*{0,2}/);
  return m ? { done: Number(m[1]), planned: Number(m[2]) } : null;
}

/** 週次レビューの結果表で「| Must … | **未達** |」の行に出てくる ID。 */
function parseUnmetMustIds(reviewText) {
  const ids = new Set();
  for (const ln of String(reviewText ?? '').replace(/\r\n/g, '\n').split('\n')) {
    if (!/^\|\s*Must\b/.test(ln) || !/未達/.test(ln)) continue;
    for (const m of ln.matchAll(/`([A-Z0-9]+(?:-[A-Z0-9]+)+)`/g)) ids.add(m[1]);
  }
  return [...ids];
}

/** 新しい週から並べたレビュー [{week, text}] の、最新週・連続未達週数・最新週の未達 Must ID。 */
function summarizeReviews(reviews) {
  let missStreak = 0;
  for (const r of reviews) {
    const ratio = parseMustRatio(r.text);
    if (!ratio || ratio.done >= ratio.planned) break;
    missStreak += 1;
  }
  const latest = reviews[0] ?? null;
  return {
    latestWeek: latest?.week ?? null,
    latestRatio: latest ? parseMustRatio(latest.text) : null,
    missStreak,
    unmetIds: latest ? parseUnmetMustIds(latest.text) : [],
  };
}

const daysSince = (date, today) => Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);

/**
 * 計画の規律 (純関数)。
 * DG081 (warning): 🔴 が上限超過 / 起票から HIGH_TIER_MAX_AGE_DAYS 日を過ぎた未着手の 🔴。月次計画で 🟡 へ下げるか分割する。
 * DG082 (error): 連続未達が MUST_MISS_STREAK_LIMIT 週以上なのに、前週の未達 Must を [分割] なしで今週の Must に再掲した。
 * DG083 (warning): 今週の Must が 🔴 の上位 HIGH_TIER_TOP_N 枚 (オーナー作業を除く) をどれも参照していない。
 *   損失の出ている不具合カードを Must に入れた週は、重点外でも許す (DG077 と同じ例外)。
 */
function auditPlanDiscipline({ cards, weeklyText, reviews, today, files }) {
  const issues = [];
  const high = cards.filter((c) => c.tier === 'high');
  if (high.length > MAX_HIGH_TIER_CARDS) {
    issues.push({ level: 'warning', code: 'DG081', file: files.backlog, message: `🔴 が ${high.length} 枚で上限 ${MAX_HIGH_TIER_CARDS} 枚を超えている。月次計画で今月の重点・不具合以外を 🟡 へ下げる` });
  }
  const staleHigh = today ? high.filter((c) => c.filed && !c.wip && daysSince(c.filed, today) > HIGH_TIER_MAX_AGE_DAYS).map((c) => c.id ?? c.title) : [];
  if (staleHigh.length) {
    issues.push({ level: 'warning', code: 'DG081', file: files.backlog, message: `起票から ${HIGH_TIER_MAX_AGE_DAYS} 日を過ぎた未着手の 🔴 ${staleHigh.length} 枚: ${staleHigh.join(', ')}。🟡 へ下げるか 1 か月で終わる大きさに分割する` });
  }
  const review = summarizeReviews(reviews);
  const planWeek = (String(weeklyText ?? '').match(/^week:\s*(\S+)/m) ?? [])[1] ?? null;
  const repeated = [];
  if (review.missStreak >= MUST_MISS_STREAK_LIMIT && planWeek && review.latestWeek && planWeek > review.latestWeek) {
    const unmet = new Set(review.unmetIds);
    for (const item of parseWeeklyItems(weeklyText)) {
      if (item.section !== 'Must' || item.text.includes(SPLIT_MARKER)) continue;
      // 主 ID (項目で最初に書いた ID) だけで見る。本文で他の施策に触れただけの項目を再掲と数えない
      // (2026-W39 の Must 1 は AFF-MEASURE-RECOVER-01 の作業で、前週未達の AFF-IMPRESSION-ROUTING-01 に言及していた)
      const primary = item.ids[0];
      if (primary && unmet.has(primary)) repeated.push(`L${item.line} ${primary}`);
    }
  }
  for (const r of repeated) {
    issues.push({ level: 'error', code: 'DG082', file: files.weekly, message: `Must が ${review.missStreak} 週連続未達なのに、${review.latestWeek} の未達 Must を同じ形で再掲している (${r})。1 週で届く完了条件に分割して見出しに ${SPLIT_MARKER} を付けるか、Should へ降格する` });
  }
  // 🔴 の上位 (ファイル上の並び順 = 着手順)。オーナー作業は Must ではなく別枠で出す
  const topHigh = high.filter((c) => c.id && c.executor !== OWNER_EXECUTOR).slice(0, HIGH_TIER_TOP_N).map((c) => c.id);
  const ownerHigh = high.filter((c) => c.id && c.executor === OWNER_EXECUTOR).map((c) => c.id);
  const mustItems = weeklyText ? parseWeeklyItems(weeklyText).filter((i) => i.section === 'Must') : [];
  const mustIds = new Set(mustItems.flatMap((i) => i.ids));
  const kindById = new Map(cards.filter((c) => c.id).map((c) => [c.id, c.kind]));
  const coveredTop = topHigh.filter((id) => mustIds.has(id));
  const hasDefectMust = [...mustIds].some((id) => kindById.get(id) === backlogLib.DEFECT_KIND);
  if (mustItems.length > 0 && topHigh.length > 0 && coveredTop.length === 0 && !hasDefectMust) {
    issues.push({ level: 'warning', code: 'DG083', file: files.weekly, message: `今週の Must が 🔴 の上位 ${topHigh.length} 枚 (${topHigh.join(', ')}) をどれも参照していない。🔴 は並び順が着手順なので、上から Must に入れる` });
  }
  return { issues, highCount: high.length, staleHigh, review, repeated, topHigh, coveredTop, ownerHigh };
}

/** improvements.md のタイトルにある `[kpi: a, b]` の id 列。目印が無ければ null。 */
function parseKpiMarker(title) {
  const m = String(title ?? '').match(KPI_MARKER);
  return m ? m[1].split(',').map((id) => id.trim()).filter(Boolean) : null;
}

/** improvements.md の 6 列表から ID・タイトル・Status・Metric を取る。 */
function parseImprovementRows(text) {
  const out = [];
  let inTier = false;
  String(text ?? '').replace(/\r\n/g, '\n').split('\n').forEach((ln, i) => {
    if (/^## /.test(ln)) inTier = /^## Tier /.test(ln);
    if (!inTier || !ln.startsWith('|')) return;
    const cells = cellsOf(ln);
    if (cells.length !== 6 || cells[0] === 'ID' || /^[-:\s]+$/.test(cells[0])) return;
    out.push({
      id: cells[0],
      title: cells[1],
      status: cells[2],
      metric: cells[5],
      kpis: parseKpiMarker(cells[1]),
      hasTarget: TARGET_MARKER.test(cells[1]),
      line: i + 1,
    });
  });
  return out;
}

/** monthly.md の frontmatter `focus_domains`。無ければ null (未設定と空配列を区別する)。 */
function parseFocusLanes(monthlyText) {
  const m = String(monthlyText ?? '').replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const lines = m[1].split('\n');
  const idx = lines.findIndex((l) => /^focus_domains:/.test(l));
  if (idx < 0) return null;
  const inline = lines[idx].replace(/^focus_domains:\s*/, '').trim();
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
/**
 * 施策 → KPI の配線 (純関数)。kpiNodes が null (KPI ツリー未生成) なら検査しない。
 * DG079 (error): 領域表の KPI 列・施策の `[kpi:]` が KPI ツリーに無い id / 施策に `[kpi:]` が無い。
 * DG080 (warning): active 施策が上限超過 / `[target:]` の無い施策 (効果判定エンジンが insufficient-target で止まる)。
 */
function auditKpiLinkage({ lanes, improvementRows, kpiNodes, files }) {
  const issues = [];
  if (!kpiNodes) {
    issues.push({ level: 'warning', code: 'DG079', file: KPI_TREE, message: 'KPI ツリーが無い。`npm run business-plan:build-state` で生成する' });
    return { issues, byKpi: new Map() };
  }
  const known = new Set(kpiNodes.map((n) => n.id));
  for (const lane of lanes) {
    for (const id of lane.kpis) {
      if (!known.has(id)) issues.push({ level: 'error', code: 'DG079', file: files.strategy, message: `領域 ${lane.name} の KPI が KPI ツリーに無い: ${id}` });
    }
  }
  const byKpi = new Map(kpiNodes.map((n) => [n.id, []]));
  for (const row of improvementRows) {
    if (!row.kpis || row.kpis.length === 0) {
      issues.push({ level: 'error', code: 'DG079', file: files.improvements, message: `${row.id} に [kpi: <id>] が無い。どの KPI を動かす施策かを KPI ツリーの id で書く` });
      continue;
    }
    for (const id of row.kpis) {
      if (!known.has(id)) issues.push({ level: 'error', code: 'DG079', file: files.improvements, message: `${row.id} の [kpi: ${id}] が KPI ツリーに無い (${[...known].join(', ')})` });
      else byKpi.get(id).push(row.id);
    }
  }
  if (improvementRows.length > MAX_ACTIVE_IMPROVEMENTS) {
    issues.push({ level: 'warning', code: 'DG080', file: files.improvements, message: `active 施策 ${improvementRows.length} 件が上限 ${MAX_ACTIVE_IMPROVEMENTS} 件を超えている。新しい施策を足さず、月次計画で判定・backlog 降格して削る` });
  }
  const noTarget = improvementRows.filter((r) => !r.hasTarget).map((r) => r.id);
  if (noTarget.length) {
    issues.push({ level: 'warning', code: 'DG080', file: files.improvements, message: `[target:] の無い施策 ${noTarget.length} 件 (効果を機械判定できない): ${noTarget.join(', ')}` });
  }
  return { issues, byKpi };
}

function auditLaneAlignment({ strategyText, backlogText, improvementsText, monthlyText, weeklyText, kpiNodes = null, reviews = [], today = null, files = {}, domainLabels = null }) {
  const f = {
    strategy: STRATEGY_DOC,
    backlog: '.claude/todo/backlog.md',
    monthly: '.claude/todo/monthly.md',
    weekly: '.claude/todo/weekly.md',
    improvements: '.claude/todo/improvements.md',
    ...files,
  };
  const issues = [];
  const add = (level, code, file, message) => issues.push({ level, code, file, message });

  const { lanes, errors } = parseLanes(strategyText);
  for (const err of errors) add('error', 'DG073', f.strategy, err);
  // 領域表の名前は領域の正本 domains.json の label と一致させる (サイドメニュー・タグ・月次重点が同じ語を使う)
  if (domainLabels && lanes.length) {
    const names = new Set(lanes.map((l) => l.name));
    for (const label of domainLabels) if (!names.has(label)) add('error', 'DG073', f.strategy, `domains.json の領域が領域表に無い: ${label}`);
    for (const name of names) if (!domainLabels.includes(name)) add('error', 'DG073', f.strategy, `領域表の領域が domains.json に無い: ${name}`);
  }
  const byName = new Map(lanes.map((l) => [l.name, l]));

  // backlog カードの領域
  const cards = backlogLib.parseBacklog(backlogText);
  const idIndex = new Map();
  let noLane = 0;
  for (const card of cards) {
    const label = card.id ?? `L${card.line} ${card.title}`;
    if (card.lane && lanes.length && !byName.has(card.lane)) {
      add('error', 'DG074', f.backlog, `${label}の領域が収益化戦略の領域表に無い: ${card.lane}`);
    }
    if (!card.lane) noLane += 1;
    if (card.id) idIndex.set(card.id, { lane: card.lane, kind: card.kind, source: 'backlog', title: card.title });
  }
  if (noLane > 0) {
    add('warning', 'DG075', f.backlog, `領域未設定 ${noLane} 件 / 全 ${cards.length} カード — todo-curator が漸次付与する`);
  }
  const improvementRows = parseImprovementRows(improvementsText);
  const kpi = auditKpiLinkage({ lanes, improvementRows, kpiNodes, files: f });
  issues.push(...kpi.issues);
  const discipline = auditPlanDiscipline({ cards, weeklyText, reviews, today, files: f });
  issues.push(...discipline.issues);
  for (const row of improvementRows) {
    if (!idIndex.has(row.id)) {
      idIndex.set(row.id, { lane: resolveImprovementLane(row.metric, lanes), kind: null, source: 'improvements', title: row.id });
    }
  }

  // 月次の重点領域
  const focusLanes = parseFocusLanes(monthlyText);
  if (focusLanes === null) {
    add('warning', 'DG076', f.monthly, 'frontmatter に focus_domains が無い。収益化戦略の「攻める」領域から1〜2個選ぶ');
  } else {
    if (focusLanes.length === 0 || focusLanes.length > 2) {
      add('warning', 'DG076', f.monthly, `focus_domains は1〜2個にする (現在 ${focusLanes.length} 個)`);
    }
    for (const name of focusLanes) {
      const lane = byName.get(name);
      if (!lane) add('error', 'DG076', f.monthly, `focus_domains の領域が収益化戦略に無い: ${name}`);
      else if (lane.stance !== ATTACK) {
        add('error', 'DG076', f.monthly, `focus_domains に「${lane.stance}」の領域は置けない: ${name} (攻めるだけ)`);
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
      add('error', 'DG078', f.weekly, `${where} は凍結領域 (${item.lanes.join(', ')}) の不具合以外のタスク`);
    }
    if (item.section !== 'Must') continue;
    if (item.status === 'unresolved') {
      add('warning', 'DG077', f.weekly, `${where} の領域を引けない (backlog / improvements にある ID を参照する)${note}`);
    } else if (item.status === 'off-focus' && focusLanes !== null) {
      add('warning', 'DG077', f.weekly, `${where} は今月の重点領域外 (${item.lanes.join(', ')})${note}`);
    }
  }

  const cardLanes = new Map(lanes.map((l) => [l.name, []]));
  for (const card of cards) if (card.lane && cardLanes.has(card.lane)) cardLanes.get(card.lane).push(card);

  return { lanes, focusLanes, cards, cardLanes, idIndex, weekly, kpiNodes, kpiLinks: kpi.byKpi, discipline, issues };
}

/** 週次レビューを新しい週から [{week, text}] で読む。 */
function readReviews(root) {
  const dir = path.join(root, REVIEWS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-W\d{2}\.md$/.test(f))
    .sort()
    .reverse()
    .map((f) => ({ week: f.replace(/\.md$/, ''), text: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

/** 領域の正本 domains.json の label 一覧。無ければ null (照合しない)。 */
function readDomainLabels(root) {
  const abs = path.join(root, DOMAINS_JSON);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')).domains.map((d) => d.label);
}

/** KPI ツリーの nodes。無い・壊れているときは null (検査側が DG079 warning にする)。 */
function readKpiNodes(root) {
  const abs = path.join(root, KPI_TREE);
  if (!fs.existsSync(abs)) return null;
  try {
    const nodes = JSON.parse(fs.readFileSync(abs, 'utf8')).nodes;
    return Array.isArray(nodes) ? nodes : null;
  } catch {
    return null;
  }
}

/**
 * リポジトリの実ファイルから整合検査する (governance / 管理画面の入口)。
 * 収益化戦略そのものが無い root (governance テストの fixture) では検査しない。
 * 実リポジトリでの存在は 00_プロジェクト管理 の固定構成検査が保証する。
 */
function laneBoard(root, today = new Date().toISOString().slice(0, 10)) {
  if (!fs.existsSync(path.join(root, STRATEGY_DOC))) {
    return { lanes: [], focusLanes: null, cards: [], cardLanes: new Map(), idIndex: new Map(), weekly: [], kpiNodes: null, kpiLinks: new Map(), discipline: null, issues: [], skipped: true };
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
    kpiNodes: readKpiNodes(root),
    reviews: readReviews(root),
    today,
    domainLabels: readDomainLabels(root),
  });
}

module.exports = {
  STRATEGY_DOC,
  STANCES,
  COLUMNS,
  KPI_TREE,
  MAX_ACTIVE_IMPROVEMENTS,
  MAX_HIGH_TIER_CARDS,
  HIGH_TIER_MAX_AGE_DAYS,
  MUST_MISS_STREAK_LIMIT,
  HIGH_TIER_TOP_N,
  SPLIT_MARKER,
  parseMustRatio,
  parseUnmetMustIds,
  summarizeReviews,
  auditPlanDiscipline,
  readReviews,
  parseLanes,
  parseKpiMarker,
  auditKpiLinkage,
  readKpiNodes,
  resolveImprovementLane,
  parseImprovementRows,
  parseFocusLanes,
  parseWeeklyItems,
  auditLaneAlignment,
  laneBoard,
};
