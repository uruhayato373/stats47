#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 個別ランキングコンポーネントを削除するスクリプト
 */

// 削除対象のファイルリスト
const rankingFiles = [
  "src/components/subcategories/administrativefinancial/expenditure/ExpenditureRanking.tsx",
  "src/components/subcategories/administrativefinancial/fiscal-indicators/FiscalIndicatorsRanking.tsx",
  "src/components/subcategories/administrativefinancial/investment/InvestmentRanking.tsx",
  "src/components/subcategories/administrativefinancial/revenue/RevenueRanking.tsx",
  "src/components/subcategories/administrativefinancial/staff-assembly-election/StaffAssemblyElectionRanking.tsx",
  "src/components/subcategories/administrativefinancial/tax-revenue/TaxRevenueRanking.tsx",
  "src/components/subcategories/agriculture/agricultural-household/AgriculturalHouseholdRanking.tsx",
  "src/components/subcategories/commercial/commerce-service-industry/CommerceServiceIndustryRanking.tsx",
  "src/components/subcategories/commercial/commercial-facilities/CommercialFacilitiesRanking.tsx",
  "src/components/subcategories/construction/construction-manufacturing/ConstructionManufacturingRanking.tsx",
  "src/components/subcategories/construction/housing-facilities/HousingFacilitiesRanking.tsx",
  "src/components/subcategories/construction/housing-ownership/HousingOwnershipRanking.tsx",
  "src/components/subcategories/construction/housing-statistics/HousingStatisticsRanking.tsx",
  "src/components/subcategories/construction/housing-structure/HousingStructureRanking.tsx",
  "src/components/subcategories/construction/living-environment/LivingEnvironmentRanking.tsx",
  "src/components/subcategories/construction/welfare-facilities/WelfareFacilitiesRanking.tsx",
  "src/components/subcategories/economy/business-activity/BusinessActivityRanking.tsx",
  "src/components/subcategories/economy/business-scale/BusinessScaleRanking.tsx",
  "src/components/subcategories/economy/consumer-price-difference-index/ConsumerPriceDifferenceIndexRanking.tsx",
  "src/components/subcategories/economy/gross-product-economic-indicators/GrossProductEconomicIndicatorsRanking.tsx",
  "src/components/subcategories/economy/household-economy/HouseholdEconomyRanking.tsx",
  "src/components/subcategories/economy/worker-household-income/WorkerHouseholdIncomeRanking.tsx",
  "src/components/subcategories/educationsports/childcare-early-education/ChildcareEarlyEducationRanking.tsx",
  "src/components/subcategories/educationsports/college-university/CollegeUniversityRanking.tsx",
  "src/components/subcategories/educationsports/compulsory-education/CompulsoryEducationRanking.tsx",
  "src/components/subcategories/educationsports/cultural-facilities/CulturalFacilitiesRanking.tsx",
  "src/components/subcategories/educationsports/elementary-school/ElementarySchoolRanking.tsx",
  "src/components/subcategories/educationsports/high-school/HighSchoolRanking.tsx",
  "src/components/subcategories/educationsports/junior-high-school/JuniorHighSchoolRanking.tsx",
  "src/components/subcategories/educationsports/kindergarten/KindergartenRanking.tsx",
  "src/components/subcategories/educationsports/social-activities/SocialActivitiesRanking.tsx",
  "src/components/subcategories/educationsports/sports-facilities/SportsFacilitiesRanking.tsx",
  "src/components/subcategories/energy/industrial-water/IndustrialWaterRanking.tsx",
  "src/components/subcategories/energy/infrastructure-energy/InfrastructureEnergyRanking.tsx",
  "src/components/subcategories/energy/waste-management/WasteManagementRanking.tsx",
  "src/components/subcategories/energy/water-supply-sewerage/WaterSupplySewerageRanking.tsx",
  "src/components/subcategories/infrastructure/roads/RoadsRanking.tsx",
  "src/components/subcategories/international/foreign-population/ForeignPopulationRanking.tsx",
  "src/components/subcategories/laborwage/commuting-employment/CommutingEmploymentRanking.tsx",
  "src/components/subcategories/laborwage/employment-type/EmploymentTypeRanking.tsx",
  "src/components/subcategories/laborwage/industrial-structure/IndustrialStructureRanking.tsx",
  "src/components/subcategories/laborwage/industry-occupation/IndustryOccupationRanking.tsx",
  "src/components/subcategories/laborwage/job-seeking-placement/JobSeekingPlacementRanking.tsx",
  "src/components/subcategories/laborwage/labor-disputes/LaborDisputesRanking.tsx",
  "src/components/subcategories/laborwage/labor-force-structure/LaborForceStructureRanking.tsx",
  "src/components/subcategories/laborwage/wages-working-conditions/WagesWorkingConditionsRanking.tsx",
  "src/components/subcategories/landweather/natural-environment/NaturalEnvironmentRanking.tsx",
  "src/components/subcategories/landweather/weather-climate/WeatherClimateRanking.tsx",
  "src/components/subcategories/miningindustry/manufacturing/ManufacturingRanking.tsx",
  "src/components/subcategories/population/basic-population/BasicPopulationRanking.tsx",
  "src/components/subcategories/population/birth-death/BirthDeathRanking.tsx",
  "src/components/subcategories/population/households/HouseholdsRanking.tsx",
  "src/components/subcategories/population/marriage/MarriageRanking.tsx",
  "src/components/subcategories/population/population-composition/PopulationCompositionRanking.tsx",
  "src/components/subcategories/population/population-movement/PopulationMovementRanking.tsx",
  "src/components/subcategories/safetyenvironment/fire-emergency/FireEmergencyRanking.tsx",
  "src/components/subcategories/safetyenvironment/fire-insurance/FireInsuranceRanking.tsx",
  "src/components/subcategories/safetyenvironment/police-crime/PoliceCrimeRanking.tsx",
  "src/components/subcategories/safetyenvironment/pollution-environment/PollutionEnvironmentRanking.tsx",
  "src/components/subcategories/safetyenvironment/traffic-accidents/TrafficAccidentsRanking.tsx",
  "src/components/subcategories/socialsecurity/card/SocialSecurityCardRanking.tsx",
  "src/components/subcategories/socialsecurity/death-statistics/DeathStatisticsRanking.tsx",
  "src/components/subcategories/socialsecurity/health-care/HealthCareRanking.tsx",
  "src/components/subcategories/socialsecurity/public-assistance-welfare/PublicAssistanceWelfareRanking.tsx",
  "src/components/subcategories/tourism/tourism-accommodation/TourismAccommodationRanking.tsx",
];

console.log("個別ランキングコンポーネントの削除を開始...");
console.log(`削除対象ファイル数: ${rankingFiles.length}`);

let deletedCount = 0;
let errorCount = 0;

rankingFiles.forEach((filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ 削除: ${filePath}`);
      deletedCount++;
    } else {
      console.log(`⚠ ファイルが存在しません: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ エラー: ${filePath} - ${error.message}`);
    errorCount++;
  }
});

console.log("\n削除完了！");
console.log(`削除成功: ${deletedCount}ファイル`);
console.log(`エラー: ${errorCount}ファイル`);

// 空になったディレクトリを削除
const directoriesToCheck = [
  "src/components/subcategories/administrativefinancial/expenditure",
  "src/components/subcategories/administrativefinancial/fiscal-indicators",
  "src/components/subcategories/administrativefinancial/investment",
  "src/components/subcategories/administrativefinancial/revenue",
  "src/components/subcategories/administrativefinancial/staff-assembly-election",
  "src/components/subcategories/administrativefinancial/tax-revenue",
  "src/components/subcategories/agriculture/agricultural-household",
  "src/components/subcategories/commercial/commerce-service-industry",
  "src/components/subcategories/commercial/commercial-facilities",
  "src/components/subcategories/construction/construction-manufacturing",
  "src/components/subcategories/construction/housing-facilities",
  "src/components/subcategories/construction/housing-ownership",
  "src/components/subcategories/construction/housing-statistics",
  "src/components/subcategories/construction/housing-structure",
  "src/components/subcategories/construction/living-environment",
  "src/components/subcategories/construction/welfare-facilities",
  "src/components/subcategories/economy/business-activity",
  "src/components/subcategories/economy/business-scale",
  "src/components/subcategories/economy/consumer-price-difference-index",
  "src/components/subcategories/economy/gross-product-economic-indicators",
  "src/components/subcategories/economy/household-economy",
  "src/components/subcategories/economy/worker-household-income",
  "src/components/subcategories/educationsports/childcare-early-education",
  "src/components/subcategories/educationsports/college-university",
  "src/components/subcategories/educationsports/compulsory-education",
  "src/components/subcategories/educationsports/cultural-facilities",
  "src/components/subcategories/educationsports/elementary-school",
  "src/components/subcategories/educationsports/high-school",
  "src/components/subcategories/educationsports/junior-high-school",
  "src/components/subcategories/educationsports/kindergarten",
  "src/components/subcategories/educationsports/social-activities",
  "src/components/subcategories/educationsports/sports-facilities",
  "src/components/subcategories/energy/industrial-water",
  "src/components/subcategories/energy/infrastructure-energy",
  "src/components/subcategories/energy/waste-management",
  "src/components/subcategories/energy/water-supply-sewerage",
  "src/components/subcategories/infrastructure/roads",
  "src/components/subcategories/international/foreign-population",
  "src/components/subcategories/laborwage/commuting-employment",
  "src/components/subcategories/laborwage/employment-type",
  "src/components/subcategories/laborwage/industrial-structure",
  "src/components/subcategories/laborwage/industry-occupation",
  "src/components/subcategories/laborwage/job-seeking-placement",
  "src/components/subcategories/laborwage/labor-disputes",
  "src/components/subcategories/laborwage/labor-force-structure",
  "src/components/subcategories/laborwage/wages-working-conditions",
  "src/components/subcategories/landweather/natural-environment",
  "src/components/subcategories/landweather/weather-climate",
  "src/components/subcategories/miningindustry/manufacturing",
  "src/components/subcategories/population/basic-population",
  "src/components/subcategories/population/birth-death",
  "src/components/subcategories/population/households",
  "src/components/subcategories/population/marriage",
  "src/components/subcategories/population/population-composition",
  "src/components/subcategories/population/population-movement",
  "src/components/subcategories/safetyenvironment/fire-emergency",
  "src/components/subcategories/safetyenvironment/fire-insurance",
  "src/components/subcategories/safetyenvironment/police-crime",
  "src/components/subcategories/safetyenvironment/pollution-environment",
  "src/components/subcategories/safetyenvironment/traffic-accidents",
  "src/components/subcategories/socialsecurity/card",
  "src/components/subcategories/socialsecurity/death-statistics",
  "src/components/subcategories/socialsecurity/health-care",
  "src/components/subcategories/socialsecurity/public-assistance-welfare",
  "src/components/subcategories/tourism/tourism-accommodation",
];

console.log("\n空のディレクトリをチェック中...");

let removedDirCount = 0;
directoriesToCheck.forEach((dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`✓ 空ディレクトリ削除: ${dirPath}`);
        removedDirCount++;
      }
    }
  } catch (error) {
    console.error(`✗ ディレクトリ削除エラー: ${dirPath} - ${error.message}`);
  }
});

console.log(`\n空ディレクトリ削除: ${removedDirCount}個`);
