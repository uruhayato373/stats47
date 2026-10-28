import { fetchPrefectures } from '@stats47/area';
import { hrefFor } from '@stats47/data-configs/content/href';

import Link from '@/components/atoms/SiteLink';
import { SectionHeader } from '@/components/section';

import { navSurfaceProps } from '@/lib/analytics/events';

interface Props {
  rankingKey: string;
  title: string;
  /** 表示中の県 (リンクにせず現在地として示す)。全国版では渡さない */
  currentPrefectureCode?: string;
}

/**
 * 同じ指標の「県名×市区町村ランキング」47 県への導線 (MUNI-PREF-RANKING-ROUTE-01)。
 * 全国版と県別ページの両方に置き、県別ページ同士も相互にリンクする。
 * クリックは共通のクリック監視が nav_click (surface=municipality_prefecture) で数える。
 */
export function MunicipalityPrefectureLinks({ rankingKey, title, currentPrefectureCode }: Props) {
  return (
    <nav aria-label={title} className="mt-8" {...navSurfaceProps('municipality_prefecture')}>
      <SectionHeader title={title} hideRule className="mb-2" />
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {fetchPrefectures().map((prefecture) => (
          <li key={prefecture.prefCode}>
            {prefecture.prefCode === currentPrefectureCode ? (
              <span aria-current="page" className="font-semibold text-foreground">
                {prefecture.prefName}
              </span>
            ) : (
              <Link
                href={hrefFor('municipality-pref-ranking', {
                  rankingKey,
                  prefCode: prefecture.prefCode,
                })}
                className="text-primary hover:underline"
              >
                {prefecture.prefName}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
