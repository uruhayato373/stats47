import "server-only";

export {
  loadDepopulationMedicalSummary,
  loadDepopulationMedicalPrefDetail,
} from "./lib/load-depopulation-medical-data";
export type {
  DepopulationMedicalSummary,
  DepopulationMedicalPref,
  DepopulationMedicalPrefDetail,
  DepopulationMedicalFacility,
} from "./lib/types";
