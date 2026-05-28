"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";

const StationPassengersPlayer = dynamic(
  () => import("./StationPassengersPlayer").then((m) => m.StationPassengersPlayer),
  { ssr: false },
);

interface Props {
  /** 初期表示の県コード（2 桁、既定: 22 = 静岡県） */
  initialPrefCode?: string;
}

/**
 * 鉄道テーマ (/themes/railway) に埋め込む駅別乗降客数バブルマップセクション。
 *
 * 旧 /station-passengers 独立ページを 2026-05-28 にテーマへ統合した際、駅レベルの
 * バブルマップ機能を失わないよう本セクションとして移設。Player は県セレクタ内蔵で、
 * 駅・路線データは /api/station-passengers/{code}/* (R2 CORS 回避プロキシ) から取得する。
 */
export function ThemeStationPassengersSection({ initialPrefCode = "22" }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref}>
      <h2 className="mb-2 text-xl font-bold text-slate-900">
        駅別乗降客数マップ
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        県内の鉄道駅を地図上にバブル表示し、1日あたり乗降客数と2019〜2023年度の推移を可視化します。
        県を切り替えて比較できます。
      </p>

      {visible ? (
        <StationPassengersPlayer initialPrefCode={initialPrefCode} />
      ) : (
        <div
          className="w-full rounded-md border bg-slate-100"
          style={{ aspectRatio: "16 / 9" }}
        />
      )}
    </section>
  );
}
