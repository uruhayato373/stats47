import type { ReactNode } from "react";

import { cn } from "@stats47/components";

import { SurfaceSection } from "@/components/surface";

interface ContentDisclosureProps {
  title: string;
  children: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  headingLevel?: 2 | 3;
  bordered?: boolean;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}

/** 開閉状態を色や文字記号に依存せず示す、細線の + / −。 */
export function DisclosureIcon() {
  return (
    <span
      aria-hidden="true"
      data-slot="disclosure-icon"
      className="relative h-3 w-3 shrink-0 text-muted-foreground"
    >
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
      <span className="disclosure-vertical absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-200 motion-reduce:transition-none" />
    </span>
  );
}

/**
 * 本文コンテンツ向けの共通開閉セクション。
 *
 * ネイティブ details/summary により、JavaScript 無効時も操作でき、閉じた本文も
 * SSR DOM に保持する。ナビゲーション用途の details はこの契約の対象外。
 */
export function ContentDisclosure({
  title,
  children,
  description,
  leading,
  meta,
  headingLevel = 2,
  bordered = true,
  defaultOpen = false,
  className,
  contentClassName,
}: ContentDisclosureProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const disclosure = (
    <details
      open={defaultOpen}
      className="[&[open]>summary_.disclosure-vertical]:scale-y-0"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          {leading ? <span className="shrink-0">{leading}</span> : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Heading className="text-sm font-semibold leading-5 text-foreground">
                {title}
              </Heading>
              {meta}
            </div>
            {description ? (
              <div className="mt-0.5 text-sm font-normal leading-relaxed text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
        </div>
        <DisclosureIcon />
      </summary>
      <div
        className={cn(
          "border-t border-border pb-2 pt-3 text-sm",
          contentClassName,
        )}
      >
        {children}
      </div>
    </details>
  );

  if (!bordered) return disclosure;

  return (
    <SurfaceSection aria-label={title} className={cn("py-2", className)}>
      {disclosure}
    </SurfaceSection>
  );
}
