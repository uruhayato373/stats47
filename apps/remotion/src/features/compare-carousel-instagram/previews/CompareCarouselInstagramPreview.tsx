import React from "react";

import { useIgSeriesFonts } from "@/features/ig-series";
import compareSample from "@/fixtures/compare-carousel-sample.json";

import { CompareCoverSlide } from "../CompareCoverSlide";
import { CompareDuelSlide } from "../CompareDuelSlide";
import { CompareOutroSlide } from "../CompareOutroSlide";
import { CompareSummarySlide } from "../CompareSummarySlide";
import { CompareCarouselDataSchema, type CompareCarouselData, type CompareCarouselSlide } from "../types";

interface CompareCarouselInstagramPreviewProps {
  slide?: CompareCarouselSlide;
  data?: CompareCarouselData;
}

/**
 * 県どうしの比較カルーセル (4:5・4枚)
 *
 * `slide` で 表紙 → 全項目対決 → 勝敗まとめ → 締め を切り替える。
 * props (`data`) を省略すると build-ig-compare-props.ts で実生成したサンプルで描画する。
 */
export const CompareCarouselInstagramPreview: React.FC<CompareCarouselInstagramPreviewProps> = ({
  slide = "cover",
  data,
}) => {
  useIgSeriesFonts();
  const resolved = CompareCarouselDataSchema.parse(data ?? compareSample);

  switch (slide) {
    case "cover":
      return <CompareCoverSlide data={resolved} />;
    case "duel":
      return <CompareDuelSlide data={resolved} />;
    case "summary":
      return <CompareSummarySlide data={resolved} />;
    case "outro":
      return <CompareOutroSlide data={resolved} />;
  }
};
