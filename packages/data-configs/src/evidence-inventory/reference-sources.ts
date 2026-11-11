import data from "../../../../data/source-inventory/policies/reference-sources.json";
import type {
  InternalEvidenceAdoption,
  ReferenceSourcePolicy,
} from "./types";

/**
 * 参考文献の解決方針の読み込み口。記録の正本は台帳 `source-inventory.reference-source-policies`
 * (data/source-inventory/policies/reference-sources.json + Schema)。原本・OCR本文・数値は持たず、
 * 各itemの解決結果は source-inventory CLI がこの方針を適用して state へ決定的に生成する。
 */
export const REFERENCE_SOURCE_POLICIES =
  data.policies as readonly ReferenceSourcePolicy[];

export const CLAUDE_SKILLS_GUIDE_ADOPTIONS =
  data.claudeSkillsGuideAdoptions as readonly InternalEvidenceAdoption[];
