/**
 * 実データセット・レジストリ (SSOT)。
 * key = src/data/datasets/<key>.ts のファイル名。R2 由来・基準年固定のスナップショットのみ登録する。
 * validator の「datasets-listed」検査 (approved/listed パックの datasets キーが実在するか) の参照元。
 */
import type { Dataset } from "../dataset";
import { TOTAL_POPULATION_2024 } from "./total-population";
import { TOTAL_AREA_2023 } from "./total-area-including-northern-territories-and-takeshima";
import { GENERAL_HOUSEHOLDS_2020 } from "./general-households";
import { PER_CAPITA_PREFECTURAL_INCOME_2020 } from "./per-capita-prefectural-income-h27";
import { JAPANESE_POPULATION_2024 } from "./japanese-population";
import { AVG_SALARY_ALL_PREFECTURE_2024 } from "./avg-salary-all-prefecture";
import { ACTIVE_JOB_OPENING_RATIO_2022 } from "./active-job-opening-ratio";
import { ANNUAL_INCOME_PER_HOUSEHOLD_2019 } from "./annual-income-per-household";
import { DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024 } from "./disposable-income-worker-households";
import { DUAL_INCOME_HOUSEHOLD_RATIO_2020 } from "./dual-income-household-ratio";
import { TOTAL_OVERNIGHT_GUESTS_2024 } from "./total-overnight-guests";
import { TOTAL_OVERNIGHT_GUESTS_FOREIGN_2024 } from "./total-overnight-guests-foreign";
import { NUMBER_OF_HOTEL_FACILITIES_2017 } from "./number-of-hotel-facilities";
import { NUMBER_OF_HOTEL_ROOMS_2017 } from "./number-of-hotel-rooms";
import { TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021 } from "./travel-participation-rate-overnight";
import { FISCAL_STRENGTH_INDEX_PREFECTURE_2022 } from "./fiscal-strength-index-prefecture";
import { REAL_PUBLIC_DEBT_SERVICE_RATIO_2022 } from "./real-public-debt-service-ratio";
import { LOCAL_TAX_PREFECTURE_2022 } from "./local-tax-prefecture";
import { LASPEYRES_INDEX_PREFECTURE_2025 } from "./laspeyres-index-prefecture";
import { TOTAL_REVENUE_PREFECTURE_2022 } from "./total-revenue-prefecture";
import { INDEPENDENT_REVENUE_PREFECTURE_2022 } from "./independent-revenue-prefecture";
import { PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022 } from "./physicians-in-medical-facilities-per-100k";
import { GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023 } from "./general-hospital-bed-count-per-100k";
import { NURSES_PER_100K_POPULATION_2020 } from "./nurses-per-100k-population";
import { NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023 } from "./nursing-welfare-facility-count-per-100k-65plus";
import { AGING_INDEX_2022 } from "./aging-index";
import { AVERAGE_LIFE_EXPECTANCY_MALE_2020 } from "./average-life-expectancy-male";
import { HIGH_SCHOOL_ADVANCEMENT_RATE_2023 } from "./high-school-advancement-rate";
import { TOTAL_FERTILITY_RATE_2023 } from "./total-fertility-rate";
import { CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024 } from "./certified-childcare-center-count-per-100k-0-5";
import { ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024 } from "./elementary-school-students-per-teacher";
import { CHILDCARE_EMPLOYMENT_RATE_2022 } from "./childcare-employment-rate";
import { CRUDE_BIRTH_RATE_2023 } from "./crude-birth-rate";
import { SOCIAL_INCREASE_RATE_2019 } from "./social-increase-rate";
import { CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024 } from "./consumer-price-difference-index-overall";
import { CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024 } from "./consumer-price-difference-index-housing";
import { RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024 } from "./residential-land-price-change-rate";
import { HOME_OWNERSHIP_RATE_KAKEI_2024 } from "./home-ownership-rate-kakei";
import { PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024 } from "./private-rental-housing-rent-per-3-3m2";
import { ANNUAL_SALES_AMOUNT_2022 } from "./annual-sales-amount";
import { ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022 } from "./annual-sales-amount-per-establishment";
import { CONVENIENCE_STORE_COUNT_PER_100K_2014 } from "./convenience-store-count-per-100k";
import { DEPARTMENT_STORE_COUNT_PER_100K_2006 } from "./department-store-count-per-100k";
import { MANUFACTURING_SHIPMENT_AMOUNT_2023 } from "./manufacturing-shipment-amount";
import { MANUFACTURING_ESTABLISHMENTS_2024 } from "./manufacturing-establishments";
import { MANUFACTURING_EMPLOYEES_2024 } from "./manufacturing-employees";
import { FACTORY_ESTABLISHMENT_COUNT_2020 } from "./factory-establishment-count";
import { GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020 } from "./gross-prefectural-product-expenditure-nominal-h27";
import { ROAD_LENGTH_PER_KM2_2023 } from "./road-length-per-km2";
import { MAIN_ROAD_LENGTH_PER_KM2_2023 } from "./main-road-length-per-km2";
import { SEWERAGE_PENETRATION_RATE_2012ON_2021 } from "./sewerage-penetration-rate-2012on";
import { WATER_SUPPLY_ANNUAL_VOLUME_2022 } from "./water-supply-annual-volume";
import { DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023 } from "./disaster-damage-amount-per-person";
import { NATURE_PARK_AREA_RATIO_2024 } from "./nature-park-area-ratio";
import { BEEF_CONSUMPTION_EXPENDITURE_2024 } from "./beef-consumption-expenditure";

export const DATASET_REGISTRY: Readonly<Record<string, Dataset>> = {
  "total-population": TOTAL_POPULATION_2024,
  "total-area-including-northern-territories-and-takeshima": TOTAL_AREA_2023,
  "general-households": GENERAL_HOUSEHOLDS_2020,
  "per-capita-prefectural-income-h27": PER_CAPITA_PREFECTURAL_INCOME_2020,
  "japanese-population": JAPANESE_POPULATION_2024,
  "avg-salary-all-prefecture": AVG_SALARY_ALL_PREFECTURE_2024,
  "active-job-opening-ratio": ACTIVE_JOB_OPENING_RATIO_2022,
  "annual-income-per-household": ANNUAL_INCOME_PER_HOUSEHOLD_2019,
  "disposable-income-worker-households": DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024,
  "dual-income-household-ratio": DUAL_INCOME_HOUSEHOLD_RATIO_2020,
  "total-overnight-guests": TOTAL_OVERNIGHT_GUESTS_2024,
  "total-overnight-guests-foreign": TOTAL_OVERNIGHT_GUESTS_FOREIGN_2024,
  "number-of-hotel-facilities": NUMBER_OF_HOTEL_FACILITIES_2017,
  "number-of-hotel-rooms": NUMBER_OF_HOTEL_ROOMS_2017,
  "travel-participation-rate-overnight": TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021,
  "fiscal-strength-index-prefecture": FISCAL_STRENGTH_INDEX_PREFECTURE_2022,
  "real-public-debt-service-ratio": REAL_PUBLIC_DEBT_SERVICE_RATIO_2022,
  "local-tax-prefecture": LOCAL_TAX_PREFECTURE_2022,
  "laspeyres-index-prefecture": LASPEYRES_INDEX_PREFECTURE_2025,
  "total-revenue-prefecture": TOTAL_REVENUE_PREFECTURE_2022,
  "independent-revenue-prefecture": INDEPENDENT_REVENUE_PREFECTURE_2022,
  "physicians-in-medical-facilities-per-100k": PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022,
  "general-hospital-bed-count-per-100k": GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023,
  "nurses-per-100k-population": NURSES_PER_100K_POPULATION_2020,
  "nursing-welfare-facility-count-per-100k-65plus": NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023,
  "aging-index": AGING_INDEX_2022,
  "average-life-expectancy-male": AVERAGE_LIFE_EXPECTANCY_MALE_2020,
  "high-school-advancement-rate": HIGH_SCHOOL_ADVANCEMENT_RATE_2023,
  "total-fertility-rate": TOTAL_FERTILITY_RATE_2023,
  "certified-childcare-center-count-per-100k-0-5": CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024,
  "elementary-school-students-per-teacher": ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024,
  "childcare-employment-rate": CHILDCARE_EMPLOYMENT_RATE_2022,
  "crude-birth-rate": CRUDE_BIRTH_RATE_2023,
  "social-increase-rate": SOCIAL_INCREASE_RATE_2019,
  "consumer-price-difference-index-overall": CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024,
  "consumer-price-difference-index-housing": CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024,
  "residential-land-price-change-rate": RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024,
  "home-ownership-rate-kakei": HOME_OWNERSHIP_RATE_KAKEI_2024,
  "private-rental-housing-rent-per-3-3m2": PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024,
  "annual-sales-amount": ANNUAL_SALES_AMOUNT_2022,
  "annual-sales-amount-per-establishment": ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022,
  "convenience-store-count-per-100k": CONVENIENCE_STORE_COUNT_PER_100K_2014,
  "department-store-count-per-100k": DEPARTMENT_STORE_COUNT_PER_100K_2006,
  "manufacturing-shipment-amount": MANUFACTURING_SHIPMENT_AMOUNT_2023,
  "manufacturing-establishments": MANUFACTURING_ESTABLISHMENTS_2024,
  "manufacturing-employees": MANUFACTURING_EMPLOYEES_2024,
  "factory-establishment-count": FACTORY_ESTABLISHMENT_COUNT_2020,
  "gross-prefectural-product-expenditure-nominal-h27": GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020,
  "road-length-per-km2": ROAD_LENGTH_PER_KM2_2023,
  "main-road-length-per-km2": MAIN_ROAD_LENGTH_PER_KM2_2023,
  "sewerage-penetration-rate-2012on": SEWERAGE_PENETRATION_RATE_2012ON_2021,
  "water-supply-annual-volume": WATER_SUPPLY_ANNUAL_VOLUME_2022,
  "disaster-damage-amount-per-person": DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023,
  "nature-park-area-ratio": NATURE_PARK_AREA_RATIO_2024,
  "beef-consumption-expenditure": BEEF_CONSUMPTION_EXPENDITURE_2024,
} as const;

/** 実在する実データセット key の集合 (validator が誇大表示防止に使う)。 */
export const DATASET_KEYS: ReadonlySet<string> = new Set(Object.keys(DATASET_REGISTRY));
