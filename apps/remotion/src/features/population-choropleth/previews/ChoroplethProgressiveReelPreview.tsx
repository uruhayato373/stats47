import React from "react";
import type { ThemeName } from "@/shared/themes/brand";
import { usePopulationData } from "../usePopulationData";
import { ChoroplethProgressiveReel } from "../ChoroplethProgressiveReel";

interface Props {
  theme?: ThemeName;
}

export const ChoroplethProgressiveReelPreview: React.FC<Props> = ({
  theme = "dark",
}) => {
  const { tokyoPaths, osakaPaths, sharedDomain, loading } = usePopulationData();

  if (loading) return null;

  return (
    <ChoroplethProgressiveReel
      tokyoPaths={tokyoPaths}
      osakaPaths={osakaPaths}
      maxAbs={sharedDomain.maxAbs}
      theme={theme}
    />
  );
};
