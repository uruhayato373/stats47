import type { OpenDatasetDefinition } from "../types";
import { MHLW_MEDICAL_DATASETS } from "./mhlw";
import { MLIT_REINFOLIB_DATASETS } from "./mlit-reinfolib";
import { MLIT_DPF_DATASETS } from "./mlit-dpf";
import { GSI_HAZARD_DATASETS } from "./gsi-hazard";
import { DIGITAL_AGENCY_ODS_DATASETS } from "./digital-agency-ods";
import { MAFF_REGIONAL_DATASETS } from "./maff";
import { JFLEC_DATASETS } from "./jflec";
import { NIER_DATASETS } from "./nier";
import { FDMA_HEATSTROKE_DATASETS } from "./fdma";

/**
 * dataset カタログの集約。source 別ファイルは 1 ファイル 300 行超 or 同一 source 20 dataset 超で
 * 分割する (doc 37 §4.1)。参照整合 (sourceId / datasetIds 双方向) は validator が検証する。
 */
export const OPEN_DATASETS: readonly OpenDatasetDefinition[] = [
  ...MHLW_MEDICAL_DATASETS,
  ...MLIT_REINFOLIB_DATASETS,
  ...MLIT_DPF_DATASETS,
  ...GSI_HAZARD_DATASETS,
  ...DIGITAL_AGENCY_ODS_DATASETS,
  ...MAFF_REGIONAL_DATASETS,
  ...JFLEC_DATASETS,
  ...NIER_DATASETS,
  ...FDMA_HEATSTROKE_DATASETS,
];

export function getOpenDataset(id: string): OpenDatasetDefinition | undefined {
  return OPEN_DATASETS.find((d) => d.id === id);
}

export function getDatasetsBySource(sourceId: string): readonly OpenDatasetDefinition[] {
  return OPEN_DATASETS.filter((d) => d.sourceId === sourceId);
}
