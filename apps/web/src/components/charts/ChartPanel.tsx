"use client";

import { type ReactNode } from "react";

import { cn } from "@stats47/components";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";

export interface ChartPanelProps {
  title: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
}

export function ChartPanel({
  title,
  children,
  icon,
  description,
  action,
  className,
  contentClassName,
  headerClassName,
  titleClassName,
}: ChartPanelProps) {
  return (
    <Card className={cn("border border-border shadow-sm", className)}>
      <CardHeader className={cn("pb-2", headerClassName)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <CardTitle className={cn("text-sm", titleClassName)}>{title}</CardTitle>
          </div>
          {action}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
