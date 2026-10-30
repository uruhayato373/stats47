'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * 凡例の行の左に置く短い説明 (地域・期間・単位など)。凡例を持つチャートは、この説明を凡例と同じ 1 行に並べる
 * (見本の shadcndashboard のチャートのカードと同じ「左に名前、右に凡例」。2026-10-29)。
 * 呼び出し側が Provider で渡し、D3ChartLegend が読む。凡例を描かないチャートでは使われないので、
 * 呼び出し側は自分でも同じ説明を出し、凡例が説明を描いたとき (data-chart-legend-lead) だけ隠す。
 * d3 の本体を読み込まずに使えるよう、このファイルは単独の入口 (@stats47/visualization/d3/chart-legend-lead) で出す。
 */
const ChartLegendLeadContext = createContext<ReactNode>(null);

export function ChartLegendLeadProvider({ lead, children }: { lead: ReactNode; children: ReactNode }) {
  return <ChartLegendLeadContext.Provider value={lead}>{children}</ChartLegendLeadContext.Provider>;
}

export function useChartLegendLead(): ReactNode {
  return useContext(ChartLegendLeadContext);
}
