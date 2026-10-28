// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の card.tsx をそのまま使う。変えたのは import 先 (相対パス) と
// 下の CARD_SURFACE_CLASS の追加だけ。取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
// 文字の大きさ (Card 14px・CardTitle 16px / 22px・CardDescription 14px) は見本サイトに合わせて lyra から変えてある
// (packages/ui-theme/style-reference.css。/* lyra */ の文字列は npm run ui-theme:lyra が書くので手で直さない)。
import * as React from "react"

import { cn } from "../../lib/cn"

/**
 * Card を使わずにカード面だけが要る場所 (apps/web の SurfaceCard 系) の外枠。
 * テンプレートの lyra カード (角丸なし・細い線・影なし) と同じ見た目を、トークンだけで決める。
 * 角丸は --card-radius、線色は --card-outline (apps/web/src/app/globals.css)。ここにリテラル値を書かない。
 * 地は lyra の .cn-card と同じ bg-background (ダークで bg-card にすると Card 経由のカードと色が食い違った。2026-10-28)。
 */
export const CARD_SURFACE_CLASS =
  "rounded-card border border-card-outline bg-background text-card-foreground"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "cn-card group/card flex flex-col gap-4 overflow-hidden py-4 text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0",
        className,
        /* lyra */ "ring-foreground/10 bg-background text-card-foreground gap-4 overflow-hidden rounded-none py-4 ring-1 border-none has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-2 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none text-sm/relaxed"
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "cn-card-header group/card-header @container/card-header grid auto-rows-min items-start gap-1 px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
        /* lyra */ "gap-1 rounded-none px-4 group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3"
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "cn-card-title font-medium group-data-[size=sm]/card:text-sm",
        className,
        /* lyra */ "font-medium group-data-[size=sm]/card:text-sm text-base leading-5.5"
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("cn-card-description text-muted-foreground", className, /* lyra */ "text-muted-foreground text-sm/relaxed")}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "cn-card-action col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("cn-card-content px-4 group-data-[size=sm]/card:px-3", className, /* lyra */ "px-4 group-data-[size=sm]/card:px-3")}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "cn-card-footer flex items-center border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className,
        /* lyra */ "rounded-none border-t p-4 group-data-[size=sm]/card:p-3"
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
