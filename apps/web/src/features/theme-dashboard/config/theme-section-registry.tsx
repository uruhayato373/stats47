import type { ComponentType } from 'react';

import { ThemeAirportTrafficSection } from '@/features/airport-traffic';
import { ThemeBridgeInspectionAgeSection } from '@/features/bridge-inspection-age';
import { ThemeCommuteFlowSection } from '@/features/commute-flow';
import { ThemeCulturalHeritageSection } from '@/features/cultural-heritage';
import { ThemeDepopulatedSettlementsSection } from '@/features/depopulated-settlements';
import { ThemeDepopulationMedicalSection } from '@/features/depopulation-medical';
import { ThemeEarthquakeExposureSection } from '@/features/earthquake-exposure';
import { ThemeFactoryInvestmentSection } from '@/features/factory-investment';
import { ThemeFinanceFlowSection } from '@/features/finance-flow';
import { ThemeFreightOdSection } from '@/features/freight-od';
import {
  ThemeGeoSnowDesignationSection,
  ThemeGeoLandslideExposureSection,
  ThemeGeoStationAccessSection,
  ThemeGeoPublicFacilityAccessSection,
} from '@/features/geo-analysis/embedded';
import { ThemeGraduationPathsSection } from '@/features/graduation-paths';
import { ThemeHighwayTimelineSection } from '@/features/highway-history';
import { ThemeIndustrySpecializationSection } from '@/features/industry-specialization';
import { ThemeFinanceOverviewSection, ThemeFinanceSustainabilitySection } from '@/features/local-finance-dashboard';
import { ThemeMedicalWorkforceSection } from '@/features/medical-workforce';
import { ThemeMigrationFlowSection } from '@/features/migration-flow';
import { ThemeNutritionSection } from '@/features/nutrition';
import { ThemePhysicalActivitySection } from '@/features/physical-activity';
import {
  ThemeMigrationDemographicsSection,
  ThemeSingleHouseholdsSection,
  ThemeFiveYearResidenceSection,
  ThemeYoungMigrationLink,
} from '@/features/population-demographics';
import { ThemePropertyPriceDistributionSection } from '@/features/property-price-distribution';
import { ThemeShelterApplicabilitySection } from '@/features/shelter-applicability';
import { ThemeStationPassengersSection } from '@/features/station-passengers';
import { ThemeSunshineMapSection } from '@/features/sunshine-map';
import { ThemeTourismSeasonalitySection } from '@/features/tourism-seasonality';
import { ThemeTsunamiExposureSection } from '@/features/tsunami-exposure';
import { ThemeWaterQualitySection } from '@/features/water-quality';

import { ThemeKakeiAxisAssetsDebtSection, ThemeKakeiAxisFoodSpendingSection } from '../components/kakei-axis/ThemeKakeiAxisSection';

/**
 * テーマダッシュボードに埋め込む GIS マップ section の registry。
 *
 * ThemeConfig.embeddedSections のキーから component を解決する。旧来 ThemePageLayout 内の
 * `themeKey === "..."` ハードコード分岐を data 駆動に一般化したもの。1 つの section を
 * 複数テーマから再利用できる (例: depopulation-medical を healthcare / aging-society で共用)。
 *
 * client section (migration-flow / station-passengers / depopulation-medical / sunshine-map) と
 * async server component (highway) が混在するが、いずれも引数なしで描画できる。
 */
export const THEME_SECTION_REGISTRY: Record<string, ComponentType> = {
  'tsunami-scenario-exposure': ThemeTsunamiExposureSection,
  'shelter-applicability': ThemeShelterApplicabilitySection,
  'snow-designation-population': ThemeGeoSnowDesignationSection,
  'landslide-population-facilities': ThemeGeoLandslideExposureSection,
  'water-quality': ThemeWaterQualitySection,
  'bridge-inspection-age': ThemeBridgeInspectionAgeSection,
  'tourism-seasonality': ThemeTourismSeasonalitySection,
  nutrition: ThemeNutritionSection,
  'physical-activity': ThemePhysicalActivitySection,
  'property-prices': ThemePropertyPriceDistributionSection,
  'factory-investment': ThemeFactoryInvestmentSection,
  'freight-od': ThemeFreightOdSection,
  'airport-traffic': ThemeAirportTrafficSection,
  'industry-specialization': ThemeIndustrySpecializationSection,
  'medical-workforce': ThemeMedicalWorkforceSection,
  'graduation-paths': ThemeGraduationPathsSection,
  'cultural-heritage-locations': ThemeCulturalHeritageSection,
  'earthquake-population': ThemeEarthquakeExposureSection,
  'migration-flow': ThemeMigrationFlowSection,
  'migration-demographics': ThemeMigrationDemographicsSection,
  'single-households-demographics': ThemeSingleHouseholdsSection,
  'five-year-residence': ThemeFiveYearResidenceSection,
  'young-migration-link': ThemeYoungMigrationLink,
  'commute-flow': ThemeCommuteFlowSection,
  'finance-overview': ThemeFinanceOverviewSection,
  'finance-sustainability': ThemeFinanceSustainabilitySection,
  'finance-flow': ThemeFinanceFlowSection,
  // 家計調査の分類軸別の全国の値 (2026-11-12 に日本全体のテーマのページから移した。県のページでは描かない)
  'kakei-axis-household-food-spending': ThemeKakeiAxisFoodSpendingSection,
  'kakei-axis-household-assets-debt': ThemeKakeiAxisAssetsDebtSection,
  'geo-station-access': ThemeGeoStationAccessSection,
  'geo-public-facility-access': ThemeGeoPublicFacilityAccessSection,
  highway: ThemeHighwayTimelineSection,
  'station-passengers': ThemeStationPassengersSection,
  'depopulation-medical': ThemeDepopulationMedicalSection,
  'depopulated-settlements': ThemeDepopulatedSettlementsSection,
  'sunshine-map': ThemeSunshineMapSection,
};

/**
 * 半幅 (lg 以上で 2 カラム) に並べてよい section。
 *
 * フロー 2 種は `ChartPanel` 化して他のテーマチャートと同じ縦横比に揃えたので、
 * 同じ 2 カラム grid に載せる (2026-08-04)。地図系 (highway / station-passengers /
 * depopulation-medical / sunshine-map) は全国地図が主役で半幅にすると読めないため全幅のまま。
 */
export const HALF_WIDTH_SECTIONS = new Set<string>([
  'migration-flow',
  'commute-flow',
]);

/**
 * 全国のページ (`/themes/<テーマ>`) だけで描く章。全国の値の図なので、県のページ (`/areas/<県>/<テーマ>`) では組み立てず、
 * 章ごと出さない (テーマ・地域のページは 1 つの地域を見せる。theme-catalog-standards §3.0。2026-11-12)
 */
export const NATIONAL_ONLY_SECTIONS = new Set<string>([
  'kakei-axis-household-food-spending',
  'kakei-axis-household-assets-debt',
]);
