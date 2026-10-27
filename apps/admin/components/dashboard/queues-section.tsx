import type { ReactNode } from "react";
import { BotIcon, FlaskConicalIcon, LightbulbIcon, MegaphoneIcon, NotebookPenIcon, TrophyIcon } from "lucide-react";

import { Cell, DataTable, PanelCard, Row, StatusBadge, TableBody, TableFrame } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";
import { Progress } from "@/components/ui/progress";

import { num, statusTone } from "./format";

type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

function QueueCard({ title, icon, fresh, children }: { title: string; icon: ReactNode; fresh?: string; children: ReactNode }) {
  return (
    <PanelCard title={title} icon={icon} description={fresh ? `(${fresh})` : undefined} className="min-w-0">
      <div className="flex flex-col gap-2">{children}</div>
    </PanelCard>
  );
}

/** 完了の割合 (%)。全体が 0 件なら 0 */
function donePct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
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
  const cards: ReactNode[] = [];

  if (!hasError(d.blogQueue) && d.blogQueue.summary) {
    const s = d.blogQueue.summary;
    const top = d.blogQueue.topMustFix ?? [];
    cards.push(
      <QueueCard
        key="blog-queue"
        title="ブログ品質是正キュー"
        icon={<NotebookPenIcon />}
        fresh={`${d.blogQueue.gscWeek ?? ""}・${(d.blogQueue.generatedAt ?? "").slice(0, 10)}`}
      >
        <Progress value={donePct(s.done, s.done + s.inProgress + s.pending)} aria-label="done の割合" />
        <div className="text-xs text-muted-foreground">
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
        <div className="text-xs text-muted-foreground">
          払い出し: <code className="rounded bg-muted px-1 font-mono text-xs">build-remediation-queue.mjs --next N</code> →{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">/brushup-blog --target queue</code>
        </div>
      </QueueCard>,
    );
  }

  if (!hasError(d.aiContent) && d.aiContent.summary) {
    const s = d.aiContent.summary;
    const top = d.aiContent.topNeeds ?? [];
    const run = d.aiContent.latestRun;
    cards.push(
      <QueueCard key="ai-content" title="ランキング ai-content" icon={<BotIcon />} fresh={(d.aiContent.generatedAt ?? "").slice(0, 10)}>
        <Progress value={donePct(s.done, s.done + s.needsRegen)} aria-label="done の割合" />
        <div className="text-xs text-muted-foreground">
          done {s.done} / needs-regen {num(s.needsRegen)} (incomplete {num(s.needsByReason?.incomplete)} / missing{" "}
          {s.needsByReason?.missing ?? 0} / blocker {s.needsByReason?.blocker ?? 0})・Gemini 日次 {s.geminiDailyLimit ?? 3}件
        </div>
        {run ? (
          <div className="text-xs text-muted-foreground">
            直近 {run.date}: {run.model} / PASS {num(run.passed)} of {num(run.targets)} / REJECT {num(run.rejected)} / FAIL{" "}
            {num(run.failed)} / token {num(run.total_tokens)} / quota停止 {num(run.quota_failures)}
            {run.preflight_status ? ` / preflight ${run.preflight_status} (${num(run.preflight_requests)} req)` : ""}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Gemini 定期 run は未観測</div>
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
        <div className="text-xs text-muted-foreground">
          定期量産: <code className="rounded bg-muted px-1 font-mono text-xs">ai-content-gemini-daily.yml</code>・手動是正候補 {s.manualEscalationTier ?? 30}件
        </div>
      </QueueCard>,
    );
  }

  if (!hasError(d.topicQueue) && d.topicQueue.summary) {
    const s = d.topicQueue.summary;
    const top = d.topicQueue.topPending ?? [];
    const arch = Object.entries(s.byArchetype ?? {});
    cards.push(
      <QueueCard key="topic-queue" title="記事ネタキュー" icon={<LightbulbIcon />} fresh={(d.topicQueue.generatedAt ?? "").slice(0, 10)}>
        <div className="text-xs text-muted-foreground">
          pending {s.pending} / in-progress {s.inProgress} (must-write {s.mustWritePending})
        </div>
        {arch.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {arch.map(([k, v]) => (
              <StatusBadge key={k} tone="info">
                {k}: {v}
              </StatusBadge>
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
      <QueueCard key="sns" title="SNS 投稿台帳" icon={<MegaphoneIcon />}>
        <div className="text-xs text-muted-foreground">
          posted {d.sns.posted} / scheduled {d.sns.scheduled} / draft {d.sns.draft}・最終投稿{" "}
          {(d.sns.lastPosted ?? "—").slice(0, 10)}
        </div>
        {plat.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {plat.map(([k, v]) => (
              <StatusBadge key={k}>
                {k}: {v}
              </StatusBadge>
            ))}
          </div>
        ) : null}
        {warnEmpty ? (
          <div className="text-xs text-console-warn">⚠ 予約/draft が 0 — X 量産 (/post-x-batch) 未稼働</div>
        ) : null}
      </QueueCard>,
    );
  }

  if (!hasError(d.winningPatterns) && d.winningPatterns.sample) {
    const wp = d.winningPatterns;
    cards.push(
      <QueueCard key="winning-patterns" title="ブログ勝ちパターン" icon={<TrophyIcon />} fresh={wp.gscWeek}>
        <div className="text-xs text-muted-foreground">
          n={wp.sample?.evaluated} (winner {wp.sample?.winners} / loser {wp.sample?.losers})
          <br />
          winner CTR 中央値{" "}
          <b className="text-foreground">{((wp.winner?.medianCtr ?? 0) * 100).toFixed(2)}%</b> (pos{" "}
          {wp.winner?.medianPosition}) vs loser {((wp.loser?.medianCtr ?? 0) * 100).toFixed(2)}%
        </div>
      </QueueCard>,
    );
  }

  if (!hasError(d.experiments)) {
    const list = d.experiments.experiments ?? [];
    cards.push(
      <QueueCard key="experiments" title="実験 (PDCA)" icon={<FlaskConicalIcon />}>
        <TableFrame><TableBody>
            {list.map((e) => (
              <Row key={e.id}>
                <Cell nowrap>{e.id}</Cell>
                <Cell className="max-w-[240px] truncate" title={e.title}>
                  {e.title}
                </Cell>
                <Cell>
                  <StatusBadge tone={statusTone(e.status)}>{e.status}</StatusBadge>
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

  return <Grid min="lg">{cards}</Grid>;
}
