"use client";

import { FINANCE_CHART_COLORS } from "@/components/charts/ChartPalette";
import { HubSankey } from "@/components/charts/HubSankey";
import { SankeyFallback } from "@/components/charts/SankeyFallback";
import { useFlowData } from "@/components/charts/useFlowData";

import type { FinanceFlowData } from "../lib/types";

/** 財政フロー Sankey: 左=歳入の財源 / 中央=一般会計 / 右=目的別歳出。幅=金額。 */

/** 千円 → 兆円 / 億円 表記 */
function yen(thousandYen: number): string {
  const oku = thousandYen / 100000; // 千円 → 億円
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)}兆円`;
  return `${Math.round(oku).toLocaleString("ja-JP")}億円`;
}

interface Props {
  /** 焦点県の 2 桁コード */
  code: string;
  /** SSG 時にサーバーが R2 から読んだ既定県データ（あれば初回 fetch を省略） */
  initialData?: FinanceFlowData;
}

export function FinanceSankey({ code, initialData }: Props) {
  const { data, errored } = useFlowData<FinanceFlowData>("finance", code, initialData);

  if (errored) return <SankeyFallback message="データを読み込めませんでした。" />;
  if (!data) return <SankeyFallback message="読み込み中…" />;

  return (
    <HubSankey
      title={`${data.focusName} 財政フロー（${data.year}年度）`}
      subtitle="左: 歳入の財源 → 中央: 一般会計 → 右: 目的別歳出（幅=金額）"
      centerLabel="一般会計"
      centerSub={`歳入 ${yen(data.totals.revenue)} / 歳出 ${yen(data.totals.expenditure)}`}
      centerSubColor={FINANCE_CHART_COLORS.subtext}
      leftNodes={data.revenue}
      rightNodes={data.expenditure}
      leftColor={FINANCE_CHART_COLORS.revenue}
      rightColor={FINANCE_CHART_COLORS.expenditure}
      formatValue={yen}
      footer={`出典: 地方財政状況調査（${data.year}年度）`}
      labelGutter={182}
    />
  );
}
