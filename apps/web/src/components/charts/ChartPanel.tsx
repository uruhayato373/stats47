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
 * 見出し行は RailCard / SectionCard と同じ型 (アイコン + font-medium + 下線) にそろえる。
 *
 * 見出し行の寸法は SurfaceCard (右レール・節カード) と同じ: 上 16px (Card の py-4)・下 12px + 下線、
 * 題は text-base font-medium leading-6、操作は同じ行の右端、本文は下線から 16px (Card の gap-4)。
 * lyra の .cn-card-header ([.border-b]:pb-4) と .cn-card-title (text-sm) はレイヤーの外にあり
 * 素のクラスに勝つので、テンプレートと同じく ! を付けて上書きする。
 */
const HEADER_CLASS_NAME = 'border-b pb-3!';
const TITLE_CLASS_NAME = 'flex min-w-0 items-center gap-2 text-base! leading-6! font-medium';
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
        <CardHeader className={cn(HEADER_CLASS_NAME, headerClassName)}>
          {(icon || title) && (
            <CardTitle
              className={cn(TITLE_CLASS_NAME, titleClassName)}
            >
              {icon && (
                <span
                  aria-hidden="true"
                  className="flex shrink-0 text-muted-foreground [&_svg]:size-4"
                >
                  {icon}
                </span>
              )}
              {title && (
                <h3 id={titleId} className="min-w-0 font-medium text-foreground">
                  {title}
                </h3>
              )}
            </CardTitle>
          )}
          {description && (
            <CardDescription id={descriptionId}>{description}</CardDescription>
          )}
          {action && (
            // 説明が無いときは見出しの 1 行だけにまたがらせ、見出しと縦の中央をそろえる
            // (CardAction 既定の row-span-2 だと空の 2 行目と gap の分だけ下にずれる)
            <CardAction className={cn('self-center', !description && 'row-span-1')}>
              {action}
            </CardAction>
          )}
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
