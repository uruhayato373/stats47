/**
 * データブック商品 (複数指標 × 47 県) の定義と登録簿。
 *
 * 単一指標=単一データセットの汎用ビルダー (build-product.ts) と異なり、データブックは
 * 複数の実データセット (各指標・基準年固定) を 1 商品に束ねて収録する。各データセットは
 * `src/data/datasets/<key>.ts` の基準年固定スナップショット (R2 由来・null 保持・0 埋めなし)。
 *
 * ここに登録された商品だけが databook 経路 (build-databook.ts) で生成される。
 * 未登録の商品は従来どおり単一デモデータで生成される。
 */
import type { Dataset } from "./dataset";
import { ACTIVE_JOB_OPENING_RATIO_2022 } from "./datasets/active-job-opening-ratio";
import { AGING_INDEX_2022 } from "./datasets/aging-index";
import { ANNUAL_INCOME_PER_HOUSEHOLD_2019 } from "./datasets/annual-income-per-household";
import { ANNUAL_SALES_AMOUNT_2022 } from "./datasets/annual-sales-amount";
import { ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022 } from "./datasets/annual-sales-amount-per-establishment";
import { AVERAGE_LIFE_EXPECTANCY_MALE_2020 } from "./datasets/average-life-expectancy-male";
import { AVG_SALARY_ALL_PREFECTURE_2024 } from "./datasets/avg-salary-all-prefecture";
import { CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024 } from "./datasets/certified-childcare-center-count-per-100k-0-5";
import { CHILDCARE_EMPLOYMENT_RATE_2022 } from "./datasets/childcare-employment-rate";
import { CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024 } from "./datasets/consumer-price-difference-index-housing";
import { CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024 } from "./datasets/consumer-price-difference-index-overall";
import { CONVENIENCE_STORE_COUNT_PER_100K_2014 } from "./datasets/convenience-store-count-per-100k";
import { CRUDE_BIRTH_RATE_2023 } from "./datasets/crude-birth-rate";
import { DEPARTMENT_STORE_COUNT_PER_100K_2006 } from "./datasets/department-store-count-per-100k";
import { DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023 } from "./datasets/disaster-damage-amount-per-person";
import { DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024 } from "./datasets/disposable-income-worker-households";
import { DUAL_INCOME_HOUSEHOLD_RATIO_2020 } from "./datasets/dual-income-household-ratio";
import { ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024 } from "./datasets/elementary-school-students-per-teacher";
import { FACTORY_ESTABLISHMENT_COUNT_2020 } from "./datasets/factory-establishment-count";
import { FISCAL_STRENGTH_INDEX_PREFECTURE_2022 } from "./datasets/fiscal-strength-index-prefecture";
import { GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023 } from "./datasets/general-hospital-bed-count-per-100k";
import { GENERAL_HOUSEHOLDS_2020 } from "./datasets/general-households";
import { GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020 } from "./datasets/gross-prefectural-product-expenditure-nominal-h27";
import { HIGH_SCHOOL_ADVANCEMENT_RATE_2023 } from "./datasets/high-school-advancement-rate";
import { HOME_OWNERSHIP_RATE_KAKEI_2024 } from "./datasets/home-ownership-rate-kakei";
import { INDEPENDENT_REVENUE_PREFECTURE_2022 } from "./datasets/independent-revenue-prefecture";
import { LASPEYRES_INDEX_PREFECTURE_2025 } from "./datasets/laspeyres-index-prefecture";
import { LOCAL_TAX_PREFECTURE_2022 } from "./datasets/local-tax-prefecture";
import { MAIN_ROAD_LENGTH_PER_KM2_2023 } from "./datasets/main-road-length-per-km2";
import { MANUFACTURING_EMPLOYEES_2024 } from "./datasets/manufacturing-employees";
import { MANUFACTURING_ESTABLISHMENTS_2024 } from "./datasets/manufacturing-establishments";
import { MANUFACTURING_SHIPMENT_AMOUNT_2023 } from "./datasets/manufacturing-shipment-amount";
import { NATURE_PARK_AREA_RATIO_2024 } from "./datasets/nature-park-area-ratio";
import { NUMBER_OF_HOTEL_FACILITIES_2017 } from "./datasets/number-of-hotel-facilities";
import { NUMBER_OF_HOTEL_ROOMS_2017 } from "./datasets/number-of-hotel-rooms";
import { NURSES_PER_100K_POPULATION_2020 } from "./datasets/nurses-per-100k-population";
import { NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023 } from "./datasets/nursing-welfare-facility-count-per-100k-65plus";
import { PER_CAPITA_PREFECTURAL_INCOME_2020 } from "./datasets/per-capita-prefectural-income-h27";
import { PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022 } from "./datasets/physicians-in-medical-facilities-per-100k";
import { PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024 } from "./datasets/private-rental-housing-rent-per-3-3m2";
import { REAL_PUBLIC_DEBT_SERVICE_RATIO_2022 } from "./datasets/real-public-debt-service-ratio";
import { RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024 } from "./datasets/residential-land-price-change-rate";
import { ROAD_LENGTH_PER_KM2_2023 } from "./datasets/road-length-per-km2";
import { SEWERAGE_PENETRATION_RATE_2012ON_2021 } from "./datasets/sewerage-penetration-rate-2012on";
import { SOCIAL_INCREASE_RATE_2019 } from "./datasets/social-increase-rate";
import { TOTAL_AREA_2023 } from "./datasets/total-area-including-northern-territories-and-takeshima";
import { TOTAL_FERTILITY_RATE_2023 } from "./datasets/total-fertility-rate";
import { TOTAL_OVERNIGHT_GUESTS_2024 } from "./datasets/total-overnight-guests";
import { TOTAL_OVERNIGHT_GUESTS_FOREIGN_2024 } from "./datasets/total-overnight-guests-foreign";
import { TOTAL_POPULATION_2024 } from "./datasets/total-population";
import { TOTAL_REVENUE_PREFECTURE_2022 } from "./datasets/total-revenue-prefecture";
import { TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021 } from "./datasets/travel-participation-rate-overnight";
import { WATER_SUPPLY_ANNUAL_VOLUME_2022 } from "./datasets/water-supply-annual-volume";

export interface Databook {
  readonly title: string;
  /** 収録データセット。先頭を代表 (プレビュー地図) に使う。全て実データ・基準年固定。 */
  readonly datasets: readonly Dataset[];
}

/**
 * データブック商品 (product.id → 収録指標)。テーマパック P-01〜P-12 に実データを接続する。
 * 各パックは 4〜6 指標を束ねる。P-11 は代表 4 指標 (地図・チャートの見本素材)。
 * P-12 は接続済み全パックの指標の和集合。
 */
export const DATABOOKS: Readonly<Record<string, Databook>> = {
  "P-01": {
    title: "47都道府県基礎統計データブック",
    datasets: [
      TOTAL_POPULATION_2024,
      TOTAL_AREA_2023,
      GENERAL_HOUSEHOLDS_2020,
      PER_CAPITA_PREFECTURAL_INCOME_2020,
    ],
  },
  "P-02": {
    title: "所得・賃金・採用データパック（47都道府県）",
    datasets: [
      PER_CAPITA_PREFECTURAL_INCOME_2020,
      AVG_SALARY_ALL_PREFECTURE_2024,
      ACTIVE_JOB_OPENING_RATIO_2022,
      ANNUAL_INCOME_PER_HOUSEHOLD_2019,
      DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024,
      DUAL_INCOME_HOUSEHOLD_RATIO_2020,
    ],
  },
  "P-03": {
    title: "観光・宿泊データパック（47都道府県）",
    datasets: [
      TOTAL_OVERNIGHT_GUESTS_2024,
      TOTAL_OVERNIGHT_GUESTS_FOREIGN_2024,
      NUMBER_OF_HOTEL_FACILITIES_2017,
      NUMBER_OF_HOTEL_ROOMS_2017,
      TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021,
    ],
  },
  "P-04": {
    title: "自治体財政データパック（47都道府県）",
    datasets: [
      FISCAL_STRENGTH_INDEX_PREFECTURE_2022,
      REAL_PUBLIC_DEBT_SERVICE_RATIO_2022,
      LOCAL_TAX_PREFECTURE_2022,
      LASPEYRES_INDEX_PREFECTURE_2025,
      TOTAL_REVENUE_PREFECTURE_2022,
      INDEPENDENT_REVENUE_PREFECTURE_2022,
    ],
  },
  "P-05": {
    title: "医療・介護データパック（47都道府県）",
    datasets: [
      PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022,
      GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023,
      NURSES_PER_100K_POPULATION_2020,
      NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023,
      AGING_INDEX_2022,
      AVERAGE_LIFE_EXPECTANCY_MALE_2020,
    ],
  },
  "P-06": {
    title: "教育・子育てデータパック（47都道府県）",
    datasets: [
      HIGH_SCHOOL_ADVANCEMENT_RATE_2023,
      TOTAL_FERTILITY_RATE_2023,
      CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024,
      ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024,
      CHILDCARE_EMPLOYMENT_RATE_2022,
      CRUDE_BIRTH_RATE_2023,
    ],
  },
  "P-07": {
    title: "移住・生活データパック（47都道府県）",
    datasets: [
      SOCIAL_INCREASE_RATE_2019,
      CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024,
      CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024,
      RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024,
      HOME_OWNERSHIP_RATE_KAKEI_2024,
      PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024,
    ],
  },
  "P-08": {
    title: "出店・商圏データパック（47都道府県）",
    datasets: [
      ANNUAL_SALES_AMOUNT_2022,
      ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022,
      CONVENIENCE_STORE_COUNT_PER_100K_2014,
      DEPARTMENT_STORE_COUNT_PER_100K_2006,
      TOTAL_POPULATION_2024,
      PER_CAPITA_PREFECTURAL_INCOME_2020,
    ],
  },
  "P-09": {
    title: "産業・経済データパック（47都道府県）",
    datasets: [
      MANUFACTURING_SHIPMENT_AMOUNT_2023,
      MANUFACTURING_ESTABLISHMENTS_2024,
      MANUFACTURING_EMPLOYEES_2024,
      FACTORY_ESTABLISHMENT_COUNT_2020,
      GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020,
      ANNUAL_SALES_AMOUNT_2022,
    ],
  },
  "P-10": {
    title: "防災・インフラデータパック（47都道府県）",
    datasets: [
      ROAD_LENGTH_PER_KM2_2023,
      MAIN_ROAD_LENGTH_PER_KM2_2023,
      SEWERAGE_PENETRATION_RATE_2012ON_2021,
      WATER_SUPPLY_ANNUAL_VOLUME_2022,
      DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023,
      NATURE_PARK_AREA_RATIO_2024,
    ],
  },
  "P-11": {
    title: "都道府県 地図・チャート素材集",
    datasets: [
      TOTAL_POPULATION_2024,
      TOTAL_AREA_2023,
      GENERAL_HOUSEHOLDS_2020,
      PER_CAPITA_PREFECTURAL_INCOME_2020,
    ],
  },
  "P-12": {
    title: "都道府県データ 全部入りバンドル",
    datasets: [
      TOTAL_POPULATION_2024,
      TOTAL_AREA_2023,
      GENERAL_HOUSEHOLDS_2020,
      PER_CAPITA_PREFECTURAL_INCOME_2020,
      AVG_SALARY_ALL_PREFECTURE_2024,
      ACTIVE_JOB_OPENING_RATIO_2022,
      ANNUAL_INCOME_PER_HOUSEHOLD_2019,
      DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024,
      DUAL_INCOME_HOUSEHOLD_RATIO_2020,
      TOTAL_OVERNIGHT_GUESTS_2024,
      TOTAL_OVERNIGHT_GUESTS_FOREIGN_2024,
      NUMBER_OF_HOTEL_FACILITIES_2017,
      NUMBER_OF_HOTEL_ROOMS_2017,
      TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021,
      FISCAL_STRENGTH_INDEX_PREFECTURE_2022,
      REAL_PUBLIC_DEBT_SERVICE_RATIO_2022,
      LOCAL_TAX_PREFECTURE_2022,
      LASPEYRES_INDEX_PREFECTURE_2025,
      TOTAL_REVENUE_PREFECTURE_2022,
      INDEPENDENT_REVENUE_PREFECTURE_2022,
      PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022,
      GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023,
      NURSES_PER_100K_POPULATION_2020,
      NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023,
      AGING_INDEX_2022,
      AVERAGE_LIFE_EXPECTANCY_MALE_2020,
      HIGH_SCHOOL_ADVANCEMENT_RATE_2023,
      TOTAL_FERTILITY_RATE_2023,
      CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024,
      ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024,
      CHILDCARE_EMPLOYMENT_RATE_2022,
      CRUDE_BIRTH_RATE_2023,
      SOCIAL_INCREASE_RATE_2019,
      CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024,
      CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024,
      RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024,
      HOME_OWNERSHIP_RATE_KAKEI_2024,
      PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024,
      ANNUAL_SALES_AMOUNT_2022,
      ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022,
      CONVENIENCE_STORE_COUNT_PER_100K_2014,
      DEPARTMENT_STORE_COUNT_PER_100K_2006,
      MANUFACTURING_SHIPMENT_AMOUNT_2023,
      MANUFACTURING_ESTABLISHMENTS_2024,
      MANUFACTURING_EMPLOYEES_2024,
      FACTORY_ESTABLISHMENT_COUNT_2020,
      GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020,
      ROAD_LENGTH_PER_KM2_2023,
      MAIN_ROAD_LENGTH_PER_KM2_2023,
      SEWERAGE_PENETRATION_RATE_2012ON_2021,
      WATER_SUPPLY_ANNUAL_VOLUME_2022,
      DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023,
      NATURE_PARK_AREA_RATIO_2024,
    ],
  },
};

export function isDatabookProduct(productId: string): boolean {
  return productId in DATABOOKS;
}
