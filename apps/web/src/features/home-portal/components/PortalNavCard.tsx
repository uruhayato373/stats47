'use client';

import {
  PORTAL_CARD_ASPECT_CLASS,
  SurfaceLinkCard,
} from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

interface PortalNavCardProps {
  href: string;
  label: string;
  description?: string;
}

/**
 * home「知りたいことから探す」のカード。
 * カード全体が1つのLink。クリックで既存nav_clickを送る
 * (analytics 失敗で遷移を止めない)。ネストした button/link を作らない。
 */
export function PortalNavCard({
  href,
  label,
  description,
}: PortalNavCardProps) {
  return (
    <SurfaceLinkCard
      href={href}
      onClick={() => {
        try {
          trackNavClick({ label, href, surface: 'home_use_case' });
        } catch {
          // analytics 失敗で遷移を止めない
        }
      }}
      className={`${PORTAL_CARD_ASPECT_CLASS} group flex items-start gap-3 overflow-hidden`}
    >
      <span className="min-w-0">
        <span className="block font-semibold text-foreground group-hover:text-primary">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </SurfaceLinkCard>
  );
}
