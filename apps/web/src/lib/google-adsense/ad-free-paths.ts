import 'server-only';

import { hrefFor } from '@stats47/data-configs/content/href';
import { INFRA_NETWORKS, isInfraNetworkAdFree } from '@stats47/gis/infra-history';
import { GIS_DATASETS, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj/catalog';

/**
 * 広告 (AdSense の script) を出さないページの接頭辞。GIS 台帳の利用条件から導き、URL を手で列挙しない。
 *
 * - 交通網の変遷: 使い方 (時系列) の利用条件が非商用の路線網 (`isInfraNetworkAdFree`)
 * - 単体 GIS ページ: 原典の利用条件で、出典表示だけで商用利用できるとは言えないデータ
 *   (非商用・一部制限)。公開の可否は別のゲートが決め、ここは公開されたときに広告を出さないことだけを決める
 * - テーマのページ: 非商用の時系列 (高速道路 N06) の地図を節として埋め込むテーマ。
 *   節とテーマの対応 (features/theme-dashboard/config/all-themes.ts) との一致は
 *   theme-dashboard の ad-free-theme-sections.test.ts が検査する
 */

/** 非商用の時系列の地図 (高速道路網の変遷の節 `highway`) を埋め込むテーマ。県のページを持たないテーマに限る */
export const AD_FREE_THEME_KEYS: readonly string[] = ['roads'];

export const AD_FREE_PATH_PREFIXES: readonly string[] = [
  // 重ね合わせ画面は、クエリで非商用の主題 (高速道路・鉄道の時系列) を足せるので、パスの判定では止められない。
  // 常に広告なしにする (GEO-OVERLAY-URL-01 の決定)
  '/geo/map',
  ...INFRA_NETWORKS.filter(isInfraNetworkAdFree).map((network) => `/geo/history/${network.key}`),
  ...AD_FREE_THEME_KEYS.map((themeKey) => hrefFor('theme', { themeSlug: themeKey })),
  // 単体 GIS ページが存在するデータ (public-r2-eligible。/geo/datasets/[dataId] の notFound と同じ条件) だけを載せる。
  // この一覧は全ページの RSC データに入るので、存在しないページを載せると Googlebot がそこから URL を拾い、
  // GSC の 404 に 22 件が並んでいた (2026-11-23・GSC-404-VALUE-TRIAGE-01)
  ...GIS_DATASETS.filter((dataset) => {
    const policy = getKsjLicensePolicy(dataset.license);
    return policy.sourcePublication === 'public-r2-eligible' && policy.commercialUse !== 'allowed-with-attribution';
  }).map((dataset) => `/geo/datasets/${dataset.dataId}`),
];
