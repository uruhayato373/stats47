"use client";

import { useEffect, useState } from "react";

import { HubSankey } from "@/components/charts/HubSankey";

import type { FinanceFlowData } from "../lib/types";

/** 財政フロー Sankey: 左=歳入の財源 / 中央=一般会計 / 右=目的別歳出。幅=金額。 */

const REV_COLOR = "#0ea5e9"; // 歳入 = 青
const EXP_COLOR = "#f59e0b"; // 歳出 = 橙

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
  const [data, setData] = useState<{ code: string; data: FinanceFlowData } | null>(() =>
    initialData && initialData.focusCode === code ? { code, data: initialData } : null,
  );
  const [errored, setErrored] = useState<string | null>(null);

  useEffect(() => {
    if (data?.code === code) return; // 既に保持（initialData or 取得済）
    let cancelled = false;
    fetch(`/api/flow/finance/${code}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<FinanceFlowData>;
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
  }, [code, data]);

  const ready = data?.code === code;

  if (errored === code) {
    return (
      <div className="flex aspect-[100/73] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        データを読み込めませんでした。
      </div>
    );
  }
  if (!ready || !data) {
    return (
      <div className="flex aspect-[100/73] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
        読み込み中…
      </div>
    );
  }

  const d = data.data;
  return (
    <HubSankey
      title={`${d.focusName} 財政フロー（${d.year}年度）`}
      subtitle="左: 歳入の財源 → 中央: 一般会計 → 右: 目的別歳出（幅=金額）"
      centerLabel="一般会計"
      centerSub={`歳入 ${yen(d.totals.revenue)} / 歳出 ${yen(d.totals.expenditure)}`}
      centerSubColor="#64748b"
      leftNodes={d.revenue}
      rightNodes={d.expenditure}
      leftColor={REV_COLOR}
      rightColor={EXP_COLOR}
      formatValue={yen}
      footer={`出典: 地方財政状況調査（${d.year}年度）`}
      labelGutter={182}
    />
  );
}
