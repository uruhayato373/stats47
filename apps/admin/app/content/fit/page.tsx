import { DataGrid, StatusBadge, type GridColumn, type GridRow } from "@/components/admin-ui";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { openFitItems, type FitItem, type FitProposal } from "@/lib/content-coverage";
import { typeFitReview } from "@/lib/server/content-coverage";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "記事の処置の案 — stats47 admin" };

const LABEL: Record<FitProposal, string> = { rewrite: "書き直し", merge: "統合", retire: "撤去" };
const COLUMNS: GridColumn[] = [
  { id: "proposal", header: "案", sortable: true, nowrap: true },
  { id: "title", header: "題名" },
  { id: "signals", header: "根拠" },
  { id: "clicks", header: "クリック", numeric: true, sortable: true },
];

function toRow(i: FitItem): GridRow {
  return {
    id: i.id,
    facet: i.proposal,
    search: `${i.title} ${i.id}`,
    sort: [LABEL[i.proposal], null, null, i.clicks],
    cells: [
      <StatusBadge key="proposal" tone={i.proposal === "retire" ? "bad" : "warn"}>
        {LABEL[i.proposal]}
      </StatusBadge>,
      i.title,
      i.mergeWith ? `${i.signals.join("・")} (${i.mergeWith.replace("blog:", "")})` : i.signals.join("・"),
      i.clicks,
    ],
  };
}

/** 型に合っていない記事の処置の案 (型 B)。処置は人が決めて台帳の decisions に書く */
export default function ContentFitPage() {
  const review = typeFitReview();
  return (
    <>
      <PageHeading title="記事の処置の案" source="処置の案の台帳" />
      {hasError(review) ? (
        <ErrorNote error={review.error} />
      ) : (
        <DataGrid columns={COLUMNS} rows={openFitItems(review).map(toRow)} searchPlaceholder="題名を検索…" facets={(Object.keys(LABEL) as FitProposal[]).map((p) => ({ value: p, label: LABEL[p] }))} />
      )}
    </>
  );
}
