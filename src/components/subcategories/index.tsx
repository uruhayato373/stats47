import React from 'react';
import { SubcategoryPageProps } from '@/types/subcategory';

// カテゴリー別にインポート
import { LandAreaPage, LandUsePage, NaturalEnvironmentPage, WeatherClimatePage } from './landweather';
import { BasicPopulationPage, BasicPopulationAreaPage, MarriagePage, HouseholdsPage, PopulationMovementPage, BirthDeathPage, PopulationCompositionPage } from './population';
import { WagesWorkingConditionsPage, LaborForceStructurePage, LaborDisputesPage, JobSeekingPlacementPage, IndustryOccupationPage, EmploymentTypePage } from './laborwage';
import { AgriculturalHouseholdPage } from './agriculture';
import { ManufacturingPage } from './miningindustry';
import { CommerceServiceIndustryPage, CommercialFacilitiesPage } from './commercial';
import { WorkerHouseholdIncomePage, GrossProductEconomicIndicatorsPage, ConsumerPriceDifferenceIndexPage } from './economy';
import { LivingEnvironmentPage, HousingOwnershipPage, HousingStructurePage, HousingFacilitiesPage, ConstructionManufacturingPage } from './construction';
import { WaterSupplySeweragePage, WasteManagementPage, IndustrialWaterPage, InfrastructureEnergyPage } from './energy';
import { TourismAccommodationPage } from './tourism';
import { EducationSportsCardPage } from './educationsports';
import { FiscalIndicatorsPage, StaffAssemblyElectionPage, TaxRevenuePage, InvestmentPage, RevenuePage, ExpenditurePage } from './administrativefinancial';
import { FireEmergencyPage, FireInsurancePage, PoliceCrimePage, PollutionEnvironmentPage } from './safetyenvironment';
import { SocialSecurityCardPage, DeathStatisticsPage } from './socialsecurity';
import { ForeignersPage } from './international';

// サブカテゴリーIDとコンポーネントのマッピング
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  // 国土・気象
  'land-area': LandAreaPage,
  'land-use': LandUsePage,
  'natural-environment': NaturalEnvironmentPage,
  'weather-climate': WeatherClimatePage,

  // 人口・世帯
  'basic-population': BasicPopulationPage,
  'population-composition': PopulationCompositionPage,
  'marriage': MarriagePage,
  'households': HouseholdsPage,
  'population-movement': PopulationMovementPage,
  'birth-death': BirthDeathPage,

  // 労働・賃金
  'wages-working-conditions': WagesWorkingConditionsPage,
  'labor-force-structure': LaborForceStructurePage,
  'labor-disputes': LaborDisputesPage,
  'job-seeking-placement': JobSeekingPlacementPage,
  'industry-occupation': IndustryOccupationPage,
  'employment-type': EmploymentTypePage,

  // 農林水産業
  'agricultural-household': AgriculturalHouseholdPage,

  // 鉱工業
  'manufacturing': ManufacturingPage,

  // 商業・サービス業
  'commerce-service-industry': CommerceServiceIndustryPage,
  'commercial-facilities': CommercialFacilitiesPage,

  // 企業・家計・経済
  'worker-household-income': WorkerHouseholdIncomePage,
  'gross-product-economic-indicators': GrossProductEconomicIndicatorsPage,
  'consumer-price-difference-index': ConsumerPriceDifferenceIndexPage,

  // 住宅・土地・建設
  'living-environment': LivingEnvironmentPage,
  'housing-ownership': HousingOwnershipPage,
  'housing-structure': HousingStructurePage,
  'housing-facilities': HousingFacilitiesPage,
  'construction-manufacturing': ConstructionManufacturingPage,

  // エネルギー・水
  'water-supply-sewerage': WaterSupplySeweragePage,
  'waste-management': WasteManagementPage,
  'industrial-water': IndustrialWaterPage,
  'infrastructure-energy': InfrastructureEnergyPage,

  // 運輸・観光
  'tourism-accommodation': TourismAccommodationPage,

  // 教育・文化・スポーツ
  'educationsports-card': EducationSportsCardPage,

  // 行財政
  'fiscal-indicators': FiscalIndicatorsPage,
  'staff-assembly-election': StaffAssemblyElectionPage,
  'tax-revenue': TaxRevenuePage,
  'investment': InvestmentPage,
  'revenue': RevenuePage,
  'expenditure': ExpenditurePage,

  // 司法・安全・環境
  'fire-emergency': FireEmergencyPage,
  'fire-insurance': FireInsurancePage,
  'police-crime': PoliceCrimePage,
  'pollution-environment': PollutionEnvironmentPage,

  // 社会保障・衛生
  'socialsecurity-card': SocialSecurityCardPage,
  'death-statistics': DeathStatisticsPage,

  // 国際
  'foreigners': ForeignersPage,

  // 他のサブカテゴリーはデフォルトコンポーネントを使用
};

// 都道府県別ページのコンポーネントマッピング
export const areaPageComponentMap: Record<string, React.ComponentType<any>> = {
  // 人口・世帯
  'basic-population': BasicPopulationAreaPage,

  // 他のサブカテゴリーはデフォルトコンポーネントを使用
};

// デフォルトのプレースホルダーコンポーネント
const DefaultSubcategoryPage: React.FC<SubcategoryPageProps> = ({ category, subcategory }) => {
  const { SubcategoryLayout } = require('./SubcategoryLayout');
  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {subcategory.name}
          </h2>
          <p className="text-gray-600 dark:text-neutral-400 mb-4">
            このページは現在開発中です。
          </p>
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            実装方法については BasicPopulationPage.tsx を参考にしてください。
          </p>
        </div>
      </div>
    </SubcategoryLayout>
  );
};

/**
 * サブカテゴリーIDに対応するコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getSubcategoryComponent = (subcategoryId: string, categoryId?: string): React.ComponentType<any> => {
  // カテゴリーIDとサブカテゴリーIDの組み合わせを試す（'card'の重複対策）
  const compositeKey = categoryId ? `${categoryId}-${subcategoryId}` : subcategoryId;
  return subcategoryComponentMap[compositeKey] || subcategoryComponentMap[subcategoryId] || DefaultSubcategoryPage;
};

/**
 * サブカテゴリーIDに対応する都道府県別ページコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getAreaPageComponent = (subcategoryId: string): React.ComponentType<any> => {
  return areaPageComponentMap[subcategoryId] || DefaultSubcategoryPage;
};

// 共通コンポーネント
export { SubcategoryLayout } from './SubcategoryLayout';

// カテゴリー別エクスポート
export * from './landweather';
export * from './population';
export * from './laborwage';
export * from './agriculture';
export * from './miningindustry';
export * from './commercial';
export * from './economy';
export * from './construction';
export * from './energy';
export * from './tourism';
export * from './educationsports';
export * from './administrativefinancial';
export * from './safetyenvironment';
export * from './socialsecurity';
export * from './international';