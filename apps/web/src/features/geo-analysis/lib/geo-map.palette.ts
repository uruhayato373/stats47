/**
 * Geo 分析の地図 (Leaflet) とカードプレビュー (SVG) の識別配色。
 *
 * Leaflet / SVG 属性は CSS 変数を解決できないため hex で持つ。値は各コンポーネントに
 * 直書きしていた色をそのまま集約したもので、色の意味は「メッシュ区分・判定結果・
 * 地点種別を見分けること」。凡例と地図がずれないよう、同じ区分は同じキーを参照する。
 */
export const GEO_MAP_COLORS = {
  /** メッシュ・区域面の境界線 / 点マーカーの縁取り */
  outline: '#ffffff',
  /** 駅・施設などの代表点マーカー */
  pointMarker: {
    stroke: '#0f172a',
    fill: '#f8fafc',
  },
  /** 2020→2050 年の人口変化率 (駅アクセス・公共施設・空間掛け合わせで共通) */
  populationChange: {
    missing: '#94a3b8',
    growing: '#0f766e',
    mildDecline: '#67a9cf',
    moderateDecline: '#fdbb84',
    severeDecline: '#b91c1c',
  },
  /** 駅 800m 圏の重なり表示 */
  stationAccess: {
    accessible: '#0f766e',
    outside: '#cbd5e1',
  },
  /** 公共施設の距離帯が解決できないメッシュ */
  publicFacilityBandFallback: '#94a3b8',
  /** 空間掛け合わせの包含判定 (浸水など) */
  spatialInclusion: {
    included: '#b91c1c',
    excluded: '#cbd5e1',
  },
  /** 指定区域 (土砂災害・豪雪) 系メッシュの 2020 年人口 3 段階 (>=1000 / >=100 / それ未満) */
  designationPopulation: {
    high: '#1e3a8a',
    medium: '#2563eb',
    low: '#93c5fd',
  },
  /** 指定区域系メッシュの中心点区分 (index = centerClass: 対象外 / 区分1 / 区分2) */
  designationClass: ['#cbd5e1', '#2563eb', '#7e22ce'],
  /** 指定区域の原典面の輪郭 (特別区域 / 通常区域) */
  designationSourceOutline: {
    special: '#7e22ce',
    standard: '#1e40af',
  },
  /** 指定区域の境界を横切るメッシュの輪郭 */
  designationBoundaryCell: '#334155',
  /** 施設点 (指定区域面内 / 面外) */
  designationFacility: {
    inside: '#7e22ce',
    outside: '#334155',
  },
  /** GIS レイヤー地図の非人口レイヤー (駅は pointMarker を使う) */
  layerFeatureFill: '#7c3aed',
  /** 原典データ地図の抽出結果 */
  sourceResult: {
    stroke: '#2563eb',
    fill: '#60a5fa',
    point: '#1e40af',
  },
  /** 地価ポイントの判定区分 (地価の上昇/横ばい・下落 × 人口の減少/維持・増加) */
  landPriceCategory: {
    unlinked: '#64748b',
    risingDecline: '#b91c1c',
    risingGrowth: '#0f766e',
    flatDecline: '#b45309',
    flatGrowth: '#1d4ed8',
  },
  /** 人口レイヤーの 5 段階 (0 / <100 / <1000 / <5000 / それ以上) */
  populationLayerScale: ['#e2e8f0', '#c6dbef', '#6baed6', '#2171b5', '#08306b'],
  /** 公共施設までの距離帯 (500m 以内 → 5km 超) */
  publicFacilityBands: ['#0f766e', '#0284c7', '#d97706', '#c2410c', '#7f1d1d'],
  /** カードプレビュー SVG */
  cardPreview: {
    meshNeutral: '#cbd5e1',
    meshFlood: '#b91c1c',
    meshDefault: '#0f766e',
    landPriceLayerPoint: '#7c3aed',
    mutedPoint: '#64748b',
    stationPoint: '#f8fafc',
    prefectureFill: '#f1f5f9',
    prefectureStroke: '#475569',
    landmark: '#0f172a',
    halo: '#ffffff',
  },
} as const;
