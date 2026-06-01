"use client";

import { useEffect, useMemo, useState } from "react";

import { HubSankey, type HubNode } from "@/components/charts/HubSankey";

import type { MigrationFlowData, MigrationPartner } from "@stats47/migration-flow";


/** 焦点県 人口移動フロー Sankey: 左=流入元 / 中央=焦点県 / 右=流出先。幅=年間移動者数。 */

const TOP_N = 10;
const IN_COLOR = "#2563eb"; // 流入 = 青
const OUT_COLOR = "#ea580c"; // 流出 = 橙

/** 上位 TOP_N + その他 に集約 */
function topWithOther(
  partners: MigrationPartner[],
  key: "inflow" | "outflow",
): HubNode[] {
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

export function MigrationSankey({ code }: Props) {
  const [data, setData] = useState<{ code: string; data: MigrationFlowData } | null>(
    null,
  );
  const [errored, setErrored] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/migration-flow/${code}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<MigrationFlowData>;
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
      title={`${view.focusName} 人口移動フロー（${view.year}年）`}
      subtitle={`左: 流入元 → 中央: ${view.focusName} → 右: 流出先（幅=人数 / 上位${TOP_N}＋その他）`}
      centerLabel={view.focusName}
      centerSub={`純移動 ${net >= 0 ? "+" : ""}${fmt(net)}`}
      centerSubColor={net >= 0 ? IN_COLOR : OUT_COLOR}
      leftNodes={view.leftNodes}
      rightNodes={view.rightNodes}
      leftColor={IN_COLOR}
      rightColor={OUT_COLOR}
      formatValue={fmt}
      footer={`総流入 ${fmt(view.totalIn)}／総流出 ${fmt(view.totalOut)}／純 ${net >= 0 ? "+" : ""}${fmt(net)}　出典: e-Stat 住民基本台帳人口移動報告（${view.year}）`}
    />
  );
}
