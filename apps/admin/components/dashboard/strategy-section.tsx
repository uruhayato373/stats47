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
      <div className="rounded-lg border border-console-accent bg-gradient-to-br from-console-bg to-console-card p-5 text-[17px] font-bold text-console-fg">
        「{strategy.statement}」
        <small className="mt-1.5 block text-[11px] font-normal text-console-muted">
          ポジショニング・ステートメント — 正典: docs/00_プロジェクト管理/03_マーケティング戦略.md
        </small>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* min-w-0 + overflow-x-auto: grid item が nowrap セルで 390px を押し出さない */}
        <div className="min-w-0 rounded-lg border border-console-border bg-console-card p-3.5">
          <h3 className="m-0 mb-2 text-[13px] font-semibold text-console-fg">ターゲティング判定 (STP §4)</h3>
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-console-muted">
                <th className="whitespace-nowrap text-left font-medium">セグメント</th>
                <th className="whitespace-nowrap text-left font-medium">判定</th>
                <th className="text-left font-medium">役割</th>
              </tr>
            </thead>
            <tbody>
              {strategy.segments.map((x, i) => (
                <tr key={i} className="border-t border-console-border/40">
                  <td className="whitespace-nowrap py-1 pr-2">{x.seg}</td>
                  <td className="whitespace-nowrap py-1 pr-2">{x.verdict}</td>
                  <td className="py-1">{x.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-console-border bg-console-card p-3.5">
          <h3 className="m-0 mb-2 text-[13px] font-semibold text-console-fg">STP 提言の反映状況 (§6)</h3>
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-console-muted">
                <th className="text-left font-medium">#</th>
                <th className="text-left font-medium">提言</th>
                <th className="text-left font-medium">状況</th>
              </tr>
            </thead>
            <tbody>
              {strategy.teigen.map((x, i) => (
                <tr key={i} className="border-t border-console-border/40">
                  <td className="py-1 pr-2">{x.n}</td>
                  <td className="py-1 pr-2">{x.title}</td>
                  <td className="py-1">{x.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="mt-2 text-[10px] text-console-muted">
            SSOT:{" "}
            {strategy.sources.map((s, i) => (
              <code key={i} className="mr-1 rounded bg-console-bg px-1">
                {s}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
