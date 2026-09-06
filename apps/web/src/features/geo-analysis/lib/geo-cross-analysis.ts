import type {
  GeoAnalysisMetricDefinition,
  GeoAnalysisSnapshot,
  GeoAnalysisValueFormat,
} from '@stats47/gis';
import type { RankingItem, RankingValue } from '@stats47/ranking';

export const GEO_CROSS_ANALYSIS_SLUGS = [
  'population-land-price',
  'population-flood-risk',
  'population-station-access',
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
  'population-land-price': {
    slug: 'population-land-price',
    eyebrow: '人口 × 地価',
    shortTitle: '住宅地点と将来人口',
    description:
      '2026年の住宅地点を1km人口メッシュに接続し、地価上昇と2020→2050年の人口減少が重なる場所を調べます。',
    spatialReading: '住宅地点を含む1kmメッシュの人口変化を確認します。同じ県内の中心部・郊外で、地価と人口変化の組み合わせがどう違うかを探してください。',
    overlapLabel: '住宅地点と人口の重なり',
    overlapLegend: '点の色：赤＝地価上昇×人口減少、青緑＝地価上昇×人口維持・増加、橙＝地価横ばい・下落×人口減少、青＝地価横ばい・下落×人口維持・増加、灰＝未接続または比較対象外。背景は1kmメッシュの人口変化です。',
    mapLimit: '地点は2026年地価公示、人口は2020→2050年推計。住宅地点を含むメッシュ全体の人口であり、地価の将来予測や徒歩圏ではありません。',
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
    spatialReading: '人口の残る場所と、今回の洪水包含判定が重なる場所を確認します。2020年と2050年で同じ浸水条件を使い、区域内人口と区域外人口の変化を比べます。',
    overlapLabel: '浸水包含の判定結果',
    overlapLegend: '赤＝中心点が浸水想定区域に含まれた1kmメッシュ、灰＝今回の入力では含まれなかったメッシュ。色は浸水深ではありません。原典の洪水ポリゴンそのものではなく、人口メッシュへの判定結果です。',
    mapLimit: '1kmメッシュ全体の浸水や個別住宅の安全を示しません。0や灰色も安全を意味せず、住所ごとの確認は最新の自治体ハザードマップを使ってください。',
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
    spatialReading: '駅の位置を固定して、駅800m圏に入るメッシュと外れるメッシュの人口変化を調べます。駅が多いことと、人口の近くに駅があることを分けて読みます。',
    overlapLabel: '駅800m圏との重なり',
    overlapLegend: '緑＝中心点が駅代表点から直線800m以内の1kmメッシュ、灰＝圏外、白い点＝判定に寄与した駅代表点。',
    mapLimit: '道路距離、駅入口、高低差、運行本数や2050年の駅存続を含みません。徒歩圏・交通利便性の総合評価ではありません。',
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
