// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の badge.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
// lyra の値は cva の外 (<名前>Lyra) に書き、呼び出し側の className より後ろで合成する (scripts/ui-theme/inline-lyra.mjs)。
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/cn"

const badgeClasses = cva(
  "cn-badge group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
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
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
// lyra:begin badgeClasses (scripts/ui-theme/inline-lyra.mjs が style-lyra.css から書く。手で直さない)
const badgeClassesLyra = cva("h-5 gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3!", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
      destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
      outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
      ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
      link: "text-primary underline-offset-4 hover:underline",
    },
  },
  defaultVariants: { variant: "default" },
})
// lyra:end badgeClasses

/**
 * 素のクラス → 呼び出し側の className → lyra の順に合成する。lyra は CSS で読んでいたときと同じく呼び出し側に勝つ
 * (勝たせたいときはテンプレートと同じく ! を付ける。packages/ui-theme/README.md)。
 */
function badgeVariants({ className, ...props }: Parameters<typeof badgeClasses>[0] = {}) {
  return cn(badgeClasses(props), className, badgeClassesLyra(props))
}

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
        className: badgeVariants({ variant, className }),
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
