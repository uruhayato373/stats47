import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import Link from "next/link";


import { cn } from "@stats47/components";

const surfaceCardClass =
  "rounded-none border bg-card p-4 shadow-sm transition-colors";

const interactiveSurfaceClass =
  "hover:border-primary/40 hover:bg-accent/40 hover:shadow-md";

interface SurfaceClassNameOptions {
  interactive?: boolean;
  className?: string;
}

export function getSurfaceCardClassName({
  interactive = false,
  className,
}: SurfaceClassNameOptions = {}) {
  return cn(surfaceCardClass, interactive && interactiveSurfaceClass, className);
}

interface SurfaceCardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

interface SurfaceSectionProps extends ComponentPropsWithoutRef<"section"> {
  children: ReactNode;
}

export function SurfaceCard({
  children,
  className,
  ...props
}: SurfaceCardProps) {
  return (
    <div className={getSurfaceCardClassName({ className })} {...props}>
      {children}
    </div>
  );
}

export function SurfaceSection({
  children,
  className,
  ...props
}: SurfaceSectionProps) {
  return (
    <section className={getSurfaceCardClassName({ className })} {...props}>
      {children}
    </section>
  );
}

interface SurfaceLinkCardProps extends ComponentPropsWithoutRef<typeof Link> {
  children: ReactNode;
}

export function SurfaceLinkCard({
  children,
  className,
  ...props
}: SurfaceLinkCardProps) {
  return (
    <Link
      className={getSurfaceCardClassName({ interactive: true, className })}
      {...props}
    >
      {children}
    </Link>
  );
}

interface RailCardProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  headerAction?: ReactNode;
  bodyClassName?: string;
  titleClassName?: string;
}

export function RailCard({
  title,
  icon,
  children,
  headerAction,
  className,
  bodyClassName,
  titleClassName,
  ...props
}: RailCardProps) {
  return (
    <SurfaceSection className={cn("p-0", className)} {...props}>
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            {title && (
              <h3
                className={cn(
                  "truncate text-sm font-medium text-muted-foreground",
                  titleClassName,
                )}
              >
                {title}
              </h3>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className={cn("px-4 pb-4 pt-3", bodyClassName)}>{children}</div>
    </SurfaceSection>
  );
}

interface RailLinkListProps extends ComponentPropsWithoutRef<"nav"> {
  children: ReactNode;
}

export function RailLinkList({
  children,
  className,
  ...props
}: RailLinkListProps) {
  return (
    <nav className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </nav>
  );
}

interface RailLinkItemProps extends ComponentPropsWithoutRef<typeof Link> {
  children: ReactNode;
}

export function RailLinkItem({
  children,
  className,
  ...props
}: RailLinkItemProps) {
  return (
    <Link
      className={cn(
        "group flex items-center py-1.5 text-xs transition-colors hover:text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
