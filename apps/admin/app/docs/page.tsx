import Link from "next/link";
import { DOMAINS } from "../../../../config/paths.mjs";

import { PanelCard } from "@/components/admin-ui";
import { Grid, Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { allDocuments, domainList } from "@/lib/server/domains";

export const dynamic = "force-dynamic";
export const metadata = { title: "文書 — stats47 admin" };

/** /docs — docs/ の全文書を領域ごとに並べる。各領域の概要 (/domains/<id>) の「文書」欄からも開ける。 */
export default function DocsIndexPage() {
  const docs = allDocuments();
  const groups = [
    ...domainList().map((d) => ({ id: d.id, label: d.label, items: docs.filter((x) => x.domainId === d.id) })),
    { id: "unresolved", label: "領域未決", items: docs.filter((x) => x.domainId === null) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeading title="文書" source={`docs/ (領域は ${DOMAINS} の documents)`} />
      <Grid min="md">
        {groups.map((g) => (
          <PanelCard
            key={g.id}
            title={`${g.label} ${g.items.length} 件`}
            action={g.id === "unresolved" ? undefined : <Link href={`/domains/${g.id}`} className="text-xs font-normal">領域へ →</Link>}
          >
            <Stack gap="sm">
              {g.items.map((d) => (
                <Link key={d.path} href={d.href} className="text-sm text-console-info hover:underline" title={d.path}>
                  {d.title}
                </Link>
              ))}
            </Stack>
          </PanelCard>
        ))}
      </Grid>
    </div>
  );
}
