import React from "react";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";

/**
 * ランキング可視化UIコンポーネント（地図+統計サマリー）
 */
interface RankingVisualizationProps {
  data: FormattedValue[];
  options?: RankingVisualizationOptions;
}

export const RankingVisualization: React.FC<RankingVisualizationProps> = ({
  data,
  options,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-4">
      {/* 地図 */}
      <div>
        <ChoroplethMap
          data={data}
          options={{
            colorScheme: options?.colorScheme || "interpolateBlues",
            divergingMidpoint: options?.divergingMidpoint || "zero",
          }}
        />
      </div>

      {/* 統計サマリー */}
      {data.length > 0 && (
        <div>
          <StatisticsSummary data={data} unit={data[0].unit || ""} />
        </div>
      )}
    </div>
  );
};
