import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

/**
 * 状態の表示 (済・ずれ・止・? など)。shadcn の Badge の variant に寄せる。
 * 手組みの pill (`rounded-full border px-2 …`) の置き換え先。色は console-good/warn (light/dark で AA を実測済み)。
 */
export type Tone = "good" | "warn" | "bad" | "neutral" | "info";

const VARIANT = {
  good: "success",
  warn: "warning",
  bad: "destructive",
  neutral: "outline",
  info: "secondary",
} as const;

export function StatusBadge({ tone = "neutral", title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <Badge variant={VARIANT[tone]} title={title}>
      {children}
    </Badge>
  );
}
