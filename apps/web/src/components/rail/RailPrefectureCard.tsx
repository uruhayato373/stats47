'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';

import { RailCard } from '@/components/surface';

import { trackNavClick, type NavSurface } from '@/lib/analytics/events';

export interface RailPrefecture {
  prefCode: string;
  prefName: string;
}

interface RailPrefectureCardProps {
  title?: string;
  prefectures: readonly RailPrefecture[];
  moreHref?: string;
  moreLabel?: string;
  trackingSurface?: NavSurface;
  collapsible?: boolean;
}

function safeTrack(label: string, href: string, surface?: NavSurface) {
  if (!surface) return;

  try {
    trackNavClick({ label, href, surface });
  } catch {
    // 計測失敗で遷移を止めない。
  }
}

function PrefectureCardBody({
  prefectures,
  moreHref,
  moreLabel,
  trackingSurface,
}: Pick<
  RailPrefectureCardProps,
  'prefectures' | 'moreHref' | 'moreLabel' | 'trackingSurface'
>) {
  const router = useRouter();

  return (
    <>
      <Select
        onValueChange={(prefCode) => {
          const prefecture = prefectures.find(
            (item) => item.prefCode === prefCode
          );
          const href = `/areas/${prefCode}`;
          safeTrack(
            `area:${prefecture?.prefName ?? prefCode}`,
            href,
            trackingSurface
          );
          router.push(href);
        }}
      >
        <SelectTrigger className="w-full" aria-label="都道府県から探す">
          <SelectValue placeholder="都道府県を選択" />
        </SelectTrigger>
        <SelectContent>
          {prefectures.map((prefecture) => (
            <SelectItem key={prefecture.prefCode} value={prefecture.prefCode}>
              {prefecture.prefName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {moreHref && moreLabel && (
        <Link
          href={moreHref}
          className="mt-3 inline-flex min-h-11 items-center text-xs font-medium text-primary hover:underline sm:min-h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => safeTrack('area:all', moreHref, trackingSurface)}
        >
          {moreLabel}
        </Link>
      )}
    </>
  );
}

/** 都道府県選択を任意のページで再利用できる、独立した右レールカード。 */
export function RailPrefectureCard({
  title = '都道府県から探す',
  prefectures,
  moreHref = '/areas',
  moreLabel = '都道府県一覧を見る →',
  trackingSurface,
  collapsible = false,
}: RailPrefectureCardProps) {
  const body = (
    <PrefectureCardBody
      prefectures={prefectures}
      moreHref={moreHref}
      moreLabel={moreLabel}
      trackingSurface={trackingSurface}
    />
  );

  return (
    <RailCard title={title} aria-label={title} collapsible={collapsible}>
      {body}
    </RailCard>
  );
}
