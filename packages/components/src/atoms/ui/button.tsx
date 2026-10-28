// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の button.tsx の写し。import 先は相対パスに変えた。
// 取り直すときは同じコミットの components/ui/ から写し、下の 1 点を当て直す (packages/ui-theme/README.md)。
//
// 公式との差: 呼び出しが 0 件の variant="destructive" を外した。Tailwind はソースに書かれたクラスを全部 CSS に出し、
// その variant の lyra の値も className に書き込まれるので、使わない見た目の分だけ全ページの CSS が
// 重くなる (2026-10-28 配信サイズの点検・策 E)。使い始めるときはテンプレートの写しから戻す。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
// lyra の値は cva の外 (<名前>Lyra) に書き、呼び出し側の className より後ろで合成する (scripts/ui-theme/inline-lyra.mjs)。
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/cn"

const buttonClasses = cva(
  "cn-button group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "cn-button-variant-default bg-primary text-primary-foreground",
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
          "cn-button-size-default gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "cn-button-size-xs h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "cn-button-size-sm h-7 gap-1 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "cn-button-size-lg gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "cn-button-size-icon",
        "icon-xs":
          "cn-button-size-icon-xs size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "cn-button-size-icon-sm size-7",
        "icon-lg": "cn-button-size-icon-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
// lyra:begin buttonClasses (scripts/ui-theme/inline-lyra.mjs が style-lyra.css から書く。手で直さない)
const buttonClassesLyra = cva("focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding font-medium focus-visible:ring-1 aria-invalid:ring-1 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4 text-sm", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      outline: "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
      secondary: "bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground hover:bg-[color-mix(in_oklch,hsl(var(--secondary)),hsl(var(--foreground))_5%)]",
      ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 h-9",
      xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3 rounded-md",
      sm: "h-7 gap-1 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5 rounded-md text-xs",
      lg: "gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 h-10",
      icon: "size-9",
      "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3 rounded-md",
      "icon-sm": "size-7 rounded-md",
      "icon-lg": "size-10",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})
// lyra:end buttonClasses

/**
 * 素のクラス → 呼び出し側の className → lyra の順に合成する。lyra は CSS で読んでいたときと同じく呼び出し側に勝つ
 * (勝たせたいときはテンプレートと同じく ! を付ける。packages/ui-theme/README.md)。
 */
function buttonVariants({ className, ...props }: Parameters<typeof buttonClasses>[0] = {}) {
  return cn(buttonClasses(props), className, buttonClassesLyra(props))
}

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
