"use client";

import { type ReactNode } from "react";

import Link from "next/link";

import { cn } from "@stats47/components";
import { Card, CardContent, CardHeader } from "@stats47/components/atoms/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@stats47/components/atoms/ui/table";

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
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="p-3 pb-1">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          {subtitle && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <Table>
          <TableBody>
            {rows.map((row, index) => {
              const content = (
                <>
                  <TableCell className="h-auto px-0 py-1.5 text-xs text-muted-foreground">
                    <div className="line-clamp-2">{row.label}</div>
                    {row.meta && <div className="mt-0.5 text-[10px]">{row.meta}</div>}
                  </TableCell>
                  <TableCell className="h-auto px-0 py-1.5 text-right text-sm font-bold tabular-nums text-foreground">
                    {row.value}
                  </TableCell>
                </>
              );

              return (
                <TableRow
                  key={index}
                  className="border-border/50 hover:bg-transparent"
                >
                  {row.href ? (
                    <>
                      <TableCell className="h-auto px-0 py-0" colSpan={2}>
                        <Link
                          href={row.href}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5 hover:text-primary"
                        >
                          <span className="text-xs text-muted-foreground">
                            <span className="line-clamp-2">{row.label}</span>
                            {row.meta && <span className="mt-0.5 block text-[10px]">{row.meta}</span>}
                          </span>
                          <span className="text-right text-sm font-bold tabular-nums text-foreground">
                            {row.value}
                          </span>
                        </Link>
                      </TableCell>
                    </>
                  ) : (
                    content
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {footer && (
          <div className="mt-1 text-[10px] text-muted-foreground">{footer}</div>
        )}
      </CardContent>
    </Card>
  );
}
