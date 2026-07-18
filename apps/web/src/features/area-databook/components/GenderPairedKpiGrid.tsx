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

/** 男/女それぞれの値+順位を表示する 1 セル。 */
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
  const color = tone === "male" ? "text-[#3b82f6]" : "text-[#ec4899]";
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors hover:bg-accent/30"
    >
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
 * 男女で対比する KPI (初婚年齢・寿命・給与・身長・体重)。男=青 / 女=桃 (予約色)。
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
