import { BanIcon, CheckCircle2Icon, FilePenLineIcon, ImageIcon, ListIcon, MapPinnedIcon, SendIcon } from "lucide-react";

import { StatCard } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";
import type { BuzzMapCatalogResponse } from "@/lib/contracts/types";

/** 集計: 総候補、eligible、blocked、landing-ready、generated、draft、posted。 */
export function BuzzMapSummary({ summary }: { summary: BuzzMapCatalogResponse["summary"] }) {
  const { aggregate, generatedAt } = summary;
  return (
    <Grid min="sm">
      <StatCard label="総候補" icon={<ListIcon />} value={aggregate.total} sub={generatedAt ? `catalog 更新: ${generatedAt}` : undefined} />
      <StatCard label="eligible" icon={<CheckCircle2Icon />} value={aggregate.eligible} />
      <StatCard label="blocked" icon={<BanIcon />} value={aggregate.blocked} tone={aggregate.blocked ? "warn" : "neutral"} />
      <StatCard label="landing-ready" icon={<MapPinnedIcon />} value={aggregate.landingReady} />
      <StatCard label="generated" icon={<ImageIcon />} value={aggregate.generated} />
      <StatCard label="draft" icon={<FilePenLineIcon />} value={aggregate.draft} />
      <StatCard label="posted" icon={<SendIcon />} value={aggregate.posted} />
    </Grid>
  );
}
