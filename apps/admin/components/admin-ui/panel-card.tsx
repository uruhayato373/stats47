import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 題名つきの区画。見本 (shadcndashboard.dev の Sales Overview 等・2026-10-27 実測) と同じく、
 * 見出し行 (アイコン + 題名 16px medium、右に操作) の下に線を引き、その下に中身を置く。
 * 1 画面に区画がいくつも並ぶときに使う。表だけの画面は TableFrame / DataGrid を直に置く。
 *
 * 外側は <section> (display: contents なので格子の並びに影響しない)、題名は <h2>。
 * Section から置き換えても、ページ内リンクの着地 (id)・見出しでの移動・e2e の「見出しを持つ section」の探し方が保たれる。
 */
export function PanelCard({
  id,
  title,
  description,
  action,
  icon,
  children,
  className,
}: {
  /** ページ内リンク (#id) の着地 */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** lucide のアイコン要素 (例: <TrendingUpIcon />) */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className="contents">
      {/* display: contents の要素には箱が無く着地できないので、id は Card に付ける */}
      <Card id={id} className={cn("scroll-mt-16", className)}>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            {icon ? (
              <span className="text-muted-foreground [&_svg]:size-4" aria-hidden="true">
                {icon}
              </span>
            ) : null}
            <h2 className="m-0 text-base leading-snug font-medium">{title}</h2>
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
