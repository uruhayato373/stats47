// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の empty.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/cn"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "cn-empty flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 border-dashed p-6 text-center text-balance",
        className,
        /* lyra */ "gap-4 rounded-none border-dashed p-6"
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("cn-empty-header flex max-w-sm flex-col items-center gap-2", className, /* lyra */ "gap-2")}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn("cn-empty-media", emptyMediaVariants({ variant, className }), /* lyra */ "mb-2")}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn(
        "cn-empty-title text-sm font-medium tracking-tight",
        className,
        /* lyra */ "text-sm font-medium"
      )}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "cn-empty-description text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
        /* lyra */ "text-xs/relaxed"
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "cn-empty-content flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-balance",
        className,
        /* lyra */ "gap-2.5 text-xs"
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
