// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の label.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn）だけ。
// 正との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/label.tsx・例外: .claude/config/shadcn-parity-allow.json）。
"use client"

import * as React from "react"

import { cn } from "@/lib/cn"

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
