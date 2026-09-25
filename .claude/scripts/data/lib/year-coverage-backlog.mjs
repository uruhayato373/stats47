/**
 * e-Stat 年カバレッジ監査の要拡張候補 (extend-candidate) をバックログカードにする (純粋関数)。
 * CYCLE-HEALTH-01 (2026-09-26): 検出器の指摘は自動起票を既定にする。形は GSC カバレッジの
 * `.claude/scripts/gsc/lib/coverage-backlog.mjs` にそろえた (開いているカードは 1 枚・1 枚 10 件・batch ファイル)。
 * CLI: .claude/scripts/data/sync-year-coverage-backlog.mjs
 */
export const CARD_PREFIX = "YEAR-COV";
export const BATCH_SIZE = 10;
export const BATCH_DIR = ".claude/state/data/estat-year-coverage/backlog-batches";
export const BY_DESIGN_PATH = ".claude/state/data/estat-year-coverage/by-design.json";

const GATE = "npx tsx .claude/scripts/data/assert-year-coverage-batch.ts";
const SYNC = "node .claude/scripts/data/sync-year-coverage-backlog.mjs";

export const batchPath = (id) => `${BATCH_DIR}/${id}.txt`;

/**
 * 起票するカードを決める。開いている YEAR-COV カードがあれば起票しない (同じ key を 2 枚に載せない)。
 * 順番は config と e-Stat の年数差が大きい順 (取りこぼしている年が多いものから)。
 */
export function planYearCoverageCard({ results, openIds, byDesign, today }) {
  if (openIds.some((id) => id.startsWith(`${CARD_PREFIX}-`))) return null;
  const rows = Object.values(results)
    .filter((r) => r.verdict === "extend-candidate" && !byDesign[r.key])
    .sort((a, b) => b.estatNonNullYears - (b.configYears ?? 1) - (a.estatNonNullYears - (a.configYears ?? 1)) || a.key.localeCompare(b.key))
    .slice(0, BATCH_SIZE);
  if (!rows.length) return null;
  const id = `${CARD_PREFIX}-${today.replaceAll("-", "")}`;
  return { id, tier: "🟡", keys: rows.map((r) => r.key), markdown: renderCard({ id, rows, today }) };
}

function renderCard({ id, rows, today }) {
  const file = batchPath(id);
  const years = (codes) => (codes.length > 6 ? `${codes[0]}〜${codes.at(-1)} の ${codes.length} 年` : codes.join("・"));
  return [
    `### [${id}] 年カバレッジ: 最新 1 年だけに絞っている e-Stat 指標 ${rows.length} 件の years を広げる`,
    "",
    `タグ: [コンテンツ品質] [種類:改善] [実行:sweep] [検証:${GATE} ${file}] [起票:${today}] [レーン:データ品質]`,
    "",
    `- **自動起票**: \`sync-year-coverage-backlog.mjs\` が週次の年カバレッジ監査 (\`.claude/state/data/estat-year-coverage/queue.json\`) の要拡張候補から作った。対象 key の一覧は \`${file}\`。規約の正典は \`.claude/rules/metric-config-standards.md\`「\`years\` は最新年だけに絞らない」。`,
    "- **対象** (config の年数 → e-Stat に値がある年):",
    ...rows.map((r) => `  - \`${r.key}\` (statsDataId ${r.statsDataId}): ${r.configYears ?? "?"} 年 → ${years(r.availableYearCodes)}`),
    "- **次**: 各 key の metric config の `years` を上の「e-Stat に値がある年」の範囲へ広げる (監査が `getStatsData` で実測した年。北海道 1 件の判定なので、他県で欠ける年は再投入後の `audit-reingest-queue.ts` と ranking-integrity 監査が拾う)。同じ statsDataId の中で系列の定義や単位が年ごとに変わる key は広げず by-design に記録する。",
    `- **記録**: 広げない key は \`${SYNC} --mark-by-design <key> --note "<理由>"\` で記録する (以後の起票から外れる)。`,
    "- **停止条件**: R2 への再投入・本番 deploy をしない (config を直した後の再投入は `audit-reingest-queue.ts` が検出し、data-ingester が行う)。判断できない key はそのまま残し、このカードを消さない。",
    "- **完了条件**: 検証コマンドが exit 0 (全 key が config で複数年になったか、理由付きで by-design に記録された)。",
  ].join("\n");
}

/**
 * batch の key のうち未処理のものを返す (空なら完了)。処理済み = by-design に記録済みか、
 * config の years が 1 年でなくなった (`"all"` は yearCountOf が null を返すので複数年として扱う)。
 * config から消えた key (yearCountOf が undefined) は未処理のまま残す。
 */
export function unhandledKeys(keys, { yearCountOf, byDesign }) {
  return keys.filter((key) => {
    if (byDesign[key]) return false;
    const count = yearCountOf(key);
    return count === undefined || count === 1;
  });
}
