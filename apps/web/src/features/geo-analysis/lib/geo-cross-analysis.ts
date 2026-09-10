import type {
  GeoAnalysisMetricDefinition,
  GeoAnalysisSnapshot,
  GeoAnalysisValueFormat,
} from '@stats47/gis';
import type { RankingItem, RankingValue } from '@stats47/ranking';

export const GEO_CROSS_ANALYSIS_SLUGS = [
  'population-landslide-exposure',
  'population-snow-designation',
  'population-land-price',
  'population-flood-risk',
  'population-station-access',
  'population-public-facility-access',
] as const;

export type GeoCrossAnalysisSlug = (typeof GEO_CROSS_ANALYSIS_SLUGS)[number];

export interface GeoCrossAnalysisConfig {
  readonly slug: GeoCrossAnalysisSlug;
  readonly eyebrow: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly mapTitle: string;
  readonly mapSubtitle: string;
  readonly takeaways: readonly string[];
  readonly spatialReading: string;
  readonly overlapLabel: string;
  readonly overlapLegend: string;
  readonly mapLimit: string;
  readonly hazardMapUrl?: string;
}

export const GEO_CROSS_ANALYSIS_CONFIGS: Readonly<
  Record<GeoCrossAnalysisSlug, GeoCrossAnalysisConfig>
> = {
  'population-landslide-exposure': {
    slug: 'population-landslide-exposure', eyebrow: '土砂災害指定区域 × 人口・公共施設', shortTitle: '土砂災害指定区域と人口・公共施設',
    description: '2025年度版の指定区域面に2020年の250m人口メッシュと2022年の公共施設を重ねます。対象は京都府を除く46県です。',
    spatialReading: '人口分布、公共施設、指定区域との重なり、元の分母へ戻るかの検算を確認します。',
    overlapLabel: '指定区域との重なり', overlapLegend: '青＝警戒区域のみ、紫＝特別警戒区域、灰＝今回の入力面外。特別警戒面が警戒面に包含されるとは仮定しません。',
    mapLimit: '人口は250m格子の中心包含による近似です。区域の更新日は県により異なります。個別住宅や現在の避難先の安全判定には使えません。',
    mapTitle: '指定区域内に中心がある人口の割合', mapSubtitle: '2020年基準人口を分母に計算。京都府は利用制限により対象外です。',
    takeaways: ['人口と2つの施設群は、それぞれ別の分母で読みます。', '現象別の区域には重複があるため合算しません。', '県境を越える区域との包含も調べ、人口と施設の元の市区町村帰属を保ちます。'],
    hazardMapUrl: 'https://disaportal.gsi.go.jp/',
  },
  'population-snow-designation': {
    slug: 'population-snow-designation', eyebrow: '豪雪指定区域 × 人口', shortTitle: '豪雪指定区域と人口',
    description: '2016年度の豪雪指定区域に2020年基準人口の250mメッシュ中心を重ね、区域内と判定した人口と面積を確認します。',
    spatialReading: '2020年人口の分布、通常・特別豪雪区域との中心包含、境界にかかる格子と保存則を確認します。',
    overlapLabel: '豪雪指定区域との重なり', overlapLegend: '青＝通常の豪雪指定区域、紫＝特別豪雪区域、灰＝中心が今回の入力区域外。輪郭は表示用に20m簡略化した指定区域で、判定には未簡略化の原典を使用しています。',
    mapLimit: '2016年度指定境界と2020年の調整済み基準人口を使用しています。現在の法指定人口、個別住宅の指定や安全を判定するものではありません。',
    mapTitle: '豪雪指定区域に中心があるメッシュの人口割合', mapSubtitle: '2020年基準人口を分母とし、特別豪雪を内数として示します。',
    takeaways: ['人口の3区分は同じ分母を排他的に分けています。', '250m格子の中心包含と全体包含・一部交差の差を確認できます。', '指定の版と人口年が異なるため、現在の公式指定人口とは一致しません。'],
  },
  'population-public-facility-access': {
    slug: 'population-public-facility-access',
    eyebrow: '人口 × 公共施設',
    shortTitle: '公共施設への距離と人口',
    description:
      '2022年4月の行政施設・公的集会施設を固定し、1km人口メッシュ中心から最寄り施設への距離帯ごとに人口を比較します。',
    spatialReading:
      '人口、県内の原典施設、最寄り距離帯、保存則の順に確認します。県外の最寄り施設も探索対象です。',
    overlapLabel: '最寄り施設への距離帯',
    overlapLegend:
      'メッシュの色は中心点から最寄り施設への距離帯です。点は判定で参照された施設で、県外の施設を含みます。',
    mapLimit:
      '1kmメッシュ中心の大円距離で、500m帯は粗い近似です。道路距離・徒歩時間・窓口の利用資格・開館時間・将来の施設存続は示しません。',
    mapTitle: '公共施設への距離帯別人口',
    mapSubtitle: '2020年人口と2050年推計人口を同じ施設位置で比較します。',
    takeaways: [
      '行政施設と公的集会施設を別々に読みます。両群は同じ人口を分類するため合算しません。',
      '全国の比率は47県の人口合計を分母に計算します。県比率の単純平均ではありません。',
      '県外の最寄り施設も含みます。実際の利用先は窓口の担当範囲と現在の施設情報を確認してください。',
    ],
  },
  'population-land-price': {
    slug: 'population-land-price',
    eyebrow: '人口 × 地価',
    shortTitle: '住宅地点と将来人口',
    description:
      '2026年の住宅地点を1km人口メッシュに接続し、地価上昇と2020→2050年の人口減少が重なる場所を調べます。',
    spatialReading:
      '住宅地点を含む1kmメッシュの人口変化を確認します。同じ県内の中心部・郊外で、地価と人口変化の組み合わせがどう違うかを探してください。',
    overlapLabel: '住宅地点と人口の重なり',
    overlapLegend:
      '点の色：赤＝地価上昇×人口減少、青緑＝地価上昇×人口維持・増加、橙＝地価横ばい・下落×人口減少、青＝地価横ばい・下落×人口維持・増加、灰＝未接続または比較対象外。背景は1kmメッシュの人口変化です。',
    mapLimit:
      '地点は2026年地価公示、人口は2020→2050年推計。住宅地点を含むメッシュ全体の人口であり、地価の将来予測や徒歩圏ではありません。',
    mapTitle: '県別集計：地価上昇 × 人口減少の地点比率',
    mapSubtitle:
      '分母は人口メッシュへ接続でき、人口増減と地価前年比を比較できる住宅地点。人口比率ではありません。',
    takeaways: [
      '同じ県でも住宅地点の周囲で将来人口の動きが異なり、県の平均的な変化だけでは読み取れない組み合わせを確認できます。',
      '地価の直近1年と人口の30年間を照合した分析です。地価が今後下落するという予測や、割安・割高の判定には使えません。',
      '気になる地点は公示価格の原票・用途地域・現地条件を確認し、地域の検討候補を絞る材料にしてください。',
    ],
  },
  'population-flood-risk': {
    slug: 'population-flood-risk',
    eyebrow: '人口 × 洪水',
    shortTitle: '人口と洪水浸水想定',
    spatialReading:
      '人口の残る場所と、今回の洪水包含判定が重なる場所を確認します。2020年と2050年で同じ浸水条件を使い、区域内人口と区域外人口の変化を比べます。',
    overlapLabel: '浸水包含の判定結果',
    overlapLegend:
      '赤＝中心点が浸水想定区域に含まれた1kmメッシュ、灰＝今回の入力では含まれなかったメッシュ。色は浸水深ではありません。原典の洪水ポリゴンそのものではなく、人口メッシュへの判定結果です。',
    mapLimit:
      '1kmメッシュ全体の浸水や個別住宅の安全を示しません。0や灰色も安全を意味せず、住所ごとの確認は最新の自治体ハザードマップを使ってください。',
    description:
      '想定最大規模の洪水浸水想定区域と1km将来人口メッシュを空間結合し、区域内と判定された人口の比率を都道府県別に比較します。',
    mapTitle: '2050年 浸水想定区域人口比率',
    mapSubtitle:
      '1kmメッシュ中心点が想定最大規模の区域内にあるかで判定した推計です。個別地点の安全判定には使えません。',
    takeaways: [
      '比率はハザードの広さだけでなく、2050年の人口がどこに残るかにも左右されます。',
      '1kmメッシュ中心点による近似なので、区域と一部だけ重なるメッシュは精密に表せません。',
      '0%は安全を意味しません。河川管理者の提供範囲外や、洪水以外の災害は別に確認が必要です。',
    ],
    hazardMapUrl: 'https://disaportal.gsi.go.jp/',
  },
  'population-station-access': {
    slug: 'population-station-access',
    eyebrow: '人口 × 駅',
    shortTitle: '人口と駅アクセス',
    spatialReading:
      '駅の位置を固定して、駅800m圏に入るメッシュと外れるメッシュの人口変化を調べます。駅が多いことと、人口の近くに駅があることを分けて読みます。',
    overlapLabel: '駅800m圏との重なり',
    overlapLegend:
      '緑＝中心点が駅代表点から直線800m以内の1kmメッシュ、灰＝圏外、白い点＝判定に寄与した駅代表点。',
    mapLimit:
      '道路距離、駅入口、高低差、運行本数や2050年の駅存続を含みません。徒歩圏・交通利便性の総合評価ではありません。',
    description:
      '全国の駅を重複整理し、駅代表点から直線800m以内に中心がある1km人口メッシュを都道府県別に集計します。',
    mapTitle: '2050年 駅800m圏人口比率',
    mapSubtitle:
      '現在の駅位置を固定し、2050年人口のうち駅代表点から直線800m以内と判定した比率です。',
    takeaways: [
      '駅の数ではなく、駅の近くと判定されたメッシュにどれだけ人口が分布するかを見ています。',
      '2020年と2050年を同じ駅位置・同じ800m条件で比べ、人口分布の変化を読みます。',
      '直線距離と1kmメッシュ中心点による近似で、実際の徒歩経路や高低差は含みません。',
    ],
  },
};

export function isGeoCrossAnalysisSlug(
  value: string
): value is GeoCrossAnalysisSlug {
  return GEO_CROSS_ANALYSIS_SLUGS.some((slug) => slug === value);
}

export function formatGeoValue(
  metric: Pick<GeoAnalysisMetricDefinition, 'format' | 'unit'>,
  value: number | null | undefined
): string {
  if (value === null || value === undefined) return '—';
  const digits = metric.format === 'integer' ? 0 : 1;
  const formatted = value.toLocaleString('ja-JP', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const sign = metric.format === 'signedPercent1' && value > 0 ? '+' : '';
  return `${sign}${formatted}${metric.unit}`;
}

function colorSchemeFor(
  slug: string
): NonNullable<RankingItem['visualization']>['colorScheme'] {
  if (slug === 'population-flood-risk') return 'interpolateReds';
  if (slug === 'population-land-price') return 'interpolateOranges';
  return 'interpolateBlues';
}

export function buildGeoMapModel(snapshot: GeoAnalysisSnapshot): {
  rankingItem: RankingItem;
  rankingValues: RankingValue[];
} {
  const metric = snapshot.metrics.find(
    (item) => item.key === snapshot.primaryMetricKey
  );
  if (!metric) throw new Error(`${snapshot.slug}: primary metric がありません`);

  const rankingKey = `geo-${snapshot.slug}-${snapshot.primaryMetricKey}`;
  return {
    rankingItem: {
      rankingKey,
      areaType: 'prefecture',
      rankingName: metric.label,
      title: metric.label,
      unit: metric.unit,
      isActive: false,
      dataSourceId: `geo-analysis:${snapshot.slug}`,
      source: snapshot.sources[0]
        ? { name: snapshot.sources[0].name, url: snapshot.sources[0].url }
        : undefined,
      hook: snapshot.question,
      valueDisplay: {
        decimalPlaces: metric.format === 'integer' ? 0 : 1,
        displayUnit: metric.unit,
      },
      visualization: {
        colorScheme: colorSchemeFor(snapshot.slug),
        colorSchemeType: 'sequential',
        minValueType: 'zero',
      },
      createdAt: snapshot.generatedAt,
      updatedAt: snapshot.generatedAt,
    },
    rankingValues: snapshot.rows.map((row) => ({
      metricKey: rankingKey,
      areaType: 'prefecture',
      areaCode: row.areaCode,
      areaName: row.areaName,
      yearCode: snapshot.dataVersion,
      yearName: snapshot.dataVersion,
      value: row.values[snapshot.primaryMetricKey] ?? null,
      unit: metric.unit,
      rank: row.rank,
    })),
  };
}

export type { GeoAnalysisSnapshot, GeoAnalysisValueFormat };
