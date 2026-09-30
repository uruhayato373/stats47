// shadcn/ui 公式（new-york-v4）の label.tsx をそのまま使う。変えたのは cn の import 先 (@/lib/cn) だけ。
// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/label.tsx・例外: .claude/config/shadcn-parity-allow.json）。
"use client"

import * as React from "react"
import { cn } from "@/lib/cn"
import { Label as LabelPrimitive } from "radix-ui"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
