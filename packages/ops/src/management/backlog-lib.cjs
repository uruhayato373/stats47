'use strict';

/**
 * backlog-lib.cjs — .claude/todo/backlog.md の機械読取 (純関数)。
 * ---------------------------------------------------------------------------
 * **doboku-note `scripts/lib/backlog-lib.mjs` (schema v3) の port + stats47 拡張 (v3-unified)。**
 * 語彙・カード構文は両リポで統一する。正典 (人間向け規約) は
 * `.claude/rules/todo-standards.md` / doboku 側コピーは `.claude/knowledge/reference/todo-standards.md`。
 *
 * カードの構文:
 *   `## 🔴/🟡/🟢/🟣 …`        = tier セクション
 *   `### [ID] タスク名`        = カード (**[ID] は stats47 拡張・省略可**。tier セクション外の ### はカードにしない)
 *   見出し直下 `タグ: [..] [..]` = token 列 (本文が始まる前の行だけ採る)
 *
 * token の解釈 (スキーマ v3-unified):
 *   [Codex候補]        → codex フラグ
 *   [進行中]           → wip フラグ (★stats47 拡張。backlog-loop が触らない目印)
 *   [種類:不具合] 等   → kind (省略時 null)
 *   [実行:sweep] 等    → executor (省略時 null＝分類待ち)
 *   [検証:cmd]         → verify (完了の決定的ゲート)
 *   [起票:YYYY-MM-DD]  → filed (鮮度測定)
 *   [期日:YYYY-MM-DD]  → due (★拡張。期限管理)
 *   [待ち:承認] 等     → waits (★拡張。複数可。値は WAITS。いま止まっている理由)
 *   上記以外の最初の token → category (無ければ '未分類')
 *
 * stats47 拡張 (doboku との差分は 3 つだけ。他は doboku 実装と同一に保つ):
 *   1. `### [ID] タイトル` の先頭 [ID] を id として抽出 (ID_PATTERN に合う形だけ。
 *      backlog-loop の ledger / verify が ID で結び付けるため stats47 では実処理対象に必須)
 *   2. `[期日:date]` / `[進行中]` token
 *   3. カードに startLine / endLine (1-indexed・両端含む) を持たせる — backlog-loop の
 *      行番号削除 (parse-backlog-core.cjs の removeLineRanges) が範囲を要るため
 *
 * 年間計画 annual.md (parseAnnual) は tier 見出しの代わりに `## YYYY-MM` の月見出しの下へ同じカード構文を置く。
 * カードの形は parseBacklog と同じで、tier=null・month='YYYY-MM' になる。
 *
 * 未知トークンを沈黙させない: コロンを含む token はすべて kv として捕まえ、キーが語彙外なら
 * unknownKeys へ記録する。パースは寛容・リントは厳格 (検査は check-docs-governance が行う)。
 */

/** tier 絵文字 → 内部値。admin の weekly/monthly 見出し判定もこれを使う。 */
const TIER = { '🔴': 'high', '🟡': 'mid', '🟢': 'low', '🟣': 'hold' };

/** 層の置き場。 */
const TODO_DIR = '.claude/todo';

/**
 * stats47 が取る 4 層 (表示順もこの順)。backlog/weekly/monthly は doboku と共通、
 * improvements は stats47 固有層 (6 列テーブル + improvement-triage 排他 write + effect-verdict。
 * カード構文ではない)。doboku 固有層は annual。
 */
const TODO_LAYER_FILES = ['backlog.md', 'weekly.md', 'monthly.md', 'improvements.md'];

/** 年間計画 (`## YYYY-MM` の月見出しの下にカード)。無い間は読み手が空として扱う */
const ANNUAL_FILE = 'annual.md';

/** tier の実行優先順 (小さいほど先) */
const TIER_ORDER = { high: 0, mid: 1, low: 2, hold: 3 };

/** カテゴリ語彙 (doboku と共通の 6 軸・正典は todo-standards.md) */
const CANONICAL_CATEGORIES = [
  'コンテンツ品質',
  'UI・UX',
  '収益化',
  'エージェント・SSOT',
  'SNS・マーケ',
  'インフラ・計測',
];

/** executor の語彙。自動処理が単独で回せるのは 'sweep' と '機械' のみ。 */
const EXECUTORS = ['sweep', '機械', '対話', 'ユーザー', 'windows', '別環境'];

/**
 * 待ちの理由 `[待ち:X]` の語彙 (1 枚に複数付けてよい)。
 *   承認 = オーナーの承認待ち / 時期 = その時期まで着手しない (年間計画 annual.md の置き場) /
 *   観測 = 効果や計測の結果待ち (改善 improvements.md の置き場) / ログイン = 認証が要る作業待ち /
 *   判断 = 方針の決定待ち
 */
const WAITS = ['承認', '時期', '観測', 'ログイン', '判断'];

/** backlog に置かず別の層へ移す待ち → 移し先 (docs-governance が置き場違いを検査する) */
const WAIT_PLACEMENT = { 時期: 'annual.md', 観測: 'improvements.md' };

/** タスクの種類。tier=緊急度・category=ドメインとは直交する軸。 */
const KINDS = ['不具合', '改善', '意思決定', '制作', '定期'];

/** 選定で最優先にする種類。「今も損失が出ている」ものを tier より先に出す。 */
const DEFECT_KIND = '不具合';

/** タグ行の kv キー → カード側のフィールド名 (期日 は stats47 発の拡張・doboku にも移植済み) */
// 領域 は stats47 拡張 (値の語彙は領域のマスタ data/business/domains.json と領域の台帳 business.domain-stances → strategy-lanes.cjs が検査する)
const TAG_KEYS = { 種類: 'kind', 実行: 'executor', 検証: 'verify', 起票: 'filed', 期日: 'due', 領域: 'lane' };

/** 複数値を取るタグキー → カード側の配列フィールド名 (同じキーを何度書いてもよい) */
const MULTI_TAG_KEYS = { 待ち: 'waits' };

/** この環境 (AI セッション / CI) が単独で消化できる executor */
const SELF_EXECUTABLE = new Set(['sweep', '機械']);

/**
 * カード ID の形 (docs-governance の idPattern と同一)。ハイフンを最低 1 つ要求するので、
 * `[WIP]` のような 1 語ブラケットをタイトル先頭に書いても ID に化けない。
 */
const ID_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/;

function tierOf(text) {
  for (const [emoji, tier] of Object.entries(TIER)) if (text.includes(emoji)) return tier;
  return null;
}

/**
 * コードフェンスの中かどうかを行ごとに返すトラッカー。
 * bash ブロックにコメント `## ...` を書いた瞬間に tier セクションが偽発生してカードが
 * 誤配置されるのを、検査で見張るのではなくパーサで正す。開始フェンスの記号と長さを覚え、
 * 同種・同長以上でだけ閉じる (CommonMark 準拠の簡易版・doboku 実装と同一)。
 */
function fenceTracker() {
  let open = null;
  return (ln) => {
    const m = ln.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (m) {
      const marker = m[1][0];
      const len = m[1].length;
      if (!open) { open = { marker, len }; return true; }
      if (marker === open.marker && len >= open.len && !ln.slice(m[0].length).trim()) {
        open = null;
        return true;
      }
    }
    return Boolean(open);
  };
}

function parseTagLine(raw) {
  const tokens = [...raw.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  const out = {
    tokens,
    codex: false,
    wip: false,
    category: '未分類',
    kind: null,
    executor: null,
    verify: null,
    filed: null,
    due: null,
    lane: null,
    waits: [],
    unknownKeys: [],
    unknownCategories: [],
  };
  const rest = [];
  for (const t of tokens) {
    if (t === 'Codex候補') { out.codex = true; continue; }
    if (t === '進行中') { out.wip = true; continue; }
    // 全角コロンも受理する (日本語入力で現実に起きる)
    const kv = t.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (kv) {
      const multi = MULTI_TAG_KEYS[kv[1].trim()];
      if (multi) {
        // 語彙外の値もそのまま持つ (パースは寛容・リントは厳格。検査が WAITS と照合する)
        const value = kv[2].trim();
        if (!out[multi].includes(value)) out[multi].push(value);
        continue;
      }
      const field = TAG_KEYS[kv[1].trim()];
      if (field) out[field] = kv[2].trim();
      else out.unknownKeys.push({ key: kv[1].trim(), value: kv[2].trim(), raw: t });
      continue;
    }
    rest.push(t);
  }
  if (rest.length) out.category = rest[0];
  out.extraCategories = rest.slice(1);
  out.unknownCategories = rest.filter((c) => !CANONICAL_CATEGORIES.includes(c));
  return out;
}

/** `### [ID] タイトル` から id を切り出す。ID_PATTERN に合わなければ id=null・タイトルはそのまま */
function splitHeadingId(headingText) {
  const m = headingText.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (m && ID_PATTERN.test(m[1])) return { id: m[1], title: m[2].trim() };
  return { id: null, title: headingText.trim() };
}

/** `## 🔴 …` を tier セクションとして読む (backlog の章立て) */
function tierSection(headingLine) {
  const tier = tierOf(headingLine);
  return tier ? { tier } : null;
}

/** 年間計画の月見出し `## YYYY-MM` (後ろに説明を書いてよい) */
const ANNUAL_MONTH_HEADING = /^##\s+(\d{4}-(?:0[1-9]|1[0-2]))(?![\d-])/;

function monthSection(headingLine) {
  const m = headingLine.match(ANNUAL_MONTH_HEADING);
  return m ? { tier: null, month: m[1] } : null;
}

/**
 * カード構文の共通パーサ。`##` 見出しを sectionOf で章として読み、章の中の `###` だけをカードにする。
 * 章の値 (tier / month) はカードへそのまま写す。
 */
function parseCardSections(text, sectionOf) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let section = null;
  let cur = null;
  const fence = fenceTracker();
  const flush = (endLineNo) => {
    if (!cur) return;
    // 末尾の空行はカードに含めない (行番号削除で段落の区切りが崩れないように)
    let end = endLineNo;
    while (end > cur.startLine && lines[end - 1].trim() === '') end -= 1;
    cur.endLine = end;
    cur.body = cur.bodyLines.join('\n').trim();
    delete cur.bodyLines;
    out.push(cur);
    cur = null;
  };
  lines.forEach((ln, i) => {
    const lineNo = i + 1;
    // フェンス内の `##`/`###`/`タグ:` は本文 (コマンド例やテンプレ) であって構造ではない
    if (fence(ln)) { if (cur) cur.bodyLines.push(ln); return; }
    if (/^###\s+/.test(ln)) {
      flush(lineNo - 1);
      // 章の外にある ### はカードにしない
      if (section) {
        const { id, title } = splitHeadingId(ln.replace(/^###\s+/, '').trim());
        const { tier, ...rest } = section;
        cur = {
          line: lineNo,
          startLine: lineNo,
          endLine: lineNo,
          id,
          tier,
          title,
          category: '未分類',
          kind: null,
          codex: false,
          wip: false,
          executor: null,
          verify: null,
          filed: null,
          due: null,
          lane: null,
          waits: [],
          hasTagLine: false,
          tokens: [],
          extraCategories: [],
          unknownKeys: [],
          unknownCategories: [],
          ...rest,
          body: '',
          bodyLines: [],
        };
      }
      return;
    }
    if (/^##\s+/.test(ln)) {
      flush(lineNo - 1);
      section = sectionOf(ln);
      return;
    }
    if (!cur) return;
    const tag = ln.match(/^タグ:\s*(.+)/);
    // 本文が始まる前の タグ: 行だけ採る
    if (tag && cur.bodyLines.filter((l) => l.trim()).length === 0 && !cur.hasTagLine) {
      Object.assign(cur, parseTagLine(tag[1]), { hasTagLine: true });
      return;
    }
    cur.bodyLines.push(ln);
  });
  flush(lines.length);
  return out;
}

/**
 * backlog.md 本文をカード配列へ。
 *
 * @param {string} text backlog.md の中身
 * @returns {Array<{line:number,startLine:number,endLine:number,id:string|null,tier:string,
 *                  title:string,category:string,kind:string|null,codex:boolean,wip:boolean,
 *                  executor:string|null,verify:string|null,filed:string|null,due:string|null,lane:string|null,
 *                  waits:string[],hasTagLine:boolean,tokens:string[],extraCategories:string[],
 *                  unknownKeys:Array<{key:string,value:string,raw:string}>,
 *                  unknownCategories:string[],body:string}>}
 */
function parseBacklog(text) {
  return parseCardSections(text, tierSection);
}

/**
 * 年間計画 annual.md をカード配列へ。frontmatter のあと `## YYYY-MM` の月見出しの下に backlog と同じ
 * カード構文を置く。カードの形は parseBacklog と同じで、tier は null、month に月見出しの 'YYYY-MM' が入る。
 * 月見出しでない `##` の下の `###` はカードにしない (findAnnualOrphanHeadings が拾う)。
 *
 * @param {string} text annual.md の中身
 */
function parseAnnual(text) {
  return parseCardSections(text, monthSection);
}

function findSectionOrphans(text, sectionOf) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let section = null;
  const fence = fenceTracker();
  lines.forEach((ln, i) => {
    if (fence(ln)) return;
    if (/^##\s+/.test(ln) && !/^###/.test(ln)) { section = sectionOf(ln); return; }
    if (/^###\s+/.test(ln) && !section) out.push({ line: i + 1, title: ln.replace(/^###\s+/, '').trim() });
  });
  return out;
}

/**
 * tier セクションの外に取り残された `###` (パーサーが黙って捨てる行) を返す。
 * 「見えていないタスク」の検出用。
 */
function findOrphanHeadings(text) {
  return findSectionOrphans(text, tierSection);
}

/** annual.md の月見出しの外に取り残された `###` を返す。 */
function findAnnualOrphanHeadings(text) {
  return findSectionOrphans(text, monthSection);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * カードを期日で分ける (純関数)。`due` = 期日が from〜to (両端含む)、`overdue` = 期日が from より前で
 * 残っているもの。期日が無い・日付として読めないカードはどちらにも入れない (語彙は検査が見る)。
 * どちらも期日の早い順。日付は引数で受け、現在時刻に依存しない。
 *
 * @template {{due:string|null}} T
 * @param {T[]} cards
 * @param {{from:string,to:string}} range YYYY-MM-DD
 * @returns {{due:T[], overdue:T[]}}
 */
function partitionByDue(cards, { from, to }) {
  if (!isIsoDate(from) || !isIsoDate(to)) throw new Error(`from / to は YYYY-MM-DD で渡す: ${from} / ${to}`);
  if (from > to) throw new Error(`from が to より後: ${from} > ${to}`);
  const dated = cards.filter((c) => isIsoDate(c.due));
  /** @param {T} a @param {T} b */
  const byDue = (a, b) => (String(a.due) < String(b.due) ? -1 : String(a.due) > String(b.due) ? 1 : 0);
  return {
    due: dated.filter((c) => String(c.due) >= from && String(c.due) <= to).sort(byDue),
    overdue: dated.filter((c) => String(c.due) < from).sort(byDue),
  };
}

/**
 * backlog と年間計画のカードのうち、期日が from〜to に入るもの (due) と、期日が from より前で
 * 残っているもの (overdue) を分けて返す。月次・週次計画が期日で引く入口。
 * 各カードに source ('backlog' | 'annual') を足す (他のフィールドはパース結果のまま)。
 *
 * @param {{backlogText?:string, annualText?:string, from:string, to:string}} input
 */
function cardsDueWithin({ backlogText = '', annualText = '', from, to }) {
  const cards = [
    ...parseBacklog(backlogText).map((c) => ({ ...c, source: 'backlog' })),
    ...parseAnnual(annualText).map((c) => ({ ...c, source: 'annual' })),
  ];
  return partitionByDue(cards, { from, to });
}

/**
 * 選定 (doboku pickTasks の port・同一セマンティクス)。コードで決定しモデルに委ねない。
 * stats47 の backlog-loop は queue-core.cjs 側で独自の eligibility (ledger / quarantine /
 * wip / ID 必須) を持つため、これは admin の集計と手動運用向け。
 *
 * @param {Array} cards parseBacklog の出力
 * @param {{limit?:number, classifyLimit?:number}} opts
 */
function pickTasks(cards, opts = {}) {
  const limit = opts.limit ?? 2;
  const classifyLimit = opts.classifyLimit ?? 2;

  const byTier = (a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || a.line - b.line;

  // 実行候補の順序: 不具合が第1キー、tier は第2キー (壊れているものを先に出す)。
  const byKindThenTier = (a, b) =>
    (a.kind === DEFECT_KIND ? 0 : 1) - (b.kind === DEFECT_KIND ? 0 : 1) || byTier(a, b);

  // 実行候補: executor が自分で回せるもの。hold は自動選定しない (ユーザー判断待ちのため)
  const runnable = cards
    .filter((c) => c.tier !== 'hold' && c.executor && SELF_EXECUTABLE.has(c.executor))
    .sort(byKindThenTier);

  // 分類待ち: executor 未付与 (バケットの一員なので条件は executor だけ)
  const unclassified = cards
    .filter((c) => c.tier !== 'hold' && !c.executor)
    .sort(byTier);

  // 除外: 自分で回せない executor
  const excluded = cards.filter(
    (c) => c.tier !== 'hold' && c.executor && !SELF_EXECUTABLE.has(c.executor),
  );
  const excludedBy = {};
  for (const c of excluded) excludedBy[c.executor] = (excludedBy[c.executor] ?? 0) + 1;

  const holdTotal = cards.filter((c) => c.tier === 'hold').length;
  // 4 バケットは総数の真の分割であること。破れたら分類漏れ＝検査不成立として呼び出し側が落とす。
  const partitionOk =
    runnable.length + unclassified.length + excluded.length + holdTotal === cards.length;

  // 分類キュー: executor か kind のどちらかが欠けているもの (partition ではなく作業キュー)
  const needsTag = cards
    .filter((c) => c.tier !== 'hold' && (!c.executor || !c.kind))
    .sort(byTier)
    .map((c) => ({
      ...c,
      missing: [!c.executor ? '実行' : null, !c.kind ? '種類' : null].filter(Boolean),
    }));

  // 不具合の全件 (limit を掛けない。沈没の可視化が目的)
  const defects = cards.filter((c) => c.kind === DEFECT_KIND).sort(byTier);
  const kindCount = cards.reduce((a, c) => ((a[c.kind ?? '未分類'] = (a[c.kind ?? '未分類'] ?? 0) + 1), a), {});

  return {
    total: cards.length,
    order: 'kind-then-tier',
    run: runnable.slice(0, limit),
    runnableTotal: runnable.length,
    classify: needsTag.slice(0, classifyLimit),
    unclassifiedTotal: unclassified.length,
    needsTagTotal: needsTag.length,
    kindMissingTotal: cards.filter((c) => !c.kind).length,
    kindCount,
    defects,
    sunkDefects: defects.filter((c) => c.tier === 'low' || c.tier === 'hold'),
    excludedTotal: excluded.length,
    excludedBy,
    holdTotal,
    partitionOk,
  };
}

module.exports = {
  TIER,
  TODO_DIR,
  TODO_LAYER_FILES,
  ANNUAL_FILE,
  TIER_ORDER,
  CANONICAL_CATEGORIES,
  EXECUTORS,
  KINDS,
  WAITS,
  WAIT_PLACEMENT,
  DEFECT_KIND,
  TAG_KEYS,
  MULTI_TAG_KEYS,
  SELF_EXECUTABLE,
  ID_PATTERN,
  fenceTracker,
  parseTagLine,
  splitHeadingId,
  parseBacklog,
  parseAnnual,
  findOrphanHeadings,
  findAnnualOrphanHeadings,
  partitionByDue,
  cardsDueWithin,
  pickTasks,
};
