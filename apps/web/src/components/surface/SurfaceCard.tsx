import Link from "next/link";

import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "@stats47/components";

const surfaceCardClass =
  "rounded-none border bg-card p-4 shadow-sm transition-colors";

const interactiveSurfaceClass =
  "hover:border-primary/40 hover:bg-accent/40 hover:shadow-md";

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
    <div className={cn(surfaceCardClass, className)} {...props}>
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
    <section className={cn(surfaceCardClass, className)} {...props}>
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
      className={cn(surfaceCardClass, interactiveSurfaceClass, className)}
      {...props}
    >
      {children}
    </Link>
  );
}
