/**
 * 週次 UI 検査の指摘を週をまたいで追跡し、未対応のものをバックログカードにする (純粋関数)。
 *
 * 検査 (page-quality-audit-weekly) → 起票 (UI-FIX-* カード) → 修正 (backlog-loop-daily) → 本番確認 (次の週次)
 * を 1 本のループにするための状態。以前は検査結果が Issue に載るだけで、カードは人が手で起こしていた
 * (2026-09-23 の Claude の指摘 6 件のうち 4 件はカードにならないまま残った)。
 * 形は GSC カバレッジ是正キュー (`.claude/scripts/gsc/lib/coverage-queue-state.mjs`) と同じ。
 *
 * CLI: .claude/scripts/page-quality/ui-findings.ts
 */
import type { AuditRun } from "../types";
import { UI_METRIC_KEYS } from "./ui-report";

/**
 * - pending: 未対応 (カードにする)
 * - fixed: develop で直した。本番へ出たあとの週次で消えていれば done、残っていれば pending に戻す
 * - done: 週次で観測されなくなった
 * - by-design: 直さないと判断した (理由 note 必須)。Claude の指摘は 28 日で見直す
 * - owner: オーナー判断や手動カードの担当 (card があればそのカードが開いている間だけ)
 */
export type UiFindingStatus = "pending" | "fixed" | "done" | "by-design" | "owner";

export interface ObservedFinding {
  /** machine: `machine|<url>|<metric>` / agent: `agent|<template>` */
  key: string;
  source: "machine" | "agent";
  template: string;
  url: string | null;
  metric_key: string | null;
  severity: string;
  detail: string;
}

export interface UiFinding extends ObservedFinding {
  status: UiFindingStatus;
  first_seen: string;
  last_seen: string;
  fixed_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  card: string | null;
  note: string;
}

export interface AgentFinding {
  template: string;
  device: string;
  severity: string;
  location: string;
  issue: string;
  suggestion: string;
}

export const CARD_PREFIX = "UI-FIX";
export const BATCH_DIR = ".claude/state/page-quality/backlog-batches";
export const BATCH_SIZE = 10;
/** Claude の指摘は表現が週ごとに変わり同一性を判定できないので、by-design は期限付きにする */
export const AGENT_BY_DESIGN_TTL_DAYS = 28;
/** done の記録を残す期間。これより古いものは queue から落とす */
export const DONE_RETENTION_DAYS = 84;
/** main へのマージからデプロイ完了までの余裕。これより直前のマージは週次監査に間に合っていない扱い */
export const DEPLOY_LAG_MINUTES = 30;

const SEVERITY_RANK: Record<string, number> = { high: 3, error: 3, medium: 2, warning: 2, low: 1 };

/** 週次の結果から、今週観測された UI の指摘を作る。Claude の指摘はページの種類ごとに 1 件へまとめる。 */
export function observeFindings(run: Pick<AuditRun, "violations">, agentFindings: readonly AgentFinding[]): ObservedFinding[] {
  const machine = run.violations
    .filter((v) => UI_METRIC_KEYS.includes(v.metric_key))
    .map<ObservedFinding>((v) => ({
      key: `machine|${v.url}|${v.metric_key}`,
      source: "machine",
      template: v.template,
      url: v.url,
      metric_key: v.metric_key,
      severity: v.severity,
      detail: `${v.metric_key} = ${v.actual} (閾値 ${v.operator} ${v.threshold})`,
    }));

  const byTemplate = new Map<string, AgentFinding[]>();
  for (const f of agentFindings) byTemplate.set(f.template, [...(byTemplate.get(f.template) ?? []), f]);
  const agent = [...byTemplate].map<ObservedFinding>(([template, items]) => ({
    key: `agent|${template}`,
    source: "agent",
    template,
    url: null,
    metric_key: null,
    severity: items.map((f) => f.severity).sort((a, b) => (SEVERITY_RANK[b] ?? 0) - (SEVERITY_RANK[a] ?? 0))[0],
    detail: items.map((f) => `[${f.device}/${f.severity}] ${f.location}: ${f.issue} → ${f.suggestion}`).join("\n"),
  }));

  return [...machine, ...agent];
}

const daysBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000;

/** develop で直した時刻より後に main へマージされ、週次監査までにデプロイが終わっているか。 */
export function isFixLive(fixedAt: string | null, mainDeployedAt: string | null, auditAt: string): boolean {
  if (!fixedAt || !mainDeployedAt) return false;
  const merged = Date.parse(mainDeployedAt);
  return merged > Date.parse(fixedAt) && merged <= Date.parse(auditAt) - DEPLOY_LAG_MINUTES * 60_000;
}

export interface SyncContext {
  today: string;
  /** 週次監査の実行時刻 (AuditRun.generated_at) */
  auditAt: string;
  /** origin/main の最新コミット時刻。取れなければ null (直したものは本番未反映として扱う) */
  mainDeployedAt: string | null;
  /** バックログに開いているカード ID */
  openCardIds: readonly string[];
  /** Claude の確認が今週実行されたか。されていなければ Claude の指摘は「消えた」と扱わない */
  agentReviewed: boolean;
}

export interface SyncCounts {
  added: number;
  reopened: number;
  resolved: number;
  confirmedFixed: number;
}

/** 今週の観測を queue へ反映する。queue は新しい配列で返す (引数は変えない)。 */
export function syncFindings(
  queue: readonly UiFinding[],
  observed: readonly ObservedFinding[],
  ctx: SyncContext,
): { queue: UiFinding[]; counts: SyncCounts } {
  const counts: SyncCounts = { added: 0, reopened: 0, resolved: 0, confirmedFixed: 0 };
  const openCards = new Set(ctx.openCardIds);
  const seen = new Map(observed.map((o) => [o.key, o]));
  const reopen = (f: UiFinding, why: string): UiFinding => {
    counts.reopened += 1;
    return { ...f, status: "pending", fixed_at: null, resolved_at: null, resolved_by: null, card: null, note: why };
  };
  const resolve = (f: UiFinding, by: string): UiFinding => ({ ...f, status: "done", resolved_at: ctx.today, resolved_by: by });

  const next: UiFinding[] = [];
  for (const f of queue) {
    const o = seen.get(f.key);
    seen.delete(f.key);
    if (o) {
      const current: UiFinding = { ...f, ...o, last_seen: ctx.today };
      if (f.status === "done") next.push(reopen(current, `再発 (${ctx.today} の週次で再検出)`));
      else if (f.status === "fixed" && isFixLive(f.fixed_at, ctx.mainDeployedAt, ctx.auditAt)) {
        next.push(reopen(current, `修正の本番反映後も ${ctx.today} の週次で再検出 (前回: ${f.note})`));
      } else if (f.status === "owner" && (!f.card || !openCards.has(f.card))) {
        next.push(reopen(current, `担当カード ${f.card ?? "(無し)"} が開いていないまま ${ctx.today} の週次で再検出`));
      } else if (
        f.status === "by-design" &&
        f.source === "agent" &&
        f.resolved_at &&
        daysBetween(f.resolved_at, ctx.today) >= AGENT_BY_DESIGN_TTL_DAYS
      ) {
        next.push(reopen(current, `by-design から ${AGENT_BY_DESIGN_TTL_DAYS} 日経過したので見直す (前回: ${f.note})`));
      } else next.push(current);
      continue;
    }
    // 今週観測されなかった。Claude の確認が走っていない週は Claude の指摘を判定しない
    if (f.source === "agent" && !ctx.agentReviewed) next.push(f);
    else if (f.status === "fixed") {
      counts.confirmedFixed += 1;
      next.push(resolve(f, "weekly-audit"));
    } else if (f.status === "owner" && f.card && openCards.has(f.card)) {
      next.push(f); // 手動カードが開いている間はそのカードに任せる
    } else if (f.status !== "done") {
      counts.resolved += 1;
      next.push(resolve(f, "not-observed"));
    } else if (f.resolved_at && daysBetween(f.resolved_at, ctx.today) > DONE_RETENTION_DAYS) {
      continue;
    } else next.push(f);
  }

  for (const o of seen.values()) {
    counts.added += 1;
    next.push({
      ...o,
      status: "pending",
      first_seen: ctx.today,
      last_seen: ctx.today,
      fixed_at: null,
      resolved_at: null,
      resolved_by: null,
      card: null,
      note: "",
    });
  }
  return { queue: next, counts };
}

/** バックログカードの対象のうち、まだ処理されていないもの (pending、または理由 note の無い処理)。 */
export function findUnhandled(queue: readonly UiFinding[], keys: readonly string[]): string[] {
  const byKey = new Map(queue.map((f) => [f.key, f]));
  return keys.filter((key) => {
    const f = byKey.get(key);
    if (!f || f.status === "done") return false; // 週次で消えたものは処理済み
    if (f.status === "pending") return true;
    return !f.note.trim();
  });
}

const cardSlug = (template: string) => template.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
export const batchPath = (id: string) => `${BATCH_DIR}/${id}.txt`;

export interface PlannedCard {
  id: string;
  template: string;
  keys: string[];
  markdown: string;
}

/** ページの種類ごとに 1 枚。開いているカードがある種類は、消化されるまで次を出さない。 */
export function planUiCards({
  queue,
  openIds,
  today,
  screenshotBaseUrl,
}: {
  queue: readonly UiFinding[];
  openIds: readonly string[];
  today: string;
  screenshotBaseUrl: string;
}): PlannedCard[] {
  const pendingByTemplate = new Map<string, UiFinding[]>();
  for (const f of queue) {
    if (f.status === "pending") pendingByTemplate.set(f.template, [...(pendingByTemplate.get(f.template) ?? []), f]);
  }
  const cards: PlannedCard[] = [];
  for (const [template, findings] of [...pendingByTemplate].sort(([a], [b]) => a.localeCompare(b))) {
    const prefix = `${CARD_PREFIX}-${cardSlug(template)}-`;
    if (openIds.some((id) => id.startsWith(prefix))) continue;
    const picked = findings
      .sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || a.key.localeCompare(b.key))
      .slice(0, BATCH_SIZE);
    const id = `${prefix}${today.replaceAll("-", "")}`;
    cards.push({ id, template, keys: picked.map((f) => f.key), markdown: renderCard(id, template, picked, today, screenshotBaseUrl) });
  }
  return cards;
}

const CLI = "npx tsx .claude/scripts/page-quality/ui-findings.ts";

const hasMetric = (findings: readonly UiFinding[], metric: string) =>
  findings.some((f) => f.metric_key === metric || f.key.endsWith(`|${metric}`));

/**
 * チャートの文字の指摘は、直し方が「部品を直す (agent)」と「作り直すだけ (スクリプト)」に分かれる。
 * 判断をカードの読み手に委ねず、振り分けの手順をカード本文に書く。正典: page-quality-standards.md
 */
export function chartFixGuide(findings: readonly UiFinding[], batchFile: string): string[] {
  const lines: string[] = [];
  if (hasMetric(findings, "chart_text_issues")) {
    lines.push(
      "- **チャートの文字 (ページに描く D3 チャート・agent が直す)**: 指摘の `svg[…]` から部品 (`packages/visualization/src/d3/components/*`) を特定し、部品を直す。1 部品を直せば同じ部品を使う全ページが直るので、ページ単位で直さない。描画範囲の外へ出る文字は共通の仕組み (`.claude/rules/chart-component-standards.md`) で収め、長いラベル (「1,400.0万」・47 都道府県名・6 系列の凡例) で描く回帰テストを足す。"
    );
  }
  if (hasMetric(findings, "blog_svg_text_issues")) {
    lines.push(
      `- **記事チャート SVG (振り分けてから直す)**: まず \`npx tsx .claude/scripts/blog/plan-svg-text-fix.ts @${batchFile}\` を実行する。` +
        "`regen-fixes` は生成器が既に正しく、R2 の SVG を作り直すだけで直る (コード変更なし)。R2 への反映はオーナー承認が要るので、出力された `gh workflow run regenerate-blog-svgs.yml …` を書いた `[実行:ユーザー]` カードを起票し、対象を `--mark-owner` で紐付ける。" +
        "`generator-fix` は `packages/svg-builder` の該当チャートを直し、長いラベルの fixture テストを足してから再実行して `regen-fixes` になることを確かめる (以降は同じ手順)。" +
        "`no-data` は data JSON が無く作り直せないので、手作業の brushup を依頼するカードを起票して `--mark-owner`。`clean` は既に直っているので `--mark-fixed`。"
    );
  }
  return lines;
}

function renderCard(id: string, template: string, findings: UiFinding[], today: string, screenshotBaseUrl: string): string {
  const file = batchPath(id);
  const shots = ["mobile-390", "desktop-1440"]
    .map((device) => `[${device}](${screenshotBaseUrl}/state/page-quality/screenshots/latest/${template}-${device}.png)`)
    .join(" / ");
  const target = (f: UiFinding) => {
    const head = f.source === "machine" ? `\`${f.key}\` — ${f.detail}` : `\`${f.key}\` (Claude の確認)`;
    const agentLines = f.source === "agent" ? f.detail.split("\n").map((line) => `    - ${line}`) : [];
    const reopened = f.note ? [`    - 経緯: ${f.note}`] : [];
    return [`  - ${head}`, ...agentLines, ...reopened];
  };
  return [
    `### [${id}] UI 是正: ${template} の週次 UI 検査の指摘 ${findings.length} 件を直す`,
    "",
    `タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:${CLI} --assert-handled ${file}] [起票:${today}]`,
    "",
    `- **自動起票**: 週次のページ品質監査 (\`page-quality-audit-weekly.yml\`) の結果から \`ui-findings.ts --sync\` が作った。対象の一覧は \`${file}\`、状態は \`.claude/state/page-quality/ui-findings-queue.json\`。正典は \`.claude/rules/page-quality-standards.md\`「UI 指摘のループ」。`,
    `- **スクショ (最新の週次)**: ${shots}。検査の詳細は \`.claude/state/metrics/page-quality/LATEST.md\`。`,
    "- **対象**:",
    ...findings.flatMap(target),
    ...chartFixGuide(findings, file),
    "- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。",
    `- **記録**: 直した指摘は \`${CLI} --mark-fixed <key> --note "<何を変えたか>"\`、直さないと判断した指摘は \`--mark-by-design <key> --note "<理由>"\`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた \`[実行:対話]\` のカードを backlog に起票してから \`--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"\` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは \`@${file}\`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。`,
    "- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。",
    "- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。",
  ].join("\n");
}

/** tier 見出し (🟡) の直後にカードを差し込む。見出しが無ければ差し込まない。 */
export function insertCards(backlogText: string, cards: readonly PlannedCard[]): { text: string; inserted: string[] } {
  const lines = backlogText.split("\n");
  const inserted: string[] = [];
  for (const card of cards) {
    const heading = lines.findIndex((line) => line.startsWith("## 🟡"));
    if (heading < 0) continue;
    lines.splice(heading + 1, 0, "", ...card.markdown.split("\n"));
    inserted.push(card.id);
  }
  return { text: lines.join("\n"), inserted };
}

/** 対応するカードが閉じた batch ファイル名。 */
export function staleBatchFiles(fileNames: readonly string[], openIds: readonly string[]): string[] {
  const open = new Set(openIds);
  return fileNames.filter((name) => name.startsWith(`${CARD_PREFIX}-`) && name.endsWith(".txt") && !open.has(name.slice(0, -4)));
}
