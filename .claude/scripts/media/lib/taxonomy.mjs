/** Visual types are independent of editorial purpose, selection and output medium. */
export const IMAGE_PURPOSES = {
  ranking: 'ランキング',
  comparison: '比較',
  trend: '推移',
  composition: '内訳・構成',
  relationship: '関係',
  distribution: '分布',
  explanation: '説明',
  navigation: '案内',
  reference: '出典・参照',
  undecided: '目的を確認する',
};
export const IMAGE_SELECTIONS = {
  'top-bottom': '上位・下位',
  'all-prefectures': '全47県',
  selected: '抜粋・注目項目',
  series: '期間・時系列',
  complete: '全項目',
  na: '対象外',
  undecided: '構成を確認する',
};
export const TEMPLATE_ALIASES = {
  'svg-bar-card': 'bar',
  'svg-bar-ig': 'bar',
  'svg-bar': 'bar',
  'svg-table': 'table',
  'svg-scatter': 'scatter',
  correlation: 'scatter',
  'svg-line': 'line',
  'svg-stacked': 'stacked-bar',
  'svg-map': 'tile-map',
  'svg-findings': 'summary-card',
  procedure: 'diagram',
};
export const RETIRED_TEMPLATES = [
  'ranking',
  'household',
  'time-series',
  'map',
  ...Object.keys(TEMPLATE_ALIASES),
];
export const VISUAL_TEMPLATES = [
  {
    id: 'bar',
    label: '棒グラフ',
    policy:
      '棒の長さで量の差を示す。基準・軸・単位・年を明記する。上位・下位は同じ青を使い、順位と余白で区別する。行列で数値を読む表はテーブルへ分類する。',
    renderer: 'packages/svg-builder/src/',
  },
  {
    id: 'table',
    label: 'テーブル',
    policy:
      '行と列で項目・順位・数値を読む。単位・年と抜粋範囲を明記し、320px幅で文字を読める列数に絞る。補助の棒があっても行列が主役ならテーブル。',
    renderer: 'packages/svg-builder/src/',
  },
  {
    id: 'line',
    label: '折れ線グラフ',
    policy:
      '線で結ぶ順序・期間・単位を明記する。始点・終点と欠測を確認し、過密な系列を分ける。',
    renderer: 'packages/svg-builder/src/',
  },
  {
    id: 'scatter',
    label: '散布図',
    policy:
      '両軸の指標・年・単位・対象範囲を明記し全点を保持する。注記は注目点に絞り、相関を因果と表現しない。',
    renderer: 'packages/svg-builder/src/',
  },
  {
    id: 'choropleth',
    label: '地図（地域を色分け）',
    policy:
      '正確な地理形状を使い、数値と色の対応・欠測・対象年・地域粒度を明記する。離島も同じ色尺度で表示する。',
    renderer: 'apps/remotion/src/features/buzz-map/',
  },
  {
    id: 'tile-map',
    label: 'タイルマップ',
    policy:
      '地域を等サイズのタイルで示す。地理的な輪郭とは区別し、地域名・値・色尺度・欠測を明示する。',
    renderer: 'packages/svg-builder/src/',
  },
  {
    id: 'stacked-bar',
    label: '積み上げ棒グラフ',
    policy:
      '積み上げの合計・母数・区分・単位を照合する。実数と構成比を区別し、凡例と並び順を揃える。',
    renderer: 'packages/svg-builder/src/',
  },
];
export function canonicalTemplate(id) {
  if (Object.hasOwn(TEMPLATE_ALIASES, id)) return TEMPLATE_ALIASES[id];
  return RETIRED_TEMPLATES.includes(id) ? 'unclassified' : id;
}
/** Names stating a purpose cannot establish a visual encoding. */
export function purposeFromEvidence(template = '', file = '') {
  const name = file.replaceAll('\\', '/').split('/').at(-1).toLowerCase();
  // Asset names of cover/backgrounds often include the linked ranking slug.
  // That describes the destination, not a statistical comparison in the image.
  const nonChartPurpose = {
    'note-cover': 'explanation',
    ogp: 'explanation',
    'title-card': 'explanation',
    background: 'explanation',
    photo: 'explanation',
    'pref-silhouette': 'explanation',
    'logo-icon': 'explanation',
    'source-card': 'reference',
    'link-card': 'navigation',
    'cta-card': 'navigation',
    'caution-card': 'explanation',
    'summary-card': 'explanation',
    diagram: 'explanation',
  };
  if (nonChartPurpose[canonicalTemplate(template)])
    return nonChartPurpose[canonicalTemplate(template)];
  if (canonicalTemplate(template) === 'scatter' || /scatter/.test(name))
    return 'relationship';
  if (template === 'ranking' || /ranking|top[-_]?bottom|all47/.test(name))
    return 'ranking';
  if (template === 'time-series' || /timeseries|time-series|trend/.test(name))
    return 'trend';
  if (template === 'correlation' || /correlation|scatter/.test(name))
    return 'relationship';
  if (/comparison|compare/.test(name)) return 'comparison';
  if (/boxplot|distribution/.test(name)) return 'distribution';
  return 'undecided';
}
/** Preserve old bookmarks without guessing that every ranking is a bar chart. */
export function taxonomyQuery(query) {
  const result = { ...query };
  const id = query.template;
  if (!id) return result;
  if (id === 'ranking' || id === 'time-series') {
    delete result.template;
    result.purpose ??= id === 'ranking' ? 'ranking' : 'trend';
  } else if (id === 'map') result.template = 'choropleth';
  else if (id === 'household') {
    delete result.template;
    result.queue ??= 'classification';
  } else result.template = canonicalTemplate(id);
  return result;
}
