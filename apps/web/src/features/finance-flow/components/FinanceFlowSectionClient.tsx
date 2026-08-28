"use client";

import { useEffect, useState } from "react";

import { PREFECTURE_LIST_2DIGIT as PREFECTURES } from "@stats47/area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { FinanceSankey } from "./FinanceSankey";

import type { FinanceFlowData } from "../lib/types";

interface Props {
  /** SSG 時にサーバーが R2 から読んだ既定県データ */
  initialData?: FinanceFlowData;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));

export function FinanceFlowSectionClient({ initialData }: Props) {
  const [prefCode, setPrefCode] = useState(initialData?.focusCode ?? "13");

  // ?pref=NN をクライアントで読み取り初期焦点県に反映（useSearchParams 不使用で SSG 保全）。
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("pref");
    if (param && VALID_CODES.has(param)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefCode(param);
    }
  }, []);

  const handleChange = (code: string) => {
    setPrefCode(code);
    const url = new URL(window.location.href);
    url.searchParams.set("pref", code);
    window.history.replaceState(null, "", url);
  };

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-foreground">
        都道府県 財政フロー
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        歳入の財源（地方税・地方交付税・国庫支出金・地方債など）が一般会計を通じて
        目的別歳出（民生費・教育費・土木費など）へ流れる様子をフロー図で可視化します。
        都道府県を選ぶと切り替わります。
      </p>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">焦点の都道府県</span>
        <Select value={prefCode} onValueChange={handleChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREFECTURES.map((p) => (
              <SelectItem key={p.code} value={p.code}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FinanceSankey code={prefCode} initialData={initialData} />
    </section>
  );
}
