import type { ReactNode } from "react";

interface KpiTileProps {
  /** ラベル（小文字キャップ） */
  label: string;
  /** メイン数値（タビュラー） */
  value: string | ReactNode;
  /** 単位（small で並走） */
  unit?: string;
  /** 補足（順位や前年比など） */
  note?: string;
  /** 暗色トーン (dark Hero 内) / 明色トーン (light Hero 内) */
  variant?: "dark" | "light";
}

/**
 * D-System KPI タイル（ヒーロー内の数値カード）
 *
 * - `dark`: 半透明白の上にホワイトテキスト。dark HeroShell 内で使う
 * - `light`: card 風の白背景。light HeroShell や section 内で使う
 */
export function KpiTile({
  label,
  value,
  unit,
  note,
  variant = "dark",
}: KpiTileProps) {
  if (variant === "dark") {
    return (
      <div className="rounded-none border border-white/15 bg-white/10 p-3.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-normal text-white/65">
          {label}
        </p>
        <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-white">
          {value}
          {unit && (
            <span className="ml-0.5 text-[11px] font-medium text-white/65">
              {unit}
            </span>
          )}
        </p>
        {note && <p className="mt-0.5 text-[11px] text-white/80">{note}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-none border border-border bg-card p-3.5 shadow-sm">
      <p className="text-[10.5px] font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-foreground">
        {value}
        {unit && (
          <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
