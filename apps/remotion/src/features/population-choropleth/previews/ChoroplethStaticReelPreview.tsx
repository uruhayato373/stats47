import React from "react";
import type { ThemeName } from "@/shared/themes/brand";
import { usePopulationData } from "../usePopulationData";
import { ChoroplethStaticReel } from "../ChoroplethStaticReel";

interface Props {
  theme?: ThemeName;
}

export const ChoroplethStaticReelPreview: React.FC<Props> = ({
  theme = "dark",
}) => {
  const { tokyoPaths, osakaPaths, sharedDomain, loading } = usePopulationData();

  if (loading) return null;

  return (
    <ChoroplethStaticReel
      tokyoPaths={tokyoPaths}
      osakaPaths={osakaPaths}
      maxAbs={sharedDomain.maxAbs}
      theme={theme}
    />
  );
};
