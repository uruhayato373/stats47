import Link from 'next/link';

import { ContentDisclosure } from '@/components/content';
import { RailCard } from '@/components/surface';

import { getGeoSourceNavigation } from '../lib/geo-source-navigation';

import { GeoSourceNavigationList } from './GeoSourceNavigationList';

import type { GeoSourceCatalog } from '../lib/geo-source-catalog';

type Props = {
  catalog: GeoSourceCatalog | null;
  currentDataId?: string;
  mobile?: boolean;
};

/** Same complete list in the desktop rail and the mobile top disclosure. */
export function GeoSourceNavigation({
  catalog,
  currentDataId,
  mobile = false,
}: Props) {
  const groups = getGeoSourceNavigation(catalog);
  const items = groups.flatMap((group) => group.items);
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const title = `GIS一覧（${items.length}種類）`;
  const body = (
    <nav aria-label="GIS一覧">
      <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
        {catalog
          ? `地図あり ${readyCount}種類${items.length > readyCount ? `・準備中 ${items.length - readyCount}種類` : ''}`
          : '地図の準備状況を取得できませんでした。データ名から個別ページへ進めます。'}
      </p>
      <GeoSourceNavigationList groups={groups} currentDataId={currentDataId} />
      <Link
        href="/geo/layers"
        className="mt-4 flex min-h-11 items-center text-sm text-primary underline"
      >
        GISを検索・比較する
      </Link>
      <Link
        href="/geo"
        className="flex min-h-11 items-center text-sm text-primary underline"
      >
        重ね合わせた地域分析を見る
      </Link>
    </nav>
  );
  if (mobile) {
    return (
      <ContentDisclosure title={title} className="mb-3 xl:hidden">
        {body}
      </ContentDisclosure>
    );
  }
  // PageShell also places its rail below the article on mobile; use the top disclosure there.
  return (
    <div className="hidden xl:block">
      <RailCard title={title}>{body}</RailCard>
    </div>
  );
}
