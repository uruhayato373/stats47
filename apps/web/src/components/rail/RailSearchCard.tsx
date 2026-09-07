import Link from 'next/link';

import { Button, Input } from '@stats47/components';
import { Search } from 'lucide-react';

import { RailCard } from '@/components/surface';

interface RailSearchCardProps {
  title: string;
  action: string;
  placeholder: string;
  ariaLabel: string;
  queryName?: string;
  hiddenFields?: Readonly<Record<string, string>>;
  moreLink?: {
    href: string;
    label: string;
  };
}

/** サイト内の検索導線に使い回せる、独立した右レールカード。 */
export function RailSearchCard({
  title,
  action,
  placeholder,
  ariaLabel,
  queryName = 'q',
  hiddenFields = {},
  moreLink,
}: RailSearchCardProps) {
  return (
    <RailCard
      title={title}
      aria-label={title}
      headerAction={
        moreLink ? (
          <Link
            href={moreLink.href}
            className="shrink-0 text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {moreLink.label}
          </Link>
        ) : undefined
      }
    >
      <form action={action} method="get" role="search" className="flex gap-2">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Input
          type="search"
          name={queryName}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className="min-w-0 flex-1 text-sm"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          aria-label="検索する"
          className="shrink-0"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>
    </RailCard>
  );
}
