import { CHART_TONE_FILL, type ChartTone } from "./chart-tone";

/** 旧 UI progressBar() の移植。parts の n を比率で横帯に積む。幅は SVG の属性 (%) で決めるので style を使わない。 */
export function ProgressBar({ parts }: { parts: Array<{ n: number; tone: ChartTone }> }) {
  const total = parts.reduce((s, p) => s + p.n, 0) || 1;
  let x = 0;
  return (
    <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="my-1.5 block h-2 w-full overflow-hidden rounded bg-muted" role="img" aria-hidden="true">
      {parts.map((p, i) => {
        const width = (p.n / total) * 100;
        const rect = <rect key={i} x={x} y={0} width={width} height={1} className={CHART_TONE_FILL[p.tone]} />;
        x += width;
        return rect;
      })}
    </svg>
  );
}
