/**
 * CI の無人 improvement-triage run が書いた差分の決定的ゲート (pure)。
 *
 * LLM の判断そのものは検査できないので、「書いてはいけない形」だけを機械で止める:
 * - 許可外のファイルを変えていない
 * - improvements.md の Status 列に effect/full|partial|none|adverse を新たに付けていない
 *   (effect の確定は閾値エンジンだけが行う。本文中の「付けない」という言及は対象外なので列で見る)
 * - backlog.md のカードを消していない (行削除は backlog-loop の排他) / 新規カードは上限以内
 * - 追加行に秘密情報の形が無い (run は GA4 の鍵を env に持ち、結果は公開 repo へ push される)
 * - 新しい施策は KPI ツリーの id を持つ [kpi:] と、根拠のある [target:] の両方を持つ。active が上限を超えている間は追加しない
 *   (登録時に測れない施策を入れない。上限と目印の解釈は strategy-lanes.cjs = docs:check DG079/DG080 と共有)
 * - Claude のファイル書き込みが権限で拒否されていない (拒否されたまま「変更 0 件」で通過させない。
 *   2026-09-24 の初回無人 run は improvements.md への Edit を 3 回拒否され、空の差分でゲートを通過した)
 */
export const ALLOWED_PATHS = [
  /^\.claude\/todo\/improvements\.md$/,
  /^\.claude\/todo\/backlog\.md$/,
  /^data\/improvement\/[a-z0-9-]+-improvement\/improvement-log\.md$/,
];
export const MAX_NEW_BACKLOG_CARDS = 2;
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
/** 公開 repo へ push する前に止める秘密の形 (サービスアカウント鍵・OAuth token)。 */
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /"private_key(?:_id)?"\s*:/,
  /[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com/,
  /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  /\bya29\.[A-Za-z0-9_-]{20,}/,
];

/** unified diff の追加行 (+) だけから秘密の形を探す。 */
export function findSecretLeaks(diffText) {
  const hits = [];
  for (const line of String(diffText ?? "").split("\n")) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    if (SECRET_PATTERNS.some((re) => re.test(line))) hits.push(line.slice(0, 80));
  }
  return hits;
}
const ID = /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/;
const KPI_MARKER = /\[kpi:\s*([^\]]+)\]/;
const TARGET_MARKER = /\[target:\s*[^\]]+\]/;
/**
 * 無人 run は effect を確定させない (evidence-based-judgment: エンジンを通さない判定は人間が実証チェックリストを満たす)。
 * エンジンが確定した施策は詳細ログに結果を残して行を削除するのが正規手順なので、Status 列にこれらを置く必要は無い。
 */
const FORBIDDEN_STATUS = /^effect\/(?:full|partial|none|adverse)$/;

/** improvements.md の 6 列表 (ID | タイトル | Status | Due | Owner | Metric) を ID → 行に落とす。 */
export function parseImprovementRows(md) {
  const rows = new Map();
  for (const line of String(md ?? "").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length !== 6 || !ID.test(cells[0])) continue;
    const kpi = cells[1].match(KPI_MARKER);
    rows.set(cells[0], {
      id: cells[0],
      status: cells[2],
      due: cells[3],
      kpis: kpi ? kpi[1].split(",").map((k) => k.trim()).filter(Boolean) : [],
      hasTarget: TARGET_MARKER.test(cells[1]),
      line,
    });
  }
  return rows;
}

export function parseCardIds(md) {
  return new Set(Array.from(String(md ?? "").matchAll(/^### \[([A-Z0-9-]+)\]/gm), (m) => m[1]));
}

/**
 * @param {object} input
 * @param {{ tool: string, target: string }[]} [input.denials] summarize-claude-execution の denialRows
 * @param {string[]|null} [input.kpiIds] KPI ツリーの id (kpi-tree.json)。null なら KPI の検査をしない
 * @param {number} [input.maxActive] active 施策の上限 (strategy-lanes.MAX_ACTIVE_IMPROVEMENTS)
 */
export function evaluateRun({ changedFiles, beforeImprovements, afterImprovements, beforeBacklog, afterBacklog, diffText = "", denials = [], kpiIds = null, maxActive = Infinity }) {
  const problems = [];
  const writeDenials = new Set(denials.filter((d) => WRITE_TOOLS.has(d.tool)).map((d) => `${d.tool} → ${d.target || "(対象不明)"}`));
  for (const d of writeDenials) problems.push(`ファイル書き込みが権限で拒否された: ${d}`);
  const leaks = findSecretLeaks(diffText);
  if (leaks.length) problems.push(`秘密情報の形を含む追加行が ${leaks.length} 行ある (push しない)`);
  for (const file of changedFiles) {
    if (!ALLOWED_PATHS.some((re) => re.test(file))) problems.push(`許可外のファイルを変更: ${file}`);
  }
  const before = parseImprovementRows(beforeImprovements);
  const after = parseImprovementRows(afterImprovements);
  const deleted = [...before.keys()].filter((id) => !after.has(id));
  const added = [...after.keys()].filter((id) => !before.has(id));
  const updated = [...after.keys()].filter((id) => before.has(id) && before.get(id).line !== after.get(id).line);
  if (kpiIds) {
    const known = new Set(kpiIds);
    for (const id of added) {
      const row = after.get(id);
      if (row.kpis.length === 0 || row.kpis.some((k) => !known.has(k))) {
        problems.push(`${id}: 新しい施策に KPI ツリーの [kpi: <id>] が無い (${row.kpis.join(", ") || "目印なし"})。どの KPI を動かすか言えない施策は backlog へ`);
      }
      if (!row.hasTarget) problems.push(`${id}: 新しい施策に [target:] が無い。根拠のある目標値を書けない施策は測れないので backlog へ`);
    }
    for (const id of updated) {
      if (before.get(id).kpis.length > 0 && after.get(id).kpis.length === 0) problems.push(`${id}: [kpi:] を消した`);
    }
  }
  if (added.length > 0 && after.size > maxActive) {
    problems.push(`active 施策 ${after.size} 件が上限 ${maxActive} 件を超えたまま新しい施策を ${added.length} 件足した (${added.join(", ")})。先に判定・降格で削る`);
  }
  for (const [id, row] of after) {
    if (FORBIDDEN_STATUS.test(row.status) && before.get(id)?.status !== row.status) {
      problems.push(`${id}: Status に ${row.status} を付けた (effect 確定は閾値エンジンだけが行う)`);
    }
  }
  const beforeCards = parseCardIds(beforeBacklog);
  const afterCards = parseCardIds(afterBacklog);
  const removedCards = [...beforeCards].filter((id) => !afterCards.has(id));
  const backlogAdded = [...afterCards].filter((id) => !beforeCards.has(id));
  if (removedCards.length) problems.push(`backlog カードを削除: ${removedCards.join(", ")} (行削除は backlog-loop の排他)`);
  if (backlogAdded.length > MAX_NEW_BACKLOG_CARDS) {
    problems.push(`backlog カードの新規が ${backlogAdded.length} 件 (上限 ${MAX_NEW_BACKLOG_CARDS})`);
  }
  return { problems, improvements: { deleted, added, updated }, backlogAdded };
}
