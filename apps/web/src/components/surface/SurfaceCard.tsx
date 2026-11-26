import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import {
  getSurfaceCardClassName,
  railNavRowClassName,
} from "@stats47/components";
import { ChevronRight } from "lucide-react";

import Link from "@/components/atoms/SiteLink";

/*
 * パネル部品の本体は @stats47/components (packages/components/src/surface/) が持つ。ここは公開サイトのリンク部品
 * (SiteLink。先読みを触れたときだけにする) で描く 2 部品だけを置く。見た目はパッケージのクラス関数から作る。
 */

interface SurfaceLinkCardProps extends ComponentPropsWithoutRef<typeof Link> {
  children: ReactNode;
}

export function SurfaceLinkCard({
  children,
  className,
  ...props
}: SurfaceLinkCardProps) {
  return (
    <Link
      className={getSurfaceCardClassName({ interactive: true, className })}
      {...props}
    >
      {children}
    </Link>
  );
}

interface RailNavRowProps extends Omit<ComponentPropsWithoutRef<typeof Link>, "children"> {
  children: ReactNode;
  /** 選択中 (現在ページ)。aria-current="page" と active 表示を同時に出す */
  active?: boolean;
  /** 右端に添える件数などの補助テキスト */
  trailing?: ReactNode;
  /** 右向き矢印を出す (既定: 出す) */
  chevron?: boolean;
  /** 左端の小さなアイコン (行の種類を見分ける。テーマの分野・調査の分野など) */
  leading?: ReactNode;
  /** 名前の下に添える 1 行 (「1位 東京都 1,424万人」など) */
  detail?: ReactNode;
}

/** レール内のリンク行 1 本。`RailLinkList` / `RailCategoryList` の中で使う */
export function RailNavRow({
  children,
  className,
  active = false,
  trailing,
  chevron = true,
  leading,
  detail,
  ...props
}: RailNavRowProps) {
  return (
    <Link
      {...(active ? { "aria-current": "page" as const } : {})}
      className={railNavRowClassName({ active, className })}
      {...props}
    >
      {leading && (
        <span aria-hidden="true" className="flex shrink-0 text-muted-foreground [&_svg]:size-4">
          {leading}
        </span>
      )}
      {detail ? (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{children}</span>
          <span className="truncate text-xs text-muted-foreground">{detail}</span>
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate">{children}</span>
      )}
      {trailing !== undefined && trailing !== null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {trailing}
        </span>
      )}
      {chevron && (
        <ChevronRight
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
        />
      )}
    </Link>
  );
}

