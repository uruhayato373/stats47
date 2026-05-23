"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

const MigrationFlowPlayer = dynamic(
  () => import("./MigrationFlowPlayer").then((m) => m.MigrationFlowPlayer),
  { ssr: false },
);

interface Props {
  /** 焦点県コード（2 桁） */
  prefCode: string;
  areaName: string;
}

/**
 * エリアページ用の人口移動フローセクション。
 * スクロールで可視範囲に入って初めて重いプレイヤーを読み込む（遅延ロード）。
 */
export function AreaMigrationFlowSection({ prefCode, areaName }: Props) {
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
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">
          {areaName}の人口移動フロー
        </h2>
        <Link
          href="/gis-cross/migration-flow"
          className="text-sm text-primary hover:underline whitespace-nowrap"
        >
          全国版を見る
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {areaName}と全国各地との転入・転出を地図アニメーションで可視化します。
        県内は市区町村別の転入超過率で塗り分けています。
      </p>

      {visible ? (
        <MigrationFlowPlayer initialPrefCode={prefCode} showSelector={false} />
      ) : (
        <div
          className="w-full rounded-md border bg-slate-100"
          style={{ aspectRatio: "16 / 9" }}
        />
      )}
    </section>
  );
}
