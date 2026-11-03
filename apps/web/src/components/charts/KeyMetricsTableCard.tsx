"use client";

import { type ReactNode } from "react";


import { cn } from "@stats47/components";

import Link from "@/components/atoms/SiteLink";
import { SurfaceCard, ValueTable } from "@/components/surface";

export interface KeyMetricsTableRow {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  href?: string;
}

export interface KeyMetricsTableCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  rows: KeyMetricsTableRow[];
  footer?: ReactNode;
  className?: string;
}

export function KeyMetricsTableCard({
  title,
  subtitle,
  rows,
  footer,
  className,
}: KeyMetricsTableCardProps) {
  return (
    <SurfaceCard className={cn("p-0", className)}>
      <div className="p-3 pb-1">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          {subtitle && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="p-3 pt-1">
        {/* 項目と値の対だけの表。見出しの行は画面に出さない (共通の静的な表 ValueTable。2026-11-03) */}
        <ValueTable
          hideHeader
          ariaLabel={typeof title === "string" ? title : undefined}
          columns={[
            { key: "label", header: "項目", rowHeader: true },
            { key: "value", header: "値", className: "font-bold text-foreground" },
          ]}
          rows={rows.map((row, index) => ({
            key: String(index),
            cells: [
              <>
                {row.href ? <Link href={row.href}>{row.label}</Link> : row.label}
                {row.meta && <small className="block">{row.meta}</small>}
              </>,
              row.value,
            ],
          }))}
        />
        {footer && (
          <div className="mt-1 text-[10px] text-muted-foreground">{footer}</div>
        )}
      </div>
    </SurfaceCard>
  );
}
