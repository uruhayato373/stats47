"use client";

import { FLOW_CHART_COLORS } from "@/components/charts/ChartPalette";
import { HubSankey } from "@/components/charts/HubSankey";
import { topNWithOther } from "@/components/charts/sankey-helpers";
import { SankeyFallback } from "@/components/charts/SankeyFallback";
import { useFlowData } from "@/components/charts/useFlowData";

import type { MigrationFlowData } from "@stats47/migration-flow";

/** 焦点県 人口移動フロー Sankey: 左=流入元 / 中央=焦点県 / 右=流出先。幅=年間移動者数。 */

const TOP_N = 10;

const fmt = (n: number) => n.toLocaleString("ja-JP");

interface Props {
  /** 焦点県の 2 桁コード */
  code: string;
  /** SSG 時にサーバーが R2 から読んだ既定県データ（あれば初回 fetch を省略） */
  initialData?: MigrationFlowData;
}

export function MigrationSankey({ code, initialData }: Props) {
  const { data, errored } = useFlowData<MigrationFlowData>("migration", code, initialData);

  if (errored) return <SankeyFallback message="データを読み込めませんでした。" />;
  if (!data) return <SankeyFallback message="読み込み中…" />;

  const totalIn = data.partners.reduce((s, p) => s + p.inflow, 0);
  const totalOut = data.partners.reduce((s, p) => s + p.outflow, 0);
  const net = totalIn - totalOut;

  return (
    <HubSankey
      title={`${data.focusName} 人口移動フロー（${data.year}年）`}
      subtitle={`左: 流入元 → 中央: ${data.focusName} → 右: 流出先（幅=人数 / 上位${TOP_N}＋その他）`}
      centerLabel={data.focusName}
      centerSub={`純移動 ${net >= 0 ? "+" : ""}${fmt(net)}`}
      centerSubColor={net >= 0 ? FLOW_CHART_COLORS.inflow : FLOW_CHART_COLORS.outflow}
      leftNodes={topNWithOther(data.partners, (p) => p.inflow, TOP_N)}
      rightNodes={topNWithOther(data.partners, (p) => p.outflow, TOP_N)}
      leftColor={FLOW_CHART_COLORS.inflow}
      rightColor={FLOW_CHART_COLORS.outflow}
      formatValue={fmt}
      footer={`総流入 ${fmt(totalIn)}／総流出 ${fmt(totalOut)}／純 ${net >= 0 ? "+" : ""}${fmt(net)}　出典: e-Stat 住民基本台帳人口移動報告（${data.year}）`}
    />
  );
}
