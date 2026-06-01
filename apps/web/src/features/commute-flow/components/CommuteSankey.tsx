"use client";

import { useEffect, useMemo, useState } from "react";

import { HubSankey, type HubNode } from "@/components/charts/HubSankey";

import type { CommuteFlowData, CommutePartner } from "../lib/types";

/** 焦点県 通勤フロー Sankey: 左=流入(他県常住→焦点勤務) / 中央=焦点県 / 右=流出(焦点常住→他県勤務)。幅=通勤者数。 */

const TOP_N = 10;
const IN_COLOR = "#0d9488"; // 流入(昼間に来る) = teal
const OUT_COLOR = "#db2777"; // 流出(他県へ通勤) = pink

function topWithOther(partners: CommutePartner[], key: "inflow" | "outflow"): HubNode[] {
  const sorted = [...partners].sort((a, b) => b[key] - a[key]);
  const head = sorted.slice(0, TOP_N).map((p) => ({ name: p.name, value: p[key] }));
  const tail = sorted.slice(TOP_N);
  const otherSum = tail.reduce((s, p) => s + p[key], 0);
  if (otherSum > 0) head.push({ name: `その他${tail.length}県`, value: otherSum });
  return head;
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

interface Props {
  /** 焦点県の 2 桁コード */
  code: string;
}

export function CommuteSankey({ code }: Props) {
  const [data, setData] = useState<{ code: string; data: CommuteFlowData } | null>(null);
  const [errored, setErrored] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/commute-flow/${code}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<CommuteFlowData>;
      })
      .then((d) => {
        if (!cancelled) {
          setData({ code, data: d });
          setErrored(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErrored(code);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const ready = data?.code === code;
  const view = useMemo(() => {
    if (!ready || !data) return null;
    const d = data.data;
    const totalIn = d.partners.reduce((s, p) => s + p.inflow, 0);
    const totalOut = d.partners.reduce((s, p) => s + p.outflow, 0);
    return {
      leftNodes: topWithOther(d.partners, "inflow"),
      rightNodes: topWithOther(d.partners, "outflow"),
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      focusName: d.focusName,
      year: d.year,
    };
  }, [ready, data]);

  if (errored === code) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        データを読み込めませんでした。
      </div>
    );
  }
  if (!view) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        読み込み中…
      </div>
    );
  }

  const net = view.net;
  return (
    <HubSankey
      title={`${view.focusName} 通勤フロー（${view.year}年）`}
      subtitle={`左: 流入（他県に住み通勤）→ 中央: ${view.focusName} → 右: 流出（他県へ通勤）（幅=通勤者数 / 上位${TOP_N}＋その他）`}
      centerLabel={view.focusName}
      centerSub={`昼間流入 ${net >= 0 ? "+" : ""}${fmt(net)}`}
      centerSubColor={net >= 0 ? IN_COLOR : OUT_COLOR}
      leftNodes={view.leftNodes}
      rightNodes={view.rightNodes}
      leftColor={IN_COLOR}
      rightColor={OUT_COLOR}
      formatValue={fmt}
      footer={`流入 ${fmt(view.totalIn)}／流出 ${fmt(view.totalOut)}／昼間純流入 ${net >= 0 ? "+" : ""}${fmt(net)}　出典: e-Stat 国勢調査${view.year} 従業地・通学地集計`}
    />
  );
}
