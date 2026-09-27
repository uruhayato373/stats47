/**
 * 「検出 → 起票 → 計画 → 実行 → 完了 → 振り返り」の各段の停滞信号 (CYCLE-HEALTH-01)。
 * 週次メトリクス Issue の「サイクルの健全性」節が読む。新しい台帳は作らず、既存の
 * .claude/todo・週次レビュー・backlog-loop ledger を数えるだけ。まだ機械で数えられない段は「未計測」と出す。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { parseBacklog } = require("../../lib/backlog-lib.cjs");
// Must の読み取り・連続未達の閾値・🔴 の上限は docs:check (DG081/082) と同じ実装を使う
const strategyLanes = require("../../lib/strategy-lanes.cjs");

import { CARD_ACTIONS as GSC_CARD_ACTIONS, CARD_PREFIX as GSC_PREFIX } from "../../gsc/lib/coverage-backlog.mjs";
import { BY_DESIGN_PATH as YEAR_BY_DESIGN, CARD_PREFIX as YEAR_PREFIX } from "../../data/lib/year-coverage-backlog.mjs";

const TODO_FILES = [".claude/todo/backlog.md", ".claude/todo/improvements.md"];
/** 連続未達がこの週数に達したら、次週計画で分割か降格を必須にする (DG082 が再掲を error にする) */
export const MUST_MISS_STREAK_LIMIT = strategyLanes.MUST_MISS_STREAK_LIMIT;

/** 起票 → 分類 / 実行 → 完了: レーン・種類の無いカードと期日超過のカード */
export function summarizeCards(cards, today) {
  const unclassified = cards.filter((c) => !c.lane || !c.kind).map((c) => c.id);
  const overdue = cards.filter((c) => c.due && c.due < today).map((c) => c.id);
  return { total: cards.length, unclassified, overdue };
}

export const parseMustRatio = strategyLanes.parseMustRatio;

/** 前週の ISO 週 (レビューは週が終わってから書くので、今日の前週のレビューがあれば最新)。 */
function previousIsoWeek(today) {
  const d = new Date(Date.parse(`${today}T00:00:00Z`) - 7 * 86_400_000);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - yearStart) / 86_400_000 + 1) / 7)).padStart(2, "0")}`;
}

/** 計画 → 実行: 週の新しい順に並べた Must 比から、直近の達成率と連続未達週数を出す */
export function summarizeMust(weeks) {
  const latest = weeks.find((w) => w.ratio) ?? null;
  let missStreak = 0;
  for (const w of weeks) {
    if (!w.ratio) break;
    if (w.ratio.done >= w.ratio.planned) break;
    missStreak += 1;
  }
  return { latest, missStreak, needsSplit: missStreak >= MUST_MISS_STREAK_LIMIT };
}

/** 実行 → 完了: 週次計画が参照する ID のうち、ledger で完了済みかつ台帳に残っていないもの */
export function findStalePlanIds(planText, completedIds, liveIds) {
  const ids = new Set(String(planText).match(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+-\d{2}\b/g) ?? []);
  return [...ids].filter((id) => completedIds.has(id) && !liveIds.has(id)).sort();
}

/**
 * 検出 → 起票: 自動起票する検出器ごとに、カードに載せる対象の残件と開いているカードの有無。
 * 残件があるのにカードが開いていなければ起票が止まっている (次の週次 sync で起票されるはず)。
 */
export function summarizeDetectors({ yearResults, yearByDesign, gscQueue, openIds }) {
  const hasOpen = (prefix) => openIds.some((id) => id.startsWith(`${prefix}-`));
  const yearPending = Object.values(yearResults ?? {}).filter((r) => r.verdict === "extend-candidate" && !yearByDesign[r.key]).length;
  const gscPending = (gscQueue ?? []).filter((e) => e.status === "pending" && e.action in GSC_CARD_ACTIONS).length;
  return [
    { name: "年カバレッジ監査", pending: yearPending, open: hasOpen(YEAR_PREFIX), measured: yearResults != null },
    { name: "GSC カバレッジ是正", pending: gscPending, open: hasOpen(GSC_PREFIX), measured: gscQueue != null },
  ].map((d) => ({ ...d, stalled: d.measured && d.pending > 0 && !d.open }));
}

function readText(root, rel) {
  const path = join(root, rel);
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

export function readCycleHealth(root, today) {
  const cards = TODO_FILES.flatMap((rel) => parseBacklog(readText(root, rel) ?? "")).filter((c) => c.id);
  const reviews = strategyLanes.readReviews(root);
  const weeks = reviews.map((r) => ({ week: r.week, ratio: parseMustRatio(r.text) }));
  const board = strategyLanes.laneBoard(root, today);
  let completedIds = new Set();
  const ledgerText = readText(root, ".claude/state/backlog-loop/ledger.json");
  if (ledgerText) {
    const items = JSON.parse(ledgerText).items ?? {};
    completedIds = new Set(Object.entries(items).filter(([, v]) => v.status === "completed").map(([id]) => id));
  }
  const yearText = readText(root, ".claude/state/data/estat-year-coverage/queue.json");
  const gscText = readText(root, ".claude/state/gsc/coverage-remediation-queue.json");
  const detectors = summarizeDetectors({
    yearResults: yearText ? JSON.parse(yearText).results : null,
    yearByDesign: JSON.parse(readText(root, YEAR_BY_DESIGN) ?? "{}"),
    gscQueue: gscText ? JSON.parse(gscText).queue : null,
    openIds: cards.map((c) => c.id),
  });
  return {
    detectors,
    cards: summarizeCards(cards, today),
    must: summarizeMust(weeks),
    stalePlanIds: findStalePlanIds(readText(root, ".claude/todo/weekly.md") ?? "", completedIds, new Set(cards.map((c) => c.id))),
    review: { latestWeek: reviews[0]?.week ?? null, expectedWeek: previousIsoWeek(today) },
    discipline: board.discipline
      ? { highCount: board.discipline.highCount, staleHigh: board.discipline.staleHigh, repeated: board.discipline.repeated }
      : null,
  };
}

const list = (ids, max = 8) => ids.slice(0, max).map((id) => `\`${id}\``).join(", ") + (ids.length > max ? ` ほか ${ids.length - max} 件` : "");

export function formatCycleHealth(h) {
  const { cards, must, stalePlanIds, detectors, review, discipline } = h;
  const reviewLine = review
    ? review.latestWeek && review.latestWeek >= review.expectedWeek
      ? `${review.latestWeek} まで記録済み`
      : `⚠️ ${review.expectedWeek} のレビューが無い (最新 ${review.latestWeek ?? "なし"})。\`/weekly-review\` を実行する`
    : "未計測";
  const highLine = discipline
    ? `${discipline.highCount} / 上限 ${strategyLanes.MAX_HIGH_TIER_CARDS} 枚${discipline.highCount > strategyLanes.MAX_HIGH_TIER_CARDS ? " ⚠️ 月次計画で 🟡 へ下げる" : ""}` +
      `・${strategyLanes.HIGH_TIER_MAX_AGE_DAYS} 日超の未着手 ${discipline.staleHigh.length} 枚${discipline.staleHigh.length ? `: ${list(discipline.staleHigh)}` : ""}`
    : "未計測";
  const repeatLine = discipline ? (discipline.repeated.length ? `⚠️ ${discipline.repeated.join(" / ")}` : "なし") : "未計測";
  const detectorLine = detectors
    .map((d) => (d.measured ? `${d.name} 残 ${d.pending} 件・カード${d.open ? "あり" : "なし"}${d.stalled ? " ⚠️ 起票が止まっている" : ""}` : `${d.name} state なし`))
    .join(" / ");
  const mustLine = must.latest
    ? `${must.latest.week} の Must ${must.latest.ratio.done}/${must.latest.ratio.planned}・連続未達 ${must.missStreak} 週` +
      (must.needsSplit ? `（${MUST_MISS_STREAK_LIMIT} 週以上: 次週計画で残った Must を分割か降格する）` : "")
    : "週次レビューに Must の達成数が見つからない";
  return [
    "| 段 | 信号 | 今週 |",
    "|---|---|---|",
    `| 検出 → 起票 | 残件があるのにカードが開いていない検出器 (自動起票が既定) | ${detectorLine} |`,
    `| 起票 → 分類 | レーンか種類の無いカード | ${cards.unclassified.length} / ${cards.total} 件${cards.unclassified.length ? `: ${list(cards.unclassified)}` : ""} |`,
    `| 計画 | バックログ 🔴 の枚数と鮮度 (DG081) | ${highLine} |`,
    `| 計画 → 実行 | 週次 Must の達成 | ${mustLine} |`,
    `| 計画 → 実行 | 連続未達の Must を同じ形で再掲 (DG082) | ${repeatLine} |`,
    `| 実行 → 完了 | 期日超過のカード | ${cards.overdue.length} 件${cards.overdue.length ? `: ${list(cards.overdue)}` : ""} |`,
    `| 実行 → 完了 | 完了済みなのに週次計画が参照する ID | ${stalePlanIds.length} 件${stalePlanIds.length ? `: ${list(stalePlanIds)}` : ""} |`,
    `| 振り返り | 前週の週次レビュー | ${reviewLine} |`,
    "| 振り返り → 起票 | 申し送りがカード ID に結ばれているか | 未計測 |",
    "",
  ].join("\n");
}
