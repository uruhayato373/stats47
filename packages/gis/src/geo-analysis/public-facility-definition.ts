import type { GeoAnalysisSnapshot } from './snapshot';
export const PUBLIC_FACILITY_DEFINITION = {
  schemaVersion: 1,
  slug: 'population-public-facility-access',
  dataVersion: 'P05-22_population2020-2050_mesh1000r6-24',
  geography: 'prefecture',
  title: '行政施設・公的集会施設までの距離と地域人口',
  question:
    '市町村役場等と公的集会施設への距離帯ごとに、2020年人口と2050年推計人口はどのように分布するか',
  primaryMetricKey: 'administrativeWithin1000mShare2020',
  metrics: [
    {
      key: 'administrativeWithin1000mShare2020',
      label: '2020年行政施設1km以内人口比率',
      unit: '%',
      format: 'percent1',
      description:
        '2022年施設の最寄り点から1km以内に中心がある1kmメッシュの2020年人口割合。県外最寄りも含む。',
    },
    {
      key: 'administrativeWithin1000mShare2050',
      label: '2050年行政施設1km以内人口比率',
      unit: '%',
      format: 'percent1',
      description:
        '2022年施設の最寄り点から1km以内に中心がある1kmメッシュの2050年推計人口割合。県外最寄りも含む。',
    },
    {
      key: 'meetingWithin1000mShare2020',
      label: '2020年公的集会施設1km以内人口比率',
      unit: '%',
      format: 'percent1',
      description:
        '2022年施設の最寄り点から1km以内に中心がある1kmメッシュの2020年人口割合。県外最寄りも含む。',
    },
    {
      key: 'meetingWithin1000mShare2050',
      label: '2050年公的集会施設1km以内人口比率',
      unit: '%',
      format: 'percent1',
      description:
        '2022年施設の最寄り点から1km以内に中心がある1kmメッシュの2050年推計人口割合。県外最寄りも含む。',
    },
    {
      key: 'population2020',
      label: '2020年人口',
      unit: '人',
      format: 'integer',
      description: '国土数値情報R6推計人口メッシュの県内合計',
    },
    {
      key: 'population2050',
      label: '2050年人口（推計）',
      unit: '人',
      format: 'integer',
      description: '国土数値情報R6推計人口メッシュの県内合計',
    },
  ],
  method: [
    '全47県のP05-22施設から行政施設群（1〜3）と公的集会施設群（4〜5）を作成',
    '1kmメッシュ中心の最近隣施設を全国で探索し大円距離を計算',
    '5距離帯を各群で排他的に割り当て人口2020/2050を合計',
    '最終値は未丸めで保存。表示時のみ丸め、全国割合は人口合計から計算',
  ],
  sources: [
    {
      name: '国土数値情報 市町村役場等・公的集会施設',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P05-v3_0.html',
      datasetId: 'P05',
      version: '22',
      license: 'PDL1.0（2026-03-23 KSJ利用規約・当該版はオープンデータ）',
    },
    {
      name: '国土数値情報 1kmメッシュ別将来推計人口',
      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html',
      datasetId: 'mesh1000r6',
      version: '24',
      license: 'CC BY 4.0',
    },
  ],
  caveats: [
    '距離は1kmメッシュ中心と原典施設地点の大円距離。各住居の距離ではなく、500m区分は粗い近似。',
    '施設位置は2022年4月固定。人口2020基準と2050推計は異なる年。将来施設の閉鎖・新設は予測しない。',
    '全国の施設を検索して県外最寄りも含む。居住自治体の行政窓口の利用資格・受付業務・開館時間・バリアフリーは判定しない。',
    '役場・支所・行政サービス施設と、公民館・公的集会施設を別々に分類。両群の人口を合算しない。',
    '全47県人口原典TopoJSONを独立取得しSHA・bytes・人口・コード復元座標を照合済み。簡略化形状の退化は使わずMESH_IDから正規格子を復元。',
  ],
} as const satisfies Omit<
  GeoAnalysisSnapshot,
  'generatedAt' | 'rows' | 'summary' | 'dataQuality'
>;
