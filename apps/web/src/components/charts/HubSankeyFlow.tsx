"use client";

import { formatValueWithPrecision } from "@stats47/utils";

import { FLOW_CHART_COLORS } from "@/components/charts/ChartPalette";
import { ChartEmptyState } from "@/components/charts/ChartState";
import { HubSankey } from "@/components/charts/HubSankey";
import { topNWithOther } from "@/components/charts/sankey-helpers";
import { useFlowData } from "@/components/charts/useFlowData";

/**
 * 焦点県の県間フロー (通勤 / 人口移動) を HubSankey で描く共通の包み部品。
 * 左=流入 / 中央=焦点県 / 右=流出。データ取得・状態表示・上位件数・キャプションを持ち、
 * 文言だけを `labels` で受ける。財政フローは形が違うため対象外。
 */

/** 2 カラム化 (2026-08-04) で横幅が半分になったため 10 → 8。高さは USABLE_H が決め、件数はラベルの詰まり具合だけに効く。 */
const TOP_N = 8;

/** 他のテーマチャートと縦横比を揃えるための列高 (既定 616 は 1 カラム時の値)。 */
const USABLE_H = 340;

// 人数は整数なので桁は 0 に揃える
const fmt = (n: number) => formatValueWithPrecision(n, 0);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${fmt(n)}`;

/** 通勤・人口移動の両データが満たす形 */
export interface HubFlowData {
  focusCode: string;
  focusName: string;
  year: number;
  partners: readonly { name: string; inflow: number; outflow: number }[];
}

export interface HubSankeyFlowLabels {
  /** 図の名前 (例: 「通勤フロー」)。title に使う */
  flowName: string;
  /** 左列の説明 (例: 「流入元」) */
  inflow: string;
  /** 右列の説明 (例: 「流出先」) */
  outflow: string;
  /** 帯の幅が表すもの (例: 「人数」) */
  width: string;
  /** 中央ノード下の純流入の名前 (例: 「純移動」) */
  centerNet: string;
  /** キャプションの総流入・総流出・純流入の名前 */
  totalIn: string;
  totalOut: string;
  totalNet: string;
}

interface Props<T extends HubFlowData> {
  /** `/api/flow/<endpoint>/<code>` の endpoint */
  endpoint: "commute" | "migration";
  /** 焦点県の 2 桁コード */
  code: string;
  /** SSG 時にサーバーが R2 から読んだ既定県データ（あれば初回 fetch を省略） */
  initialData?: T;
  labels: HubSankeyFlowLabels;
}

export function HubSankeyFlow<T extends HubFlowData>({ endpoint, code, initialData, labels }: Props<T>) {
  const { data, errored } = useFlowData<T>(endpoint, code, initialData);

  if (errored) return <ChartEmptyState message="データを読み込めませんでした。" height={null} className="aspect-100/73" />;
  if (!data) return <ChartEmptyState message="読み込み中…" height={null} className="aspect-100/73" />;

  const totalIn = data.partners.reduce((s, p) => s + p.inflow, 0);
  const totalOut = data.partners.reduce((s, p) => s + p.outflow, 0);
  const net = totalIn - totalOut;

  // 見出し・出典は ChartPanel が持つ (chrome="bare")。SVG に描くと二重表示になる。
  // 集計値だけは年次を含むためチャート直下のキャプションに残す。
  return (
    <>
      <HubSankey
        title={`${data.focusName} ${labels.flowName}（${data.year}年）`}
        subtitle={`左: ${labels.inflow} → 中央: ${data.focusName} → 右: ${labels.outflow}（幅=${labels.width} / 上位${TOP_N}＋その他）`}
        centerLabel={data.focusName}
        centerSub={`${labels.centerNet} ${signed(net)}`}
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
        {`${data.year}年・左=${labels.inflow} / 右=${labels.outflow}（上位${TOP_N}＋その他）。` +
          `${labels.totalIn} ${fmt(totalIn)}／${labels.totalOut} ${fmt(totalOut)}／${labels.totalNet} ${signed(net)}`}
      </p>
    </>
  );
}
