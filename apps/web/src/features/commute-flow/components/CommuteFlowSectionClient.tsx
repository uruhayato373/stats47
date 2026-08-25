"use client";

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

import { CommuteSankey } from "./CommuteSankey";

import type { CommuteFlowData } from "../lib/types";

interface Props {
  /** SSG 時にサーバーが R2 から読んだ既定県データ */
  initialData?: CommuteFlowData;
}

export function CommuteFlowSectionClient({ initialData }: Props) {
  const { prefCode, isNationalFallback, options, setFocus } = useFlowFocusPrefecture(
    initialData?.focusCode,
  );

  const focusName = options.find((p) => p.code === prefCode)?.name ?? "";

  return (
    <ChartPanel
      title="都道府県 通勤フロー（昼夜間人口）"
      description="他県に住み焦点県へ通勤してくる人（流入）と、焦点県から他県へ通勤する人（流出）。流入が多い県は昼間人口が膨らみます。"
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
          source="国勢調査 従業地・通学地集計"
          sourceLinks={[{ label: "国勢調査", url: "/survey/census" }]}
          rankingLink="/ranking/day-time-population-ratio"
          rankingLabel="ランキングを見る"
        />
      }
    >
      <CommuteSankey code={prefCode} initialData={initialData} />
    </ChartPanel>
  );
}
