import { sparkPoints, type WowResult } from "./format";

/** 旧 UI の spark() 相当。inline SVG polyline のみ (外部チャートライブラリ禁止)。 */
export function Sparkline({
  values,
  color = "rgb(var(--console-info))",
  w = 140,
  h = 30,
}: {
  values: Array<number | null | undefined>;
  color?: string;
  w?: number;
  h?: number;
}) {
  const points = sparkPoints(values, { w, h });
  if (!points) return null;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-1.5 block" role="img" aria-hidden="true">
      {/* ★stroke は「属性」だと var() が解決されないので style で当てる */}
      <polyline points={points} fill="none" style={{ stroke: color }} strokeWidth={1.5} />
    </svg>
  );
}

/** WoW 変化率バッジ。up/down で色を分ける。 */
export function WowBadge({ result }: { result: WowResult | null }) {
  if (!result) return null;
  return (
    <span className={result.up ? "text-console-good" : "text-console-bad"}>
      {result.up ? "▲" : "▼"} {Math.abs(result.pct).toFixed(1)}%
    </span>
  );
}
