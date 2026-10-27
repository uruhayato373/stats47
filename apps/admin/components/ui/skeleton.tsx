// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102・Base UI) の skeleton.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn）だけ。
// 正との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/skeleton.tsx・例外: .claude/config/shadcn-parity-allow.json）。
import { cn } from "@/lib/cn"

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
