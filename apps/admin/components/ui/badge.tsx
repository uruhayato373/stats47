// shadcn/ui 公式（new-york-v4）の badge.tsx をそのまま使う。変えたのは cn の import 先 (@/lib/cn) だけ。
// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/badge.tsx・例外: .claude/config/shadcn-parity-allow.json）。
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        // 公式に無い状態用 variant (check-shadcn-parity の例外に理由を登録)。色は console-good/warn (light/dark で AA 実測済み)
        success: "bg-console-good/10 text-console-good [a&]:hover:bg-console-good/20",
        warning: "bg-console-warn/10 text-console-warn [a&]:hover:bg-console-warn/20",
        info: "bg-console-info/10 text-console-info [a&]:hover:bg-console-info/20",
        danger: "bg-console-bad/10 text-console-bad [a&]:hover:bg-console-bad/20",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
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
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
