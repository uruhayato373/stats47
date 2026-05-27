"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";

const MigrationFlowPlayer = dynamic(
  () => import("./MigrationFlowPlayer").then((m) => m.MigrationFlowPlayer),
  { ssr: false },
);

interface Props {
  /** 初期表示の焦点県コード（2 桁、既定: 28 = 兵庫県） */
  initialPrefCode?: string;
}

export function ThemeMigrationFlowSection({ initialPrefCode = "28" }: Props) {
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
      <h2 className="mb-3 text-xl font-bold text-slate-900">
        都道府県 人口移動フロー
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        焦点の都道府県と全国との「人の出入り」をアニメーション地図で可視化します。
        焦点県は市区町村別の転入超過率で塗り分け、全国との転入・転出をパーティクルで表示します。
      </p>

      {visible ? (
        <MigrationFlowPlayer initialPrefCode={initialPrefCode} />
      ) : (
        <div
          className="w-full rounded-md border bg-slate-100"
          style={{ aspectRatio: "16 / 9" }}
        />
      )}
    </section>
  );
}
