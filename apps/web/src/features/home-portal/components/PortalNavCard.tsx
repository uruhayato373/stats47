'use client';

import Image from 'next/image';

import {
  PORTAL_CARD_ASPECT_CLASS,
  PORTAL_CARD_DESCRIPTION_CLASS,
  PORTAL_CARD_PADDING_CLASS,
  PORTAL_CARD_TITLE_CLASS,
  SurfaceLinkCard,
} from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

interface PortalNavCardProps {
  href: string;
  label: string;
  description?: string;
  imageSrc: string;
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
  imageSrc,
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
      className={`${PORTAL_CARD_ASPECT_CLASS} ${PORTAL_CARD_PADDING_CLASS} group relative block overflow-hidden`}
    >
      <span className="relative z-10 block w-[60%] min-w-0">
        <span className={PORTAL_CARD_TITLE_CLASS}>
          {label}
        </span>
        {description && (
          <span className={`${PORTAL_CARD_DESCRIPTION_CLASS} mt-1 block`}>
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 right-1 h-[70%] w-[48%]"
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 1280px) 110px, (min-width: 1024px) 120px, (min-width: 640px) 160px, 40vw"
          className="object-contain object-right-bottom"
        />
      </span>
    </SurfaceLinkCard>
  );
}
