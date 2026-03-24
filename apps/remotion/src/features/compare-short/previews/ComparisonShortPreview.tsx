import React from "react";
import { ComparisonShort, type ComparisonShortProps } from "../ComparisonShort";
import { previewDataComparison } from "@/utils/preview-data-comparison";

/**
 * Remotion Studio 用プレビュー
 */
export const ComparisonShortPreview: React.FC<Partial<ComparisonShortProps>> = (props) => {
  return (
    <ComparisonShort
      areaNameA={props.areaNameA ?? previewDataComparison.areaNameA}
      areaNameB={props.areaNameB ?? previewDataComparison.areaNameB}
      areaCodeA={props.areaCodeA ?? previewDataComparison.areaCodeA}
      areaCodeB={props.areaCodeB ?? previewDataComparison.areaCodeB}
      indicators={props.indicators ?? previewDataComparison.indicators}
      theme={props.theme ?? "dark"}
      hookText={props.hookText ?? previewDataComparison.hookText}
      showSafeAreas={props.showSafeAreas ?? false}
    />
  );
};
