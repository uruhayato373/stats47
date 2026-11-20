import { fetchPrefectures } from '@stats47/area';
import { hrefFor } from '@stats47/data-configs/content/href';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';

import { AdRow, composeAdRows } from '@/features/ads';
import { PrefectureNavigator } from '@/features/area-profile';

import { CONTENT_FOOTER } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';
import { formatOgpTitle } from '@/lib/metadata/site-title';

import { DEFAULT_OGP_IMAGE_PATH, SITE_ORIGIN } from '@/config/site';

import type { Metadata } from 'next';

const title = '都道府県から統計を見る';
const description =
  '47都道府県の全国順位、地域の強み・弱み、人口・産業・暮らしの統計を確認できます。都道府県名の検索・地方別の一覧・タイル地図から、目的の県のプロフィールへ移動できます。';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/areas',
  },
  ...generateOGMetadata({ title: formatOgpTitle(title), description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
};

export default async function AreasPage() {
  const prefectures = fetchPrefectures();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || SITE_ORIGIN;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '都道府県一覧',
    url: `${baseUrl}/areas`,
    itemListElement: prefectures.map((pref, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: pref.prefName,
      url: `${baseUrl}${hrefFor('area', { areaCode: pref.prefCode })}`,
    })),
  };

  // 広告の段: ページの最後に AdSense 1 つを本文の幅いっぱい (上限 580px) に出す (2026-11-12 オーナー決定でアフィリエイトを止め、PR を外した)
  const [indexRow] = composeAdRows([['adsense']], [CONTENT_FOOTER], []);
  return (
    // 地方の切り替え (ページ内ナビ) は 2026-11-20 に外した。一覧は地方ごとに分かれ、地図が地方を色で示す
    <PageShell
        header={
          <>
            <Breadcrumbs
              items={[{ label: 'ホーム', href: '/' }, { label: '都道府県' }]}
            />
            <PageHeader
              eyebrow="エリア"
              title="都道府県から統計を見る"
              description="47都道府県の全国順位、地域の強み・弱み、人口・産業・暮らしの統計を確認できます。"
              stats="47 都道府県 ・ 並び順: 地方ごと、地方の中は都道府県コードの順 (北から)"
            />
          </>
        }
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <PrefectureNavigator
          prefectures={prefectures}
          variant="full"
          surface="areas"
          heading="都道府県を選ぶ"
          className="mt-2"
        />

        {/* 一覧面の共通フッター枠。広告は本文カラム幅へ収まり、カテゴリ・テーマ面と揃う */}
        {indexRow.length > 0 && <AdRow cells={indexRow} position="areas-index-row" trackingCategory="areas-index" wide />}
      </PageShell>
  );
}
