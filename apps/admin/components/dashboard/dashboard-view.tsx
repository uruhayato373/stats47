"use client";

import { useEffect, useState } from "react";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { EmptyState, ErrorState, Loading } from "@/components/async-state";

import { BacklogTable, type BacklogRow } from "./backlog-table";
import { FeatureTable, type FeatureRow } from "./feature-table";
import { MetricsSection, type MetricsData } from "./metrics-section";
import { QueuesSection, type QueuesData } from "./queues-section";
import { StrategySection, type StrategyData } from "./strategy-section";

type Wrapped<T> = T | { error: string };

interface DashboardSummary extends MetricsData, QueuesData {
  generatedAt: string;
  backlog: Wrapped<{ rows?: BacklogRow[] }>;
  featureBacklog: Wrapped<{ rows?: FeatureRow[] }>;
  strategy: Wrapped<StrategyData>;
}

const ANCHOR_ITEMS = [
  { href: "#metrics", label: "メトリクス" },
  { href: "#queues", label: "進捗キュー" },
  { href: "#todo", label: "改善バックログ" },
  { href: "#feature", label: "機能バックログ" },
  { href: "#strategy", label: "戦略" },
];

export function DashboardView() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    apiGet<DashboardSummary>("/api/dashboard/summary")
      .then((res) => setData(res))
      .catch((e: unknown) => {
        const message =
          e instanceof ApiError
            ? `取得失敗: ${e.message}。npm run admin を起動してください`
            : e instanceof Error
              ? e.message
              : String(e);
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-console-fg">プロジェクト現況</h1>
        <p className="mt-1 text-xs text-console-muted">
          {loading ? (
            "読込中…"
          ) : error ? (
            <span className="text-console-bad">{error}</span>
          ) : data ? (
            `state/md ライブ読みの読み取り専用ミラー (60秒キャッシュ)。取得: ${data.generatedAt.replace("T", " ").slice(0, 19)} — 再読込で更新`
          ) : null}
        </p>
        <nav className="mt-3 flex flex-wrap gap-1.5">
          {ANCHOR_ITEMS.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="rounded-md border border-console-border px-2.5 py-1 text-xs text-console-fg/80 transition-colors hover:border-console-accent"
            >
              {a.label}
            </a>
          ))}
        </nav>
      </div>

      {loading ? <Loading /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && !data ? <EmptyState message="現況データなし" /> : null}

      {data ? (
        <>
          <section id="metrics">
            <h2 className="mb-3 border-b border-console-border pb-1.5 text-sm font-semibold text-console-fg">
              メトリクス (週次)
            </h2>
            <MetricsSection metrics={data.metrics} psi={data.psi} coverage={data.coverage} />
          </section>

          <section id="queues">
            <h2 className="mb-3 border-b border-console-border pb-1.5 text-sm font-semibold text-console-fg">
              進捗キュー
            </h2>
            <QueuesSection
              blogQueue={data.blogQueue}
              aiContent={data.aiContent}
              topicQueue={data.topicQueue}
              sns={data.sns}
              winningPatterns={data.winningPatterns}
              experiments={data.experiments}
            />
          </section>

          <section id="todo">
            <h2 className="mb-1 border-b border-console-border pb-1.5 text-sm font-semibold text-console-fg">
              TODO — 改善バックログ{/* .claude/todo/04_改善バックログ.md ミラー */}
            </h2>
            <p className="mb-3 text-xs text-console-muted">
              真実源: <code className="rounded bg-console-card px-1">.claude/todo/04_改善バックログ.md</code>{" "}
              (このテーブルは読み取り専用ミラー。編集は md 側で)
            </p>
            <BacklogTable backlog={data.backlog} />
          </section>

          <section id="feature">
            <h2 className="mb-1 border-b border-console-border pb-1.5 text-sm font-semibold text-console-fg">
              機能バックログ
            </h2>
            <p className="mb-3 text-xs text-console-muted">
              真実源: <code className="rounded bg-console-card px-1">.claude/todo/05_機能バックログ.md</code>{" "}
              (読み取り専用ミラー。編集は md 側で)
            </p>
            <FeatureTable featureBacklog={data.featureBacklog} />
          </section>

          <section id="strategy">
            <h2 className="mb-3 border-b border-console-border pb-1.5 text-sm font-semibold text-console-fg">
              戦略 (STP)
            </h2>
            <StrategySection strategy={data.strategy} />
          </section>
        </>
      ) : null}
    </div>
  );
}
