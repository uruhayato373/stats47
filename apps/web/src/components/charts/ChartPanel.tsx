'use client';

import { type ReactNode, useId } from 'react';

import { cn } from '@stats47/components';

import { SurfaceSection } from '@/components/surface';

export interface ChartPanelProps {
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

export function ChartPanel({
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
  const titleId = title ? `${generatedId}-title` : undefined;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  return (
    <SurfaceSection
      className={cn('w-full p-0', className)}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {hasHeader && (
        <div
          className={cn('border-b border-border px-4 py-3', headerClassName)}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {icon}
              {title && (
                <h3
                  id={titleId}
                  className={cn(
                    'text-sm font-semibold text-foreground',
                    titleClassName
                  )}
                >
                  {title}
                </h3>
              )}
            </div>
            {action}
          </div>
          {description && (
            <div
              id={descriptionId}
              className="mt-1 text-sm leading-relaxed text-muted-foreground"
            >
              {description}
            </div>
          )}
        </div>
      )}
      <div className={cn('p-4', contentClassName)}>{children}</div>
      {footer && (
        <div
          className={cn(
            'border-t border-border px-4 py-3 text-xs text-muted-foreground',
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </SurfaceSection>
  );
}
