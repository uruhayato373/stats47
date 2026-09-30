import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * リンクになるカード (トップ・チャネル一覧・方針の入口など)。中身は shadcn の Card で、a で包む。
 * ホバーで枠がアクセント色になる。`href` は内部リンクなら next/link ではなく素の a で足りる (ローカル専用コンソール)。
 */
export function LinkCard({
  href,
  children,
  className,
  contentClassName,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <a href={href} className="block h-full">
      <Card className={cn("h-full gap-0 py-4 transition-colors hover:border-console-accent/60", className)}>
        <CardContent className={cn("px-4", contentClassName)}>{children}</CardContent>
      </Card>
    </a>
  );
}
