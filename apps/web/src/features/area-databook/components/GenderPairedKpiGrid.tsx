import Link from "next/link";

import { getSurfaceCardClassName } from "@/components/surface";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";
import type { DatabookGenderPair } from "@stats47/data-configs";


interface Props {
  pairs: DatabookGenderPair[];
  databook: AreaDatabookSnapshot | null;
}

function fmt(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("ja-JP");
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

/**
 * 男/女それぞれの値+順位を表示する 1 セル。
 *
 * 色は 2026-08-05 に是正した。旧 `text-[#3b82f6]` / `text-[#ec4899]` は白地で
 * contrast 3.68 / 3.53 しかなく、本文サイズの文字に必要な 4.5:1 を満たしていない。
 * 単色では light と dark の両方を満たせないため (濃色は dark 地で 2 前後まで落ちる)、
 * light は 700 系、dark は 400 系に分ける。実測 contrast:
 * blue-700 6.70 / pink-700 6.04 (白地)、blue-400 5.83 / pink-400 5.60 (dark --card)。
 *
 * 併せて「男性 / 女性」を可視ラベルとして出す。左右の位置と色以外に手掛かりが無く、
 * 色覚特性によっては men/women を区別できなかった (WCAG 1.4.1)。
 */
function GenderCell({
  href,
  value,
  rank,
  unit,
  tone,
}: {
  href: string;
  value: number | null;
  rank: number | null;
  unit: string;
  tone: "male" | "female";
}) {
  const color =
    tone === "male"
      ? "text-blue-700 dark:text-blue-400"
      : "text-pink-700 dark:text-pink-400";
  const genderLabel = tone === "male" ? "男性" : "女性";
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors hover:bg-accent/30"
    >
      <span className="text-[10px] leading-none text-muted-foreground">
        {genderLabel}
      </span>
      {value !== null ? (
        <>
          <span className={`text-base font-bold tabular-nums ${color}`}>
            {fmt(value)}
            <span className="ml-0.5 text-[11px] text-muted-foreground">{unit}</span>
          </span>
          {rank !== null && rank >= 1 && rank <= 47 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              全国{rank}位
            </span>
          )}
        </>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </Link>
  );
}

/**
 * 男女で対比する KPI (初婚年齢・寿命・給与・身長・体重)。男=青 / 女=桃 の系統は
 * 予約色に合わせつつ、テキスト用途として 4.5:1 を満たす明度に寄せてある (GenderCell)。
 * 各値は databook.json、47 県比較は `/ranking/<key>` リンクで回遊。
 */
export function GenderPairedKpiGrid({ pairs, databook }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {pairs.map((p) => {
        const male = databook?.metrics[p.maleKey] ?? null;
        const female = databook?.metrics[p.femaleKey] ?? null;
        const unit = male?.unit ?? female?.unit ?? "";
        return (
          <div
            key={p.label}
            className={getSurfaceCardClassName({
              className: "flex items-stretch overflow-hidden p-0",
            })}
          >
            <GenderCell
              href={`/ranking/${p.maleKey}`}
              value={male?.value ?? null}
              rank={male?.rank ?? null}
              unit={unit}
              tone="male"
            />
            <div className="flex w-24 shrink-0 items-center justify-center border-x border-border bg-muted/30 px-2 text-center text-xs font-medium text-muted-foreground">
              {p.label}
            </div>
            <GenderCell
              href={`/ranking/${p.femaleKey}`}
              value={female?.value ?? null}
              rank={female?.rank ?? null}
              unit={unit}
              tone="female"
            />
          </div>
        );
      })}
    </div>
  );
}
