import Link from "next/link";
import { notFound } from "next/navigation";


import { Cell, DataTable, Row } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { localSiteHref } from "@/lib/local-site";
import { metricDetail } from "@/lib/server/reference-metrics";
import { hasError } from "@/lib/server/state-io";
import type { MetricExternalPage } from "@/lib/reference-metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: "指標の配線 — stats47 admin" };

const LINK = "font-medium underline-offset-4 hover:underline";

function ExternalTable({ pages, empty }: { pages: MetricExternalPage[]; empty: string }) {
  if (pages.length === 0) return <p className="m-0 text-sm text-muted-foreground">{empty}</p>;
  return (
    <DataTable columns={["題名", "公開"]}>
      {pages.map((p) => (
        <Row key={p.id}>
          <Cell>
            {p.href ? (
              <a className={LINK} href={p.href} target="_blank" rel="noreferrer">
                {p.title}
              </a>
            ) : (
              p.title
            )}
          </Cell>
          <Cell nowrap>{p.published ? "公開" : "未公開"}</Cell>
        </Row>
      ))}
    </DataTable>
  );
}

/** 1 つの指標につながる記事・note・SNS (型 C: 詳細) */
export default async function MetricDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const data = metricDetail(decodeURIComponent(key));
  if (data === null) notFound();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="指標の配線" source="ページ索引 + external" />
        <ErrorNote error={data.error} />
      </>
    );
  }
  return (
    <>
      <PageHeading title={data.title} source={`ranking:${data.key} — ページ索引 + external`}>
        <div className="flex flex-wrap gap-4 text-sm">
          <a className={LINK} href={localSiteHref(data.href)} target="_blank" rel="noreferrer">
            ランキングを開く
          </a>
          {data.municipalityHref ? (
            <a className={LINK} href={localSiteHref(data.municipalityHref)} target="_blank" rel="noreferrer">
              市区町村ランキングを開く
            </a>
          ) : null}
          <Link className={LINK} href="/content/types?type=reference">
            参照型の一覧へ戻る
          </Link>
        </div>
      </PageHeading>
      <Section title={`記事 (${data.blogs.length})`}>
        <ExternalTable pages={data.blogs.map((b) => ({ ...b, href: localSiteHref(b.href) }))} empty="この指標を使う記事はありません。" />
      </Section>
      <Section title={`note (${data.notes.length})`}>
        <ExternalTable pages={data.notes} empty="この指標を使う note はありません。" />
      </Section>
      <Section title={`SNS (${data.posts.length})`}>
        <ExternalTable pages={data.posts} empty="この指標を使う投稿はありません。" />
      </Section>
    </>
  );
}
