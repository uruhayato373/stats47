import { Briefcase, HeartPulse, Palette, Plane, Users, type LucideIcon } from 'lucide-react';

export interface ThemeNavGroup {
  id: string;
  label: string;
  themeKeys: readonly string[];
}

/**
 * デスクトップ左レール専用の表示グループ。
 *
 * ranking category や ThemeCatalog の分類 taxonomy ではなく、テーマを探しやすくする
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
      'household-food-spending',
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
      'construction-industry',
      'information-industry',
      'occupation-salary',
      'real-income',
      'labor-mobility',
      'local-finance',
    ],
  },
  {
    id: 'health-education-safety',
    label: '医療・教育・安全',
    themeKeys: ['healthcare', 'education-culture', 'safety', 'childcare-services', 'long-term-care', 'disability-support', 'public-assistance', 'health-checkups', 'earthquake-exposure', 'landslide-exposure', 'tsunami-exposure'],
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
      'waste-recycling',
      'land-property-market',
      'agriculture-production',
      'forestry-timber',
      'regional-transport',
      'geographic-access',
      'water-services',
      'regional-energy',
      'natural-environment',
      'environmental-quality',
    ],
  },
  {
    id: 'culture-community-digital',
    label: '文化・地域・デジタル',
    themeKeys: [
      'cultural-participation',
      'sports-participation',
      'daily-time-use',
      'household-assets-debt',
      'single-parent-households',
      'community-participation',
      'gender-participation',
      'local-government-digital',
      'communication-access',
      'innovation-patents',
      'business-demography',
      'local-services',
      'retail-commerce',
      'freight-logistics',
    ],
  },
] as const satisfies readonly ThemeNavGroup[];

/** テーマの 5 系統 (THEME_NAV_GROUPS の id) のアイコン。サイドバーと調査ハブのテーマのカードが共有する */
export const THEME_NAV_GROUP_ICONS: Record<(typeof THEME_NAV_GROUPS)[number]['id'], LucideIcon> = {
  'population-life': Users,
  'work-economy': Briefcase,
  'health-education-safety': HeartPulse,
  'tourism-transport-nature': Plane,
  'culture-community-digital': Palette,
};

/** テーマが属する系統 (どの系統にも無いテーマは undefined) */
export function themeNavGroupOf(themeKey: string): (typeof THEME_NAV_GROUPS)[number] | undefined {
  return THEME_NAV_GROUPS.find((group) => (group.themeKeys as readonly string[]).includes(themeKey));
}
