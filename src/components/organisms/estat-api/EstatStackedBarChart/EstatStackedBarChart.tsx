"use client";

import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { estatAPI, EstatStatsDataResponse } from "@/lib/estat-api";
import { StackedBarChart } from "@/components/organisms/visualization/StackedBarChart";

interface EstatParams {
  statsDataId: string;
  cdCat01: string[];
}

interface EstatStackedBarChartProps {
  params: EstatParams;
  areaCode?: string;
  title: string;
  yLabel?: string;
  width?: number;
  height?: number;
}

interface TransformedData {
  time: string;
  [key: string]: number | string;
}

export const EstatStackedBarChart: React.FC<EstatStackedBarChartProps> = ({
  params,
  areaCode,
  title,
  yLabel,
  width = 800,
  height = 500,
}) => {
  const [data, setData] = useState<TransformedData[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res: EstatStatsDataResponse = await estatAPI.getStatsData({
          statsDataId: params.statsDataId,
          cdCat01: params.cdCat01.join(","),
          cdArea: areaCode,
          limit: 10000, // get more data points
        });

        const { VALUE } = res.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF;
        const { CLASS_OBJ } = res.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF;

        const timeObj = CLASS_OBJ.find((obj) => obj["@id"] === "time");
        const cat01Obj = CLASS_OBJ.find((obj) => obj["@id"] === "cat01");

        if (!timeObj || !cat01Obj) {
          throw new Error("Required CLASS_OBJ not found");
        }

        if (!Array.isArray(timeObj.CLASS) || !Array.isArray(cat01Obj.CLASS)) {
          throw new Error("CLASS must be an array");
        }

        const timeMap = new Map(
          timeObj.CLASS.map((c) => [c["@code"], c["@name"]])
        );
        const cat01Map = new Map(
          cat01Obj.CLASS.map((c) => [c["@code"], c["@name"]])
        );

        const keyNames = params.cdCat01
          .map((code) => cat01Map.get(code)!)
          .filter(Boolean);
        setKeys(keyNames);

        if (!Array.isArray(VALUE)) {
          throw new Error("VALUE must be an array");
        }

        const transformed = VALUE.reduce<Record<string, TransformedData>>(
          (acc, item) => {
            const timeCode = item["@time"];
            const time = timeCode ? timeMap.get(timeCode) : undefined;
            const cat01Code = item["@cat01"];
            const cat01Name = cat01Code ? cat01Map.get(cat01Code) : undefined;
            const value = Number(item.$);

            if (time && cat01Name) {
              if (!acc[time]) {
                acc[time] = { time };
              }
              acc[time][cat01Name] = value;
            }
            return acc;
          },
          {}
        );

        const chartData = Object.values(transformed).sort((a, b) =>
          d3.ascending(a.time, b.time)
        );
        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch data for StackedBarChart", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, areaCode]);

  const colors = d3
    .scaleOrdinal<string>()
    .domain(keys)
    .range(d3.schemeCategory10);

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <StackedBarChart
        data={data}
        keys={keys}
        colors={colors}
        width={width}
        height={height}
        yLabel={yLabel}
      />
    </div>
  );
};
