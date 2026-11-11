import data from "../../../../../data/source-inventory/japan-zue/pilot.json";
import type { EvidenceContentRole } from "../types";

export type JapanZuePilotStatus = "existing-live" | "local-ready-publication-pending";

export interface JapanZuePilotItem {
  evidenceId: string;
  question: string;
  metricKeys: string[];
  surveyIds: string[];
  provenanceUrls: string[];
  placements: EvidenceContentRole[];
  status: JapanZuePilotStatus;
  nextAction: string;
}

/**
 * 日本国勢図会の試行の読み込み口。記録の正本は台帳 `source-inventory.japan-zue-pilot`
 * (data/source-inventory/japan-zue/pilot.json + Schema)。書籍の文章・見出し・数値は持たず、
 * 独立した問いとstats47のlineageだけを持つ。
 */
export const JAPAN_ZUE_PILOT_ITEMS = data.items as readonly JapanZuePilotItem[];

type MasterContentDerivative = (typeof data.masterContent.derivatives)[number];

/** 派生の投稿の出し先 (Schema の derivatives[].platform の列挙と同じ) */
export type JapanZueMediaChannel = "blog" | "note" | "youtube" | "instagram" | "x";

export const JAPAN_ZUE_MASTER_CONTENT = data.masterContent as Omit<
  typeof data.masterContent,
  "derivatives"
> & {
  readonly derivatives: readonly (Omit<MasterContentDerivative, "platform" | "parentPlatform"> & {
    readonly platform: JapanZueMediaChannel;
    readonly parentPlatform: JapanZueMediaChannel;
  })[];
};
