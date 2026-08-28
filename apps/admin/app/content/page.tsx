import {
  ContentAuditPanel,
  StageBadge,
} from "@/components/content/content-ui";
import { ErrorNote, PageHeading, Section } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "コンテンツ運用 — stats47 admin" };

export default function ContentPage() {
  const data = contentOperations();
  if (hasError(data)) {
    return (
      <div className="space-y-4">
        <PageHeading title="コンテンツ運用" source="各チャネルの既存SSOT" />
        <ErrorNote error={data.error} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading
        title="コンテンツ運用"
        source="SNS posts / note catalog + R2 / Kindle catalog + KDP listings"
      >
        <p className="text-xs text-console-muted">
          原稿・公開状態・次の作業を横断表示します。TODOはシステム課題と意思決定だけに使い、個々の制作物はここで追跡します。
        </p>
      </PageHeading>

      <Section title="チャネル別の現在地">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.channels.map((channel) => (
            <a
              key={channel.channel}
              href={channel.href}
              className="rounded-md border border-console-border bg-console-card p-4 transition-colors hover:border-console-accent/60"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold text-console-fg">{channel.label}</h2>
                <span className="font-mono text-xl font-bold text-console-fg">{channel.total}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {channel.ready > 0 ? <StageBadge stage="ready" /> : null}
                {channel.scheduled > 0 ? <StageBadge stage="scheduled" /> : null}
                {channel.published > 0 ? <StageBadge stage="published" /> : null}
                {channel.draft > 0 ? <StageBadge stage="draft" /> : null}
                {channel.blocked > 0 ? <StageBadge stage="blocked" /> : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-console-muted">
                <div>準備完了 {channel.ready}</div>
                <div>予約 {channel.scheduled}</div>
                <div>公開 {channel.published}</div>
                <div>準備中 {channel.draft}</div>
              </dl>
              <p className="mt-3 break-all text-[10px] text-console-muted/80">{channel.source}</p>
            </a>
          ))}
        </div>
      </Section>

      <Section title="判断待ち" count={data.decisions.filter((x) => x.status === "pending").length}>
        <div className="space-y-2">
          {data.decisions.map((decision) => (
            <article key={`${decision.channel}-${decision.title}`} className="rounded-md border border-console-warn/50 bg-console-warn/10 p-3">
              <div className="text-sm font-semibold text-console-fg">{decision.title}</div>
              <p className="mt-1 text-xs text-console-muted">{decision.detail}</p>
              <p className="mt-1 text-xs text-console-muted">再開条件: {decision.resumeCondition}</p>
              <code className="mt-2 block text-[10px] text-console-muted">{decision.source}</code>
            </article>
          ))}
        </div>
      </Section>

      <Section title="機械監査">
        <ContentAuditPanel status={data.audit.status} findings={data.audit.findings} />
      </Section>
    </div>
  );
}
