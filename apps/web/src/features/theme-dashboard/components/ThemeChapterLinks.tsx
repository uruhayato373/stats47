'use client';

import Link from 'next/link';

import { trackNavClick } from '@/lib/analytics/events';

/** Chapter anchors use the same event contract in the rail and the narrow navigation. */
export function ThemeChapterLinks({
  links,
  themeKey,
  className,
}: {
  links: Array<{ href: string; label: string }>;
  themeKey: string;
  className?: string;
}) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={className}
          onClick={() =>
            trackNavClick({
              surface: 'theme_section',
              label: `${themeKey}:${link.href.slice(1)}`,
              href: link.href,
            })
          }
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
