'use client';

import Image from 'next/image';

import { PORTAL_CARD_ASPECT_CLASS, PORTAL_CARD_DESCRIPTION_CLASS, PORTAL_CARD_PADDING_CLASS, PORTAL_CARD_TITLE_CLASS, SurfaceLinkCard, PORTAL_CARD_CELL_CLASS } from '@/components/surface';

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
      className={`${PORTAL_CARD_PADDING_CLASS} ${PORTAL_CARD_CELL_CLASS} group flex h-full flex-col gap-2 overflow-hidden`}
    >
      {/* 挿絵はブログカード (PortalBlogCard) と同じ全幅の 16:9 の枠に置く (2026-11-16。旧: 題名の上の 48px 角で、
          絵の中身が読めずアイコンにしか見えなかった)。画像は遷移先テーマのサムネイル (640×360 の WebP・全面の絵) */}
      <span
        aria-hidden="true"
        className={`pointer-events-none relative block ${PORTAL_CARD_ASPECT_CLASS} w-full overflow-hidden rounded-sm bg-muted`}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 50vw, 85vw"
          className="object-cover transition-transform duration-200 group-hover:scale-[1.01]"
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
