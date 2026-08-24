export interface ThemeNavGroup {
  id: string;
  label: string;
  themeKeys: readonly string[];
}

/**
 * デスクトップ左レール専用の表示グループ。
 *
 * ranking category や ThemeCatalog の分類 taxonomy ではなく、21 テーマを探しやすくする
 * navigation-only の SSOT。全テーマが重複なく 1 回だけ現れることはテストで固定する。
 */
export const THEME_NAV_GROUPS = [
  {
    id: 'population-life',
    label: '人口・暮らし',
    themeKeys: [
      'population-dynamics',
      'aging-society',
      'living-housing',
      'consumer-prices',
      'foreign-residents',
    ],
  },
  {
    id: 'work-economy',
    label: '仕事・経済',
    themeKeys: [
      'local-economy',
      'labor-wages',
      'manufacturing',
      'occupation-salary',
      'real-income',
      'labor-mobility',
      'local-finance',
    ],
  },
  {
    id: 'health-education-safety',
    label: '医療・教育・安全',
    themeKeys: ['healthcare', 'education-culture', 'safety'],
  },
  {
    id: 'tourism-transport-nature',
    label: '観光・交通・自然',
    themeKeys: [
      'tourism',
      'fishery-marine',
      'ports',
      'railway',
      'roads',
      'climate',
    ],
  },
] as const satisfies readonly ThemeNavGroup[];
