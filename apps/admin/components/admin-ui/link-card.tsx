import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle, cn } from "@stats47/components";

/**
 * リンクになるカード (トップ・チャネル一覧・方針の入口など)。中身は Card で、a で包む。ホバーで面を薄く塗る。
 * title / value / sub を渡すと StatCard と同じ形 (名前 14px・値 24px semibold・補足 muted) になる。
 * それ以外の中身は children で渡す。`href` は素の a で足りる (ローカル専用コンソール)。
 */
export function LinkCard({
  href,
  title,
  value,
  sub,
  children,
  className,
}: {
  href: string;
  title?: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className="group/link block h-full">
      <Card className={cn("h-full transition-colors group-hover/link:bg-muted/40", className)}>
        {title !== undefined ? (
          <CardHeader>
            <CardTitle className="text-sm font-normal">{title}</CardTitle>
          </CardHeader>
        ) : null}
        <CardContent className="flex flex-col gap-1">
          {value !== undefined ? <p className="text-2xl font-semibold tracking-tight">{value}</p> : null}
          {sub !== undefined ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
          {children}
        </CardContent>
      </Card>
    </a>
  );
}
