import React from "react";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { SubcategoryData } from "@/types/visualization/choropleth";
import { RankingVisualizationOptions } from "@/types/visualization/ranking-options";

/**
 * ランキング可視化UIコンポーネント（地図+統計サマリー）
 */
interface RankingVisualizationProps {
  data: FormattedValue[];
  subcategory: SubcategoryData;
  options?: RankingVisualizationOptions;
  mapWidth?: number;
  mapHeight?: number;
}

export const RankingVisualization: React.FC<RankingVisualizationProps> = ({
  data,
  subcategory,
  options,
  mapWidth = 800,
  mapHeight = 600,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-4">
      {/* 地図 */}
      <div>
        <ChoroplethMap
          data={data}
          options={{
            colorScheme:
              options?.colorScheme ||
              subcategory.colorScheme ||
              "interpolateBlues",
            divergingMidpoint: options?.divergingMidpoint || "zero",
          }}
          width={mapWidth}
          height={mapHeight}
        />
      </div>

      {/* 統計サマリー */}
      <div>
        <StatisticsSummary data={data} unit={subcategory.unit || ""} />
      </div>
    </div>
  );
};
