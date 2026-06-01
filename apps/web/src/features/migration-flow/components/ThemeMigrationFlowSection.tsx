"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { PREFECTURES } from "../lib/prefectures";

import { MigrationSankey } from "./MigrationSankey";

const MigrationFlowPlayer = dynamic(
  () => import("./MigrationFlowPlayer").then((m) => m.MigrationFlowPlayer),
  { ssr: false },
);

interface Props {
  /** 初期表示の焦点県コード（2 桁、既定: 13 = 東京都）。?pref= があれば優先 */
  initialPrefCode?: string;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));

export function ThemeMigrationFlowSection({ initialPrefCode = "13" }: Props) {
  const [prefCode, setPrefCode] = useState(initialPrefCode);
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // ?pref=NN をクライアントで読み取り初期焦点県に反映
  // （useSearchParams を使わず window.location を読むことで SSG を保全する）。
  // SSR/初回 render は initialPrefCode で一致させ、マウント後に URL の値へ更新することで
  // hydration mismatch を避ける。そのため setState-in-effect は意図的。
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("pref");
    if (param && VALID_CODES.has(param)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefCode(param);
    }
  }, []);

  // アニメ地図（重い）はビューポート接近時に遅延ロード
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMapVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleChange = (code: string) => {
    setPrefCode(code);
    // 共有用に URL も更新（履歴は汚さない）
    const url = new URL(window.location.href);
    url.searchParams.set("pref", code);
    window.history.replaceState(null, "", url);
  };

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-slate-900">
        都道府県 人口移動フロー
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        焦点の都道府県と全国との「人の出入り」を可視化します。フロー図（Sankey）で県間の転入・転出の量を、
        アニメ地図で移動の動きを示します。都道府県を選ぶと両方が連動します。
      </p>

      {/* 共有 焦点県セレクタ */}
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

      {/* フロー図（Sankey）— 軽量・即時描画（着地ページの主役） */}
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        フロー図（Sankey）
      </h3>
      <MigrationSankey code={prefCode} />

      {/* アニメ地図 — 遅延ロード */}
      <h3 className="mb-2 mt-8 text-sm font-semibold text-slate-700">
        アニメ地図
      </h3>
      <div ref={mapRef}>
        {mapVisible ? (
          <MigrationFlowPlayer prefCode={prefCode} showSelector={false} />
        ) : (
          <div
            className="w-full rounded-md border bg-slate-100"
            style={{ aspectRatio: "16 / 9" }}
          />
        )}
      </div>
    </section>
  );
}
