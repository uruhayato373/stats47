import { GEO_MAP_PATH, GeoMapPage, resolveGeoMapSelection } from '@/features/geo-map';

import type { Metadata } from 'next';

// 主題と範囲は URL のクエリで決まり、データは R2 を実行時に読むので静的化しない (nextjs-ssg-preservation.md)
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ base?: string | string[]; subjects?: string | string[]; scope?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const selection = resolveGeoMapSelection(await searchParams);
  return {
    title: `地図を重ねて見る（${selection.scope.name}）`,
    description:
      '市区町村の人口や製造品出荷額を背景に塗り分け、高速道路・鉄道・空港などの交通網を重ねて、年を動かして見比べられます。全国・地方・都道府県の範囲で表示します。',
    alternates: { canonical: GEO_MAP_PATH },
    // 主題・範囲の組み合わせごとのページは検索に出さない (GEO-OVERLAY-URL-01。canonical は素の /geo/map)
    ...(selection.hasQuery ? { robots: 'noindex, follow' } : {}),
  };
}

export default async function GeoMapRoutePage({ searchParams }: Props) {
  return <GeoMapPage selection={resolveGeoMapSelection(await searchParams)} />;
}
