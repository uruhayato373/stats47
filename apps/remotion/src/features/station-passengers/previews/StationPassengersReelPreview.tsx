import React from "react";

import { StationPassengersReelRemotion } from "../StationPassengersReelRemotion";
import { useStationPassengersData } from "../useStationPassengersData";

interface Props {
  /** 県コード (2 桁 or 5 桁、既定: 22 = 静岡県) */
  prefCode?: string;
}

export const StationPassengersReelPreview: React.FC<Props> = ({
  prefCode = "22",
}) => {
  const { topology, data, railLines, loading } =
    useStationPassengersData(prefCode);

  if (loading || !topology || !data) return null;

  return (
    <StationPassengersReelRemotion
      topology={topology}
      data={data}
      railLines={railLines}
    />
  );
};
