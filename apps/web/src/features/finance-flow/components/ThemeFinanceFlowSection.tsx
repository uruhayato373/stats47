"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { PREFECTURES } from "@/features/migration-flow";

import { FinanceSankey } from "./FinanceSankey";

interface Props {
  /** 初期表示の焦点県コード（2 桁、既定: 13 = 東京都）。?pref= があれば優先 */
  initialPrefCode?: string;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));

export function ThemeFinanceFlowSection({ initialPrefCode = "13" }: Props) {
  const [prefCode, setPrefCode] = useState(initialPrefCode);

  // ?pref=NN をクライアントで読み取り初期焦点県に反映
  // （useSearchParams を使わず window.location を読むことで SSG を保全する）。
  // SSR/初回 render は initialPrefCode で一致させ、マウント後に URL の値へ更新する。
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
      <h2 className="mb-3 text-xl font-bold text-slate-900">
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

      <FinanceSankey code={prefCode} />
    </section>
  );
}
