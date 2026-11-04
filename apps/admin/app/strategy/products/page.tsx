import { Cell, DataTable, PanelCard, Row, StatusBadge } from "@/components/admin-ui";
import { Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { PRODUCT_LEDGER_PATH, PRODUCT_STRATEGY_PATH, type ProductLineSummary, readProductLedger } from "@/lib/server/product-ledger";

export const dynamic = "force-dynamic";
export const metadata = { title: "商品の台帳 — stats47 admin" };

const STANCE: Record<ProductLineSummary["stance"], { label: string; tone: "info" | "good" | "neutral" | "bad" }> = {
  "price-test": { label: "価格の実験中", tone: "info" },
  keep: { label: "続ける", tone: "good" },
  hold: { label: "保留", tone: "neutral" },
  stop: { label: "止める", tone: "bad" },
};

const yen = (value: number | null) => (value === null ? "未計測" : `¥${value.toLocaleString()}`);

function priceRange(line: ProductLineSummary) {
  if (line.priceMinYen === null) return "—";
  return line.priceMinYen === line.priceMaxYen ? yen(line.priceMinYen) : `${yen(line.priceMinYen)}〜${yen(line.priceMaxYen)}`;
}

/** 商品の台帳 (型 B: 一覧)。商品群ごとの判断と実績、次の論点、決定の記録を並べる。読み取り専用 */
export default function ProductLedgerPage() {
  const { ledger, strategy } = readProductLedger();
  const source = `${PRODUCT_LEDGER_PATH} + ${PRODUCT_STRATEGY_PATH}`;
  if (!ledger || !strategy) {
    return (
      <>
        <PageHeading title="商品の台帳" source={source} />
        <ErrorNote error="台帳がまだありません。node .claude/scripts/products/build-product-ledger.mjs で作ります。" />
      </>
    );
  }
  const reasons = new Map(strategy.lines.map((line) => [line.id, line]));
  const due = ledger.experiments.filter((experiment) => experiment.due);

  return (
    <>
      <PageHeading title="商品の台帳" source={source}>
        <p className="max-w-4xl text-sm text-muted-foreground">
          {ledger.asOf} 時点。note の閲覧と売上は {ledger.notePeriod ? `${ledger.notePeriod.start}〜${ledger.notePeriod.end}` : "記録なし"}、KDP の売上は販売台帳の累計 (手取り)。
          閲覧を測れない販売面は未計測と書く。
        </p>
      </PageHeading>
      <Stack>
        {due.length > 0 ? <StatusBadge tone="warn">判定の期日が来た価格実験 {due.map((experiment) => experiment.id).join("・")}</StatusBadge> : null}
        {ledger.unassigned.length > 0 ? <StatusBadge tone="bad">商品群に入らない商品 {ledger.unassigned.length} 件</StatusBadge> : null}
        <DataTable columns={["商品群", "構え", "本数", "価格", "閲覧", "売上", "次の見直し"]}>
          {ledger.lines.map((line) => (
            <Row key={line.id}>
              <Cell nowrap>{line.name}</Cell>
              <Cell nowrap>
                <StatusBadge tone={STANCE[line.stance].tone}>{STANCE[line.stance].label}</StatusBadge>
              </Cell>
              <Cell nowrap>{line.products}</Cell>
              <Cell nowrap>{priceRange(line)}</Cell>
              <Cell nowrap>{line.pageViews ?? "未計測"}</Cell>
              <Cell nowrap>{yen(line.salesYen)}</Cell>
              <Cell nowrap muted>
                {line.nextReviewOn}
              </Cell>
            </Row>
          ))}
        </DataTable>
        <DataTable columns={["商品群", "読者", "HARM", "支払う理由", "価格の考え方", "需要の証拠"]}>
          {ledger.lines.map((line) => {
            const reason = reasons.get(line.id);
            return (
              <Row key={line.id}>
                <Cell nowrap>{line.name}</Cell>
                <Cell>{reason?.audience ?? "—"}</Cell>
                <Cell>{reason?.harm ?? "—"}</Cell>
                <Cell>{reason?.payReason ?? "—"}</Cell>
                <Cell>{reason?.priceRule ?? "—"}</Cell>
                <Cell>{reason?.demandEvidence ?? "—"}</Cell>
              </Row>
            );
          })}
        </DataTable>
        <PanelCard title="次に議論する論点">
          <DataTable columns={["論点", "問い", "必要な材料"]}>
            {strategy.agenda.map((item) => (
              <Row key={item.topic}>
                <Cell nowrap>{item.topic}</Cell>
                <Cell>{item.question}</Cell>
                <Cell muted>{item.evidenceNeeded}</Cell>
              </Row>
            ))}
          </DataTable>
        </PanelCard>
        <PanelCard title="決定の記録">
          <DataTable columns={["日付", "論点", "決定", "理由"]}>
            {[...strategy.decisions].reverse().map((item) => (
              <Row key={`${item.date}-${item.topic}`}>
                <Cell nowrap muted>
                  {item.date}
                </Cell>
                <Cell nowrap>{item.topic}</Cell>
                <Cell>{item.decision}</Cell>
                <Cell muted>{item.reason}</Cell>
              </Row>
            ))}
          </DataTable>
        </PanelCard>
      </Stack>
    </>
  );
}
