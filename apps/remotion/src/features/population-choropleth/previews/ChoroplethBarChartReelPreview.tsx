import React from "react";
import type { ThemeName } from "@/shared/themes/brand";
import { usePopulationData } from "../usePopulationData";
import { ChoroplethBarChartReel } from "../ChoroplethBarChartReel";

interface Props {
  theme?: ThemeName;
}

export const ChoroplethBarChartReelPreview: React.FC<Props> = ({
  theme = "dark",
}) => {
  const {
    tokyoPaths,
    osakaPaths,
    tokyoData,
    osakaData,
    sharedDomain,
    loading,
  } = usePopulationData();

  if (loading) return null;

  return (
    <ChoroplethBarChartReel
      tokyoData={tokyoData}
      osakaData={osakaData}
      tokyoPaths={tokyoPaths}
      osakaPaths={osakaPaths}
      maxAbs={sharedDomain.maxAbs}
      theme={theme}
    />
  );
};
