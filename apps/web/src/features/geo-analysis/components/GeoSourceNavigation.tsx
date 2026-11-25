import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';

import Link from '@/components/atoms/SiteLink';
import { RailCard } from '@/components/surface';

import { getGeoSourceNavigation } from '../lib/geo-source-navigation';

import { GeoSourceNavigationList } from './GeoSourceNavigationList';

import type { GeoSourceCatalog } from '../lib/geo-source-catalog';

type Props = {
  catalog: GeoSourceCatalog | null;
  currentDataId?: string;
  mobile?: boolean;
};

/** 一覧の後に置く関連ページ。行はテンプレートの SidebarMenu で描く。 */
const RELATED_LINKS = [
  { href: '/geo/layers', label: 'GISを検索・比較する' },
  { href: '/geo', label: '重ね合わせた地域分析を見る' },
] as const;

/** 一覧の置き場所 (レールのカード) の id。モバイルの先頭の入口はここへ飛ぶ。 */
export const GEO_SOURCE_NAVIGATION_ID = 'geo-source-navigation';

/**
 * 一覧の本体は右レールのカード 1 つだけを描く (モバイルでは PageShell が本文の下へ置く)。
 * 以前はモバイル先頭の開閉と右レールの両方が同じ 50 件を描き、同じリンクが HTML に 2 回出て
 * ページ品質の duplicate_link_ratio が error になっていた (2026-11-20 の監査で /geo/datasets/* 50 件)。
 * `mobile` は本文の先頭に置く、一覧への入口 (ページ内リンク) だけを描く。
 */
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
      <SidebarMenu className="-mx-2 mt-4">
        {RELATED_LINKS.map((link) => (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuSubButton
              className="h-auto min-h-11 translate-x-0 text-primary underline xl:min-h-8"
              render={<Link href={link.href} />}
            >
              <span>{link.label}</span>
            </SidebarMenuSubButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
  if (mobile) {
    return (
      <p className="mb-3 rail:hidden">
        <a
          href={`#${GEO_SOURCE_NAVIGATION_ID}`}
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          {title}へ移動する
        </a>
      </p>
    );
  }
  return (
    <div id={GEO_SOURCE_NAVIGATION_ID}>
      <RailCard title={title}>{body}</RailCard>
    </div>
  );
}
