import { type ReactNode } from 'react';

import { buttonVariants, cn } from '@stats47/components';
import { ArrowRight } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';


interface SectionIndexLinkProps {
  href: string;
  /** 見える文字 (既定「一覧」)。 */
  children?: ReactNode;
  /** スクリーンリーダー向けの遷移先（例: 「テーマ一覧へ」）。見える文字で足りるときは省略する。 */
  label?: string;
  className?: string;
}

/**
 * 見出しの右端 (SectionHeader の action / RailCard の headerAction) に置く、一覧ハブへの共通導線。
 * テンプレートの Button (outline・sm) の見た目をリンクに付け、矢印は lucide の ArrowRight で描く
 * (役割はリンクのまま。文字の「→」は使わない。ui-components.md)。
 */
export function SectionIndexLink({
  href,
  children = '一覧',
  label,
  className,
}: SectionIndexLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-slot="button"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)}
    >
      <span>{children}</span>
      <ArrowRight data-icon="inline-end" aria-hidden />
    </Link>
  );
}
