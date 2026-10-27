// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の button.tsx の写し。import 先は相対パスに変えた。
// 取り直すときは同じコミットの components/ui/ から写し、下の 1 点を当て直す (packages/ui-theme/README.md)。
//
// 公式との差: 呼び出しが 0 件の variant="destructive" を外した。Tailwind はソースに書かれたクラスを全部 CSS に出し、
// その variant の lyra 規則名を書くと style-lyra.used.css に規則が残るので、使わない見た目の分だけ全ページの CSS が
// 重くなる (2026-10-28 配信サイズの点検・策 E)。使い始めるときはテンプレートの写しから戻す。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/cn"

const buttonVariants = cva(
  "cn-button group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "cn-button-variant-default bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "cn-button-variant-outline border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "cn-button-variant-secondary bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "cn-button-variant-ghost hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        link: "cn-button-variant-link text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "cn-button-size-default h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "cn-button-size-xs h-6 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "cn-button-size-sm h-7 gap-1 px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "cn-button-size-lg h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "cn-button-size-icon size-8",
        "icon-xs":
          "cn-button-size-icon-xs size-6 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "cn-button-size-icon-sm size-7 in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "cn-button-size-icon-lg size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
