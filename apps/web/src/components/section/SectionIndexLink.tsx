import { buttonVariants } from '@stats47/components';
import { ArrowRight } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';


interface SectionIndexLinkProps {
  href: string;
  /** スクリーンリーダー向けの遷移先（例: 「テーマ一覧へ」）。 */
  label: string;
}

/**
 * 左レールなどの見出し右端 (CardAction) に置く、一覧ハブへの共通導線。
 * テンプレートの Button の link 見た目をリンクに付ける (役割はリンクのまま。ui-components.md)。
 */
export function SectionIndexLink({ href, label }: SectionIndexLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-slot="button"
      className={buttonVariants({ variant: 'link', size: 'sm' })}
    >
      <span>一覧</span>
      <ArrowRight data-icon="inline-end" aria-hidden />
    </Link>
  );
}
