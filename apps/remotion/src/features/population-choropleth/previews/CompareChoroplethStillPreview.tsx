import React from "react";
import type { ThemeName } from "@/shared/themes/brand";
import { usePopulationData } from "../usePopulationData";
import { CompareChoroplethStill } from "../CompareChoroplethStill";

interface Props {
  theme?: ThemeName;
  showGuides?: boolean;
}

export const CompareChoroplethStillPreview: React.FC<Props> = ({
  theme = "dark",
  showGuides = false,
}) => {
  const { tokyoPaths, osakaPaths, sharedDomain, loading } = usePopulationData();

  if (loading) return null;

  return (
    <CompareChoroplethStill
      tokyoPaths={tokyoPaths}
      osakaPaths={osakaPaths}
      maxAbs={sharedDomain.maxAbs}
      theme={theme}
      showGuides={showGuides}
    />
  );
};
