'use client';

import { ChevronRight } from 'lucide-react';

import {
  PORTAL_CARD_ASPECT_CLASS,
  SurfaceLinkCard,
} from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

interface PortalAreaEntryProps {
  mapSvg: string;
}

/**
 * 「都道府県から探す」= `/areas` への地理的な入口。
 *
 * TopoJSON SSOTからserver生成した全国地図を受け取り、home側では静的SVGとして軽量表示する。
 * 県別リンク・検索・詳細な地図操作は `/areas` が担い、このカード全体は単一linkを維持する。
 */
export function PortalAreaEntry({ mapSvg }: PortalAreaEntryProps) {
  return (
    <SurfaceLinkCard
      href="/areas"
      aria-label="都道府県から探す。47都道府県の地図と一覧を見る"
      onClick={() => {
        try {
          trackNavClick({
            label: '都道府県から探す',
            href: '/areas',
            surface: 'home_area',
          });
        } catch {
          // analytics 失敗で遷移を止めない
        }
      }}
      className={`${PORTAL_CARD_ASPECT_CLASS} group flex flex-col overflow-hidden p-3`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-semibold text-foreground group-hover:text-primary">
            地図から都道府県を選ぶ
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            47都道府県の順位・強み・暮らしの統計へ
          </span>
        </span>
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </span>
      <span
        aria-hidden="true"
        className="mt-1 min-h-0 flex-1 transition-transform duration-200 group-hover:scale-[1.02] [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: mapSvg }}
      />
    </SurfaceLinkCard>
  );
}
