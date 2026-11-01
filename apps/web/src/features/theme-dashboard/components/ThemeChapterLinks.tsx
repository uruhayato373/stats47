'use client';

import { useEffect, useState } from 'react';

import Link from '@/components/atoms/SiteLink';

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
  // 地域で出す指標を絞ると、描かれない章がある (全国のページで公式の全国の値が無い章など。2026-11-01)。
  // 描かれた章への導線だけを残す (飛び先の無いリンクを置かない)
  const [shown, setShown] = useState(links);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 描画後の DOM に章があるかで決める
    setShown(links.filter((link) => document.getElementById(link.href.slice(1)) !== null));
  }, [links]);
  return (
    <>
      {shown.map((link) => (
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
