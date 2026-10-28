// shadcn/ui 公式（base-nova）の separator.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn・registry の別名 → admin の alias・IconPlaceholder → lucide-react）だけ。
// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/separator.tsx・例外: .claude/config/shadcn-parity-allow.json）。
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@/lib/cn"

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
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
