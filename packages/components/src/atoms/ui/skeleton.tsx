// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の skeleton.tsx をそのまま使う。変えたのは import 先 (相対パス) だけ。
// 正の写し: .claude/config/shadcn-reference/ (packages/ui-theme/README.md)。
import { cn } from "../../lib/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("cn-skeleton animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
