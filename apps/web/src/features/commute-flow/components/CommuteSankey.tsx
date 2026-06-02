"use client";

import { HubSankey } from "@/components/charts/HubSankey";
import { topNWithOther } from "@/components/charts/sankey-helpers";
import { SankeyFallback } from "@/components/charts/SankeyFallback";
import { useFlowData } from "@/components/charts/useFlowData";

import type { CommuteFlowData } from "../lib/types";

/** 焦点県 通勤フロー Sankey: 左=流入(他県常住→焦点勤務) / 中央=焦点県 / 右=流出(焦点常住→他県勤務)。幅=通勤者数。 */

const TOP_N = 10;
const IN_COLOR = "#0d9488"; // 流入(昼間に来る) = teal
const OUT_COLOR = "#db2777"; // 流出(他県へ通勤) = pink

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

  return (
    <HubSankey
      title={`${data.focusName} 通勤フロー（${data.year}年）`}
      subtitle={`左: 流入（他県に住み通勤）→ 中央: ${data.focusName} → 右: 流出（他県へ通勤）（幅=通勤者数 / 上位${TOP_N}＋その他）`}
      centerLabel={data.focusName}
      centerSub={`昼間流入 ${net >= 0 ? "+" : ""}${fmt(net)}`}
      centerSubColor={net >= 0 ? IN_COLOR : OUT_COLOR}
      leftNodes={topNWithOther(data.partners, (p) => p.inflow, TOP_N)}
      rightNodes={topNWithOther(data.partners, (p) => p.outflow, TOP_N)}
      leftColor={IN_COLOR}
      rightColor={OUT_COLOR}
      formatValue={fmt}
      footer={`流入 ${fmt(totalIn)}／流出 ${fmt(totalOut)}／昼間純流入 ${net >= 0 ? "+" : ""}${fmt(net)}　出典: e-Stat 国勢調査${data.year} 従業地・通学地集計`}
    />
  );
}
