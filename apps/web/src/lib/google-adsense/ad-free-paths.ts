import 'server-only';

import { INFRA_NETWORKS, isInfraNetworkAdFree } from '@stats47/gis/infra-history';
import { GIS_DATASETS, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj/catalog';

/**
 * 広告 (AdSense の script) を出さないページの接頭辞。GIS 台帳の利用条件から導き、URL を手で列挙しない。
 *
 * - 交通網の変遷: 使い方 (時系列) の利用条件が非商用の路線網 (`isInfraNetworkAdFree`)
 * - 単体 GIS ページ: 原典の利用条件で、出典表示だけで商用利用できるとは言えないデータ
 *   (非商用・一部制限)。公開の可否は別のゲートが決め、ここは公開されたときに広告を出さないことだけを決める
 */
export const AD_FREE_PATH_PREFIXES: readonly string[] = [
  // 重ね合わせ画面は、クエリで非商用の主題 (高速道路・鉄道の時系列) を足せるので、パスの判定では止められない。
  // 常に広告なしにする (GEO-OVERLAY-URL-01 の決定)
  '/geo/map',
  ...INFRA_NETWORKS.filter(isInfraNetworkAdFree).map((network) => `/geo/history/${network.key}`),
  ...GIS_DATASETS.filter(
    (dataset) => getKsjLicensePolicy(dataset.license).commercialUse !== 'allowed-with-attribution',
  ).map((dataset) => `/geo/datasets/${dataset.dataId}`),
];
