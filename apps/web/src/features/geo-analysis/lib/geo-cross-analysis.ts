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
  readonly hazardMapUrl?: string;
}

export const GEO_CROSS_ANALYSIS_CONFIGS: Readonly<
  Record<GeoCrossAnalysisSlug, GeoCrossAnalysisConfig>
> = {
  'population-land-price': {
    slug: 'population-land-price',
    eyebrow: '人口 × 地価',
    shortTitle: '人口と住宅地価',
    description:
      '2026年の住宅地地価公示と1km将来人口メッシュを都道府県別に集計し、現在の価格水準と2050年人口変化を並べて読みます。',
    mapTitle: '2026年 住宅地の地価中央値',
    mapSubtitle:
      '用途区分「住宅地」の標準地点を都道府県別に集計した中央値です。県を選ぶと人口変化も比較できます。',
    takeaways: [
      '地図は2026年の価格水準を示し、2050年の将来価格を予測するものではありません。',
      '人口増減率と地価変動率を同じ表で確認できますが、相関だけで因果関係は判断できません。',
      '県ごとの標準地点数を併記し、地点の構成差を隠さない設計にしています。',
    ],
  },
  'population-flood-risk': {
    slug: 'population-flood-risk',
    eyebrow: '人口 × 洪水',
    shortTitle: '人口と洪水浸水想定',
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
