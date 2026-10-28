import type { ComponentProps, ReactNode } from "react";

import { cn, PanelGrid } from "@stats47/components";

/**
 * 並べ方の部品。部品 (Card など) は外側の余白を持たず、間隔はここの gap だけが決める。
 * 「直後がカードのときだけ margin」のような兄弟セレクタ依存は、間に別の箱が入ると 0 になる (doboku-note PR #684 の実例)。
 */

const GAP = { sm: "gap-2", md: "gap-4", lg: "gap-6" } as const;
type Gap = keyof typeof GAP;

/** 縦に積む。 */
export function Stack({ gap = "md", className, ...props }: ComponentProps<"div"> & { gap?: Gap }) {
  return <div className={cn("flex flex-col", GAP[gap], className)} {...props} />;
}

/**
 * 幅に合わせて列数が変わる格子。min は 1 列の最小幅 (この幅を下回ると列が減る)。
 * 既定 (lines) は公開サイトと同じ線の格子 (@stats47/components の PanelGrid) で、カードが 1px の線を共有して並ぶ。
 * カード以外を並べるときは lines={false}。
 * 例: <Grid min="sm"> (180px) = 数値タイル (StatCard)、<Grid min="lg"> (320px) = グラフ入りカード。
 */
const MIN = {
  sm: "grid-cols-[repeat(auto-fit,minmax(180px,1fr))]",
  md: "grid-cols-[repeat(auto-fit,minmax(260px,1fr))]",
  lg: "grid-cols-[repeat(auto-fit,minmax(320px,1fr))]",
} as const;

export function Grid({
  min = "md",
  gap = "md",
  lines = true,
  className,
  ...props
}: ComponentProps<"div"> & { min?: keyof typeof MIN; gap?: Gap; lines?: boolean }) {
  if (lines) return <PanelGrid className={cn(MIN[min], className)} {...props} />;
  return <div className={cn("grid", MIN[min], GAP[gap], className)} {...props} />;
}

/**
 * 見出しつきのまとまり。見出しと中身の間隔もここで持つ。note は中身の下に出す注記。
 * id はページ内リンク (#id) の着地、count は見出しの横に出す件数。
 */
export function Section({
  id,
  title,
  count,
  note,
  children,
  className,
}: {
  id?: string;
  title: ReactNode;
  count?: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("flex scroll-mt-6 flex-col gap-3", className)}>
      <h2 className="m-0 text-base font-semibold">
        {title}
        {count !== undefined ? <span className="ml-2 font-normal text-muted-foreground">({count})</span> : null}
      </h2>
      {children}
      {note ? <p className="m-0 text-xs text-muted-foreground">{note}</p> : null}
    </section>
  );
}
