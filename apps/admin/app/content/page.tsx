import { BanIcon, CircleCheckIcon, FileWarningIcon, HammerIcon, PencilRulerIcon } from "lucide-react";

import { ChannelSummaryCard, ContentAuditPanel, DecisionPanel } from "@/components/content/content-ui";
import { LinkCard, StatCard } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { contentOperations } from "@/lib/server/content-operations";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "コンテンツ運用 — stats47 admin" };

/** /content — 型 A (概況): チャネル別の数値 → 参考文献の数値 → 判断待ち・監査の区画 */
export default function ContentPage() {
  const data = contentOperations();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="コンテンツ運用" source="各チャネルの既存SSOT" />
        <ErrorNote error={data.error} />
      </>
    );
  }

  return (
    <>
      <PageHeading title="コンテンツ運用" source="SNS posts / note catalog + R2 / Kindle catalog + KDP listings">
        <p className="text-sm text-muted-foreground">
          原稿・公開状態・次の作業を横断表示します。TODOはシステム課題と意思決定だけに使い、個々の制作物はここで追跡します。
        </p>
      </PageHeading>

      <Section title="チャネル別の現在地">
        <Grid min="md">
          {data.channels.map((channel) => (
            <ChannelSummaryCard key={channel.channel} channel={channel} />
          ))}
        </Grid>
      </Section>

      <Section title="参考文献からの展開">
        {/* Card の入れ子は禁止 (apps/web の design-system:check)。リンクカードと数値タイルは同じ格子に並べる */}
        <Grid min="sm">
          <LinkCard
            href="/content/references"
            title="参考文献 制作ポートフォリオ"
            value={`${data.references.summary.productionUnits}単位`}
            sub="Drive原本を複製せず、解決済みinventoryを既存のサイト・ブログ・note・Kindleへ突合します。"
          />
          <StatCard label="統合済み" icon={<CircleCheckIcon />} value={data.references.summary.integratedSlots} tone="good" />
          <StatCard label="制作中" icon={<PencilRulerIcon />} value={data.references.summary.draftSlots} tone="warn" />
          <StatCard label="制作可能" icon={<HammerIcon />} value={data.references.summary.readySlots} tone="info" />
          <StatCard label="制作停止" icon={<BanIcon />} value={data.references.summary.blockedSlots} tone="bad" />
          <StatCard label="公開不可の根拠候補" icon={<FileWarningIcon />} value={data.references.summary.blockedEvidence} tone="warn" />
        </Grid>
      </Section>

      <Grid min="lg">
        <DecisionPanel decisions={data.decisions} />
        <ContentAuditPanel status={data.audit.status} findings={data.audit.findings} />
      </Grid>
    </>
  );
}
