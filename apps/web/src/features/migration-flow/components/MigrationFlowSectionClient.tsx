"use client";

import { useState } from "react";

import dynamic from "next/dynamic";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";

import { useFlowFocusPrefecture } from "@/features/theme-dashboard";

import { MigrationSankey } from "./MigrationSankey";

import type { MigrationFlowData } from "@stats47/migration-flow";

const MigrationFlowPlayer = dynamic(
  () => import("./MigrationFlowPlayer").then((m) => m.MigrationFlowPlayer),
  { ssr: false },
);

interface Props {
  /** SSG 時にサーバーが R2 から読んだ既定県の Sankey データ */
  initialData?: MigrationFlowData;
}

export function MigrationFlowSectionClient({ initialData }: Props) {
  const { prefCode, isNationalFallback, options, setFocus } = useFlowFocusPrefecture(
    initialData?.focusCode,
  );
  // アニメ地図 (16:9・重い) は既定で閉じる。開いた時点で初めてロードする。
  // ★常時表示していた頃はこのパネルだけ他チャートの約 2 倍の高さになり、
  //   2 カラムの相方 (通勤フロー) に大きな余白を作っていた (2026-08-04)。
  const [mapOpen, setMapOpen] = useState(false);

  const focusName = options.find((p) => p.code === prefCode)?.name ?? "";

  return (
    <ChartPanel
      title="都道府県 人口移動フロー"
      description="焦点の都道府県と全国との「人の出入り」。フロー図で県間の転入・転出の量を、アニメ地図で移動の動きを示します。"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isNationalFallback && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              都道府県未選択のため{focusName}を例に表示中
            </span>
          )}
          <Select value={prefCode} onValueChange={setFocus}>
            <SelectTrigger className="h-8 w-32 text-xs" aria-label="焦点の都道府県">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      footer={
        <ChartFooter
          source="住民基本台帳人口移動報告"
          rankingLink="/ranking/moving-in-excess-rate"
          rankingLabel="ランキングを見る"
        />
      }
    >
      <MigrationSankey code={prefCode} initialData={initialData} />

      <details
        className="mt-4 border-t border-border pt-3"
        onToggle={(e) => setMapOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xs font-semibold text-foreground">
          アニメ地図で移動の動きを見る
        </summary>
        <div className="mt-3">
          {mapOpen ? (
            <MigrationFlowPlayer prefCode={prefCode} showSelector={false} />
          ) : (
            <div
              className="w-full rounded-none border bg-muted"
              style={{ aspectRatio: "16 / 9" }}
            />
          )}
        </div>
      </details>
    </ChartPanel>
  );
}
