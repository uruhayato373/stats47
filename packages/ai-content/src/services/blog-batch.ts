/**
 * blog-batch — ブログ量産バッチの決定的な判断 (純粋関数)。
 *
 * 需要順の対象選定、slug の決定、公開待ちへの確定結果の読み取り、結果の一覧を持つ。
 * 実行の順序と子プロセスは scripts/write-blog-batch.ts が持つ。
 *
 * 正典: .claude/rules/blog-quality-standards.md「量産バッチ」
 */

export interface TopicEntry {
  topicKey: string;
  archetype: string;
  metricKeys: string[];
  label: string;
  suggestedTitle: string;
  status: string;
  lane: string;
  source?: string;
  combinedScore?: number;
  /** 47 県に満たない散布図で、対象外の県がなぜ対象外かを宣言する (§blog-svg-chart-standards §6-3) */
  exclusionReason?: string;
}

/** metric config のうち、調査の指定に照らす欄 */
export interface MetricSourceInfo {
  surveyId?: string;
  sourceKind?: string;
  displayName?: string;
}

/**
 * topicKey → slug。**決定的**にする (毎回同じ slug になる)。
 * 既存記事と同じ命名 (`<metric>-prefecture-gap`) に寄せ、URL が長くなりすぎないよう切る。
 */
export function slugForTopic(topic: Pick<TopicEntry, "topicKey" | "metricKeys" | "archetype">): string {
  const primary = topic.metricKeys[0] ?? topic.topicKey;
  // 型B は 2 指標の関係が主題なので slug も両方を含める。切り詰めで衝突しても
  // 「既に存在」でスキップされるだけなので安全側に倒れる。
  const base =
    topic.archetype === "B" && topic.metricKeys.length >= 2
      ? `${topic.metricKeys[0]}-vs-${topic.metricKeys[1]}`
      : `${primary}-prefecture-gap`;
  if (base.length <= 60) return base;
  const cut = base.slice(0, 60);
  const boundary = cut.lastIndexOf("-");
  return boundary > 20 ? cut.slice(0, boundary) : cut;
}

/** GSC の pages.csv から、ランキングページの表示回数を key ごとに足す */
export function addRankingImpressions(csv: string, demand: Map<string, number>): void {
  for (const line of csv.split("\n").slice(1)) {
    const [page, , impressions] = line.split(",");
    const key = page?.match(/\/ranking\/([^/?#]+)$/)?.[1];
    if (key) demand.set(key, (demand.get(key) ?? 0) + Number(impressions));
  }
}

/** 調査の指定はトピックの出どころ・metric の surveyId / source.kind / 調査名のどれでも当てる */
export function matchesSource(
  topic: Pick<TopicEntry, "source" | "metricKeys">,
  source: string,
  metrics: ReadonlyMap<string, MetricSourceInfo>,
): boolean {
  if (topic.source === source) return true;
  return topic.metricKeys.some((key) => {
    const info = metrics.get(key);
    return info !== undefined && [info.surveyId, info.sourceKind, info.displayName].includes(source);
  });
}

export interface RankedTopic {
  topic: TopicEntry;
  slug: string;
  demand: number;
}

/**
 * pending のトピックを需要の大きい順に並べる。同じ需要はトピックのスコア順。
 * 既に送り箱か公開済みにある slug は外す (実行中の記事に触らない)。同じ slug のトピックは先頭だけ残す。
 */
export function rankBatchTopics(input: {
  topics: readonly TopicEntry[];
  source: string | null;
  metrics: ReadonlyMap<string, MetricSourceInfo>;
  demand: ReadonlyMap<string, number>;
  takenSlugs: ReadonlySet<string>;
}): RankedTopic[] {
  const { topics, source, metrics, demand, takenSlugs } = input;
  const ranked = topics
    .filter((t) => t.status === "pending" && t.metricKeys.length > 0)
    .filter((t) => source === null || matchesSource(t, source, metrics))
    .map((topic) => ({
      topic,
      slug: slugForTopic(topic),
      demand: topic.metricKeys.reduce((sum, key) => sum + (demand.get(key) ?? 0), 0),
    }))
    .filter((r) => !takenSlugs.has(r.slug))
    .sort((a, b) => b.demand - a.demand || (b.topic.combinedScore ?? 0) - (a.topic.combinedScore ?? 0));
  const seen = new Set<string>();
  return ranked.filter((r) => {
    if (seen.has(r.slug)) return false;
    seen.add(r.slug);
    return true;
  });
}

export type IngestOutcome = "ready" | "background-pending" | "rejected";

/**
 * `generate-blog-article.ts --ingest` の出力を読む。新しい記事の背景は Codex の工程で作るので、
 * 公開フラグ後のゲートに背景の blocker だけが残るのは失敗ではなく背景待ちとして扱う。
 */
export function classifyIngest(output: string, exitCode: number | null): IngestOutcome {
  if (exitCode === 0) return "ready";
  const blockers = output.split("\n").filter((line) => /^\s+- /.test(line));
  const afterPublish = output.includes("公開フラグ後のゲートで落ちた");
  return afterPublish && blockers.length > 0 && blockers.every((line) => /^\s+- 背景:/.test(line))
    ? "background-pending"
    : "rejected";
}

export type BatchStatus = "ready" | "background-pending" | "revise" | "gate-rejected" | "fail" | "ingest-rejected" | "skipped";

export interface BatchRow {
  slug: string;
  status: BatchStatus;
  title?: string;
  /** 需要: 直近の週のランキングページの表示回数 */
  demand: number;
  authorCalls?: number;
  tokens?: number;
  costUsd?: number;
  research?: boolean;
  /** 落ちた理由・次の手 */
  note?: string;
}

const STATUS_LABEL: Record<BatchStatus, string> = {
  ready: "公開待ち",
  "background-pending": "背景待ち",
  revise: "critic 差し戻し",
  "gate-rejected": "ゲート落ち",
  fail: "実行エラー",
  "ingest-rejected": "確定で落ちた",
  skipped: "書かない",
};

function cell(text: string | number | undefined): string {
  return String(text ?? "").replace(/\|/g, "/").replace(/\n/g, " ");
}

/** 結果の一覧。件数の要約と表、背景の未生成の一覧を返す */
export function renderBatchSummary(rows: readonly BatchRow[], backgroundCommand: (slug: string) => string): string {
  const count = (status: BatchStatus) => rows.filter((r) => r.status === status).length;
  const written = rows.filter((r) => r.status !== "skipped");
  const passed = count("ready") + count("background-pending");
  const lines = [
    `合格 ${passed}/${written.length} 本 (公開待ち ${count("ready")} / 背景待ち ${count("background-pending")})` +
      ` / 書かない ${count("skipped")} 本` +
      ` / 合計 ${written.reduce((sum, r) => sum + (r.tokens ?? 0), 0).toLocaleString("ja-JP")} トークン`,
    "",
    "| slug | 結果 | 題 | 需要 | 調査材料 | 執筆回数 | トークン | 費用 | 理由 |",
    "|---|---|---|---:|---|---:|---:|---:|---|",
    ...rows.map((r) =>
      [
        "",
        cell(r.slug),
        STATUS_LABEL[r.status],
        cell(r.title),
        r.demand.toLocaleString("ja-JP"),
        r.research ? "あり" : "",
        cell(r.authorCalls),
        r.tokens === undefined ? "" : r.tokens.toLocaleString("ja-JP"),
        r.costUsd === undefined ? "" : `$${r.costUsd.toFixed(2)}`,
        cell(r.note),
        "",
      ].join(" | ").trim(),
    ),
  ];
  const pending = rows.filter((r) => r.status === "background-pending");
  if (pending.length > 0) {
    lines.push("", `背景が未生成の記事 ${pending.length} 本 (Codex の工程で作る):`);
    lines.push(...pending.map((r) => `- ${backgroundCommand(r.slug)}`));
  }
  return lines.join("\n");
}
