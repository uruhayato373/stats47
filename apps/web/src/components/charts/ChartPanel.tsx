'use client';

import { type ReactNode, useId } from 'react';

import { cn } from '@stats47/components';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@stats47/components/atoms/ui/card';

export interface ChartPanelProps {
  /** 固定キーがあるグラフでは、SSRとクライアントで同じ見出しIDを使う。 */
  id?: string;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  footerClassName?: string;
}

/**
 * タイトル付きチャート/地図の枠。テンプレートの Card 構成
 * (CardHeader / CardTitle / CardDescription / CardAction / CardContent / CardFooter) で描く。
 * 見出しは h3 として CardTitle の中に置き、領域は見出し・説明で命名する。
 */
export function ChartPanel({
  id,
  title,
  children,
  icon,
  description,
  action,
  footer,
  className,
  contentClassName,
  headerClassName,
  titleClassName,
  footerClassName,
}: ChartPanelProps) {
  const hasHeader = title || description || action || icon;
  const generatedId = useId();
  const titleId = title ? `${id ?? generatedId}-title` : undefined;
  const descriptionId = description
    ? `${id ?? generatedId}-description`
    : undefined;

  return (
    <Card
      id={id}
      role={titleId ? 'region' : undefined}
      className={cn('w-full', className)}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {hasHeader && (
        <CardHeader className={cn('border-b', headerClassName)}>
          {(icon || title) && (
            <CardTitle
              className={cn('flex min-w-0 items-center gap-2', titleClassName)}
            >
              {icon}
              {title && <h3 id={titleId}>{title}</h3>}
            </CardTitle>
          )}
          {description && (
            <CardDescription id={descriptionId}>{description}</CardDescription>
          )}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer && (
        <CardFooter
          className={cn(
            'flex-col items-stretch text-xs text-muted-foreground',
            footerClassName
          )}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
