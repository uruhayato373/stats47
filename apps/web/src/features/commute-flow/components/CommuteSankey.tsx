"use client";

import { FLOW_CHART_COLORS } from "@/components/charts/ChartPalette";
import { HubSankey } from "@/components/charts/HubSankey";
import { topNWithOther } from "@/components/charts/sankey-helpers";
import { SankeyFallback } from "@/components/charts/SankeyFallback";
import { useFlowData } from "@/components/charts/useFlowData";

import type { CommuteFlowData } from "../lib/types";

/** 焦点県 通勤フロー Sankey: 左=流入(他県常住→焦点勤務) / 中央=焦点県 / 右=流出(焦点常住→他県勤務)。幅=通勤者数。 */

/** 2 カラム化 (2026-08-04) で横幅が半分になったため 10 → 8。MigrationSankey と揃える。 */
const TOP_N = 8;

/** 他のテーマチャートと縦横比を揃えるための列高 (既定 616 は 1 カラム時の値)。 */
const USABLE_H = 340;

const fmt = (n: number) => n.toLocaleString("ja-JP");

interface Props {
  /** 焦点県の 2 桁コード */
  code: string;
  /** SSG 時にサーバーが R2 から読んだ既定県データ（あれば初回 fetch を省略） */
  initialData?: CommuteFlowData;
}

export function CommuteSankey({ code, initialData }: Props) {
  const { data, errored } = useFlowData<CommuteFlowData>("commute", code, initialData);

  if (errored) return <SankeyFallback message="データを読み込めませんでした。" />;
  if (!data) return <SankeyFallback message="読み込み中…" />;

  const totalIn = data.partners.reduce((s, p) => s + p.inflow, 0);
  const totalOut = data.partners.reduce((s, p) => s + p.outflow, 0);
  const net = totalIn - totalOut;

  // 見出し・出典は ChartPanel が持つ (chrome="bare")。集計値だけキャプションに残す。
  return (
    <>
      <HubSankey
        title={`${data.focusName} 通勤フロー（${data.year}年）`}
        subtitle={`左: 流入（他県に住み通勤）→ 中央: ${data.focusName} → 右: 流出（他県へ通勤）（幅=通勤者数 / 上位${TOP_N}＋その他）`}
        centerLabel={data.focusName}
        centerSub={`昼間流入 ${net >= 0 ? "+" : ""}${fmt(net)}`}
        centerSubColor={net >= 0 ? FLOW_CHART_COLORS.inflow : FLOW_CHART_COLORS.outflow}
        leftNodes={topNWithOther(data.partners, (p) => p.inflow, TOP_N)}
        rightNodes={topNWithOther(data.partners, (p) => p.outflow, TOP_N)}
        leftColor={FLOW_CHART_COLORS.inflow}
        rightColor={FLOW_CHART_COLORS.outflow}
        formatValue={fmt}
        chrome="bare"
        usableHeight={USABLE_H}
      />
      <p className="mt-1 text-[11px] text-muted-foreground">
        {data.year}年・左=流入（他県に住み通勤）/ 右=流出（他県へ通勤）（上位{TOP_N}＋その他）。
        流入 {fmt(totalIn)}／流出 {fmt(totalOut)}／昼間純流入 {net >= 0 ? "+" : ""}
        {fmt(net)}
      </p>
    </>
  );
}
