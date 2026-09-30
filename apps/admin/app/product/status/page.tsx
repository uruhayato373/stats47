import { ChannelSummaryCard } from "@/components/content/content-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { channelById, channelsOf } from "@/lib/channel-registry";
import { coconalaSummary } from "@/lib/server/coconala";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "販売状態 — stats47 admin" };

/** 商品 3 チャネル (note・ココナラ・Kindle) の現在地を横断で並べる。各チャネルの詳細は左メニューの「チャネル別」 */
export default function ProductStatusPage() {
  const content = contentOperations();
  const coconala = coconalaSummary();
  const productIds = new Set(channelsOf("product").map((c) => c.id));
  const coconalaChannel = channelById("coconala");

  return (
    <div className="space-y-8">
      <PageHeading
        title="販売状態"
        source="note catalog + R2 / coconala-listings.json + product-factory / Kindle catalog + KDP listings"
      />

      <Section title="チャネル別の現在地">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {hasError(content) ? (
            <ErrorNote error={content.error} />
          ) : (
            content.channels
              .filter((channel) => productIds.has(channel.channel))
              .map((channel) => <ChannelSummaryCard key={channel.channel} channel={channel} />)
          )}
          {hasError(coconala) ? (
            <ErrorNote error={coconala.error} />
          ) : (
            <ChannelSummaryCard
              channel={{
                label: coconalaChannel.label,
                href: coconalaChannel.href,
                total: coconala.rows.length,
                draft: coconala.draft + coconala.unlisted,
                ready: 0,
                review: 0,
                scheduled: 0,
                published: coconala.listed,
                blocked: 0,
                source: coconala.source,
              }}
            />
          )}
        </div>
      </Section>

      {hasError(content) ? null : (
        <Section title="判断待ち" count={content.decisions.filter((x) => x.status === "pending").length}>
          <div className="space-y-2">
            {content.decisions.map((decision) => (
              <article key={`${decision.channel}-${decision.title}`} className="rounded-md border border-console-warn/50 bg-console-warn/10 p-3">
                <div className="text-sm font-semibold text-console-fg">{decision.title}</div>
                <p className="mt-1 text-xs text-console-muted">{decision.detail}</p>
                <p className="mt-1 text-xs text-console-muted">再開条件: {decision.resumeCondition}</p>
                <code className="mt-2 block text-[10px] text-console-muted">{decision.source}</code>
              </article>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
