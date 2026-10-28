'use client';

import { type ReactNode, useId } from 'react';

import { cn } from '@stats47/components';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
}

/**
 * タイトル付きチャート/地図の枠 (部品の種類「パネル」)。テンプレートの Card 構成
 * (CardHeader / CardTitle / CardDescription / CardAction / CardContent) で描く。
 * 見出しは h3 として CardTitle の中に置き、領域は見出し・説明で命名する。
 *
 * 寸法は Card 部品が見本 (docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」) の値で持つ:
 * 見出し行は上 16px (Card の py-4)・下 16px + 下線、題は 16px / 22px・500、本文は 14px で下線から 16px。
 * SurfaceCard (RailCard・SectionCard) も同じ寸法。ページの側から見出し・余白・補足の位置を変える口は持たない
 * (`design-system:check` の panel-* 規則)。
 *
 * 補足 (出典・注記・関連リンク) は下端の帯 (CardFooter) にせず、本文の後の 1 行としてパネルの中に置く。
 */
const TITLE_CLASS_NAME = 'flex min-w-0 items-center gap-2';
const META_CLASS_NAME = 'flex flex-col px-4 text-xs text-muted-foreground';

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
        <CardHeader className="border-b">
          {(icon || title) && (
            <CardTitle className={TITLE_CLASS_NAME}>
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
        <div data-slot="panel-meta" className={META_CLASS_NAME}>
          {footer}
        </div>
      )}
    </Card>
  );
}
