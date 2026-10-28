import type { ReactNode } from "react";

import { Badge } from "@stats47/components";

/**
 * 状態の表示 (済・ずれ・止・? など)。共有の Badge に状態色 (@stats47/ui-theme/theme.css の positive / warning / negative / info) を当てる。
 * 共有の Badge は lyra の値を呼び出し側の className より後ろで合成するので、色は ! で勝たせる (packages/ui-theme/README.md)。
 */
export type Tone = "good" | "warn" | "bad" | "neutral" | "info";

const TONE_CLASS: Record<Tone, string> = {
  good: "bg-positive-soft! text-positive!",
  warn: "bg-warning-soft! text-warning!",
  bad: "bg-negative-soft! text-negative!",
  neutral: "",
  info: "bg-info-soft! text-info!",
};

export function StatusBadge({ tone = "neutral", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <Badge variant={tone === "neutral" ? "outline" : "ghost"} className={TONE_CLASS[tone]} title={title}>
      {children}
    </Badge>
  );
}
