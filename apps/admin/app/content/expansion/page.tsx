import Link from "next/link";

import { Cell, DataTable, Row } from "@/components/admin-ui";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { COVERAGE_CHANNELS } from "@/lib/content-coverage";
import { contentCoverage } from "@/lib/server/content-coverage";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "展開状況 — stats47 admin" };

const SOURCE = "4 型の台帳 + ページ索引 / posts / note 記事台帳 / 商品の台帳";
const LINK = "font-medium underline-offset-4 hover:underline";

/** 4 型 × 媒体の公開件数 (型 A: 概況)。押すと型の一覧へ移る */
export default function ContentExpansionPage() {
  const data = contentCoverage();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="展開状況" source={SOURCE} />
        <ErrorNote error={data.error} />
      </>
    );
  }
  return (
    <>
      <PageHeading title="展開状況" source={SOURCE} />
      <DataTable columns={["型", ...COVERAGE_CHANNELS.map((c) => c.label)]}>
        {data.rows.map((r) => (
          <Row key={r.type}>
            <Cell>{r.title}</Cell>
            {COVERAGE_CHANNELS.map((c) => (
              <Cell key={c.id} nowrap>
                <Link href={`/content/types?type=${r.type.replace("type:", "")}&channel=${c.id}`} className={LINK}>
                  {r.cells[c.id].published.toLocaleString()}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">未公開 {r.cells[c.id].preparing.toLocaleString()}</span>
              </Cell>
            ))}
          </Row>
        ))}
      </DataTable>
    </>
  );
}
