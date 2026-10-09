/**
 * data/themes/catalogs/<key>.json を読んで登録簿にする。テーマ定義の SSOT は JSON 側で、ここは型を付けるだけ。
 *
 * このディレクトリは package.json の sideEffects:false で「副作用なし」と宣言している。
 * index.ts の barrel から GIS 原典の定数や型だけを import するクライアント部品では、webpack がこのモジュールごと
 * (55 テーマ分の JSON を含めて) チャンクから外せる。JSON は JSON.parse として埋め込まれ、未使用でも圧縮で消えないため、
 * モジュール単位で外す必要がある。
 */
import type { ThemeCatalog } from "../types";
import agingSocietyJson from "../../../../../data/themes/catalogs/aging-society.json";
import consumerPricesJson from "../../../../../data/themes/catalogs/consumer-prices.json";
import climateJson from "../../../../../data/themes/catalogs/climate.json";
import educationCultureJson from "../../../../../data/themes/catalogs/education-culture.json";
import fisheryMarineJson from "../../../../../data/themes/catalogs/fishery-marine.json";
import foreignResidentsJson from "../../../../../data/themes/catalogs/foreign-residents.json";
import healthcareJson from "../../../../../data/themes/catalogs/healthcare.json";
import laborMobilityJson from "../../../../../data/themes/catalogs/labor-mobility.json";
import laborWagesJson from "../../../../../data/themes/catalogs/labor-wages.json";
import livingHousingJson from "../../../../../data/themes/catalogs/living-housing.json";
import localEconomyJson from "../../../../../data/themes/catalogs/local-economy.json";
import localFinanceJson from "../../../../../data/themes/catalogs/local-finance.json";
import manufacturingJson from "../../../../../data/themes/catalogs/manufacturing.json";
import occupationSalaryJson from "../../../../../data/themes/catalogs/occupation-salary.json";
import populationDynamicsJson from "../../../../../data/themes/catalogs/population-dynamics.json";
import portsJson from "../../../../../data/themes/catalogs/ports.json";
import railwayJson from "../../../../../data/themes/catalogs/railway.json";
import realIncomeJson from "../../../../../data/themes/catalogs/real-income.json";
import roadsJson from "../../../../../data/themes/catalogs/roads.json";
import safetyJson from "../../../../../data/themes/catalogs/safety.json";
import tourismJson from "../../../../../data/themes/catalogs/tourism.json";
import constructionIndustryJson from "../../../../../data/themes/catalogs/construction-industry.json";
import wasteRecyclingJson from "../../../../../data/themes/catalogs/waste-recycling.json";
import informationIndustryJson from "../../../../../data/themes/catalogs/information-industry.json";
import landPropertyMarketJson from "../../../../../data/themes/catalogs/land-property-market.json";
import agricultureProductionJson from "../../../../../data/themes/catalogs/agriculture-production.json";
import forestryTimberJson from "../../../../../data/themes/catalogs/forestry-timber.json";
import retailCommerceJson from "../../../../../data/themes/catalogs/retail-commerce.json";
import localServicesJson from "../../../../../data/themes/catalogs/local-services.json";
import businessDemographyJson from "../../../../../data/themes/catalogs/business-demography.json";
import innovationPatentsJson from "../../../../../data/themes/catalogs/innovation-patents.json";
import childcareServicesJson from "../../../../../data/themes/catalogs/childcare-services.json";
import singleParentHouseholdsJson from "../../../../../data/themes/catalogs/single-parent-households.json";
import longTermCareJson from "../../../../../data/themes/catalogs/long-term-care.json";
import disabilitySupportJson from "../../../../../data/themes/catalogs/disability-support.json";
import publicAssistanceJson from "../../../../../data/themes/catalogs/public-assistance.json";
import healthCheckupsJson from "../../../../../data/themes/catalogs/health-checkups.json";
import dailyTimeUseJson from "../../../../../data/themes/catalogs/daily-time-use.json";
import householdAssetsDebtJson from "../../../../../data/themes/catalogs/household-assets-debt.json";
import freightLogisticsJson from "../../../../../data/themes/catalogs/freight-logistics.json";
import regionalTransportJson from "../../../../../data/themes/catalogs/regional-transport.json";
import geographicAccessJson from "../../../../../data/themes/catalogs/geographic-access.json";
import waterServicesJson from "../../../../../data/themes/catalogs/water-services.json";
import communicationAccessJson from "../../../../../data/themes/catalogs/communication-access.json";
import regionalEnergyJson from "../../../../../data/themes/catalogs/regional-energy.json";
import environmentalQualityJson from "../../../../../data/themes/catalogs/environmental-quality.json";
import naturalEnvironmentJson from "../../../../../data/themes/catalogs/natural-environment.json";
import earthquakeExposureJson from "../../../../../data/themes/catalogs/earthquake-exposure.json";
import landslideExposureJson from "../../../../../data/themes/catalogs/landslide-exposure.json";
import tsunamiExposureJson from "../../../../../data/themes/catalogs/tsunami-exposure.json";
import culturalParticipationJson from "../../../../../data/themes/catalogs/cultural-participation.json";
import sportsParticipationJson from "../../../../../data/themes/catalogs/sports-participation.json";
import localGovernmentDigitalJson from "../../../../../data/themes/catalogs/local-government-digital.json";
import genderParticipationJson from "../../../../../data/themes/catalogs/gender-participation.json";
import communityParticipationJson from "../../../../../data/themes/catalogs/community-participation.json";
import householdFoodSpendingJson from "../../../../../data/themes/catalogs/household-food-spending.json";

// JSON の import は文字列リテラルの union 型 (componentType 等) を string に広げるため、
// 型の一致は schema と validator で担保し、ここでは ThemeCatalog として扱う。
const THEME_CATALOG_JSON: unknown[] = [
  agingSocietyJson,
  consumerPricesJson,
  climateJson,
  educationCultureJson,
  fisheryMarineJson,
  foreignResidentsJson,
  healthcareJson,
  laborMobilityJson,
  laborWagesJson,
  livingHousingJson,
  localEconomyJson,
  localFinanceJson,
  manufacturingJson,
  occupationSalaryJson,
  populationDynamicsJson,
  portsJson,
  railwayJson,
  realIncomeJson,
  roadsJson,
  safetyJson,
  tourismJson,
  constructionIndustryJson,
  wasteRecyclingJson,
  informationIndustryJson,
  landPropertyMarketJson,
  agricultureProductionJson,
  forestryTimberJson,
  retailCommerceJson,
  localServicesJson,
  businessDemographyJson,
  innovationPatentsJson,
  childcareServicesJson,
  singleParentHouseholdsJson,
  longTermCareJson,
  disabilitySupportJson,
  publicAssistanceJson,
  healthCheckupsJson,
  dailyTimeUseJson,
  householdAssetsDebtJson,
  freightLogisticsJson,
  regionalTransportJson,
  geographicAccessJson,
  waterServicesJson,
  communicationAccessJson,
  regionalEnergyJson,
  environmentalQualityJson,
  naturalEnvironmentJson,
  earthquakeExposureJson,
  landslideExposureJson,
  tsunamiExposureJson,
  culturalParticipationJson,
  sportsParticipationJson,
  localGovernmentDigitalJson,
  genderParticipationJson,
  communityParticipationJson,
  householdFoodSpendingJson,
];

/** カタログ駆動テーマの登録簿 (key → catalog)。 */
export const THEME_CATALOGS: Record<string, ThemeCatalog> = Object.fromEntries(
  (THEME_CATALOG_JSON as ThemeCatalog[]).map((catalog) => [catalog.key, catalog]),
);

/** 登録済みカタログ配列。 */
export function listThemeCatalogs(): ThemeCatalog[] {
  return Object.values(THEME_CATALOGS);
}
