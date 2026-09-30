// shadcn/ui 公式（new-york-v4）の separator.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn・registry の別名 → admin の alias）だけ。
// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/separator.tsx・例外: .claude/config/shadcn-parity-allow.json）。
"use client"

import * as React from "react"
import { cn } from "@/lib/cn"
import { Separator as SeparatorPrimitive } from "radix-ui"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
