import { Cell, DataTable, Row } from "@/components/admin-ui";

import { Card, CardContent } from "@/components/ui/card";
type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

export interface StrategyData {
  statement: string | null;
  segments: Array<{ seg: string; verdict: string; role: string }>;
  teigen: Array<{ n: string; title: string; state: string }>;
  sources: string[];
}

/** 旧 dashboard.html renderStrategy() の移植。STP ポジショニング・ターゲティング判定・提言反映状況。 */
export function StrategySection({ strategy }: { strategy: Wrapped<StrategyData> }) {
  if (hasError(strategy)) {
    return <p className="text-sm text-console-bad">取得失敗: {strategy.error}</p>;
  }

  return (
    <div>
      <div className="rounded-lg border border-console-accent bg-linear-to-br from-console-bg to-console-card p-5 text-[17px] font-bold text-console-fg">
        「{strategy.statement}」
        <small className="mt-1.5 block text-[11px] font-normal text-console-muted">
          ポジショニング・ステートメント — 正典: docs/00_プロジェクト管理/03_マーケティング戦略.md
        </small>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* min-w-0 + overflow-x-auto: grid item が nowrap セルで 390px を押し出さない */}
        <Card className="min-w-0 gap-0 py-3.5"><CardContent className="px-3.5">
          <h3 className="m-0 mb-2 text-[13px] font-semibold text-console-fg">ターゲティング判定 (STP §4)</h3>
          <DataTable columns={["セグメント", "判定", "役割"]}>
              {strategy.segments.map((x, i) => (
                <Row key={i}>
                  <Cell nowrap>{x.seg}</Cell>
                  <Cell nowrap>{x.verdict}</Cell>
                  <Cell>{x.role}</Cell>
                </Row>
              ))}
            </DataTable>
        </CardContent></Card>
        <Card className="min-w-0 gap-0 py-3.5"><CardContent className="px-3.5">
          <h3 className="m-0 mb-2 text-[13px] font-semibold text-console-fg">STP 提言の反映状況 (§6)</h3>
          <DataTable columns={["#", "提言", "状況"]}>
              {strategy.teigen.map((x, i) => (
                <Row key={i}>
                  <Cell>{x.n}</Cell>
                  <Cell>{x.title}</Cell>
                  <Cell>{x.state}</Cell>
                </Row>
              ))}
            </DataTable>
          <div className="mt-2 text-[10px] text-console-muted">
            SSOT:{" "}
            {strategy.sources.map((s, i) => (
              <code key={i} className="mr-1 break-all rounded bg-console-bg px-1">
                {s}
              </code>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
