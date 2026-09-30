import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * 数値タイル (ラベル + 大きな値 + 補足)。旧 `ops/primitives` の Stat の置き換え先で、中身は shadcn の Card。
 * 色は console-good/warn/info/bad (light/dark でコントラスト AA を実測済み)。
 */
export type StatTone = "neutral" | "good" | "warn" | "bad" | "info";

const TONE: Record<StatTone, string> = {
  neutral: "text-foreground",
  good: "text-console-good",
  warn: "text-console-warn",
  bad: "text-console-bad",
  info: "text-console-info",
};

export function StatCard({ label, value, sub, tone = "neutral" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: StatTone }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="px-3">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className={cn("mt-1 text-xl font-bold", TONE[tone])}>{value}</div>
        {sub ? <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}
