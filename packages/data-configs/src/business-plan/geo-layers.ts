/** Public single-layer views. Only verified, renderable representations get routes. */
export const GEO_LAYERS = [
  {
    slug: 'population-mesh',
    name: '1kmメッシュの人口',
    kind: 'population',
    dataId: 'mesh1000r6',
    sourceAnalysis: 'population-land-price',
    representation: '人口メッシュ（表示項目を抽出）',
    description: '2020年と2050年の人口を、1kmメッシュごとに確かめます。',
    reading:
      '人口の集まる場所、分布の広がりを確認できます。メッシュをタップすると、2020年と2050年それぞれの人口を読めます。',
    limitation:
      '2050年は推計です。配信対象は基準データに収録された人口メッシュで、空白を人口ゼロと断定できません。建物や住所単位の人口ではありません。',
    related: [
      'population-land-price',
      'population-flood-risk',
      'population-station-access',
    ],
  },
  {
    slug: 'residential-land-price',
    name: '住宅地の地価公示地点',
    kind: 'land-price',
    dataId: 'L01',
    sourceAnalysis: 'population-land-price',
    representation: '地価公示から住宅地を抽出',
    description:
      '2026年の住宅地標準地点と、公示価格・前年からの変動率を見ます。',
    reading:
      '地図の点をタップすると、公示価格（円/㎡）と前年比を確認できます。点のない場所まで価格を補間した地図ではありません。',
    limitation:
      '地価公示の全用途ではなく住宅地が対象です。個々の土地の取引価格や将来価格を示すものではありません。前年比がない地点は「不明」と表示します。',
    related: ['population-land-price'],
  },
  {
    slug: 'station-points',
    name: '駅の代表点',
    kind: 'stations',
    dataId: 'S12',
    sourceAnalysis: 'population-station-access',
    representation: '駅データを重複整理した代表点',
    description:
      '分析用に整理した駅の位置と名称を、人口データを重ねずに確認します。',
    reading:
      '駅の位置と名称を確認できます。白い点をタップすると駅名を表示します。路線や運行頻度を示す地図ではありません。',
    limitation:
      '駅別乗降客数データをもとに、重複整理した駅代表点を表示します。原典の全地物や駅入口ではなく、配信県データに含まれる代表点が対象です。',
    related: ['population-station-access'],
  },
] as const;

export type GeoLayer = (typeof GEO_LAYERS)[number];
export type GeoLayerSlug = GeoLayer['slug'];
export function findGeoLayer(slug: string): GeoLayer | undefined {
  return GEO_LAYERS.find((layer) => layer.slug === slug);
}
