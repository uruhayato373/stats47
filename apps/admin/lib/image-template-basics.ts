import type { Template } from '../../../.claude/scripts/media/lib/workspace.mjs';
import { taxonomyQuery } from '../../../.claude/scripts/media/lib/taxonomy.mjs';
import type { MetricPresentation } from '@stats47/types';

/** Basic forms are chosen from the type catalogue, never from article/image inventory. */
const PURPOSE_TYPES: Record<string, string[]> = {
  ranking: ['bar', 'table', 'tile-map'],
  comparison: ['bar', 'table', 'radar', 'waterfall'],
  trend: ['line', 'tile-map'],
  composition: ['stacked-bar', 'pie', 'table'],
  relationship: ['scatter', 'sankey'],
  distribution: ['choropleth', 'tile-map', 'boxplot', 'heatmap'],
  explanation: ['diagram', 'summary-card'],
  navigation: ['link-card', 'cta-card'],
  reference: ['source-card'],
};
export interface StatisticalSample {
  id: string;
  templateId: string;
  purpose: string;
  statistic: string;
  label?: string;
  topic?: string;
  imageId?: string;
  renderer?: 'ranking-bars' | 'ranking-table' | 'ranking-tile-map' | 'trend-line' | 'composition-stacked';
  referenceImages?: { imageId: string; label: string }[];
}
/** A small curated sample per form, not a menu of every article using the form. */
export const STATISTICAL_SAMPLES: StatisticalSample[] = [
  {
    id: 'household-nagoya',
    templateId: 'bar',
    purpose: 'comparison',
    statistic: '家計支出の10分類（2024年）',
    label: '名古屋市',
    topic: 'a-kakei-aichi',
  },
  {
    id: 'household-aomori',
    templateId: 'bar',
    purpose: 'comparison',
    statistic: '家計支出の10分類（2024年）',
    label: '青森市',
    topic: 'a-kakei-aomori',
  },
  {
    id: 'household-sapporo',
    templateId: 'bar',
    purpose: 'comparison',
    statistic: '家計支出の10分類（2024年）',
    label: '札幌市',
    topic: 'a-kakei-hokkaido',
  },
  {
    id: 'maximum-temperature-bars',
    templateId: 'bar',
    purpose: 'ranking',
    statistic: '都道府県別の最高気温（2024年）',
    imageId: 'IMG-37a9dcaff111583e70fc2cf7',
    renderer: 'ranking-bars',
    referenceImages: [
      { imageId: 'IMG-37a9dcaff111583e70fc2cf7', label: 'note：最高気温（公開済み）' },
      { imageId: 'IMG-0c14873010e41a46fd627e96', label: 'Instagram：副業者の割合（公開済み）' },
    ],
  },
  {
    id: 'maximum-temperature-table',
    templateId: 'table',
    purpose: 'ranking',
    statistic: '都道府県別の最高気温（2024年）',
    renderer: 'ranking-table',
  },
  {
    id: 'food-champions',
    templateId: 'table',
    purpose: 'ranking',
    statistic: '食品の品目別支出が多い地域',
    imageId: 'IMG-72112e48fd6bc78ba01582ce',
  },
  {
    id: 'tokyo-osaka',
    templateId: 'table',
    purpose: 'comparison',
    statistic: '東京都と大阪府の指標比較',
    imageId: 'IMG-c9dcca78991487bb8046b5dc',
  },
  {
    id: 'household-breakdown',
    templateId: 'table',
    purpose: 'composition',
    statistic: '家計支出の費目別内訳',
    label: '兵庫県',
    imageId: 'IMG-d1311cce6fa69e3d1c662ac4',
  },
  {
    id: 'engel-trend',
    templateId: 'line',
    purpose: 'trend',
    statistic: 'エンゲル係数の推移（2007〜2024年）',
    label: '名古屋市',
    renderer: 'trend-line',
    referenceImages: [{ imageId: 'IMG-d28cb325765185d2707d5a1b', label: 'note：全国の推移（公開済み）' }],
  },
  {
    id: 'temperature-kerosene',
    templateId: 'scatter',
    purpose: 'relationship',
    statistic: '平均気温と灯油購入数量',
    imageId: 'IMG-53b2df4d3e2fb0581af64f02',
  },
  {
    id: 'liquor-breakdown',
    templateId: 'stacked-bar',
    purpose: 'composition',
    statistic: '酒類の品目別販売内訳',
    imageId: 'IMG-50aa9b2aa27814e64e4e2227',
    renderer: 'composition-stacked',
    referenceImages: [{ imageId: 'IMG-50aa9b2aa27814e64e4e2227', label: 'サイト：酒類の販売数量構成比（公開済み）' }],
  },
  {
    id: 'maximum-temperature-distribution',
    templateId: 'boxplot',
    purpose: 'distribution',
    statistic: '都道府県別の最高気温（2024年）',
    imageId: 'IMG-ec111f9fb7067e3d8c9628c1',
  },
  {
    id: 'maximum-temperature-map',
    templateId: 'choropleth',
    purpose: 'distribution',
    statistic: '都道府県別の最高気温（2024年）',
    imageId: 'IMG-b853d348f90285971268e44e',
  },
  {
    id: 'maximum-temperature-tile-map',
    templateId: 'tile-map',
    purpose: 'ranking',
    statistic: '都道府県別の最高気温（2024年）',
    renderer: 'ranking-tile-map',
    referenceImages: [
      { imageId: 'IMG-13e4c802056bd58faa30fc45', label: 'note：住居費割合（公開済み）' },
      { imageId: 'IMG-00f8e848935569c9b086c2c1', label: 'Instagram：焼酎支出クイズ（公開済み）' },
    ],
  },
  {
    id: 'population-change',
    templateId: 'tile-map',
    purpose: 'trend',
    statistic: '都道府県別人口の長期変化',
    imageId: 'IMG-165950508e29a5c24d5893f8',
  },
  {
    id: 'household-radar',
    templateId: 'radar',
    purpose: 'comparison',
    statistic: '家計支出の10分類（47市平均との比較）',
  },
  {
    id: 'liquor-shares',
    templateId: 'pie',
    purpose: 'composition',
    statistic: '酒類の品目別販売構成比',
  },
  {
    id: 'population-time-heatmap',
    templateId: 'heatmap',
    purpose: 'distribution',
    statistic: '都道府県別人口の年次推移',
  },
];
export interface SampleImage {
  src: string;
  imageId: string;
  width?: number;
  height?: number;
  kind: 'trial' | 'reference';
}
export type StatisticalSampleView = StatisticalSample & {
  binding?: {
    metricKey: string;
    definitionPath: string;
    dataKey: string;
    dataSha256: string;
    visualization: MetricPresentation;
  };
  media: Partial<Record<'note' | 'web' | 'x' | 'instagram', SampleImage>>;
  basisImages?: { src: string; label: string; pageUrl?: string | null }[];
};
export function basicTemplateBranches<T extends Template>(templates: T[]) {
  return Object.entries(PURPOSE_TYPES).flatMap(([purpose, ids]) =>
    ids.flatMap((templateId) => {
      const template = templates.find((t) => t.id === templateId);
      return template
        ? [{ key: templateId + ':' + purpose, templateId, purpose, template }]
        : [];
    })
  );
}
/** Saved topic/media/sample bookmarks resolve to the same type without selecting an article. */
export function basicTemplateQuery(raw: Record<string, string | undefined>) {
  const query = taxonomyQuery(raw);
  if (query.selection === 'top-bottom') query.purpose ??= 'ranking';
  const result: Record<string, string> = {};
  for (const key of ['template', 'purpose', 'q'])
    if (query[key]) result[key] = query[key];
  return result;
}
