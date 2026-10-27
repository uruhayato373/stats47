// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の badge.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn）だけ。
// 正との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/badge.tsx・例外: .claude/config/shadcn-parity-allow.json）。
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "cn-badge group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "cn-badge-variant-default bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "cn-badge-variant-secondary bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "cn-badge-variant-destructive bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "cn-badge-variant-outline border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "cn-badge-variant-ghost hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "cn-badge-variant-link text-primary underline-offset-4 hover:underline",
        success: "bg-console-good/10 text-console-good [a]:hover:bg-console-good/20",
        warning: "bg-console-warn/10 text-console-warn [a]:hover:bg-console-warn/20",
        info: "bg-console-info/10 text-console-info [a]:hover:bg-console-info/20",
        danger: "bg-console-bad/10 text-console-bad [a]:hover:bg-console-bad/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
