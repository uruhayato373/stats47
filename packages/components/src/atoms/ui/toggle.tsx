// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の toggle.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
// lyra の値は cva の外 (<名前>Lyra) に書き、呼び出し側の className より後ろで合成する (scripts/ui-theme/inline-lyra.mjs)。
"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/cn"

const toggleClasses = cva(
  "cn-toggle group/toggle inline-flex items-center justify-center gap-1 font-medium whitespace-nowrap transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "cn-toggle-variant-default bg-transparent",
        outline: "cn-toggle-variant-outline border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default:
          "cn-toggle-size-default h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "cn-toggle-size-sm h-7 min-w-7 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "cn-toggle-size-lg h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
// lyra:begin toggleClasses (scripts/ui-theme/inline-lyra.mjs が style-lyra.css から書く。手で直さない)
const toggleClassesLyra = cva("hover:text-foreground aria-pressed:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[state=on]:bg-muted gap-1 rounded-none text-xs font-medium transition-all [&_svg:not([class*='size-'])]:size-4", {
  variants: {
    variant: {
      default: "bg-transparent",
      outline: "border-input hover:bg-muted border bg-transparent",
    },
    size: {
      default: "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      sm: "h-7 min-w-7 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
      lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})
// lyra:end toggleClasses

/**
 * 素のクラス → 呼び出し側の className → lyra の順に合成する。lyra は CSS で読んでいたときと同じく呼び出し側に勝つ
 * (勝たせたいときはテンプレートと同じく ! を付ける。packages/ui-theme/README.md)。
 */
function toggleVariants({ className, ...props }: Parameters<typeof toggleClasses>[0] = {}) {
  return cn(toggleClasses(props), className, toggleClassesLyra(props))
}

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleClasses, toggleClassesLyra, toggleVariants }
