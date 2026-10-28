// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の separator.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "../../lib/cn"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "cn-separator shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className,
        /* lyra */ "bg-border shrink-0"
      )}
      {...props}
    />
  )
}

export { Separator }
