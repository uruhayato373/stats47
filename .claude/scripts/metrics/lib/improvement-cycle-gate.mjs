/**
 * CI の無人 improvement-triage run が書いた差分の決定的ゲート (pure)。
 *
 * LLM の判断そのものは検査できないので、「書いてはいけない形」だけを機械で止める:
 * - 許可外のファイルを変えていない
 * - improvements.md の Status 列に effect/full|partial|none|adverse を新たに付けていない
 *   (effect の確定は閾値エンジンだけが行う。本文中の「付けない」という言及は対象外なので列で見る)
 * - backlog.md のカードを消していない (行削除は backlog-loop の排他) / 新規カードは上限以内
 * - 追加行に秘密情報の形が無い (run は GA4 の鍵を env に持ち、結果は公開 repo へ push される)
 */
export const ALLOWED_PATHS = [
  /^\.claude\/todo\/improvements\.md$/,
  /^\.claude\/todo\/backlog\.md$/,
  /^\.claude\/skills\/analytics\/[a-z0-9-]+-improvement\/reference\/improvement-log\.md$/,
];
export const MAX_NEW_BACKLOG_CARDS = 2;
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
    rows.set(cells[0], { id: cells[0], status: cells[2], due: cells[3], line });
  }
  return rows;
}

export function parseCardIds(md) {
  return new Set(Array.from(String(md ?? "").matchAll(/^### \[([A-Z0-9-]+)\]/gm), (m) => m[1]));
}

export function evaluateRun({ changedFiles, beforeImprovements, afterImprovements, beforeBacklog, afterBacklog, diffText = "" }) {
  const problems = [];
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
