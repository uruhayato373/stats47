import { num, statusBadgeClass } from "./format";
import { ProgressBar } from "./progress-bar";

import { Cell, DataTable, Row, TableBody, TableFrame } from "@/components/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

function QueueCard({ title, fresh, children }: { title: string; fresh?: string; children: React.ReactNode }) {
  return (
    // min-w-0: grid item の automatic minimum size を殺し、内側 overflow-x-auto を効かせる (390px 対策)
    <Card className="min-w-0 gap-0 py-3.5"><CardContent className="px-3.5">
      <h3 className="m-0 text-[13px] font-semibold text-console-fg">
        {title} {fresh ? <span className="ml-1 text-[10px] font-normal text-console-muted">({fresh})</span> : null}
      </h3>
      <div className="mt-2">{children}</div>
    </CardContent></Card>
  );
}

export interface QueuesData {
  blogQueue: Wrapped<{
    generatedAt?: string;
    gscWeek?: string;
    summary?: { done: number; inProgress: number; pending: number; mustFixPending: number };
    topMustFix?: Array<{ slug: string; blockers: number; impressions: number }>;
  }>;
  aiContent: Wrapped<{
    generatedAt?: string;
    summary?: {
      done: number;
      needsRegen: number;
      needsByReason?: { incomplete?: number; missing?: number; blocker?: number };
      manualEscalationTier?: number;
      geminiDailyLimit?: number;
    };
    topNeeds?: Array<{ rankingKey: string; impressions: number; reviewTier: string | null }>;
    latestRun?: {
      date?: string;
      model?: string;
      targets?: number;
      passed?: number;
      rejected?: number;
      failed?: number;
      total_tokens?: number;
      quota_failures?: number;
      preflight_requests?: number;
      preflight_status?: string;
    } | null;
  }>;
  topicQueue: Wrapped<{
    generatedAt?: string;
    summary?: { pending: number; inProgress: number; mustWritePending: number; byArchetype?: Record<string, number> };
    topPending?: Array<{ label: string; archetype: string }>;
  }>;
  sns: Wrapped<{
    posted: number;
    scheduled: number;
    draft: number;
    lastPosted?: string;
    byPlatform: Record<string, number>;
  }>;
  winningPatterns: Wrapped<{
    gscWeek?: string;
    sample?: { evaluated?: number; winners?: number; losers?: number };
    winner?: { medianCtr?: number; medianPosition?: number };
    loser?: { medianCtr?: number; medianPosition?: number };
  }>;
  experiments: Wrapped<{ experiments?: Array<{ id: string; title: string; status: string }> }>;
}

/** 旧 dashboard.html renderQueues() の移植。各カードは欠損耐性 (error はカードごと非表示)。 */
export function QueuesSection(d: QueuesData) {
  const cards: React.ReactNode[] = [];

  if (!hasError(d.blogQueue) && d.blogQueue.summary) {
    const s = d.blogQueue.summary;
    const top = d.blogQueue.topMustFix ?? [];
    cards.push(
      <QueueCard
        key="blog-queue"
        title="📝 ブログ品質是正キュー"
        fresh={`${d.blogQueue.gscWeek ?? ""}・${(d.blogQueue.generatedAt ?? "").slice(0, 10)}`}
      >
        <ProgressBar
          parts={[
            { n: s.done, tone: "good" },
            { n: s.inProgress, tone: "info" },
            { n: s.pending, tone: "neutral" },
          ]}
        />
        <div className="text-[12px] text-console-muted">
          done {s.done} / in-progress {s.inProgress} / pending {s.pending} (must-fix 未着手 {s.mustFixPending})
        </div>
        {top.length > 0 ? (
          // カード内テーブルは overflow-x-auto でラップ (390px で body を押し出さない)
          <DataTable columns={["must-fix top", "blocker", "imp"]}>
              {top.slice(0, 5).map((e, i) => (
                <Row key={i}>
                  <Cell className="max-w-[220px] truncate" title={e.slug}>
                    {e.slug}
                  </Cell>
                  <Cell>{e.blockers}</Cell>
                  <Cell>{num(e.impressions)}</Cell>
                </Row>
              ))}
            </DataTable>
        ) : null}
        <div className="mt-1.5 text-[10px] text-console-muted">
          払い出し: <code className="rounded bg-console-bg px-1">build-remediation-queue.mjs --next N</code> →{" "}
          <code className="rounded bg-console-bg px-1">/brushup-blog --target queue</code>
        </div>
      </QueueCard>,
    );
  }

  if (!hasError(d.aiContent) && d.aiContent.summary) {
    const s = d.aiContent.summary;
    const top = d.aiContent.topNeeds ?? [];
    const run = d.aiContent.latestRun;
    cards.push(
      <QueueCard key="ai-content" title="🤖 ランキング ai-content" fresh={(d.aiContent.generatedAt ?? "").slice(0, 10)}>
        <ProgressBar
          parts={[
            { n: s.done, tone: "good" },
            { n: s.needsRegen, tone: "neutral" },
          ]}
        />
        <div className="text-[12px] text-console-muted">
          done {s.done} / needs-regen {num(s.needsRegen)} (incomplete {num(s.needsByReason?.incomplete)} / missing{" "}
          {s.needsByReason?.missing ?? 0} / blocker {s.needsByReason?.blocker ?? 0})・Gemini 日次 {s.geminiDailyLimit ?? 3}件
        </div>
        {run ? (
          <div className="mt-1 text-[11px] text-console-muted">
            直近 {run.date}: {run.model} / PASS {num(run.passed)} of {num(run.targets)} / REJECT {num(run.rejected)} / FAIL{" "}
            {num(run.failed)} / token {num(run.total_tokens)} / quota停止 {num(run.quota_failures)}
            {run.preflight_status ? ` / preflight ${run.preflight_status} (${num(run.preflight_requests)} req)` : ""}
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-console-muted">Gemini 定期 run は未観測</div>
        )}
        {top.length > 0 ? (
          <DataTable columns={["needs-regen top (imp順)", "imp", "tier"]}>
              {top.slice(0, 5).map((e, i) => (
                <Row key={i}>
                  <Cell className="max-w-[220px] truncate" title={e.rankingKey}>
                    {e.rankingKey}
                  </Cell>
                  <Cell>{num(e.impressions)}</Cell>
                  <Cell>{e.reviewTier ?? "-"}</Cell>
                </Row>
              ))}
            </DataTable>
        ) : null}
        <div className="mt-1.5 text-[10px] text-console-muted">
          定期量産: <code className="rounded bg-console-bg px-1">ai-content-gemini-daily.yml</code>・手動是正候補 {s.manualEscalationTier ?? 30}件
        </div>
      </QueueCard>,
    );
  }

  if (!hasError(d.topicQueue) && d.topicQueue.summary) {
    const s = d.topicQueue.summary;
    const top = d.topicQueue.topPending ?? [];
    const arch = Object.entries(s.byArchetype ?? {});
    cards.push(
      <QueueCard key="topic-queue" title="💡 記事ネタキュー" fresh={(d.topicQueue.generatedAt ?? "").slice(0, 10)}>
        <div className="text-[12px] text-console-muted">
          pending {s.pending} / in-progress {s.inProgress} (must-write {s.mustWritePending})
        </div>
        {arch.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {arch.map(([k, v]) => (
              <span key={k} className="rounded-full border border-sky-400 px-2 py-0.5 text-[10px] text-console-info">
                {k}: {v}
              </span>
            ))}
          </div>
        ) : null}
        {top.length > 0 ? (
          <DataTable columns={["top", "型"]}>
              {top.slice(0, 5).map((e, i) => (
                <Row key={i}>
                  <Cell className="max-w-[260px] truncate" title={e.label}>
                    {e.label}
                  </Cell>
                  <Cell>{e.archetype}</Cell>
                </Row>
              ))}
            </DataTable>
        ) : null}
      </QueueCard>,
    );
  }

  if (!hasError(d.sns)) {
    const plat = Object.entries(d.sns.byPlatform ?? {});
    const warnEmpty = d.sns.scheduled + d.sns.draft === 0;
    cards.push(
      <QueueCard key="sns" title="📮 SNS 投稿台帳">
        <div className="text-[12px] text-console-muted">
          posted {d.sns.posted} / scheduled {d.sns.scheduled} / draft {d.sns.draft}・最終投稿{" "}
          {(d.sns.lastPosted ?? "—").slice(0, 10)}
        </div>
        {plat.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {plat.map(([k, v]) => (
              <span
                key={k}
                className="rounded-full border border-console-border px-2 py-0.5 text-[10px] text-console-muted"
              >
                {k}: {v}
              </span>
            ))}
          </div>
        ) : null}
        {warnEmpty ? (
          <div className="mt-1.5 text-[12px] text-console-warn">⚠ 予約/draft が 0 — X 量産 (/post-x-batch) 未稼働</div>
        ) : null}
      </QueueCard>,
    );
  }

  if (!hasError(d.winningPatterns) && d.winningPatterns.sample) {
    const wp = d.winningPatterns;
    cards.push(
      <QueueCard key="winning-patterns" title="🏆 ブログ勝ちパターン" fresh={wp.gscWeek}>
        <div className="text-[12px] text-console-muted">
          n={wp.sample?.evaluated} (winner {wp.sample?.winners} / loser {wp.sample?.losers})
          <br />
          winner CTR 中央値{" "}
          <b className="text-console-fg">{((wp.winner?.medianCtr ?? 0) * 100).toFixed(2)}%</b> (pos{" "}
          {wp.winner?.medianPosition}) vs loser {((wp.loser?.medianCtr ?? 0) * 100).toFixed(2)}%
        </div>
      </QueueCard>,
    );
  }

  if (!hasError(d.experiments)) {
    const list = d.experiments.experiments ?? [];
    cards.push(
      <QueueCard key="experiments" title="🧪 実験 (PDCA)">
        <TableFrame><TableBody>
            {list.map((e) => (
              <Row key={e.id}>
                <Cell nowrap>{e.id}</Cell>
                <Cell className="max-w-[240px] truncate" title={e.title}>
                  {e.title}
                </Cell>
                <Cell>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusBadgeClass(e.status)}`}>
                    {e.status}
                  </span>
                </Cell>
              </Row>
            ))}
          </TableBody></TableFrame>
      </QueueCard>,
    );
  }

  if (cards.length === 0) {
    return <p className="text-sm text-console-bad">進捗データの取得に失敗</p>;
  }

  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards}</div>;
}
