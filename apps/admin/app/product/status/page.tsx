import { ChannelSummaryCard, DecisionPanel } from "@/components/content/content-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { channelsOf } from "@/lib/channel-registry";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "販売状態 — stats47 admin" };

/**
 * 商品 2 チャネル (note・Kindle) の現在地を横断で並べる。型 A (概況): チャネルのカード → 判断待ち。
 * 各チャネルの詳細は左メニューの「チャネル別」
 */
export default function ProductStatusPage() {
  const content = contentOperations();
  const productIds = new Set(channelsOf("product").map((c) => c.id));

  return (
    <>
      <PageHeading title="販売状態" source="note catalog + R2 / Kindle catalog + KDP listings" />

      <Section title="チャネル別の現在地">
        {hasError(content) ? <ErrorNote error={content.error} /> : null}
        <Grid min="md">
          {hasError(content)
            ? null
            : content.channels
                .filter((channel) => productIds.has(channel.channel))
                .map((channel) => <ChannelSummaryCard key={channel.channel} channel={channel} />)}
        </Grid>
      </Section>

      {hasError(content) ? null : <DecisionPanel decisions={content.decisions} />}
    </>
  );
}
