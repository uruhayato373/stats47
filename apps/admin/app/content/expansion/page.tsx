import Link from "next/link";

import { Cell, DataGrid, DataTable, Row, StatusBadge, type GridColumn, type GridRow } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { COVERAGE_CHANNELS, UNCLASSIFIED, openFitItems, type CoverageChannel, type CoverageItem, type FitItem, type FitProposal } from "@/lib/content-coverage";
import { contentCoverage, typeFitReview } from "@/lib/server/content-coverage";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "展開状況 — stats47 admin" };

const PAGE = "/content/expansion";
const SOURCE = "4 型の台帳 + 処置の案の台帳 + ページ索引 / posts / note 記事台帳 / 商品の台帳";
/** 1 セルの明細の上限。多い型は検索よりも規則の確認に使うので、全件をブラウザへ送らない */
const MAX_ITEMS = 500;
const LINK = "font-medium underline-offset-4 hover:underline";

const COLUMNS: GridColumn[] = [
  { id: "title", header: "題名" },
  { id: "state", header: "状態", sortable: true, nowrap: true },
  { id: "detail", header: "種別", sortable: true },
  { id: "how", header: "型の決め方", sortable: true },
];

const PROPOSAL_LABEL: Record<FitProposal, string> = { rewrite: "書き直し", merge: "統合", retire: "撤去" };
const FIT_COLUMNS: GridColumn[] = [
  { id: "proposal", header: "案", sortable: true, nowrap: true },
  { id: "title", header: "題名" },
  { id: "signals", header: "根拠" },
  { id: "clicks", header: "クリック", numeric: true, sortable: true },
  { id: "impressions", header: "表示", numeric: true, sortable: true },
];

function toFitRow(i: FitItem): GridRow {
  return {
    id: i.id,
    facet: i.proposal,
    search: `${i.title} ${i.id}`,
    sort: [PROPOSAL_LABEL[i.proposal], null, null, i.clicks, i.impressions],
    cells: [
      <StatusBadge key="proposal" tone={i.proposal === "retire" ? "bad" : "warn"}>
        {PROPOSAL_LABEL[i.proposal]}
      </StatusBadge>,
      i.title,
      i.mergeWith ? `${i.signals.join("・")} (${i.mergeWith.replace("blog:", "")})` : i.signals.join("・"),
      i.clicks,
      i.impressions,
    ],
  };
}

function toGridRow(i: CoverageItem): GridRow {
  return {
    id: i.id,
    search: `${i.title} ${i.id}`,
    sort: [null, i.state, i.detail, i.how],
    cells: [
      i.href ? (
        <a key="title" href={i.href} target="_blank" rel="noreferrer" className={LINK}>
          {i.title}
        </a>
      ) : (
        <span key="title">{i.title}</span>
      ),
      <StatusBadge key="state" tone={i.state === "公開" ? "good" : "warn"}>
        {i.state}
      </StatusBadge>,
      i.detail,
      i.how,
    ],
  };
}

/** 展開状況 (型 B: 一覧・キュー)。4 型 × 媒体の件数 → 選んだマスの明細。回収の判断は載せない */
export default async function ContentCoveragePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const data = contentCoverage();
  const review = typeFitReview();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="展開状況" source={SOURCE} />
        <ErrorNote error={data.error} />
      </>
    );
  }

  const unclassified = data.items.some((i) => i.type === null);
  const selectedRow = data.rows.find((r) => r.type === params.type) ?? (unclassified ? data.rows.find((r) => r.type === UNCLASSIFIED)! : data.rows[0]);
  const selectedChannel: CoverageChannel = COVERAGE_CHANNELS.find((c) => c.id === params.channel)?.id ?? "site";
  const channelLabel = COVERAGE_CHANNELS.find((c) => c.id === selectedChannel)?.label;
  const selectedType = selectedRow.type === UNCLASSIFIED ? null : selectedRow.type;
  const items = data.items.filter((i) => i.channel === selectedChannel && i.type === selectedType);

  return (
    <>
      <PageHeading title="展開状況" source={SOURCE}>
        <p className="max-w-4xl text-sm text-muted-foreground">
          4 つの型ごとに、どの媒体へ何件展開できているかを集める。件数は毎回それぞれの台帳から集計する。件数は量であり、効いているかは示さない。
        </p>
      </PageHeading>

      <Section title="4 型 × 媒体">
        <DataTable columns={["型", ...COVERAGE_CHANNELS.map((c) => c.label)]}>
          {data.rows.map((r) => (
            <Row key={r.type}>
              <Cell>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.question}</div>
              </Cell>
              {COVERAGE_CHANNELS.map((c) => (
                <Cell key={c.id} nowrap>
                  <Link href={`${PAGE}?type=${encodeURIComponent(r.type)}&channel=${c.id}#items`} className={LINK}>
                    公開 {r.cells[c.id].published.toLocaleString()}
                  </Link>
                  <div className="text-xs text-muted-foreground">未公開 {r.cells[c.id].preparing.toLocaleString()}</div>
                </Cell>
              ))}
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title={`${selectedRow.title} × ${channelLabel} (${items.length.toLocaleString()})`} id="items">
        {items.length > MAX_ITEMS ? <p className="m-0 text-sm text-muted-foreground">先頭の {MAX_ITEMS} 件だけを表示している。</p> : null}
        <DataGrid columns={COLUMNS} rows={items.slice(0, MAX_ITEMS).map(toGridRow)} searchPlaceholder="題名を検索…" />
      </Section>

      {hasError(review) ? (
        <ErrorNote error={review.error} />
      ) : (
        <Section title={`型に合っていない記事の処置の案 (${openFitItems(review).length})`} id="fit">
          <p className="m-0 text-sm text-muted-foreground">
            公開ブログ {review.articlesRead} 本の本文の信号と GSC ({review.gscWeeks[0]}〜{review.gscWeeks.at(-1)}) から機械が出した案で、処置は人が決める。公開から日が浅い {review.articlesUnobserved} 本はクリックで判定していない。決めたものは処置の案の台帳の decisions に書く。
          </p>
          <DataGrid
            columns={FIT_COLUMNS}
            rows={openFitItems(review).map(toFitRow)}
            searchPlaceholder="題名を検索…"
            facets={(Object.keys(PROPOSAL_LABEL) as FitProposal[]).map((p) => ({ value: p, label: PROPOSAL_LABEL[p] }))}
          />
        </Section>
      )}
    </>
  );
}
