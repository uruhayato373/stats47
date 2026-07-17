import React from "react";

import { BuzzMapStill } from "../BuzzMapStill";
import type { BuzzMapRatio } from "../tokens";
import type { BuzzMapSpec } from "../types";
import sampleA from "../specs/sample-landlocked.json";

export interface BuzzMapStillPreviewProps {
  /** spec 全体。CLI からは --props='{"spec": {...}}'（specs/*.json はこの形で保存） */
  spec?: BuzzMapSpec;
  ratio?: BuzzMapRatio;
  /** 型B spec の静止画化: 表示年（省略時は最終年） */
  year?: number;
  /** 型B spec の静止画化: サマリー（最大・最小）表示 */
  showSummary?: boolean;
}

export const BuzzMapStillPreview: React.FC<BuzzMapStillPreviewProps> = ({
  spec,
  ratio = "45",
  year,
  showSummary,
}) => (
  <BuzzMapStill
    spec={spec ?? (sampleA.spec as unknown as BuzzMapSpec)}
    ratio={ratio}
    year={year}
    showSummary={showSummary}
  />
);
