// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の label.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 正の写し: .claude/config/shadcn-reference/ (packages/ui-theme/README.md)。
"use client"

import * as React from "react"

import { cn } from "../../lib/cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "cn-label flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
