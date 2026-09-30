import { sparkPoints, type WowResult } from "./format";
import { CHART_TONE_TEXT, type ChartTone } from "./chart-tone";

/** 旧 UI の spark() 相当。inline SVG polyline のみ (外部チャートライブラリ禁止)。 */
export function Sparkline({
  values,
  tone = "info",
  w = 140,
  h = 30,
}: {
  values: Array<number | null | undefined>;
  tone?: ChartTone;
  w?: number;
  h?: number;
}) {
  const points = sparkPoints(values, { w, h });
  if (!points) return null;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`mt-1.5 block max-w-full ${CHART_TONE_TEXT[tone]}`}
      role="img"
      aria-hidden="true"
    >
      {/* 色は tone のクラス (text-console-*) の currentColor。属性では var() が解決されず、style は使わない */}
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
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
