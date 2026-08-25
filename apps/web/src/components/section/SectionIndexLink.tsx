import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

interface SectionIndexLinkProps {
  href: string;
  /** スクリーンリーダー向けの遷移先（例: 「テーマ一覧へ」）。 */
  label: string;
}

/** 左レールなどの SectionHeader 右端に置く、一覧ハブへの共通導線。 */
export function SectionIndexLink({ href, label }: SectionIndexLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span>一覧</span>
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
