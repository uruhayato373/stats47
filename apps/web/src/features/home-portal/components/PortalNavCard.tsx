'use client';

import Image from 'next/image';

import { PORTAL_CARD_DESCRIPTION_CLASS, PORTAL_CARD_PADDING_CLASS, PORTAL_CARD_TITLE_CLASS, SurfaceLinkCard, PORTAL_CARD_CELL_CLASS } from '@/components/surface';

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
      className={`${PORTAL_CARD_PADDING_CLASS} ${PORTAL_CARD_CELL_CLASS} group flex h-full flex-col gap-3`}
    >
      {/* 挿絵は題名の上の固定の枠 (size-12) に置く。題名の横に並べると狭い幅で題名の列が潰れていた */}
      <span
        aria-hidden="true"
        className="pointer-events-none relative block size-12 shrink-0"
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </span>
      <span className="block min-w-0">
        <span className={`${PORTAL_CARD_TITLE_CLASS} block`}>{label}</span>
        {description && (
          <span className={`${PORTAL_CARD_DESCRIPTION_CLASS} mt-1 block`}>
            {description}
          </span>
        )}
      </span>
    </SurfaceLinkCard>
  );
}
