// テンプレート (shadcndashboard/next-shadcn-dashboard@91deb102) の hooks/use-mobile.ts の写し。
// 公式との差: MOBILE_BREAKPOINT を 1025 から 1024 にした。sidebar.tsx の PC 表示境界 (Tailwind の lg: = min-width 1024px)
// と JS の判定をそろえ、1024px ちょうどで CSS は PC 表示・JS は Sheet という食い違いを起こさないため。
import * as React from "react"

export const MOBILE_BREAKPOINT = 1024

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
