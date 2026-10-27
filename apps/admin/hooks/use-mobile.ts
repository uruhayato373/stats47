// shadcn/ui 公式（base-nova）の use-mobile.ts をそのまま使う。変えたのは import 先（cn → @/lib/cn・registry の別名 → admin の alias・IconPlaceholder → lucide-react）だけ。
// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/use-mobile.ts・例外: .claude/config/shadcn-parity-allow.json）。
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
