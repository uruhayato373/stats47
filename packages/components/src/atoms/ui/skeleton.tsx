// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の skeleton.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 取り直すときは同じコミットの components/ui/ から写す (packages/ui-theme/README.md)。
// lyra の cn-* 規則が別の値で上書きする素のクラス (rounded-xl・text-sm 等) は消してある (packages/ui-theme/README.md の差の一覧)。
import { cn } from "../../lib/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("cn-skeleton animate-pulse bg-muted", className, /* lyra */ "bg-muted rounded-none")}
      {...props}
    />
  )
}

export { Skeleton }
