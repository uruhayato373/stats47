// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の collapsible.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn）だけ。
// 正との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/collapsible.tsx・例外: .claude/config/shadcn-parity-allow.json）。
"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
