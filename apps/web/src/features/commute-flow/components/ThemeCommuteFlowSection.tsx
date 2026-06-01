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

import { CommuteSankey } from "./CommuteSankey";

interface Props {
  /** 初期表示の焦点県コード（2 桁、既定: 13 = 東京都）。?pref= があれば優先 */
  initialPrefCode?: string;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));

export function ThemeCommuteFlowSection({ initialPrefCode = "13" }: Props) {
  const [prefCode, setPrefCode] = useState(initialPrefCode);

  // ?pref=NN をクライアントで読み取り初期焦点県に反映（useSearchParams 不使用で SSG 保全）。
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
        都道府県 通勤フロー（昼夜間人口）
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        他県に住み焦点県へ通勤してくる人（流入）と、焦点県に住み他県へ通勤する人（流出）の
        都道府県間フローを可視化します。流入が多い県は昼間人口が膨らみます。都道府県を選ぶと切り替わります。
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

      <CommuteSankey code={prefCode} />
    </section>
  );
}
